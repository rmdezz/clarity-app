# backend/tenants/views.py
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from properties.models import Unit
from .serializers import TenantSerializer

class TenantAssignAPIView(generics.CreateAPIView):
    """Asigna un nuevo inquilino a una unidad específica."""
    serializer_class = TenantSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        unit_pk = self.kwargs['unit_pk']
        # Seguridad: Verifica que la unidad existe y pertenece al usuario.
        unit = get_object_or_404(Unit, pk=unit_pk, property__user=request.user)
        
        # Regla de Negocio: Verifica que la unidad está vacante.
        if hasattr(unit, 'tenant'):
            return Response(
                {"error": "Esta unidad ya tiene un inquilino asignado."},
                status=status.HTTP_409_CONFLICT
            )
        
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        unit = Unit.objects.get(pk=self.kwargs['unit_pk'])
        serializer.save(unit=unit)