# backend/tenants/views.py
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from properties.models import Unit
from .models import Tenant, Tenancy
from .serializers import (
    TenantSerializer, TenancySerializer, TenancyCreateSerializer, 
    TenancyUpdateSerializer, TenancyEndSerializer
)
from .services import TenancyService, TenancyValidationService

class TenantAssignAPIView(generics.CreateAPIView):
    """Asigna un nuevo inquilino a una unidad específica."""
    serializer_class = TenantSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        unit_pk = self.kwargs['unit_pk']
        # Seguridad: Verifica que la unidad existe y pertenece al usuario.
        unit = get_object_or_404(Unit, pk=unit_pk, property__user=request.user)
        
        # Regla de Negocio: Verifica que la unidad está vacante.
        if hasattr(unit, 'tenant'):
            return Response(
                {"error": "Esta unidad ya tiene un inquilino asignado."},
                status=status.HTTP_409_CONFLICT
            )
        
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        unit = Unit.objects.get(pk=self.kwargs['unit_pk'])
        serializer.save(unit=unit)


class TenancyListCreateAPIView(generics.ListCreateAPIView):
    """
    Vista para listar (GET) y crear (POST) arrendamientos para una unidad específica.
    
    GET /api/units/{unit_id}/tenancies/ - Lista historial de arrendamientos
    POST /api/units/{unit_id}/tenancies/ - Crea nuevo arrendamiento
    """
    permission_classes = [IsAuthenticated]

    def get_unit(self):
        """
        Obtiene la unidad verificando que pertenece al usuario autenticado.
        """
        unit_id = self.kwargs['unit_id']
        return get_object_or_404(
            Unit,
            pk=unit_id,
            property__user=self.request.user
        )

    def get_queryset(self):
        """
        Filtra los arrendamientos para la unidad especificada.
        """
        unit = self.get_unit()
        return Tenancy.objects.filter(unit=unit).order_by('-start_date')

    def get_serializer_class(self):
        """
        Devuelve el serializador apropiado según el método HTTP.
        """
        if self.request.method == 'POST':
            return TenancyCreateSerializer
        return TenancySerializer

    def create(self, request, *args, **kwargs):
        """
        Crea un nuevo arrendamiento con validaciones usando el servicio.
        Puede crear un inquilino nuevo si no existe.
        """
        unit = self.get_unit()
        
        try:
            # Verificar si se proporciona un tenant_id o datos para crear uno nuevo
            tenant_id = request.data.get('tenant')
            tenant_name = request.data.get('tenant_name')
            tenant_email = request.data.get('tenant_email')
            
            if tenant_id:
                # Usar inquilino existente
                tenant = get_object_or_404(Tenant, pk=tenant_id)
            elif tenant_name and tenant_email:
                # Crear nuevo inquilino
                # Buscar una unidad disponible en la misma propiedad para asignar temporalmente
                available_unit = unit.property.units.filter(tenant__isnull=True).first()
                if not available_unit:
                    # Si no hay unidades disponibles, usar la unidad actual
                    available_unit = unit
                
                tenant, created = Tenant.objects.get_or_create(
                    email=tenant_email,
                    defaults={
                        'name': tenant_name,
                        'number_of_occupants': request.data.get('number_of_occupants', 1),
                        'unit': available_unit
                    }
                )
            else:
                return Response(
                    {"error": "Debe proporcionar un tenant_id o tenant_name y tenant_email"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validar los datos de entrada para el arrendamiento
            tenancy_data = {
                'tenant': tenant.pk,
                'start_date': request.data.get('start_date'),
                'end_date': request.data.get('end_date'),
                'number_of_occupants': request.data.get('number_of_occupants')
            }
            
            serializer = self.get_serializer(data=tenancy_data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            start_date = serializer.validated_data['start_date']
            end_date = serializer.validated_data.get('end_date')
            number_of_occupants = serializer.validated_data['number_of_occupants']

            # Usar el servicio para crear el arrendamiento con validaciones
            tenancy = TenancyService.create_tenancy(
                unit=unit,
                tenant=tenant,
                start_date=start_date,
                number_of_occupants=number_of_occupants,
                end_date=end_date
            )
            
            # Serializar la respuesta
            response_serializer = TenancySerializer(tenancy)
            return Response(
                response_serializer.data, 
                status=status.HTTP_201_CREATED
            )
            
        except ValidationError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_409_CONFLICT
            )
        except Exception as e:
            return Response(
                {"error": "Error interno del servidor."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TenancyRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    """
    Vista para obtener (GET) y actualizar (PUT/PATCH) un arrendamiento específico.
    
    GET /api/tenancies/{tenancy_id}/ - Obtiene detalles del arrendamiento
    PUT /api/tenancies/{tenancy_id}/ - Actualiza el arrendamiento
    """
    serializer_class = TenancyUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Solo permite acceso a arrendamientos de propiedades del usuario autenticado.
        """
        return Tenancy.objects.filter(unit__property__user=self.request.user)

    def get_serializer_class(self):
        """
        Devuelve el serializador apropiado según el método HTTP.
        """
        if self.request.method == 'GET':
            return TenancySerializer
        return TenancyUpdateSerializer

    def update(self, request, *args, **kwargs):
        """
        Actualiza un arrendamiento con validaciones.
        """
        tenancy = self.get_object()
        partial = kwargs.pop('partial', False)
        
        serializer = self.get_serializer(tenancy, data=request.data, partial=partial)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Validar superposiciones si se cambian las fechas
        start_date = serializer.validated_data.get('start_date', tenancy.start_date)
        end_date = serializer.validated_data.get('end_date', tenancy.end_date)

        try:
            # Verificar superposiciones excluyendo el arrendamiento actual
            overlapping = TenancyValidationService.check_overlapping_tenancies(
                unit=tenancy.unit,
                start_date=start_date,
                end_date=end_date,
                exclude_tenancy_id=tenancy.pk
            )
            
            if overlapping:
                overlapping_desc = overlapping[0]
                return Response(
                    {
                        "error": f"Las nuevas fechas se superponen con un arrendamiento existente "
                                f"({overlapping_desc.tenant.name}: {overlapping_desc.start_date} - "
                                f"{overlapping_desc.end_date or 'Activo'})."
                    },
                    status=status.HTTP_409_CONFLICT
                )

            serializer.save()
            
            # Responder con el serializer de lectura
            response_serializer = TenancySerializer(tenancy)
            return Response(response_serializer.data)
            
        except ValidationError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_409_CONFLICT
            )
        except Exception as e:
            return Response(
                {"error": "Error interno del servidor."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TenancyEndAPIView(generics.UpdateAPIView):
    """
    Vista específica para finalizar un arrendamiento.
    
    PUT /api/tenancies/{tenancy_id}/end/ - Finaliza el arrendamiento
    """
    serializer_class = TenancyEndSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Solo permite acceso a arrendamientos de propiedades del usuario autenticado.
        """
        return Tenancy.objects.filter(unit__property__user=self.request.user)

    def get_serializer_context(self):
        """
        Añade el arrendamiento al contexto para las validaciones.
        """
        context = super().get_serializer_context()
        context['tenancy'] = self.get_object()
        return context

    def update(self, request, *args, **kwargs):
        """
        Finaliza un arrendamiento estableciendo la fecha de fin.
        """
        tenancy = self.get_object()
        
        # Verificar que el arrendamiento esté activo
        if not tenancy.is_active:
            return Response(
                {"error": "Este arrendamiento ya está finalizado."},
                status=status.HTTP_409_CONFLICT
            )
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        end_date = serializer.validated_data['end_date']

        try:
            # Usar el servicio para finalizar el arrendamiento
            updated_tenancy = TenancyService.end_tenancy(tenancy, end_date)
            
            # Responder con el arrendamiento actualizado
            response_serializer = TenancySerializer(updated_tenancy)
            return Response(response_serializer.data)
            
        except ValidationError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_409_CONFLICT
            )
        except Exception as e:
            return Response(
                {"error": "Error interno del servidor."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PropertyTenantsAPIView(generics.ListCreateAPIView):
    """
    Vista para gestionar inquilinos independientes por propiedad.
    
    GET /api/properties/{property_id}/tenants/ - Lista inquilinos de la propiedad
    POST /api/properties/{property_id}/tenants/ - Crea un nuevo inquilino
    """
    serializer_class = TenantSerializer
    permission_classes = [IsAuthenticated]

    def get_property(self):
        """
        Obtiene la propiedad verificando que pertenece al usuario autenticado.
        """
        property_id = self.kwargs['property_id']
        from properties.models import Property
        return get_object_or_404(
            Property,
            pk=property_id,
            user=self.request.user
        )

    def get_queryset(self):
        """
        Filtra los inquilinos para la propiedad especificada.
        """
        property = self.get_property()
        return Tenant.objects.filter(unit__property=property)

    def create(self, request, *args, **kwargs):
        """
        Crea un nuevo inquilino independiente (sin unidad asignada inicialmente).
        """
        # Para crear inquilinos independientes, necesitamos modificar el modelo
        # Por ahora, retornamos un error explicativo
        return Response(
            {"error": "Para crear arrendamientos, usa el formulario en la gestión de arrendamientos."},
            status=status.HTTP_400_BAD_REQUEST
        )


class AvailableTenantsAPIView(APIView):
    """
    Vista para obtener inquilinos disponibles para una unidad.
    
    GET /api/units/{unit_id}/tenants/ - Lista inquilinos de la propiedad
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, unit_id):
        """
        Obtiene todos los inquilinos de la propiedad que contiene la unidad.
        """
        try:
            # Verificar que la unidad existe y pertenece al usuario
            unit = get_object_or_404(
                Unit,
                pk=unit_id,
                property__user=request.user
            )
            
            # Obtener todos los inquilinos de la propiedad
            tenants = Tenant.objects.filter(unit__property=unit.property)
            
            # Serializar los datos para el frontend
            tenant_data = []
            for tenant in tenants:
                tenant_data.append({
                    'id': tenant.id,
                    'name': tenant.name,
                    'email': tenant.email
                })
            
            # Si no hay inquilinos registrados, devolver array vacío (no error)
            return Response(tenant_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": "Error al obtener inquilinos disponibles."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )