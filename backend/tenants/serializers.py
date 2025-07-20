# backend/tenants/serializers.py
from rest_framework import serializers
from .models import Tenant, Tenancy


class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'name', 'email', 'number_of_occupants', 'created_at', 'updated_at']
        read_only_fields = ['unit'] # La unidad se asigna desde la URL


class TenancySerializer(serializers.ModelSerializer):
    """
    Serializer completo para leer arrendamientos.
    """
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    tenant_email = serializers.CharField(source='tenant.email', read_only=True)
    unit_name = serializers.CharField(source='unit.name', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Tenancy
        fields = [
            'id', 'unit', 'unit_name', 'tenant', 'tenant_name', 'tenant_email',
            'number_of_occupants', 'start_date', 'end_date', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class TenancyCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear nuevos arrendamientos.
    """
    class Meta:
        model = Tenancy
        fields = ['tenant', 'number_of_occupants', 'start_date', 'end_date']
    
    def validate(self, attrs):
        """
        Validaciones personalizadas usando los servicios.
        """
        from .services import TenancyValidationService
        
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        
        # Validar fechas básicas
        TenancyValidationService.validate_dates(start_date, end_date)
        
        return attrs


class TenancyUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para actualizar arrendamientos existentes.
    """
    class Meta:
        model = Tenancy
        fields = ['number_of_occupants', 'start_date', 'end_date']
    
    def validate(self, attrs):
        """
        Validaciones para actualización.
        """
        from .services import TenancyValidationService
        
        start_date = attrs.get('start_date', self.instance.start_date)
        end_date = attrs.get('end_date', self.instance.end_date)
        
        # Validar fechas básicas
        TenancyValidationService.validate_dates(start_date, end_date)
        
        return attrs


class TenancyEndSerializer(serializers.Serializer):
    """
    Serializer específico para finalizar un arrendamiento.
    """
    end_date = serializers.DateField(required=True)
    
    def validate_end_date(self, value):
        """
        Valida la fecha de finalización.
        """
        from .services import TenancyValidationService
        
        tenancy = self.context.get('tenancy')
        if tenancy:
            TenancyValidationService.validate_dates(tenancy.start_date, value)
            TenancyValidationService.validate_end_date_against_future_tenancies(tenancy, value)
        
        return value