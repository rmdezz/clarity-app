# backend/properties/views.py
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Property
from .serializers import PropertySerializer, UnitSerializer, PropertySummarySerializer
from django.shortcuts import get_object_or_404

class PropertyListCreateAPIView(generics.ListCreateAPIView):
    """
    Vista para listar (GET) y crear (POST) propiedades.
    Utiliza diferentes serializadores para cada acción para optimizar el rendimiento.
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Asegura que los usuarios solo vean sus propias propiedades."""
        return Property.objects.filter(user=self.request.user).order_by('name')

    def get_serializer_class(self):
        """
        Devuelve el serializador apropiado según el método de la petición.
        """
        if self.request.method == 'GET':
            # Para listado, usamos el serializador de resumen (ligero).
            return PropertySummarySerializer
        # Para creación, usamos el serializador completo para la respuesta.
        return PropertySerializer

    def perform_create(self, serializer):
        """Asigna el usuario autenticado a la nueva propiedad."""
        serializer.save(user=self.request.user)

class PropertyRetrieveAPIView(generics.RetrieveAPIView):
    """Vista para obtener los detalles de una propiedad específica."""
    serializer_class = PropertySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtra para asegurar que el usuario solo puede ver sus propiedades."""
        return Property.objects.filter(user=self.request.user)

class UnitCreateAPIView(generics.CreateAPIView):
    """Vista para crear una nueva unidad dentro de una propiedad específica."""
    serializer_class = UnitSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """Asocia la nueva unidad a la propiedad correcta, verificando la propiedad."""
        property_pk = self.kwargs['property_pk']
        # get_object_or_404 aquí actúa como una barrera de seguridad.
        # Si la propiedad no existe O no pertenece al usuario, se devuelve un 404.
        prop = get_object_or_404(Property, pk=property_pk, user=self.request.user)
        serializer.save(property=prop)

