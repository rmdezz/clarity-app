from django.contrib.auth.models import User

def create_user(email: str, password: str) -> User:
    """
    Encapsula la lógica de negocio para crear un usuario.
    Retorna la instancia del usuario creado.
    """
    # La validación de email duplicado y hasheo de contraseña
    # está gestionada por el propio manager de Django.
    user = User.objects.create_user(username=email, email=email, password=password)
    return user