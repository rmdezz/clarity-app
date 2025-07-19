# backend/properties/tests/test_property_api.py

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from ..models import Property

class PropertyAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='david.property@example.com', password='StrongPassword123')
        self.url = reverse('property-list-create') # Definiremos este nombre de URL

    def test_crear_propiedad_exitoso(self):
        """
        Verifica que un usuario autenticado puede crear una propiedad.
        """
        self.client.force_authenticate(user=self.user)
        data = {'name': 'Edificio Sol', 'address': 'Calle del Amanecer 123'}
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Property.objects.count(), 1)
        
        prop = Property.objects.first()
        self.assertEqual(prop.name, 'Edificio Sol')
        self.assertEqual(prop.user, self.user)

    def test_crear_propiedad_falla_sin_autenticacion(self):
        """
        Verifica que un usuario no autenticado no puede crear una propiedad.
        """
        data = {'name': 'Edificio Fantasma', 'address': 'Calle Inexistente 404'}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_crear_propiedad_falla_con_datos_invalidos(self):
        """
        Verifica que la validación del backend rechaza datos incompletos.
        """
        self.client.force_authenticate(user=self.user)
        data = {'name': '', 'address': 'Dirección sin nombre'}
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Property.objects.count(), 0)