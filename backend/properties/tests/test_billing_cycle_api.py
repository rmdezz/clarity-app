# backend/properties/tests/test_billing_cycle_api.py
from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from properties.models import Property, BillingCycle


class BillingCycleAPITestCase(TestCase):
    """
    Suite completa de pruebas para la API de ciclos de facturación.
    Implementa todos los criterios de aceptación de HU-11.
    """

    def setUp(self):
        """Configuración inicial para todas las pruebas."""
        self.client = APIClient()
        
        # Crear usuarios de prueba
        self.user1 = User.objects.create_user(
            username='david',
            email='david@test.com',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            username='otro_usuario',
            email='otro@test.com',
            password='testpass123'
        )
        
        # Crear propiedades de prueba
        self.property1 = Property.objects.create(
            name="Edificio Central",
            address="Calle Principal 123",
            user=self.user1
        )
        self.property2 = Property.objects.create(
            name="Edificio del Otro Usuario",
            address="Avenida Test 456",
            user=self.user2
        )
        
        # URLs para las pruebas
        self.url_create_cycle = reverse(
            'billing-cycle-list-create', 
            kwargs={'property_id': self.property1.pk}
        )
        self.url_list_cycles = self.url_create_cycle  # Misma URL para GET y POST
        
        # Fecha actual para validaciones
        self.current_date = timezone.now().date()
        self.current_month = self.current_date.month
        self.current_year = self.current_date.year

    def authenticate_user1(self):
        """Autentica al usuario 1 (David)."""
        self.client.force_authenticate(user=self.user1)

    def authenticate_user2(self):
        """Autentica al usuario 2."""
        self.client.force_authenticate(user=self.user2)

    # ===== PRUEBAS DE CREACIÓN DE CICLO (POST) =====

    def test_create_billing_cycle_success(self):
        """
        [CA-11.2] Prueba la creación exitosa de un ciclo de facturación.
        """
        self.authenticate_user1()
        
        # Usar el mes anterior para evitar problemas con fechas futuras
        test_month = self.current_month - 1 if self.current_month > 1 else 12
        test_year = self.current_year if self.current_month > 1 else self.current_year - 1
        
        payload = {
            "month": test_month,
            "year": test_year
        }
        
        response = self.client.post(self.url_create_cycle, data=payload, format='json')
        
        # Verificar respuesta exitosa
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['month'], test_month)
        self.assertEqual(response.data['year'], test_year)
        self.assertEqual(response.data['status'], 'open')
        self.assertEqual(response.data['property'], self.property1.pk)
        self.assertEqual(response.data['property_name'], "Edificio Central")
        
        # Verificar que se creó en la base de datos
        cycle = BillingCycle.objects.get(id=response.data['id'])
        self.assertEqual(cycle.property, self.property1)
        self.assertEqual(cycle.month, test_month)
        self.assertEqual(cycle.year, test_year)
        self.assertEqual(cycle.status, BillingCycle.Status.OPEN)

    def test_create_billing_cycle_duplicate_returns_409(self):
        """
        [CA-11.2] Prueba que crear un ciclo duplicado retorna 409 Conflict.
        """
        self.authenticate_user1()
        
        test_month = self.current_month - 1 if self.current_month > 1 else 12
        test_year = self.current_year if self.current_month > 1 else self.current_year - 1
        
        # Crear el primer ciclo
        BillingCycle.objects.create(
            property=self.property1,
            month=test_month,
            year=test_year
        )
        
        # Intentar crear un ciclo duplicado
        payload = {
            "month": test_month,
            "year": test_year
        }
        
        response = self.client.post(self.url_create_cycle, data=payload, format='json')
        
        # Verificar respuesta 409 Conflict
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("error", response.data)
        self.assertIn("Ya existe un ciclo", response.data["error"])

    def test_create_billing_cycle_future_date_returns_400(self):
        """
        [CA-11.3] Prueba que no se pueden crear ciclos para fechas futuras.
        """
        self.authenticate_user1()
        
        # Intentar crear ciclo para el próximo mes
        future_month = self.current_month + 1 if self.current_month < 12 else 1
        future_year = self.current_year if self.current_month < 12 else self.current_year + 1
        
        payload = {
            "month": future_month,
            "year": future_year
        }
        
        response = self.client.post(self.url_create_cycle, data=payload, format='json')
        
        # Verificar respuesta 400 Bad Request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("No se pueden crear ciclos", str(response.data))

    def test_create_billing_cycle_invalid_month_returns_400(self):
        """
        Prueba validación de mes inválido (fuera del rango 1-12).
        """
        self.authenticate_user1()
        
        payload = {
            "month": 13,  # Mes inválido
            "year": self.current_year
        }
        
        response = self.client.post(self.url_create_cycle, data=payload, format='json')
        
        # Verificar respuesta 400 Bad Request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_billing_cycle_invalid_year_returns_400(self):
        """
        Prueba validación de año inválido (fuera del rango permitido).
        """
        self.authenticate_user1()
        
        payload = {
            "month": 6,
            "year": 2050  # Año fuera del rango permitido
        }
        
        response = self.client.post(self.url_create_cycle, data=payload, format='json')
        
        # Verificar respuesta 400 Bad Request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_billing_cycle_unauthorized_property_returns_404(self):
        """
        Prueba que un usuario no puede crear ciclos en propiedades ajenas.
        """
        self.authenticate_user2()  # Usuario 2 intenta acceder a propiedad de usuario 1
        
        payload = {
            "month": self.current_month - 1 if self.current_month > 1 else 12,
            "year": self.current_year if self.current_month > 1 else self.current_year - 1
        }
        
        response = self.client.post(self.url_create_cycle, data=payload, format='json')
        
        # Verificar respuesta 404 Not Found
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_billing_cycle_unauthenticated_returns_401(self):
        """
        Prueba que se requiere autenticación para crear ciclos.
        """
        payload = {
            "month": 6,
            "year": 2024
        }
        
        response = self.client.post(self.url_create_cycle, data=payload, format='json')
        
        # Verificar respuesta 401 Unauthorized
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ===== PRUEBAS DE LISTADO DE CICLOS (GET) =====

    def test_list_billing_cycles_success(self):
        """
        Prueba el listado exitoso de ciclos de facturación.
        """
        self.authenticate_user1()
        
        # Crear algunos ciclos de prueba
        cycle1 = BillingCycle.objects.create(
            property=self.property1,
            month=6,
            year=2024
        )
        cycle2 = BillingCycle.objects.create(
            property=self.property1,
            month=7,
            year=2024
        )
        
        response = self.client.get(self.url_list_cycles)
        
        # Verificar respuesta exitosa
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 2)
        
        # Verificar orden (más reciente primero)
        self.assertEqual(response.data[0]['id'], cycle2.id)  # Julio 2024
        self.assertEqual(response.data[1]['id'], cycle1.id)  # Junio 2024

    def test_list_billing_cycles_empty_property(self):
        """
        Prueba el listado cuando no hay ciclos en la propiedad.
        """
        self.authenticate_user1()
        
        response = self.client.get(self.url_list_cycles)
        
        # Verificar respuesta exitosa con lista vacía
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_list_billing_cycles_unauthorized_property_returns_404(self):
        """
        Prueba que un usuario no puede listar ciclos de propiedades ajenas.
        """
        self.authenticate_user2()  # Usuario 2 intenta acceder a propiedad de usuario 1
        
        response = self.client.get(self.url_list_cycles)
        
        # Verificar respuesta 404 Not Found
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_billing_cycles_unauthenticated_returns_401(self):
        """
        Prueba que se requiere autenticación para listar ciclos.
        """
        response = self.client.get(self.url_list_cycles)
        
        # Verificar respuesta 401 Unauthorized
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ===== PRUEBAS DE DETALLE DE CICLO (GET por ID) =====

    def test_retrieve_billing_cycle_success(self):
        """
        Prueba la obtención exitosa de detalles de un ciclo específico.
        """
        self.authenticate_user1()
        
        # Crear un ciclo de prueba
        cycle = BillingCycle.objects.create(
            property=self.property1,
            month=7,
            year=2024
        )
        
        url_detail = reverse('billing-cycle-detail', kwargs={'pk': cycle.pk})
        response = self.client.get(url_detail)
        
        # Verificar respuesta exitosa
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], cycle.id)
        self.assertEqual(response.data['month'], 7)
        self.assertEqual(response.data['year'], 2024)
        self.assertEqual(response.data['property_name'], "Edificio Central")

    def test_retrieve_billing_cycle_unauthorized_returns_404(self):
        """
        Prueba que un usuario no puede obtener detalles de ciclos de propiedades ajenas.
        """
        self.authenticate_user2()
        
        # Crear un ciclo en la propiedad del usuario 1
        cycle = BillingCycle.objects.create(
            property=self.property1,
            month=7,
            year=2024
        )
        
        url_detail = reverse('billing-cycle-detail', kwargs={'pk': cycle.pk})
        response = self.client.get(url_detail)
        
        # Verificar respuesta 404 Not Found
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_nonexistent_billing_cycle_returns_404(self):
        """
        Prueba que obtener un ciclo inexistente retorna 404.
        """
        self.authenticate_user1()
        
        url_detail = reverse('billing-cycle-detail', kwargs={'pk': 99999})
        response = self.client.get(url_detail)
        
        # Verificar respuesta 404 Not Found
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ===== PRUEBAS DE VALIDACIONES DEL MODELO =====

    def test_billing_cycle_model_string_representation(self):
        """
        Prueba la representación en string del modelo BillingCycle.
        """
        cycle = BillingCycle.objects.create(
            property=self.property1,
            month=7,
            year=2024
        )
        
        expected_string = f"Julio 2024 - Edificio Central (Abierto)"
        self.assertEqual(str(cycle), expected_string)

    def test_billing_cycle_model_ordering(self):
        """
        Prueba que los ciclos se ordenan correctamente (más reciente primero).
        """
        cycle1 = BillingCycle.objects.create(
            property=self.property1,
            month=6,
            year=2024
        )
        cycle2 = BillingCycle.objects.create(
            property=self.property1,
            month=7,
            year=2024
        )
        cycle3 = BillingCycle.objects.create(
            property=self.property1,
            month=5,
            year=2024
        )
        
        cycles = list(BillingCycle.objects.all())
        
        # Verificar orden: Julio, Junio, Mayo
        self.assertEqual(cycles[0], cycle2)  # Julio 2024
        self.assertEqual(cycles[1], cycle1)  # Junio 2024
        self.assertEqual(cycles[2], cycle3)  # Mayo 2024

    def test_billing_cycle_unique_constraint(self):
        """
        Prueba que la restricción de unicidad funciona a nivel de modelo.
        """
        # Crear el primer ciclo
        BillingCycle.objects.create(
            property=self.property1,
            month=7,
            year=2024
        )
        
        # Intentar crear un ciclo duplicado debe fallar
        with self.assertRaises(Exception):  # IntegrityError o ValidationError
            BillingCycle.objects.create(
                property=self.property1,
                month=7,
                year=2024
            )