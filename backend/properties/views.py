# backend/properties/views.py
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import IntegrityError
from .models import Property, BillingCycle, Expense
from .serializers import (
    PropertySerializer, UnitSerializer, PropertySummarySerializer,
    BillingCycleSerializer, BillingCycleCreateSerializer,
    ExpenseSerializer, ExpenseCreateSerializer, UnitCreateSerializer, UnitUpdateSerializer
)
from .services.unit_service import UnitService
from rules.models import ServiceRule

class PropertyListCreateAPIView(generics.ListCreateAPIView):
    """
    Vista para listar (GET) y crear (POST) propiedades.
    Utiliza diferentes serializadores para cada acción para optimizar el rendimiento.
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Asegura que los usuarios solo vean sus propias propiedades."""
        return Property.objects.filter(user=self.request.user).order_by('name')

    def get_serializer_class(self):
        """
        Devuelve el serializador apropiado según el método de la petición.
        """
        if self.request.method == 'GET':
            # Para listado, usamos el serializador de resumen (ligero).
            return PropertySummarySerializer
        # Para creación, usamos el serializador completo para la respuesta.
        return PropertySerializer

    def perform_create(self, serializer):
        """Asigna el usuario autenticado a la nueva propiedad."""
        serializer.save(user=self.request.user)

class PropertyRetrieveAPIView(generics.RetrieveAPIView):
    """Vista para obtener los detalles de una propiedad específica."""
    serializer_class = PropertySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtra para asegurar que el usuario solo puede ver sus propiedades."""
        return Property.objects.filter(user=self.request.user)

class UnitListCreateAPIView(generics.ListCreateAPIView):
    """Vista para listar (GET) y crear (POST) unidades dentro de una propiedad específica."""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtra las unidades para la propiedad especificada."""
        property_pk = self.kwargs['property_pk']
        property_obj = UnitService.validate_property_ownership(property_pk, self.request.user)
        return UnitService.get_property_units(property_obj)

    def get_serializer_class(self):
        """Devuelve el serializador apropiado según el método HTTP."""
        if self.request.method == 'POST':
            return UnitCreateSerializer
        return UnitSerializer

    def create(self, request, *args, **kwargs):
        """Crea una nueva unidad usando el servicio."""
        property_pk = self.kwargs['property_pk']
        property_obj = UnitService.validate_property_ownership(property_pk, request.user)
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            unit = UnitService.create_unit(
                property_obj=property_obj,
                name=serializer.validated_data['name']
            )
            response_serializer = UnitSerializer(unit)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class UnitRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para obtener, actualizar y eliminar una unidad específica."""
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """Obtiene la unidad específica."""
        property_pk = self.kwargs['property_pk']
        unit_pk = self.kwargs['pk']
        property_obj = UnitService.validate_property_ownership(property_pk, self.request.user)
        return UnitService.get_unit_by_id(property_obj, unit_pk)

    def get_serializer_class(self):
        """Devuelve el serializador apropiado según el método HTTP."""
        if self.request.method in ['PUT', 'PATCH']:
            return UnitUpdateSerializer
        return UnitSerializer

    def update(self, request, *args, **kwargs):
        """Actualiza una unidad usando el servicio."""
        unit = self.get_object()
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            updated_unit = UnitService.update_unit(
                unit=unit,
                name=serializer.validated_data['name']
            )
            response_serializer = UnitSerializer(updated_unit)
            return Response(response_serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, *args, **kwargs):
        """Elimina una unidad usando el servicio."""
        unit = self.get_object()
        
        try:
            UnitService.delete_unit(unit)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class BillingCycleListCreateAPIView(generics.ListCreateAPIView):
    """
    Vista combinada para listar (GET) y crear (POST) ciclos de facturación.
    
    GET /api/properties/{property_id}/billing-cycles/ - Lista ciclos existentes
    POST /api/properties/{property_id}/billing-cycles/ - Crea nuevo ciclo
    """
    permission_classes = [IsAuthenticated]

    def get_property(self):
        """
        Obtiene la propiedad verificando que pertenece al usuario autenticado.
        """
        property_id = self.kwargs['property_id']
        return get_object_or_404(
            Property,
            pk=property_id,
            user=self.request.user
        )

    def get_queryset(self):
        """
        Filtra los ciclos de facturación para la propiedad especificada.
        Solo devuelve ciclos de propiedades que pertenecen al usuario autenticado.
        """
        property_obj = self.get_property()
        return BillingCycle.objects.filter(property=property_obj)

    def get_serializer_class(self):
        """
        Devuelve el serializador apropiado según el método HTTP.
        """
        if self.request.method == 'POST':
            return BillingCycleCreateSerializer
        return BillingCycleSerializer

    def create(self, request, *args, **kwargs):
        """
        Crea un nuevo ciclo de facturación con validaciones específicas.
        """
        property_obj = self.get_property()
        
        # Validar los datos de entrada
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        month = serializer.validated_data['month']
        year = serializer.validated_data['year']

        # Validar unicidad antes de crear
        try:
            serializer.validate_property_uniqueness(property_obj, month, year)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_409_CONFLICT
            )

        # Crear el ciclo de facturación
        try:
            billing_cycle = BillingCycle.objects.create(
                property=property_obj,
                month=month,
                year=year,
                status=BillingCycle.Status.OPEN
            )
            
            # Serializar la respuesta con el serializer completo
            response_serializer = BillingCycleSerializer(billing_cycle)
            return Response(
                response_serializer.data, 
                status=status.HTTP_201_CREATED
            )
            
        except IntegrityError:
            # Manejar violación de constraintUniqueConstraint a nivel de BD
            return Response(
                {"error": "Ya existe un ciclo de facturación para esta propiedad en este mes y año."},
                status=status.HTTP_409_CONFLICT
            )
        except Exception as e:
            return Response(
                {"error": "Error interno del servidor."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BillingCycleRetrieveAPIView(generics.RetrieveAPIView):
    """
    Vista para obtener detalles de un ciclo de facturación específico.
    
    GET /api/billing-cycles/{cycle_id}/
    """
    serializer_class = BillingCycleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Solo permite acceso a ciclos de propiedades del usuario autenticado.
        """
        return BillingCycle.objects.filter(property__user=self.request.user)


class ExpenseListCreateAPIView(generics.ListCreateAPIView):
    """
    Vista para listar (GET) y crear (POST) gastos para un ciclo de facturación específico.
    
    GET /api/billing-cycles/{cycle_id}/expenses/ - Lista gastos del ciclo
    POST /api/billing-cycles/{cycle_id}/expenses/ - Crea nuevo gasto
    """
    permission_classes = [IsAuthenticated]

    def get_billing_cycle(self):
        """
        Obtiene el ciclo de facturación verificando que pertenece al usuario autenticado.
        """
        cycle_id = self.kwargs['cycle_id']
        return get_object_or_404(
            BillingCycle,
            pk=cycle_id,
            property__user=self.request.user
        )

    def get_queryset(self):
        """
        Filtra los gastos para el ciclo de facturación especificado.
        Solo devuelve gastos de ciclos de propiedades que pertenecen al usuario autenticado.
        """
        billing_cycle = self.get_billing_cycle()
        return Expense.objects.filter(billing_cycle=billing_cycle)

    def get_serializer_class(self):
        """
        Devuelve el serializador apropiado según el método HTTP.
        """
        if self.request.method == 'POST':
            return ExpenseCreateSerializer
        return ExpenseSerializer

    def get_serializer_context(self):
        """
        Añade el ciclo de facturación al contexto para las validaciones.
        """
        context = super().get_serializer_context()
        if hasattr(self, 'get_billing_cycle'):
            context['billing_cycle'] = self.get_billing_cycle()
        return context

    def create(self, request, *args, **kwargs):
        """
        Crea un nuevo gasto con validaciones específicas.
        """
        billing_cycle = self.get_billing_cycle()
        
        # Validar que el ciclo está abierto
        if billing_cycle.status != BillingCycle.Status.OPEN:
            return Response(
                {"error": "No se pueden añadir gastos a un ciclo que no está abierto."},
                status=status.HTTP_409_CONFLICT
            )
        
        # Validar los datos de entrada
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        service_type = serializer.validated_data['service_type']
        
        # Validar que existe una regla configurada para este servicio
        service_rule_exists = ServiceRule.objects.filter(
            property=billing_cycle.property,
            service_type=service_type
        ).exists()
        
        if not service_rule_exists:
            return Response(
                {"error": "Debe configurar una regla para este servicio antes de añadir gastos."},
                status=status.HTTP_409_CONFLICT
            )

        # Crear el gasto
        try:
            expense = serializer.save(billing_cycle=billing_cycle)
            
            # Serializar la respuesta con el serializer completo
            response_serializer = ExpenseSerializer(expense, context=self.get_serializer_context())
            return Response(
                response_serializer.data, 
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            return Response(
                {"error": "Error interno del servidor."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

