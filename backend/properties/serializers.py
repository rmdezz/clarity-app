# backend/properties/serializers.py
from rest_framework import serializers
from .models import Property

class PropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = ['id', 'name', 'address', 'user', 'created_at', 'updated_at']
        # El campo 'user' es de solo lectura. Se asigna en la vista para garantizar
        # que el propietario sea siempre el usuario autenticado.
        read_only_fields = ['user']