# backend/rules/serializers.py
from rest_framework import serializers
from .models import Rule, ServiceRule

class RuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rule
        fields = ['id', 'type', 'property']
        read_only_fields = ['property'] # La propiedad se infiere de la URL


class ServiceRuleSerializer(serializers.ModelSerializer):
    """
    Serializer para ServiceRule que maneja la configuración de servicios.
    Solo incluye service_type y rule_type en la respuesta API, ocultando detalles internos.
    """
    
    class Meta:
        model = ServiceRule
        fields = ['service_type', 'rule_type']
        # No incluimos 'property', 'id', 'created_at', 'updated_at' en la API response
    
    def validate(self, attrs):
        """
        Validación a nivel de serializer que complementa la validación del modelo.
        """
        service_type = attrs.get('service_type')
        rule_type = attrs.get('rule_type')
        
        # Validar que los choices son válidos (esto ya lo hace Django, pero es explícito)
        if service_type not in dict(ServiceRule.ServiceType.choices):
            raise serializers.ValidationError(f"service_type '{service_type}' no es válido.")
        
        if rule_type not in dict(ServiceRule.RuleType.choices):
            raise serializers.ValidationError(f"rule_type '{rule_type}' no es válido.")
        
        return attrs


class ServiceRuleListSerializer(serializers.Serializer):
    """
    Serializer para manejar listas de ServiceRule en operaciones PUT.
    Valida que el payload sea un array de objetos válidos.
    """
    service_rules = ServiceRuleSerializer(many=True)
    
    def validate_service_rules(self, value):
        """
        Validaciones adicionales para la lista de reglas de servicio.
        """
        if not value:
            raise serializers.ValidationError("service_rules no puede estar vacío.")
        
        # Validar que no hay duplicados de service_type
        service_types = [rule['service_type'] for rule in value]
        if len(service_types) != len(set(service_types)):
            raise serializers.ValidationError(
                "No se pueden tener reglas duplicadas para el mismo service_type."
            )
        
        return value