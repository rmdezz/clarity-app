# backend/tenants/tests/test_tenant_assignment_api.py
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from properties.models import Property, Unit
from ..models import Tenant

class TenantAssignmentAPITest(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(username='user.tenant.test@example.com', password='password123')
        self.property_a = Property.objects.create(name='Propiedad Test Inquilino', address='Calle Test', user=self.user_a)
        self.unit_vacant = Unit.objects.create(name='Apto Test Vacante', property=self.property_a)
        self.unit_occupied = Unit.objects.create(name='Apto Test Ocupado', property=self.property_a)
        Tenant.objects.create(name='Inquilino Previo', email='previo@email.com', number_of_occupants=1, unit=self.unit_occupied)

    def test_assign_tenant_exitoso(self):
        """Verifica que un propietario puede asignar un inquilino con todos los datos correctos."""
        self.client.force_authenticate(user=self.user_a)
        url = reverse('tenant-assign', kwargs={'unit_pk': self.unit_vacant.pk})
        data = {'name': 'Juan Pérez', 'email': 'juan.perez@email.com', 'number_of_occupants': 3}
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Juan Pérez')
        self.assertEqual(response.data['number_of_occupants'], 3)
        self.assertTrue(Tenant.objects.filter(unit=self.unit_vacant).exists())

    def test_assign_tenant_falla_si_unidad_ocupada(self):
        """Verifica 409 Conflict si la unidad ya tiene un inquilino."""
        self.client.force_authenticate(user=self.user_a)
        url = reverse('tenant-assign', kwargs={'unit_pk': self.unit_occupied.pk})
        data = {'name': 'Inquilino Intruso', 'email': 'intruso@email.com', 'number_of_occupants': 1}
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_assign_tenant_falla_con_ocupantes_invalidos(self):
        """Verifica 400 Bad Request para un número de ocupantes inválido."""
        self.client.force_authenticate(user=self.user_a)
        url = reverse('tenant-assign', kwargs={'unit_pk': self.unit_vacant.pk})
        data = {'name': 'Sin Ocupantes', 'email': 'sin@email.com', 'number_of_occupants': 0}
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('number_of_occupants', response.data)