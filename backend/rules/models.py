# backend/rules/models.py
from django.db import models
from django.core.exceptions import ValidationError
from properties.models import Property

class Rule(models.Model):
    """
    Representa una regla de asignación de gastos para una propiedad.
    """
    class RuleType(models.TextChoices):
        EQUAL_DIVISION = 'equal_division', 'División Equitativa'
        OCCUPANT_PRORATION = 'occupant_proration', 'Prorrateo por Ocupante'
        PROPORTIONAL_AREA = 'proportional_area', 'Ajuste Proporcional por Área'
        CONSUMPTION_ADJUSTMENT = 'consumption_adjustment', 'Ajuste por Consumo (Medidores)'
        FIXED_FEE = 'fixed_fee', 'Cuota Fija'

    type = models.CharField(
        max_length=50,
        choices=RuleType.choices,
        help_text="El tipo de regla de asignación de gastos."
    )
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='rules')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Una propiedad no debería tener la misma regla dos veces.
        unique_together = ('property', 'type')

    def __str__(self):
        return f'{self.get_type_display()} para {self.property.name}'


class ServiceRule(models.Model):
    """
    Representa la configuración de regla específica para un servicio en una propiedad.
    """
    class ServiceType(models.TextChoices):
        ELECTRICITY = 'electricity', 'Luz'
        WATER = 'water', 'Agua'
        ARBITRIOS = 'arbitrios', 'Arbitrios'
        MOTOR = 'motor', 'Motor'
        MAINTENANCE = 'maintenance', 'Mantenimiento'
        GAS = 'gas', 'Gas'

    class RuleType(models.TextChoices):
        EQUAL_DIVISION = 'equal_division', 'División Equitativa'
        OCCUPANT_PRORATION = 'occupant_proration', 'Prorrateo por Ocupante'
        PROPORTIONAL_AREA = 'proportional_area', 'Ajuste Proporcional por Área'
        CONSUMPTION_ADJUSTMENT = 'consumption_adjustment', 'Ajuste por Consumo (Medidores)'
        FIXED_FEE = 'fixed_fee', 'Cuota Fija'

    service_type = models.CharField(
        max_length=50,
        choices=ServiceType.choices,
        help_text="El tipo de servicio al que se aplica la regla."
    )
    rule_type = models.CharField(
        max_length=50,
        choices=RuleType.choices,
        help_text="El tipo de regla de asignación de gastos para este servicio."
    )
    property = models.ForeignKey(
        Property, 
        on_delete=models.CASCADE, 
        related_name='service_rules',
        help_text="La propiedad a la que pertenece esta configuración de servicio."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Restricción crítica: Una propiedad no puede tener más de una regla por servicio
        constraints = [
            models.UniqueConstraint(
                fields=['property', 'service_type'],
                name='unique_property_service_rule'
            )
        ]
        verbose_name = "Service Rule Configuration"
        verbose_name_plural = "Service Rule Configurations"

    def clean(self):
        """
        Validación personalizada para verificar que las reglas de prorrateo por ocupantes
        solo se apliquen cuando todas las unidades tengan inquilinos con número de ocupantes.
        """
        if self.rule_type == self.RuleType.OCCUPANT_PRORATION:
            if not self._can_use_occupant_proration():
                raise ValidationError(
                    "No se puede usar prorrateo por ocupantes: todas las unidades deben tener "
                    "inquilinos asignados con número de ocupantes."
                )

    def _can_use_occupant_proration(self):
        """
        Verifica si la propiedad cumple los prerrequisitos para usar prorrateo por ocupantes.
        """
        if not self.property_id:
            return False
        
        units = self.property.units.all()
        if not units.exists():
            return False
        
        # Todas las unidades deben tener un inquilino con número de ocupantes > 0
        for unit in units:
            if not hasattr(unit, 'tenant') or unit.tenant is None:
                return False
            if unit.tenant.number_of_occupants <= 0:
                return False
        
        return True

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.get_service_type_display()}: {self.get_rule_type_display()} ({self.property.name})'