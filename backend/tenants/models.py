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