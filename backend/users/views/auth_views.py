# backend/users/views/auth_views.py

from users.serializers.login_serializer import CustomTokenObtainPairSerializer
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model

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

class LoginAPIView(TokenObtainPairView):
    """
    • Usa email en lugar de username.  
    • Si el email existe pero la contraseña es incorrecta → {'error': ...}.  
    • Si el email no existe → respuesta estándar {'detail': ...}.
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        User = get_user_model()
        user_exists = User.objects.filter(username=email).exists()  # username guarda el email

        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except AuthenticationFailed as exc:
            if user_exists:
                # Caso: email correcto, contraseña incorrecta → clave 'error'
                return Response(
                    {
                        "error": "Credenciales inválidas. Por favor, verifique su correo y contraseña."
                    },
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            # Caso: email inexistente → mantenemos formato estándar
            raise exc

        return Response(serializer.validated_data, status=status.HTTP_200_OK)