# backend/users/serializers/login_serializer.py
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import AuthenticationFailed

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Autenticación por email y formato de error acorde a los tests."""
    email = serializers.EmailField(write_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields.pop("username", None)  # no exponer username

    def validate(self, attrs):
        # Mapear email ➜ username para que authenticate() funcione
        attrs["username"] = attrs.get("email")
        User = get_user_model()

        try:
            return super().validate(attrs)   # caso éxito
        except AuthenticationFailed as exc:  # credenciales malas
            email = attrs.get("email")
            if User.objects.filter(username=email).exists():
                # Email correcto pero password incorrecto → clave 'error'
                raise serializers.ValidationError(
                    {
                        "error": (
                            "Credenciales inválidas. Por favor, verifique "
                            "su correo y contraseña."
                        )
                    }
                )
            # Email inexistente → mantener respuesta estándar ('detail')
            raise exc
