# backend/properties/tests/test_unit_api.py
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from ..models import Property

class UnitAPITest(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(username='user.a@example.com', password='password123')
        self.user_b = User.objects.create_user(username='user.b@example.com', password='password123')
        self.property_a = Property.objects.create(name='Propiedad de A', address='Calle A', user=self.user_a)

    def test_create_unit_exitoso(self):
        """Verifica que el propietario puede añadir una unidad a su propiedad."""
        self.client.force_authenticate(user=self.user_a)
        url = reverse('unit-create', kwargs={'property_pk': self.property_a.pk})
        data = {'name': 'Apto 101'}
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.property_a.units.count(), 1)
        self.assertEqual(self.property_a.units.first().name, 'Apto 101')

    def test_create_unit_falla_para_propiedad_ajena(self):
        """Verifica que un usuario no puede añadir una unidad a una propiedad que no le pertenece."""
        self.client.force_authenticate(user=self.user_b) # Autenticado como Usuario B
        url = reverse('unit-create', kwargs={'property_pk': self.property_a.pk})
        data = {'name': 'Unidad Intruso'}
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.property_a.units.count(), 0)

    def test_create_unit_falla_con_nombre_vacio(self):
        """Verifica que la validación del backend rechaza un nombre de unidad vacío."""
        self.client.force_authenticate(user=self.user_a)
        url = reverse('unit-create', kwargs={'property_pk': self.property_a.pk})
        data = {'name': ''}
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)