# backend/properties/views.py
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Property
from .serializers import PropertySerializer

class PropertyListCreateAPIView(generics.ListCreateAPIView):
    """
    Vista para listar las propiedades de un usuario y para crear nuevas propiedades.
    """
    serializer_class = PropertySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Sobrescribe el queryset para asegurar que los usuarios
        solo puedan ver y gestionar sus propias propiedades.
        """
        return Property.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """
        Sobrescribe el método de creación para inyectar automáticamente
        al usuario autenticado como propietario de la nueva propiedad.
        """
        serializer.save(user=self.request.user)