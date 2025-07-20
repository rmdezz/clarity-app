# backend/rules/views.py
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.core.exceptions import ValidationError
from django.http import Http404
from properties.models import Property
from .models import Rule, ServiceRule
from .serializers import RuleSerializer, ServiceRuleSerializer, ServiceRuleListSerializer

class RuleListCreateAPIView(generics.ListCreateAPIView):
    """
    Vista para listar y crear reglas para una propiedad específica.
    """
    serializer_class = RuleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtra las reglas para la propiedad especificada en la URL."""
        property_pk = self.kwargs['property_pk']
        # Seguridad: get_object_or_404 asegura que el usuario solo pueda ver reglas de sus propiedades.
        prop = get_object_or_404(Property, pk=property_pk, user=self.request.user)
        return Rule.objects.filter(property=prop)

    def create(self, request, *args, **kwargs):
        """Sobrescribe el método create para añadir validación de negocio personalizada."""
        rule_type = request.data.get('type')
        
        if rule_type == 'occupant_proration':
            property_pk = self.kwargs['property_pk']
            prop = get_object_or_404(Property, pk=property_pk, user=self.request.user)
            
            # Validar que todas las unidades tengan inquilino.
            units = prop.units.all()
            if units.count() > 0 and not all(hasattr(unit, 'tenant') for unit in units):
                return Response(
                    {"error": "Para usar esta regla, todas las unidades de la propiedad deben tener un número de ocupantes asignado."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return super().create(request, *args, **kwargs)
        
    def perform_create(self, serializer):
        """Asocia la nueva regla a la propiedad correcta, verificando la propiedad."""
        property_pk = self.kwargs['property_pk']
        prop = get_object_or_404(Property, pk=property_pk, user=self.request.user)
        serializer.save(property=prop)


class ServiceConfigurationAPIView(APIView):
    """
    Vista para gestionar la configuración completa de servicios de una propiedad.
    
    GET: Obtiene la configuración actual de servicios
    PUT: Reemplaza atómicamente toda la configuración de servicios
    """
    permission_classes = [IsAuthenticated]

    def get_property(self, property_id):
        """
        Obtiene la propiedad verificando que pertenece al usuario autenticado.
        Retorna 404 si no existe o no pertenece al usuario.
        """
        return get_object_or_404(
            Property,
            pk=property_id,
            user=self.request.user
        )

    def get(self, request, property_id):
        """
        GET /api/properties/{property_id}/service-configuration/
        
        Obtiene la configuración actual de servicios para la propiedad.
        Retorna un array de objetos con service_type y rule_type.
        """
        try:
            property_obj = self.get_property(property_id)
            
            # Obtener todas las reglas de servicio para esta propiedad
            service_rules = ServiceRule.objects.filter(property=property_obj)
            serializer = ServiceRuleSerializer(service_rules, many=True)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Http404:
            return Response(
                {"error": "Propiedad no encontrada."},
                status=status.HTTP_404_NOT_FOUND
            )

    @transaction.atomic
    def put(self, request, property_id):
        """
        PUT /api/properties/{property_id}/service-configuration/
        
        Reemplaza atómicamente toda la configuración de servicios.
        El cuerpo debe ser un array de objetos: [{"service_type": "water", "rule_type": "equal_division"}]
        """
        try:
            property_obj = self.get_property(property_id)
            
            # Validar que el payload es un array
            if not isinstance(request.data, list):
                return Response(
                    {"error": "El cuerpo de la solicitud debe ser un array de objetos."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Usar el serializer de lista para validar el payload completo
            serializer = ServiceRuleListSerializer(data={'service_rules': request.data})
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            # Obtener los datos validados
            validated_service_rules = serializer.validated_data['service_rules']

            # Validación de negocio: verificar reglas de prorrateo por ocupantes
            self._validate_occupant_proration_rules(property_obj, validated_service_rules)

            # OPERACIÓN ATÓMICA: Borrar configuración anterior y crear nueva
            # 1. Borrar toda la configuración anterior de servicios
            ServiceRule.objects.filter(property=property_obj).delete()

            # 2. Crear las nuevas reglas de servicio
            new_service_rules = []
            for rule_data in validated_service_rules:
                service_rule = ServiceRule(
                    property=property_obj,
                    service_type=rule_data['service_type'],
                    rule_type=rule_data['rule_type']
                )
                # Validar cada regla individual (llamará a clean())
                service_rule.full_clean()
                new_service_rules.append(service_rule)

            # 3. Guardar todas las nuevas reglas en batch
            ServiceRule.objects.bulk_create(new_service_rules)

            # 4. Retornar la nueva configuración
            updated_service_rules = ServiceRule.objects.filter(property=property_obj)
            response_serializer = ServiceRuleSerializer(updated_service_rules, many=True)
            
            return Response(response_serializer.data, status=status.HTTP_200_OK)

        except Http404:
            return Response(
                {"error": "Propiedad no encontrada."},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            # Error de validación de negocio (ej. prorrateo sin ocupantes)
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            # Error inesperado - la transacción se revierte automáticamente
            return Response(
                {"error": "Error interno del servidor."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _validate_occupant_proration_rules(self, property_obj, service_rules):
        """
        Valida que las reglas de prorrateo por ocupantes solo se apliquen
        cuando todas las unidades tengan inquilinos con número de ocupantes.
        """
        occupant_rules = [
            rule for rule in service_rules
            if rule['rule_type'] == ServiceRule.RuleType.OCCUPANT_PRORATION
        ]
        
        if not occupant_rules:
            return  # No hay reglas de prorrateo, no hay qué validar

        # Verificar prerrequisitos para prorrateo por ocupantes
        units = property_obj.units.all()
        if not units.exists():
            raise ValidationError(
                "No se puede usar prorrateo por ocupantes: la propiedad no tiene unidades."
            )

        for unit in units:
            if not hasattr(unit, 'tenant') or unit.tenant is None:
                raise ValidationError(
                    f"No se puede usar prorrateo por ocupantes: la unidad '{unit.name}' "
                    "no tiene inquilino asignado."
                )
            if unit.tenant.number_of_occupants <= 0:
                raise ValidationError(
                    f"No se puede usar prorrateo por ocupantes: el inquilino de la unidad "
                    f"'{unit.name}' no tiene número de ocupantes válido."
                )