# backend/tenants/tests/test_tenancy_api.py

from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date, timedelta
from properties.models import Property, Unit
from tenants.models import Tenant, Tenancy


class TenancyAPITestCase(TestCase):
    """
    Suite completa de pruebas para la API de arrendamientos.
    Implementa todos los criterios de aceptación de HU-MANAGE-TENANCY.
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
        
        # Crear unidades de prueba
        self.unit1 = Unit.objects.create(
            name="Apto 101",
            property=self.property1
        )
        self.unit2 = Unit.objects.create(
            name="Apto 102",
            property=self.property1
        )
        self.unit_user2 = Unit.objects.create(
            name="Apto 201",
            property=self.property2
        )
        
        # Crear inquilinos de prueba
        self.tenant1 = Tenant.objects.create(
            name="Juan Pérez",
            email="juan@test.com",
            number_of_occupants=2,
            unit=self.unit1
        )
        self.tenant2 = Tenant.objects.create(
            name="María García",
            email="maria@test.com",
            number_of_occupants=1,
            unit=self.unit2
        )
        
        # URLs para las pruebas
        self.url_tenancies_unit1 = reverse('tenancy-list-create', kwargs={'unit_id': self.unit1.pk})
        self.url_tenancies_unit2 = reverse('tenancy-list-create', kwargs={'unit_id': self.unit2.pk})
        self.url_tenancies_user2 = reverse('tenancy-list-create', kwargs={'unit_id': self.unit_user2.pk})
        
        # Fechas de prueba
        self.today = date.today()
        self.yesterday = self.today - timedelta(days=1)
        self.tomorrow = self.today + timedelta(days=1)
        self.next_week = self.today + timedelta(days=7)
        self.last_month = self.today - timedelta(days=30)

    def authenticate_user1(self):
        """Autentica al usuario 1 (David)."""
        self.client.force_authenticate(user=self.user1)

    def authenticate_user2(self):
        """Autentica al usuario 2."""
        self.client.force_authenticate(user=self.user2)

    # ===== PRUEBAS DE CREACIÓN DE ARRENDAMIENTOS (POST) =====

    def test_create_tenancy_success(self):
        """
        [CA-MT-02] Prueba la creación exitosa de un arrendamiento.
        """
        self.authenticate_user1()
        
        payload = {
            "tenant": self.tenant1.pk,
            "number_of_occupants": 3,
            "start_date": self.today.isoformat(),
            "end_date": self.next_week.isoformat()
        }
        
        response = self.client.post(self.url_tenancies_unit1, data=payload, format='json')
        
        # Verificar respuesta exitosa
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['tenant'], self.tenant1.pk)
        self.assertEqual(response.data['tenant_name'], "Juan Pérez")
        self.assertEqual(response.data['unit'], self.unit1.pk)
        self.assertEqual(response.data['unit_name'], "Apto 101")
        self.assertEqual(response.data['number_of_occupants'], 3)
        self.assertEqual(response.data['start_date'], self.today.isoformat())
        self.assertEqual(response.data['end_date'], self.next_week.isoformat())
        
        # Verificar que se creó en la base de datos
        tenancy = Tenancy.objects.get(id=response.data['id'])
        self.assertEqual(tenancy.unit, self.unit1)
        self.assertEqual(tenancy.tenant, self.tenant1)
        self.assertEqual(tenancy.number_of_occupants, 3)

    def test_create_tenancy_active_no_end_date(self):
        """
        Prueba la creación de un arrendamiento activo (sin fecha de fin).
        """
        self.authenticate_user1()
        
        payload = {
            "tenant": self.tenant1.pk,
            "number_of_occupants": 2,
            "start_date": self.today.isoformat()
            # Sin end_date
        }
        
        response = self.client.post(self.url_tenancies_unit1, data=payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['end_date'])
        self.assertTrue(response.data['is_active'])

    def test_create_tenancy_overlapping_returns_409(self):
        """
        [CA-MT-02] Prueba que crear arrendamientos superpuestos retorna 409.
        """
        self.authenticate_user1()
        
        # Crear el primer arrendamiento
        Tenancy.objects.create(
            unit=self.unit1,
            tenant=self.tenant1,
            number_of_occupants=2,
            start_date=self.yesterday,
            end_date=self.tomorrow
        )
        
        # Intentar crear un arrendamiento superpuesto
        payload = {
            "tenant": self.tenant1.pk,
            "number_of_occupants": 3,
            "start_date": self.today.isoformat(),
            "end_date": self.next_week.isoformat()
        }
        
        response = self.client.post(self.url_tenancies_unit1, data=payload, format='json')
        
        # Verificar respuesta 409 Conflict
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("error", response.data)
        self.assertIn("se superpone", response.data["error"])

    def test_create_tenancy_invalid_dates_returns_400(self):
        """
        Prueba que fechas inválidas retornan 400.
        """
        self.authenticate_user1()
        
        payload = {
            "tenant": self.tenant1.pk,
            "number_of_occupants": 2,
            "start_date": self.today.isoformat(),
            "end_date": self.yesterday.isoformat()  # Fecha anterior al inicio
        }
        
        response = self.client.post(self.url_tenancies_unit1, data=payload, format='json')
        
        # Verificar respuesta 400 Bad Request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_tenancy_unauthorized_unit_returns_404(self):
        """
        [CA-MT-02] Prueba que un usuario no puede crear arrendamientos en unidades ajenas.
        """
        self.authenticate_user1()  # Usuario 1 intenta acceder a unidad de usuario 2
        
        payload = {
            "tenant": self.tenant1.pk,
            "number_of_occupants": 2,
            "start_date": self.today.isoformat()
        }
        
        response = self.client.post(self.url_tenancies_user2, data=payload, format='json')
        
        # Verificar respuesta 404 Not Found
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_tenancy_unauthenticated_returns_401(self):
        """
        Prueba que se requiere autenticación para crear arrendamientos.
        """
        payload = {
            "tenant": self.tenant1.pk,
            "number_of_occupants": 2,
            "start_date": self.today.isoformat()
        }
        
        response = self.client.post(self.url_tenancies_unit1, data=payload, format='json')
        
        # Verificar respuesta 401 Unauthorized
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ===== PRUEBAS DE LISTADO DE ARRENDAMIENTOS (GET) =====

    def test_list_tenancies_success(self):
        """
        Prueba el listado exitoso de arrendamientos de una unidad.
        """
        self.authenticate_user1()
        
        # Crear algunos arrendamientos de prueba
        tenancy1 = Tenancy.objects.create(
            unit=self.unit1,
            tenant=self.tenant1,
            number_of_occupants=2,
            start_date=self.last_month,
            end_date=self.yesterday
        )
        tenancy2 = Tenancy.objects.create(
            unit=self.unit1,
            tenant=self.tenant1,
            number_of_occupants=3,
            start_date=self.today
        )
        
        response = self.client.get(self.url_tenancies_unit1)
        
        # Verificar respuesta exitosa
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 2)
        
        # Verificar orden (más reciente primero)
        self.assertEqual(response.data[0]['id'], tenancy2.id)
        self.assertEqual(response.data[1]['id'], tenancy1.id)

    def test_list_tenancies_empty_unit(self):
        """
        Prueba el listado cuando no hay arrendamientos en la unidad.
        """
        self.authenticate_user1()
        
        response = self.client.get(self.url_tenancies_unit1)
        
        # Verificar respuesta exitosa con lista vacía
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_list_tenancies_unauthorized_unit_returns_404(self):
        """
        Prueba que un usuario no puede listar arrendamientos de unidades ajenas.
        """
        self.authenticate_user1()  # Usuario 1 intenta acceder a unidad de usuario 2
        
        response = self.client.get(self.url_tenancies_user2)
        
        # Verificar respuesta 404 Not Found
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ===== PRUEBAS DE ACTUALIZACIÓN DE ARRENDAMIENTOS (PUT) =====

    def test_update_tenancy_success(self):
        """
        [CA-MT-02] Prueba la actualización exitosa de un arrendamiento.
        """
        self.authenticate_user1()
        
        # Crear un arrendamiento
        tenancy = Tenancy.objects.create(
            unit=self.unit1,
            tenant=self.tenant1,
            number_of_occupants=2,
            start_date=self.today
        )
        
        url_detail = reverse('tenancy-detail', kwargs={'pk': tenancy.pk})
        payload = {
            "number_of_occupants": 4,
            "start_date": self.yesterday.isoformat(),
            "end_date": self.next_week.isoformat()
        }
        
        response = self.client.put(url_detail, data=payload, format='json')
        
        # Verificar respuesta exitosa
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['number_of_occupants'], 4)
        self.assertEqual(response.data['start_date'], self.yesterday.isoformat())
        self.assertEqual(response.data['end_date'], self.next_week.isoformat())
        
        # Verificar que se actualizó en la base de datos
        tenancy.refresh_from_db()
        self.assertEqual(tenancy.number_of_occupants, 4)
        self.assertEqual(tenancy.start_date, self.yesterday)
        self.assertEqual(tenancy.end_date, self.next_week)

    def test_update_tenancy_overlapping_returns_409(self):
        """
        Prueba que actualizar con fechas que se superponen retorna 409.
        """
        self.authenticate_user1()
        
        # Crear dos arrendamientos
        tenancy1 = Tenancy.objects.create(
            unit=self.unit1,
            tenant=self.tenant1,
            number_of_occupants=2,
            start_date=self.last_month,
            end_date=self.yesterday
        )
        tenancy2 = Tenancy.objects.create(
            unit=self.unit1,
            tenant=self.tenant1,
            number_of_occupants=2,
            start_date=self.today
        )
        
        # Intentar actualizar el segundo para que se superponga con el primero
        url_detail = reverse('tenancy-detail', kwargs={'pk': tenancy2.pk})
        payload = {
            "start_date": self.yesterday.isoformat()  # Se superpondría
        }
        
        response = self.client.patch(url_detail, data=payload, format='json')
        
        # Verificar respuesta 409 Conflict
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("se superponen", response.data["error"])

    def test_update_tenancy_unauthorized_returns_404(self):
        """
        Prueba que un usuario no puede actualizar arrendamientos ajenos.
        """
        self.authenticate_user2()
        
        # Crear un arrendamiento del usuario 1
        tenancy = Tenancy.objects.create(
            unit=self.unit1,
            tenant=self.tenant1,
            number_of_occupants=2,
            start_date=self.today
        )
        
        url_detail = reverse('tenancy-detail', kwargs={'pk': tenancy.pk})
        payload = {"number_of_occupants": 3}
        
        response = self.client.patch(url_detail, data=payload, format='json')
        
        # Verificar respuesta 404 Not Found
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ===== PRUEBAS DE FINALIZACIÓN DE ARRENDAMIENTOS =====

    def test_end_tenancy_success(self):
        """
        [CA-MT-04] Prueba la finalización exitosa de un arrendamiento.
        """
        self.authenticate_user1()
        
        # Crear un arrendamiento activo
        tenancy = Tenancy.objects.create(
            unit=self.unit1,
            tenant=self.tenant1,
            number_of_occupants=2,
            start_date=self.yesterday
            # Sin end_date = activo
        )
        
        url_end = reverse('tenancy-end', kwargs={'pk': tenancy.pk})
        payload = {"end_date": self.today.isoformat()}
        
        response = self.client.put(url_end, data=payload, format='json')
        
        # Verificar respuesta exitosa
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['end_date'], self.today.isoformat())
        self.assertFalse(response.data['is_active'])
        
        # Verificar que se actualizó en la base de datos
        tenancy.refresh_from_db()
        self.assertEqual(tenancy.end_date, self.today)
        self.assertFalse(tenancy.is_active)

    def test_end_tenancy_already_ended_returns_409(self):
        """
        Prueba que finalizar un arrendamiento ya finalizado retorna 409.
        """
        self.authenticate_user1()
        
        # Crear un arrendamiento ya finalizado
        tenancy = Tenancy.objects.create(
            unit=self.unit1,
            tenant=self.tenant1,
            number_of_occupants=2,
            start_date=self.last_month,
            end_date=self.yesterday
        )
        
        url_end = reverse('tenancy-end', kwargs={'pk': tenancy.pk})
        payload = {"end_date": self.today.isoformat()}
        
        response = self.client.put(url_end, data=payload, format='json')
        
        # Verificar respuesta 409 Conflict
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("ya está finalizado", response.data["error"])

    def test_end_tenancy_invalid_date_returns_400(self):
        """
        Prueba que finalizar con fecha inválida retorna 400.
        """
        self.authenticate_user1()
        
        # Crear un arrendamiento activo
        tenancy = Tenancy.objects.create(
            unit=self.unit1,
            tenant=self.tenant1,
            number_of_occupants=2,
            start_date=self.today
        )
        
        url_end = reverse('tenancy-end', kwargs={'pk': tenancy.pk})
        payload = {"end_date": self.yesterday.isoformat()}  # Anterior al inicio
        
        response = self.client.put(url_end, data=payload, format='json')
        
        # Verificar respuesta 400 Bad Request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ===== PRUEBA DE FLUJO COMPLETO =====

    def test_complete_tenancy_workflow(self):
        """
        [CA-MT-04] Prueba el flujo completo de gestión de arrendamiento como David.
        """
        self.authenticate_user1()
        
        # David navega a la unidad "Apto 101"
        self.assertEqual(self.unit1.name, "Apto 101")
        
        # Crea un arrendamiento activo con Juan Pérez
        payload_create = {
            "tenant": self.tenant1.pk,
            "number_of_occupants": 2,
            "start_date": self.last_month.isoformat()
        }
        
        response_create = self.client.post(self.url_tenancies_unit1, data=payload_create, format='json')
        self.assertEqual(response_create.status_code, status.HTTP_201_CREATED)
        
        tenancy_id = response_create.data['id']
        
        # Hace clic en "Gestionar Arrendamiento" y luego en "Finalizar Arrendamiento"
        # Selecciona la fecha de salida, "15 de Julio de 2025", y guarda
        end_date = date(2025, 7, 15)
        
        url_end = reverse('tenancy-end', kwargs={'pk': tenancy_id})
        payload_end = {"end_date": end_date.isoformat()}
        
        response_end = self.client.put(url_end, data=payload_end, format='json')
        
        # El sistema actualiza el end_date del arrendamiento
        self.assertEqual(response_end.status_code, status.HTTP_200_OK)
        self.assertEqual(response_end.data['end_date'], end_date.isoformat())
        self.assertFalse(response_end.data['is_active'])
        
        # La unidad ahora se muestra como vacante
        tenancy = Tenancy.objects.get(id=tenancy_id)
        self.assertFalse(tenancy.is_active)
        self.assertEqual(tenancy.end_date, end_date)