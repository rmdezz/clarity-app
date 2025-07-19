# backend/properties/serializers.py
from rest_framework import serializers
from .models import Property, Unit
from tenants.serializers import TenantSerializer

class PropertySummarySerializer(serializers.ModelSerializer):
    """
    Serializador para una vista resumida de la propiedad, optimizado para listados.
    """
    class Meta:
        model = Property
        fields = ['id', 'name', 'address']
        
class UnitSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True, allow_null=True)
    class Meta:
        model = Unit
        fields = ['id', 'name', 'created_at', 'updated_at', 'tenant']

class PropertySerializer(serializers.ModelSerializer):
    units = UnitSerializer(many=True, read_only=True) # Serializador anidado

    class Meta:
        model = Property
        fields = ['id', 'name', 'address', 'user', 'created_at', 'updated_at', 'units']
        read_only_fields = ['user']

