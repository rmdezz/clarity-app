# backend/properties/serializers.py
from rest_framework import serializers
from .models import Property, Unit

class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = ['id', 'name', 'created_at', 'updated_at']

class PropertySerializer(serializers.ModelSerializer):
    units = UnitSerializer(many=True, read_only=True) # Serializador anidado

    class Meta:
        model = Property
        fields = ['id', 'name', 'address', 'user', 'created_at', 'updated_at', 'units']
        read_only_fields = ['user']