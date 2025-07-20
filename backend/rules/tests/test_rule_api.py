from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from properties.models import Property, Unit
from tenants.models import Tenant
from ..models import Rule

class RuleAPITest(APITestCase):
    """
    Conjunto de pruebas para el endpoint de la API de Reglas (/api/properties/{id}/rules/).
    Cubre la creación (POST) y validación de diferentes tipos de reglas de gasto.
    """

    def setUp(self):
        """
        Configura el entorno de prueba.
        Crea múltiples usuarios y propiedades con diferentes estados (unidades vacantes vs. ocupadas)
        para probar la lógica de validación de las reglas.
        """
        self.user_a = User.objects.create_user(username='user.a.rule.test@example.com', password='password123')
        self.user_b = User.objects.create_user(username='user.b.rule.test@example.com', password='password123')
        
        # Propiedad donde todas las unidades tienen inquilinos (y por ende, ocupantes)
        self.property_full = Property.objects.create(name='Propiedad Completa', address='Calle Llena 1', user=self.user_a)
        unit1_full = Unit.objects.create(name='U1F', property=self.property_full)
        Tenant.objects.create(name='T1', email='t1@example.com', number_of_occupants=2, unit=unit1_full)

        # Propiedad con al menos una unidad vacante
        self.property_vacant = Property.objects.create(name='Propiedad Parcial', address='Calle Vacía 2', user=self.user_a)
        Unit.objects.create(name='U2V', property=self.property_vacant)

    # --- Pruebas para la Regla "División Equitativa" (HU-08) ---
    
    def test_create_equal_division_rule_exitoso(self):
        """
        Verifica que el propietario puede añadir una regla de división equitativa
        independientemente del estado de ocupación de las unidades.
        """
        self.client.force_authenticate(user=self.user_a)
        url = reverse('rule-create', kwargs={'property_pk': self.property_vacant.pk})
        data = {'type': 'equal_division'}
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Rule.objects.filter(property=self.property_vacant, type='equal_division').exists())

    # --- Pruebas para la Regla "Prorrateo por Ocupante" (HU-09) ---

    def test_create_occupant_proration_rule_exitoso(self):
        """
        Verifica que la regla 'occupant_proration' se puede crear si
        todas las unidades de la propiedad tienen inquilinos asignados.
        """
        self.client.force_authenticate(user=self.user_a)
        url = reverse('rule-create', kwargs={'property_pk': self.property_full.pk})
        data = {'type': 'occupant_proration'}
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Rule.objects.filter(property=self.property_full, type='occupant_proration').exists())

    def test_create_occupant_proration_falla_si_unidades_vacantes(self):
        """
        Verifica que la creación de la regla 'occupant_proration' falla (400)
        si alguna unidad de la propiedad no tiene un inquilino asignado.
        """
        self.client.force_authenticate(user=self.user_a)
        url = reverse('rule-create', kwargs={'property_pk': self.property_vacant.pk})
        data = {'type': 'occupant_proration'}
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Para usar esta regla, todas las unidades de la propiedad deben tener un número de ocupantes asignado.')
        self.assertFalse(Rule.objects.filter(property=self.property_vacant, type='occupant_proration').exists())

    # --- Pruebas Generales de la API ---

    def test_create_rule_falla_para_propiedad_ajena(self):
        """
        Verifica que un usuario no puede añadir reglas a una propiedad que no le pertenece (404).
        """
        self.client.force_authenticate(user=self.user_b) # Autenticado como Usuario B
        url = reverse('rule-create', kwargs={'property_pk': self.property_full.pk})
        data = {'type': 'equal_division'}
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_rule_falla_con_tipo_no_valido(self):
        """
        Verifica que la API devuelve 400 Bad Request para un tipo de regla no reconocido.
        """
        self.client.force_authenticate(user=self.user_a)
        url = reverse('rule-create', kwargs={'property_pk': self.property_full.pk})
        data = {'type': 'tipo_invalido'}
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Verifica que el error es específico sobre el campo 'type'.
        self.assertIn('type', response.data)