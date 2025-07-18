# backend/users/tests/test_registration_api.py
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from django.urls import reverse

class RegistrationAPITest(APITestCase):
    def test_registro_exitoso_crea_usuario_y_retorna_tokens(self):
        """
        Verifica que un nuevo usuario puede ser registrado exitosamente.
        """
        url = reverse('register-user')
        data = {
            'email': 'david.test@example.com',
            # El campo 'username' ha sido eliminado del payload de la prueba.
            'password': 'StrongPassword123',
            'password2': 'StrongPassword123'
        }

        response = self.client.post(url, data, format='json')

        # Para depuración, si la prueba vuelve a fallar, descomente la siguiente línea:
        # print(response.data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        
        user = User.objects.get()
        self.assertEqual(user.email, 'david.test@example.com')
        # Verificar que el username fue asignado correctamente
        self.assertEqual(user.username, 'david.test@example.com') 
        self.assertTrue(user.check_password('StrongPassword123'))

        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_registro_falla_con_email_existente(self):
        """
        Verifica que la API rechaza un intento de registro con un email
        que ya existe en la base de datos.
        """
        # GIVEN: Un usuario ya existe en la base de datos.
        existing_email = 'david.exists@example.com'
        User.objects.create_user(username=existing_email, email=existing_email, password='SomePassword123')

        url = reverse('register-user')
        data = {
            'email': existing_email,
            'username': existing_email,
            'password': 'NewPassword456',
            'password2': 'NewPassword456'
        }

        # WHEN: Se realiza una petición POST con el mismo email.
        response = self.client.post(url, data, format='json')

        # THEN: La respuesta debe tener un estado 400 Bad Request.
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # AND: No se debe haber creado un nuevo usuario.
        self.assertEqual(User.objects.count(), 1)
    
    def test_registro_falla_con_password_demasiado_corto(self):
        """
        Verifica que la API rechaza una contraseña que no cumple con los
        criterios mínimos de longitud de Django.
        """
        url = reverse('register-user')
        data = {
            'email': 'david.weakpass@example.com',
            'username': 'david.weakpass@example.com',
            'password': 'short',
            'password2': 'short'
        }
        response = self.client.post(url, data, format='json')

        # THEN: La respuesta debe ser 400 y el usuario no debe ser creado.
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(User.objects.count(), 0) # Asumiendo una BD limpia para esta prueba
        # AND: La respuesta debe contener un error específico sobre la contraseña.
        self.assertIn('password', response.data)
    
    def test_registro_falla_si_passwords_no_coinciden(self):
        """
        Verifica que la API rechaza la petición si los campos de contraseña
        no coinciden.
        """
        url = reverse('register-user')
        data = {
            'email': 'david.mismatch@example.com',
            'username': 'david.mismatch@example.com',
            'password': 'StrongPassword123',
            'password2': 'DIFFERENTPassword456'
        }
        response = self.client.post(url, data, format='json')

        # THEN: La respuesta debe ser 400 y el usuario no debe ser creado.
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(User.objects.count(), 0) # Asumiendo una BD limpia
        self.assertIn('password', response.data)
        self.assertEqual(str(response.data['password'][0]), 'Las contraseñas no coinciden.')