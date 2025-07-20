# backend/tenants/models.py
from django.db import models
from django.core.validators import MinValueValidator
from properties.models import Unit

class Tenant(models.Model):
    """
    Representa a un inquilino asociado a una única unidad, incluyendo
    el número de ocupantes para el cálculo de prorrateo.
    """
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True, help_text="El correo debe ser único para cada inquilino.")
    number_of_occupants = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1)],
        help_text="Número de personas que ocupan la unidad."
    )

    # Clave uno a uno. Una unidad solo puede tener un inquilino.
    # Si la unidad es eliminada, el registro del inquilino también se elimina.
    unit = models.OneToOneField(Unit, on_delete=models.CASCADE, related_name='tenant')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.name} ({self.unit.name})'


class Tenancy(models.Model):
    """
    Representa un período de arrendamiento entre un inquilino y una unidad.
    """
    unit = models.ForeignKey(
        Unit, 
        on_delete=models.CASCADE, 
        related_name='tenancies',
        help_text="La unidad que está siendo arrendada."
    )
    tenant = models.ForeignKey(
        'Tenant', 
        on_delete=models.CASCADE, 
        related_name='tenancies',
        help_text="El inquilino que arrienda la unidad."
    )
    number_of_occupants = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1)],
        help_text="Número de personas que ocupan la unidad durante este arrendamiento."
    )
    start_date = models.DateField(
        help_text="Fecha de inicio del arrendamiento."
    )
    end_date = models.DateField(
        null=True, 
        blank=True,
        help_text="Fecha de fin del arrendamiento. Si es null, el arrendamiento está activo."
    )
    
    # Campos de auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Tenancy"
        verbose_name_plural = "Tenancies"
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['unit', 'start_date']),
            models.Index(fields=['unit', 'end_date']),
        ]

    def clean(self):
        """
        Validaciones básicas del modelo.
        """
        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValidationError("La fecha de fin no puede ser anterior a la fecha de inicio.")

    @property
    def is_active(self):
        """
        Retorna True si el arrendamiento no tiene fecha de fin.
        """
        return self.end_date is None

    def __str__(self):
        end_date_str = self.end_date.strftime('%Y-%m-%d') if self.end_date else 'Activo'
        return f'{self.tenant.name} en {self.unit.name} ({self.start_date} - {end_date_str})'