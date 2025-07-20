# backend/tenants/tests/test_tenancy_services.py

from django.test import TestCase
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from datetime import date, timedelta
from properties.models import Property, Unit
from tenants.models import Tenant, Tenancy
from tenants.services import TenancyService, TenancyValidationService


class TenancyValidationServiceTestCase(TestCase):
    """
    Suite de pruebas para TenancyValidationService.
    """

    def setUp(self):
        """Configuración inicial para todas las pruebas."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )
        
        self.property = Property.objects.create(
            name="Edificio Central",
            address="Calle Principal 123",
            user=self.user
        )
        
        self.unit = Unit.objects.create(
            name="Apto 101",
            property=self.property
        )
        
        self.tenant = Tenant.objects.create(
            name="Juan Pérez",
            email="juan@test.com",
            number_of_occupants=2,
            unit=self.unit
        )
        
        # Fechas de prueba
        self.today = date.today()
        self.yesterday = self.today - timedelta(days=1)
        self.tomorrow = self.today + timedelta(days=1)
        self.next_week = self.today + timedelta(days=7)
        self.last_month = self.today - timedelta(days=30)

    def test_validate_dates_success(self):
        """
        Prueba la validación exitosa de fechas.
        """
        # No debería lanzar excepción
        TenancyValidationService.validate_dates(self.today, self.next_week)
        TenancyValidationService.validate_dates(self.today, None)  # Sin fecha de fin

    def test_validate_dates_end_before_start(self):
        """
        Prueba que la validación falla cuando end_date < start_date.
        """
        with self.assertRaises(ValidationError) as context:
            TenancyValidationService.validate_dates(self.today, self.yesterday)
        
        self.assertIn("La fecha de fin no puede ser anterior", str(context.exception))

    def test_periods_overlap_both_active(self):
        """
        Prueba superposición cuando ambos períodos son activos (sin end_date).
        """
        overlap = TenancyValidationService._periods_overlap(
            self.today, None,  # Período 1: activo desde hoy
            self.yesterday, None  # Período 2: activo desde ayer
        )
        self.assertTrue(overlap)

    def test_periods_overlap_one_active(self):
        """
        Prueba superposición cuando un período es activo y otro no.
        """
        # Período 1 activo, período 2 terminado antes
        overlap1 = TenancyValidationService._periods_overlap(
            self.today, None,  # Activo desde hoy
            self.last_month, self.yesterday  # Terminado ayer
        )
        self.assertFalse(overlap1)
        
        # Período 1 activo, período 2 se superpone
        overlap2 = TenancyValidationService._periods_overlap(
            self.today, None,  # Activo desde hoy
            self.yesterday, self.tomorrow  # Se superpone
        )
        self.assertTrue(overlap2)

    def test_periods_overlap_both_finished(self):
        """
        Prueba superposición cuando ambos períodos están terminados.
        """
        # Períodos consecutivos (no se superponen)
        overlap1 = TenancyValidationService._periods_overlap(
            self.last_month, self.yesterday,  # Mes pasado a ayer
            self.today, self.next_week  # Hoy a la próxima semana
        )
        self.assertFalse(overlap1)
        
        # Períodos superpuestos
        overlap2 = TenancyValidationService._periods_overlap(
            self.yesterday, self.next_week,  # Ayer a la próxima semana
            self.today, self.tomorrow  # Hoy a mañana (se superpone)
        )
        self.assertTrue(overlap2)

    def test_check_overlapping_tenancies_no_overlap(self):
        """
        Prueba verificación cuando no hay superposiciones.
        """
        # Crear un arrendamiento existente
        Tenancy.objects.create(
            unit=self.unit,
            tenant=self.tenant,
            number_of_occupants=2,
            start_date=self.last_month,
            end_date=self.yesterday
        )
        
        # Verificar un nuevo arrendamiento que no se superpone
        overlapping = TenancyValidationService.check_overlapping_tenancies(
            unit=self.unit,
            start_date=self.today,
            end_date=self.next_week
        )
        
        self.assertEqual(len(overlapping), 0)

    def test_check_overlapping_tenancies_with_overlap(self):
        """
        Prueba verificación cuando hay superposiciones.
        """
        # Crear un arrendamiento existente
        existing = Tenancy.objects.create(
            unit=self.unit,
            tenant=self.tenant,
            number_of_occupants=2,
            start_date=self.yesterday,
            end_date=self.tomorrow
        )
        
        # Verificar un nuevo arrendamiento que se superpone
        overlapping = TenancyValidationService.check_overlapping_tenancies(
            unit=self.unit,
            start_date=self.today,
            end_date=self.next_week
        )
        
        self.assertEqual(len(overlapping), 1)
        self.assertEqual(overlapping[0], existing)

    def test_check_overlapping_tenancies_exclude_current(self):
        """
        Prueba verificación excluyendo el arrendamiento actual (para edición).
        """
        # Crear un arrendamiento existente
        existing = Tenancy.objects.create(
            unit=self.unit,
            tenant=self.tenant,
            number_of_occupants=2,
            start_date=self.today,
            end_date=self.next_week
        )
        
        # Verificar el mismo período excluyendo el arrendamiento actual
        overlapping = TenancyValidationService.check_overlapping_tenancies(
            unit=self.unit,
            start_date=self.today,
            end_date=self.next_week,
            exclude_tenancy_id=existing.pk
        )
        
        self.assertEqual(len(overlapping), 0)


class TenancyServiceTestCase(TestCase):
    """
    Suite de pruebas para TenancyService.
    """

    def setUp(self):
        """Configuración inicial para todas las pruebas."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )
        
        self.property = Property.objects.create(
            name="Edificio Central",
            address="Calle Principal 123",
            user=self.user
        )
        
        self.unit = Unit.objects.create(
            name="Apto 101",
            property=self.property
        )
        
        self.tenant = Tenant.objects.create(
            name="Juan Pérez",
            email="juan@test.com",
            number_of_occupants=2,
            unit=self.unit
        )
        
        # Fechas de prueba
        self.today = date.today()
        self.yesterday = self.today - timedelta(days=1)
        self.tomorrow = self.today + timedelta(days=1)
        self.next_week = self.today + timedelta(days=7)
        self.last_month = self.today - timedelta(days=30)

    def test_create_tenancy_success(self):
        """
        Prueba la creación exitosa de un arrendamiento.
        """
        tenancy = TenancyService.create_tenancy(
            unit=self.unit,
            tenant=self.tenant,
            start_date=self.today,
            number_of_occupants=3,
            end_date=self.next_week
        )
        
        self.assertIsNotNone(tenancy.id)
        self.assertEqual(tenancy.unit, self.unit)
        self.assertEqual(tenancy.tenant, self.tenant)
        self.assertEqual(tenancy.number_of_occupants, 3)
        self.assertEqual(tenancy.start_date, self.today)
        self.assertEqual(tenancy.end_date, self.next_week)

    def test_create_tenancy_with_overlap_fails(self):
        """
        Prueba que la creación falla cuando hay superposición.
        """
        # Crear un arrendamiento existente
        TenancyService.create_tenancy(
            unit=self.unit,
            tenant=self.tenant,
            start_date=self.yesterday,
            number_of_occupants=2,
            end_date=self.tomorrow
        )
        
        # Intentar crear otro que se superpone
        with self.assertRaises(ValidationError) as context:
            TenancyService.create_tenancy(
                unit=self.unit,
                tenant=self.tenant,
                start_date=self.today,
                number_of_occupants=2,
                end_date=self.next_week
            )
        
        self.assertIn("se superpone", str(context.exception))

    def test_get_active_tenancy_exists(self):
        """
        Prueba obtener el arrendamiento activo cuando existe.
        """
        # Crear un arrendamiento activo
        active_tenancy = TenancyService.create_tenancy(
            unit=self.unit,
            tenant=self.tenant,
            start_date=self.today,
            number_of_occupants=2
            # Sin end_date = activo
        )
        
        result = TenancyService.get_active_tenancy(self.unit)
        self.assertEqual(result, active_tenancy)

    def test_get_active_tenancy_not_exists(self):
        """
        Prueba obtener el arrendamiento activo cuando no existe.
        """
        result = TenancyService.get_active_tenancy(self.unit)
        self.assertIsNone(result)

    def test_get_current_tenancy_active(self):
        """
        Prueba obtener el arrendamiento actual cuando hay uno activo.
        """
        # Crear un arrendamiento activo
        active_tenancy = TenancyService.create_tenancy(
            unit=self.unit,
            tenant=self.tenant,
            start_date=self.yesterday,
            number_of_occupants=2
        )
        
        result = TenancyService.get_current_tenancy(self.unit, self.today)
        self.assertEqual(result, active_tenancy)

    def test_get_current_tenancy_finished(self):
        """
        Prueba obtener el arrendamiento actual cuando hay uno vigente con fecha de fin.
        """
        # Crear un arrendamiento vigente pero no activo
        current_tenancy = TenancyService.create_tenancy(
            unit=self.unit,
            tenant=self.tenant,
            start_date=self.yesterday,
            number_of_occupants=2,
            end_date=self.tomorrow
        )
        
        result = TenancyService.get_current_tenancy(self.unit, self.today)
        self.assertEqual(result, current_tenancy)

    def test_end_tenancy_success(self):
        """
        Prueba finalizar un arrendamiento exitosamente.
        """
        # Crear un arrendamiento activo
        tenancy = TenancyService.create_tenancy(
            unit=self.unit,
            tenant=self.tenant,
            start_date=self.yesterday,
            number_of_occupants=2
        )
        
        # Finalizarlo
        updated = TenancyService.end_tenancy(tenancy, self.today)
        
        self.assertEqual(updated.end_date, self.today)
        self.assertFalse(updated.is_active)

    def test_end_tenancy_invalid_date(self):
        """
        Prueba que finalizar con fecha inválida falla.
        """
        # Crear un arrendamiento activo
        tenancy = TenancyService.create_tenancy(
            unit=self.unit,
            tenant=self.tenant,
            start_date=self.today,
            number_of_occupants=2
        )
        
        # Intentar finalizar con fecha anterior al inicio
        with self.assertRaises(ValidationError):
            TenancyService.end_tenancy(tenancy, self.yesterday)

    def test_get_tenancy_history(self):
        """
        Prueba obtener el historial de arrendamientos de una unidad.
        """
        # Crear varios arrendamientos
        tenancy1 = TenancyService.create_tenancy(
            unit=self.unit,
            tenant=self.tenant,
            start_date=self.last_month,
            number_of_occupants=2,
            end_date=self.yesterday
        )
        
        tenancy2 = TenancyService.create_tenancy(
            unit=self.unit,
            tenant=self.tenant,
            start_date=self.today,
            number_of_occupants=3
        )
        
        history = TenancyService.get_tenancy_history(self.unit)
        history_list = list(history)
        
        self.assertEqual(len(history_list), 2)
        # Debería estar ordenado por start_date descendente
        self.assertEqual(history_list[0], tenancy2)  # Más reciente
        self.assertEqual(history_list[1], tenancy1)  # Más antiguo