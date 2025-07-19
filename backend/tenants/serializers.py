# backend/tenants/serializers.py
from rest_framework import serializers
from .models import Tenant

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'name', 'email', 'number_of_occupants', 'created_at', 'updated_at']
        read_only_fields = ['unit'] # La unidad se asigna desde la URL