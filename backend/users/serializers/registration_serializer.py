from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializador refactorizado para el registro de usuarios.
    No espera un 'username' en la entrada. Lo deriva del 'email'.
    """
    # Se añade un validador explícito para el email, lo que devuelve errores más claros.
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="Un usuario con este correo electrónico ya existe.")]
    )
    password2 = serializers.CharField(style={'input_type': 'password'}, write_only=True)

    class Meta:
        model = User
        # 'username' se elimina de los campos de entrada.
        fields = ('email', 'password', 'password2')
        extra_kwargs = {
            'password': {'write_only': True, 'validators': [validate_password]},
        }

    def validate(self, attrs):
        """
        Verifica que las dos contraseñas proporcionadas coincidan.
        """
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden."})
        return attrs

    def create(self, validated_data):
        """
        Crea un nuevo usuario, estableciendo el username a partir del email
        y hasheando la contraseña.
        """
        user = User.objects.create(
            # Se establece el username aquí, no se espera como entrada.
            username=validated_data['email'],
            email=validated_data['email']
        )
        
        user.set_password(validated_data['password'])
        user.save()

        return user