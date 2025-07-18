from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.exceptions import ErrorDetail

class LoginAPITest(APITestCase):
    def setUp(self):
        """
        Configura un usuario de prueba antes de cada test.
        """
        self.email = 'david.login@example.com'
        self.password = 'StrongPassword123'
        self.user = User.objects.create_user(
            username=self.email,
            email=self.email,
            password=self.password
        )
        self.login_url = reverse('token_obtain_pair')

    def test_login_exitoso_retorna_tokens(self):
        """
        Verifica que un login exitoso con credenciales correctas devuelve tokens.
        """
        data = {'email': self.email, 'password': self.password}
        response = self.client.post(self.login_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_falla_con_password_incorrecto(self):
        """
        Verifica que el login falla con una contraseña incorrecta.
        Ahora esperamos 'detail' en lugar de 'error'.
        """
        data = {'email': self.email, 'password': 'WrongPassword'}
        response = self.client.post(self.login_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        # Verificamos que use la clave 'detail'
        self.assertIn('detail', response.data)
        # Y que el mensaje coincida con el default de Simple JWT
        expected = ErrorDetail(string='No active account found with the given credentials', code='no_active_account')
        self.assertEqual(response.data['detail'], expected)

    def test_login_falla_con_email_inexistente(self):
        """
        Verifica que el login falla con un email que no existe.
        """
        data = {'email': 'nonexistent@example.com', 'password': 'anypassword'}
        response = self.client.post(self.login_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('detail', response.data)
