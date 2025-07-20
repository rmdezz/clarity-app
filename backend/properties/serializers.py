# backend/properties/serializers.py
from rest_framework import serializers
from django.utils import timezone
from .models import Property, Unit, BillingCycle, Expense
from tenants.serializers import TenantSerializer
from rules.models import ServiceRule

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


class UnitCreateSerializer(serializers.ModelSerializer):
    """
    Serializador para crear unidades.
    """
    class Meta:
        model = Unit
        fields = ['name']
        
    def validate_name(self, value):
        """
        Validar que el nombre de la unidad sea único dentro de la propiedad.
        """
        property = self.context.get('property')
        if property and Unit.objects.filter(property=property, name=value).exists():
            raise serializers.ValidationError(f"Ya existe una unidad con el nombre '{value}' en esta propiedad.")
        return value


class UnitUpdateSerializer(serializers.ModelSerializer):
    """
    Serializador para actualizar unidades.
    """
    class Meta:
        model = Unit
        fields = ['name']
        
    def validate_name(self, value):
        """
        Validar que el nombre de la unidad sea único dentro de la propiedad.
        """
        property = self.instance.property if self.instance else None
        if property and Unit.objects.filter(property=property, name=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError(f"Ya existe otra unidad con el nombre '{value}' en esta propiedad.")
        return value

class PropertySerializer(serializers.ModelSerializer):
    units = UnitSerializer(many=True, read_only=True) # Serializador anidado

    class Meta:
        model = Property
        fields = ['id', 'name', 'address', 'user', 'created_at', 'updated_at', 'units']
        read_only_fields = ['user']


class BillingCycleSerializer(serializers.ModelSerializer):
    """
    Serializer para BillingCycle usado en respuestas de API.
    """
    property_name = serializers.CharField(source='property.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = BillingCycle
        fields = [
            'id', 'property', 'property_name', 'month', 'year', 
            'status', 'status_display', 'created_at', 'updated_at'
        ]
        read_only_fields = ['property', 'status', 'created_at', 'updated_at']


class BillingCycleCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear nuevos ciclos de facturación.
    Incluye validaciones específicas para la creación.
    """
    
    class Meta:
        model = BillingCycle
        fields = ['month', 'year']
    
    def validate(self, attrs):
        """
        Validaciones personalizadas para la creación de ciclos de facturación.
        """
        month = attrs.get('month')
        year = attrs.get('year')
        
        # Validar que el mes esté en el rango correcto
        if month < 1 or month > 12:
            raise serializers.ValidationError("El mes debe estar entre 1 y 12.")
        
        # Validar que el año sea razonable
        if year < 2020 or year > 2030:
            raise serializers.ValidationError("El año debe estar entre 2020 y 2030.")
        
        # Validar que no sea una fecha futura
        current_date = timezone.now().date()
        current_month = current_date.month
        current_year = current_date.year
        
        if year > current_year or (year == current_year and month > current_month):
            raise serializers.ValidationError(
                "No se pueden crear ciclos de facturación para fechas futuras."
            )
        
        return attrs
    
    def validate_property_uniqueness(self, property_obj, month, year):
        """
        Verifica que no exista ya un ciclo para esta propiedad en el mes/año especificado.
        """
        existing_cycle = BillingCycle.objects.filter(
            property=property_obj,
            month=month,
            year=year
        ).exists()
        
        if existing_cycle:
            raise serializers.ValidationError(
                "Ya existe un ciclo de facturación para esta propiedad en este mes y año."
            )


class BillingCycleListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listas de ciclos de facturación.
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = BillingCycle
        fields = ['id', 'month', 'year', 'status', 'status_display', 'created_at']


class ExpenseSerializer(serializers.ModelSerializer):
    """
    Serializer para gastos asociados a ciclos de facturación.
    """
    invoice_pdf_url = serializers.SerializerMethodField()
    service_type_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Expense
        fields = [
            'id', 'billing_cycle', 'service_type', 'service_type_display',
            'total_amount', 'invoice_pdf', 'invoice_pdf_url', 'created_at', 'updated_at'
        ]
        read_only_fields = ['billing_cycle', 'created_at', 'updated_at']
    
    def get_invoice_pdf_url(self, obj):
        """
        Devuelve la URL completa del archivo PDF.
        """
        if obj.invoice_pdf:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.invoice_pdf.url)
            return obj.invoice_pdf.url
        return None
    
    def get_service_type_display(self, obj):
        """
        Devuelve el nombre legible del tipo de servicio.
        """
        service_choices = dict(ServiceRule.ServiceType.choices)
        return service_choices.get(obj.service_type, obj.service_type)
    
    def validate_service_type(self, value):
        """
        Valida que el service_type sea uno de los tipos válidos.
        """
        valid_choices = [choice[0] for choice in ServiceRule.ServiceType.choices]
        if value not in valid_choices:
            raise serializers.ValidationError(
                f"Tipo de servicio inválido. Debe ser uno de: {', '.join(valid_choices)}"
            )
        return value
    
    def validate(self, attrs):
        """
        Validaciones personalizadas para la creación de gastos.
        """
        billing_cycle = self.context.get('billing_cycle')
        service_type = attrs.get('service_type')
        
        if billing_cycle and service_type:
            # Verificar que el ciclo esté abierto
            if billing_cycle.status != BillingCycle.Status.OPEN:
                raise serializers.ValidationError(
                    "No se pueden añadir gastos a un ciclo que no está abierto."
                )
            
            # Verificar que existe una regla configurada para este servicio
            service_rule_exists = ServiceRule.objects.filter(
                property=billing_cycle.property,
                service_type=service_type
            ).exists()
            
            if not service_rule_exists:
                raise serializers.ValidationError(
                    "Debe configurar una regla para este servicio antes de añadir gastos."
                )
        
        return attrs


class ExpenseCreateSerializer(serializers.ModelSerializer):
    """
    Serializer específico para la creación de gastos.
    """
    class Meta:
        model = Expense
        fields = ['service_type', 'total_amount', 'invoice_pdf']
    
    def validate_service_type(self, value):
        """
        Valida que el service_type sea uno de los tipos válidos.
        """
        valid_choices = [choice[0] for choice in ServiceRule.ServiceType.choices]
        if value not in valid_choices:
            raise serializers.ValidationError(
                f"Tipo de servicio inválido. Debe ser uno de: {', '.join(valid_choices)}"
            )
        return value
    
    def validate_total_amount(self, value):
        """
        Valida que el monto sea positivo.
        """
        if value <= 0:
            raise serializers.ValidationError("El monto debe ser mayor a 0.")
        return value

