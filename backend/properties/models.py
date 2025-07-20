# backend/properties/models.py

from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

class Property(models.Model):
    """
    Representa una propiedad inmobiliaria perteneciente a un usuario.
    """
    name = models.CharField(max_length=255, blank=False, null=False, help_text="El nombre de la propiedad (ej. Edificio Central)")
    address = models.TextField(blank=False, null=False, help_text="La dirección completa de la propiedad")
    
    # Clave foránea que vincula la propiedad a un usuario.
    # Si el usuario es eliminado, sus propiedades también lo serán (CASCADE).
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='properties')
    
    # Campos de auditoría. Se gestionan automáticamente.
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Properties" # Corrige el plural en el admin de Django

    def __str__(self):
        return f'{self.name} ({self.user.username})'

class Unit(models.Model):
    """
    Representa una unidad individual (ej. apartamento, oficina) dentro de una Propiedad.
    """
    name = models.CharField(max_length=255, blank=False, null=False, help_text="El nombre o número de la unidad (ej. Apto 101)")
    
    # Clave foránea que establece la relación con Property.
    # related_name='units' nos permite acceder a las unidades desde una instancia de Property (ej. property.units.all())
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='units')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.name} ({self.property.name})'


class BillingCycle(models.Model):
    """
    Representa un ciclo de facturación para una propiedad en un mes y año específicos.
    """
    class Status(models.TextChoices):
        OPEN = 'open', 'Abierto'
        IN_REVIEW = 'in_review', 'En Revisión'
        CLOSED = 'closed', 'Cerrado'

    property = models.ForeignKey(
        Property, 
        on_delete=models.CASCADE, 
        related_name='billing_cycles',
        help_text="La propiedad a la que pertenece este ciclo de facturación."
    )
    month = models.PositiveSmallIntegerField(
        help_text="El mes del ciclo de facturación (1-12)."
    )
    year = models.PositiveIntegerField(
        help_text="El año del ciclo de facturación."
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
        help_text="El estado actual del ciclo de facturación."
    )
    
    # Campos de auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Restricción crítica: Una propiedad no puede tener más de un ciclo por mes/año
        constraints = [
            models.UniqueConstraint(
                fields=['property', 'month', 'year'],
                name='unique_property_month_year_billing_cycle'
            )
        ]
        verbose_name = "Billing Cycle"
        verbose_name_plural = "Billing Cycles"
        ordering = ['-year', '-month']  # Ordenar por más reciente primero

    def clean(self):
        """
        Validación personalizada para el modelo BillingCycle.
        """
        # Validar que el mes esté en el rango correcto
        if self.month < 1 or self.month > 12:
            raise ValidationError("El mes debe estar entre 1 y 12.")
        
        # Validar que el año sea razonable
        if self.year < 2020 or self.year > 2030:
            raise ValidationError("El año debe estar entre 2020 y 2030.")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        month_names = {
            1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
            5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
            9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
        }
        month_name = month_names.get(self.month, f'Mes {self.month}')
        return f'{month_name} {self.year} - {self.property.name} ({self.get_status_display()})'


class Expense(models.Model):
    """
    Representa un gasto asociado a un ciclo de facturación.
    """
    billing_cycle = models.ForeignKey(
        BillingCycle,
        on_delete=models.CASCADE,
        related_name='expenses',
        help_text="El ciclo de facturación al que pertenece este gasto."
    )
    service_type = models.CharField(
        max_length=50,
        help_text="El tipo de servicio del gasto (ej. electricity, water)."
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="El monto total del gasto."
    )
    invoice_pdf = models.FileField(
        upload_to='invoices/',
        help_text="El archivo PDF de la factura original."
    )
    
    # Campos de auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Expense"
        verbose_name_plural = "Expenses"
        ordering = ['-created_at']  # Ordenar por más reciente primero
    
    def __str__(self):
        return f'{self.service_type} - S/ {self.total_amount:.2f} ({self.billing_cycle})'