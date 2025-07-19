# backend/properties/models.py

from django.db import models
from django.contrib.auth.models import User

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