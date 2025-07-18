# backend/users/views/auth_views.py

from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

# La nueva ruta de importación, relativa a la ubicación de este archivo.
from ..serializers.registration_serializer import UserRegistrationSerializer
from ..services import user_service

class UserRegistrationAPIView(generics.CreateAPIView):
    """
    Vista para el registro de usuarios.
    Responsabilidades:
    1. Recibir la petición HTTP.
    2. Usar el 'registration_serializer' para validar los datos de entrada.
    3. Delegar la creación del usuario al 'user_service'.
    4. Generar tokens JWT para el nuevo usuario.
    5. Devolver una respuesta HTTP 201 Created con los tokens.
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Delegamos la lógica de negocio pura al servicio.
        # La vista no sabe 'cómo' se crea un usuario, solo que debe ser creado.
        user = user_service.create_user(
            email=serializer.validated_data['email'],
            password=serializer.validated_data['password']
        )
        
        # Generar los tokens JWT
        refresh = RefreshToken.for_user(user)
        
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

        headers = self.get_success_headers(serializer.data)
        
        return Response(data, status=status.HTTP_201_CREATED, headers=headers)