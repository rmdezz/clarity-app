# backend/users/tests/test_logout_api.py

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken

class LogoutAPITest(APITestCase):
    def setUp(self):
        """
        Configura un usuario de prueba antes de cada test.
        Se asegura de que el 'username' se proporciona, cumpliendo con los requisitos del modelo User.
        """
        self.email = 'david.logout@example.com'
        self.user = User.objects.create_user(
            username=self.email, # <-- Argumento requerido añadido
            email=self.email, 
            password='StrongPassword123'
        )
        self.refresh = RefreshToken.for_user(self.user)
        self.access_token = str(self.refresh.access_token)
        self.refresh_token = str(self.refresh)
        self.logout_url = reverse('logout-user')

    def test_logout_exitoso_invalida_refresh_token(self):
        """
        Verifica que un logout exitoso añade el refresh token a la lista negra.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.post(self.logout_url, {'refresh': self.refresh_token}, format='json')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertTrue(BlacklistedToken.objects.filter(token__jti=self.refresh.payload['jti']).exists())

    def test_logout_falla_sin_access_token(self):
        """
        Verifica que el endpoint está protegido y requiere un access token.
        """
        response = self.client.post(self.logout_url, {'refresh': self.refresh_token}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_falla_con_refresh_token_invalido(self):
        """
        Verifica que la API maneja correctamente un refresh token basura.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.post(self.logout_url, {'refresh': 'not-a-valid-token'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'Token inválido o caducado.')