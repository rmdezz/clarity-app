# backend/tenants/tests/test_tenancy_model.py

from django.test import TestCase
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from datetime import date, timedelta
from properties.models import Property, Unit
from tenants.models import Tenant, Tenancy


class TenancyModelTestCase(TestCase):
    """
    Suite de pruebas para el modelo Tenancy.
    Verifica validaciones, propiedades y comportamiento del modelo.
    """

    def setUp(self):
        """Configuración inicial para todas las pruebas."""
        # Crear usuario de prueba
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )
        
        # Crear propiedad de prueba
        self.property = Property.objects.create(
            name="Edificio Central",
            address="Calle Principal 123",
            user=self.user
        )
        
        # Crear unidad de prueba
        self.unit = Unit.objects.create(
            name="Apto 101",
            property=self.property
        )
        
        # Crear inquilino de prueba
        self.tenant = Tenant.objects.create(
            name="Juan Pérez",
            email="juan@test.com",
            number_of_occupants=2,
            unit=self.unit  # Relación antigua, temporal
        )
        
        # Fechas de prueba
        self.today = date.today()
        self.yesterday = self.today - timedelta(days=1)
        self.tomorrow = self.today + timedelta(days=1)
        self.next_week = self.today + timedelta(days=7)
        self.last_month = self.today - timedelta(days=30)

    def test_tenancy_creation_success(self):
        """
        [CA-MT-01] Prueba la creación exitosa de un arrendamiento con todos los campos.
        """
        tenancy = Tenancy.objects.create(
            unit=self.unit,
            tenant=self.tenant,
            number_of_occupants=3,
            start_date=self.today,
            end_date=self.next_week
        )
        
        # Verificar que se creó correctamente
        self.assertIsNotNone(tenancy.id)
        self.assertEqual(tenancy.unit, self.unit)
        self.assertEqual(tenancy.tenant, self.tenant)
        self.assertEqual(tenancy.number_of_occupants, 3)
        self.assertEqual(tenancy.start_date, self.today)
        self.assertEqual(tenancy.end_date, self.next_week)
        self.assertIsNotNone(tenancy.created_at)
        self.assertIsNotNone(tenancy.updated_at)

    def test_tenancy_creation_without_end_date(self):
        """
        Prueba la creación de un arrendamiento activo (sin fecha de fin).
        """
        tenancy = Tenancy.objects.create(
            unit=self.unit,
            tenant=self.tenant,
            number_of_occupants=2,
            start_date=self.today
            # end_date es None por defecto
        )
        
        self.assertIsNone(tenancy.end_date)
        self.assertTrue(tenancy.is_active)

    def test_tenancy_string_representation(self):
        """
        Prueba la representación en string del modelo.
        """
        tenancy = Tenancy.objects.create(
            unit=self.unit,
            tenant=self.tenant,
            number_of_occupants=2,
            start_date=self.today,
            end_date=self.next_week
        )
        
        expected_string = f"Juan Pérez en Apto 101 ({self.today} - {self.next_week})"
        self.assertEqual(str(tenancy), expected_string)

    def test_tenancy_string_representation_active(self):
        """
        Prueba la representación en string de un arrendamiento activo.
        """
        tenancy = Tenancy.objects.create(
            unit=self.unit,
            tenant=self.tenant,
            number_of_occupants=2,
            start_date=self.today
        )
        
        expected_string = f"Juan Pérez en Apto 101 ({self.today} - Activo)"
        self.assertEqual(str(tenancy), expected_string)

    def test_tenancy_is_active_property(self):
        """
        Prueba la propiedad is_active del modelo.
        """
        # Arrendamiento activo (sin end_date)
        active_tenancy = Tenancy.objects.create(
            unit=self.unit,
            tenant=self.tenant,
            number_of_occupants=2,
            start_date=self.today
        )
        self.assertTrue(active_tenancy.is_active)
        
        # Arrendamiento finalizado (con end_date)
        finished_tenancy = Tenancy.objects.create(
            unit=self.unit,
            tenant=self.tenant,
            number_of_occupants=2,
            start_date=self.last_month,
            end_date=self.yesterday
        )
        self.assertFalse(finished_tenancy.is_active)

    def test_tenancy_clean_validation_end_before_start(self):
        """
        [CA-MT-01] Prueba que end_date no puede ser anterior a start_date.
        """
        tenancy = Tenancy(
            unit=self.unit,
            tenant=self.tenant,
            number_of_occupants=2,
            start_date=self.today,
            end_date=self.yesterday  # Fecha anterior al inicio
        )
        
        with self.assertRaises(ValidationError) as context:
            tenancy.clean()
        
        self.assertIn("La fecha de fin no puede ser anterior", str(context.exception))

    def test_tenancy_save_triggers_clean(self):
        """
        Prueba que save() llama a clean() automáticamente.
        """
        with self.assertRaises(ValidationError):
            Tenancy.objects.create(
                unit=self.unit,
                tenant=self.tenant,
                number_of_occupants=2,
                start_date=self.today,
                end_date=self.yesterday  # Fecha inválida
            )

    def test_tenancy_ordering(self):
        """
        Prueba que los arrendamientos se ordenan por start_date descendente.
        """
        tenancy1 = Tenancy.objects.create(
            unit=self.unit,
            tenant=self.tenant,
            number_of_occupants=2,
            start_date=self.last_month,
            end_date=self.yesterday
        )
        tenancy2 = Tenancy.objects.create(
            unit=self.unit,
            tenant=self.tenant,
            number_of_occupants=2,
            start_date=self.today
        )
        
        tenancies = list(Tenancy.objects.all())
        
        # Verificar orden: más reciente primero
        self.assertEqual(tenancies[0], tenancy2)  # Hoy
        self.assertEqual(tenancies[1], tenancy1)  # Mes pasado

    def test_tenancy_related_names(self):
        """
        Prueba que se puede acceder a los arrendamientos desde Unit y Tenant.
        """
        tenancy = Tenancy.objects.create(
            unit=self.unit,
            tenant=self.tenant,
            number_of_occupants=2,
            start_date=self.today
        )
        
        # Acceder desde la unidad
        unit_tenancies = self.unit.tenancies.all()
        self.assertEqual(unit_tenancies.count(), 1)
        self.assertIn(tenancy, unit_tenancies)
        
        # Acceder desde el inquilino
        tenant_tenancies = self.tenant.tenancies.all()
        self.assertEqual(tenant_tenancies.count(), 1)
        self.assertIn(tenancy, tenant_tenancies)

    def test_tenancy_cascade_deletion_unit(self):
        """
        Prueba que los arrendamientos se eliminan cuando se elimina la unidad.
        """
        tenancy = Tenancy.objects.create(
            unit=self.unit,
            tenant=self.tenant,
            number_of_occupants=2,
            start_date=self.today
        )
        
        tenancy_id = tenancy.id
        
        # Eliminar la unidad
        self.unit.delete()
        
        # Verificar que el arrendamiento también se eliminó
        with self.assertRaises(Tenancy.DoesNotExist):
            Tenancy.objects.get(id=tenancy_id)

    def test_tenancy_cascade_deletion_tenant(self):
        """
        Prueba que los arrendamientos se eliminan cuando se elimina el inquilino.
        """
        tenancy = Tenancy.objects.create(
            unit=self.unit,
            tenant=self.tenant,
            number_of_occupants=2,
            start_date=self.today
        )
        
        tenancy_id = tenancy.id
        
        # Eliminar el inquilino
        self.tenant.delete()
        
        # Verificar que el arrendamiento también se eliminó
        with self.assertRaises(Tenancy.DoesNotExist):
            Tenancy.objects.get(id=tenancy_id)

    def test_tenancy_number_of_occupants_validation(self):
        """
        Prueba que number_of_occupants debe ser un número positivo.
        """
        # Esto debería fallar a nivel de base de datos o validadores
        with self.assertRaises(Exception):  # Puede ser ValidationError o IntegrityError
            Tenancy.objects.create(
                unit=self.unit,
                tenant=self.tenant,
                number_of_occupants=0,  # Inválido
                start_date=self.today
            )

    def test_tenancy_meta_options(self):
        """
        Prueba las opciones de meta del modelo.
        """
        # Verificar verbose names
        self.assertEqual(Tenancy._meta.verbose_name, "Tenancy")
        self.assertEqual(Tenancy._meta.verbose_name_plural, "Tenancies")
        
        # Verificar ordering
        self.assertEqual(Tenancy._meta.ordering, ['-start_date'])
        
        # Verificar que tiene índices
        index_fields = [index.fields for index in Tenancy._meta.indexes]
        self.assertIn(['unit', 'start_date'], index_fields)
        self.assertIn(['unit', 'end_date'], index_fields)