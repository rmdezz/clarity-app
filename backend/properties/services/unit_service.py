# backend/properties/services/unit_service.py
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from ..models import Property, Unit
from tenants.models import Tenancy


class UnitService:
    """Servicio para encapsular la lógica de negocio de las unidades."""

    @staticmethod
    def get_property_units(property_obj):
        """Obtiene todas las unidades de una propiedad."""
        return property_obj.units.all().order_by('name')

    @staticmethod
    def create_unit(property_obj, name):
        """Crea una nueva unidad en la propiedad."""
        # Validar que el nombre sea único en la propiedad
        if Unit.objects.filter(property=property_obj, name=name).exists():
            raise ValidationError(f"Ya existe una unidad con el nombre '{name}' en esta propiedad.")
        
        unit = Unit.objects.create(
            property=property_obj,
            name=name
        )
        return unit

    @staticmethod
    def update_unit(unit, name):
        """Actualiza una unidad existente."""
        # Validar que el nombre sea único en la propiedad (excluyendo la unidad actual)
        if Unit.objects.filter(
            property=unit.property, 
            name=name
        ).exclude(pk=unit.pk).exists():
            raise ValidationError(f"Ya existe otra unidad con el nombre '{name}' en esta propiedad.")
        
        unit.name = name
        unit.save()
        return unit

    @staticmethod
    def delete_unit(unit):
        """Elimina una unidad si no tiene arrendamientos activos."""
        # Verificar si tiene arrendamientos activos
        active_tenancies = Tenancy.objects.filter(
            unit=unit,
            end_date__isnull=True
        ).exists()
        
        if active_tenancies:
            raise ValidationError("No se puede eliminar una unidad con arrendamientos activos.")
        
        unit.delete()

    @staticmethod
    def get_unit_by_id(property_obj, unit_id):
        """Obtiene una unidad específica de la propiedad."""
        return get_object_or_404(Unit, pk=unit_id, property=property_obj)

    @staticmethod
    def validate_property_ownership(property_id, user):
        """Valida que la propiedad pertenece al usuario."""
        return get_object_or_404(Property, pk=property_id, user=user)