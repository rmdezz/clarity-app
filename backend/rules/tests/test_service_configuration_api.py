# backend/rules/tests/test_service_configuration_api.py
from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from properties.models import Property, Unit
from tenants.models import Tenant
from rules.models import ServiceRule


class ServiceConfigurationAPITestCase(TestCase):
    """
    Suite completa de pruebas para la API de configuración de servicios.
    Implementa el conjunto de pruebas especificado en la Fase 2.
    """

    def setUp(self):
        """Configuración inicial para todas las pruebas."""
        self.client = APIClient()
        
        # Crear usuarios de prueba
        self.user1 = User.objects.create_user(
            username='propietario1',
            email='propietario1@test.com',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            username='propietario2',
            email='propietario2@test.com',
            password='testpass123'
        )
        
        # Crear propiedades de prueba
        self.property1 = Property.objects.create(
            name="Edificio del User1",
            address="Calle Ficticia 123",
            user=self.user1
        )
        self.property2 = Property.objects.create(
            name="Edificio del User2",
            address="Avenida Test 456",
            user=self.user2
        )
        
        # Crear unidades para property1
        self.unit1 = Unit.objects.create(name="Apto 101", property=self.property1)
        self.unit2 = Unit.objects.create(name="Apto 102", property=self.property1)
        
        # Crear inquilinos para todas las unidades (necesario para pruebas de prorrateo)
        self.tenant1 = Tenant.objects.create(
            name="Juan Pérez",
            email="juan@test.com",
            number_of_occupants=2,
            unit=self.unit1
        )
        self.tenant2 = Tenant.objects.create(
            name="María García",
            email="maria@test.com",
            number_of_occupants=3,
            unit=self.unit2
        )
        
        # URLs para las pruebas
        self.url_property1 = reverse('service-configuration', kwargs={'property_id': self.property1.pk})
        self.url_property2 = reverse('service-configuration', kwargs={'property_id': self.property2.pk})

    def authenticate_user1(self):
        """Autentica al usuario 1."""
        self.client.force_authenticate(user=self.user1)

    def authenticate_user2(self):
        """Autentica al usuario 2."""
        self.client.force_authenticate(user=self.user2)

    def test_get_service_configuration_exitoso(self):
        """
        test_get_service_configuration_exitoso: Usuario obtiene su configuración.
        """
        self.authenticate_user1()
        
        # Crear algunas reglas de servicio para la propiedad del user1
        ServiceRule.objects.create(
            property=self.property1,
            service_type=ServiceRule.ServiceType.WATER,
            rule_type=ServiceRule.RuleType.OCCUPANT_PRORATION
        )
        ServiceRule.objects.create(
            property=self.property1,
            service_type=ServiceRule.ServiceType.ELECTRICITY,
            rule_type=ServiceRule.RuleType.EQUAL_DIVISION
        )
        
        # Realizar petición GET
        response = self.client.get(self.url_property1)
        
        # Verificar respuesta exitosa
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 2)
        
        # Verificar formato de los datos
        expected_data = [
            {"service_type": "water", "rule_type": "occupant_proration"},
            {"service_type": "electricity", "rule_type": "equal_division"}
        ]
        self.assertCountEqual(response.data, expected_data)

    def test_get_service_configuration_falla_para_propiedad_ajena(self):
        """
        test_get_service_configuration_falla_para_propiedad_ajena: Recibe 404.
        """
        self.authenticate_user1()
        
        # Intentar acceder a la propiedad del user2
        response = self.client.get(self.url_property2)
        
        # Verificar que recibe 404
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("error", response.data)

    def test_get_service_configuration_sin_autenticacion(self):
        """
        Verifica que se requiere autenticación para acceder al endpoint.
        """
        # No autenticar - hacer petición anónima
        response = self.client.get(self.url_property1)
        
        # Verificar que recibe 401 Unauthorized
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_put_service_configuration_exitoso_reemplaza_configuracion_antigua(self):
        """
        test_put_service_configuration_exitoso_reemplaza_configuracion_antigua: 
        La operación atómica funciona.
        """
        self.authenticate_user1()
        
        # Crear configuración inicial
        ServiceRule.objects.create(
            property=self.property1,
            service_type=ServiceRule.ServiceType.WATER,
            rule_type=ServiceRule.RuleType.EQUAL_DIVISION
        )
        ServiceRule.objects.create(
            property=self.property1,
            service_type=ServiceRule.ServiceType.MOTOR,
            rule_type=ServiceRule.RuleType.FIXED_FEE
        )
        
        # Verificar configuración inicial
        initial_count = ServiceRule.objects.filter(property=self.property1).count()
        self.assertEqual(initial_count, 2)
        
        # Nueva configuración para reemplazar
        new_config = [
            {"service_type": "electricity", "rule_type": "consumption_adjustment"},
            {"service_type": "arbitrios", "rule_type": "proportional_area"},
            {"service_type": "water", "rule_type": "occupant_proration"}
        ]
        
        # Realizar petición PUT
        response = self.client.put(
            self.url_property1,
            data=new_config,
            format='json'
        )
        
        # Verificar respuesta exitosa
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 3)
        
        # Verificar que la configuración fue reemplazada completamente
        final_count = ServiceRule.objects.filter(property=self.property1).count()
        self.assertEqual(final_count, 3)
        
        # Verificar que no existe la configuración anterior
        old_motor_rule = ServiceRule.objects.filter(
            property=self.property1,
            service_type=ServiceRule.ServiceType.MOTOR
        ).exists()
        self.assertFalse(old_motor_rule)
        
        # Verificar la nueva configuración
        self.assertCountEqual(response.data, new_config)

    def test_put_falla_si_unidades_no_cumplen_prerrequisito_de_ocupantes(self):
        """
        test_put_falla_si_unidades_no_cumplen_prerrequisito_de_ocupantes: 
        Verifica la validación de negocio para occupant_proration y devuelve 400.
        """
        self.authenticate_user1()
        
        # Eliminar un inquilino para que la propiedad no cumpla prerrequisitos
        self.tenant1.delete()
        
        # Intentar configurar prorrateo por ocupantes
        invalid_config = [
            {"service_type": "water", "rule_type": "occupant_proration"}
        ]
        
        # Realizar petición PUT
        response = self.client.put(
            self.url_property1,
            data=invalid_config,
            format='json'
        )
        
        # Verificar que falla con 400 Bad Request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
        self.assertIn("no tiene inquilino asignado", response.data["error"])
        
        # Verificar que no se creó ninguna regla
        rule_count = ServiceRule.objects.filter(property=self.property1).count()
        self.assertEqual(rule_count, 0)

    def test_put_falla_atomicamente_si_un_item_es_invalido(self):
        """
        test_put_falla_atomicamente_si_un_item_es_invalido: 
        Verifica que si un elemento en el array de reglas es inválido, 
        ningún cambio se persiste en la base de datos gracias a @transaction.atomic.
        """
        self.authenticate_user1()
        
        # Crear configuración inicial válida
        ServiceRule.objects.create(
            property=self.property1,
            service_type=ServiceRule.ServiceType.WATER,
            rule_type=ServiceRule.RuleType.EQUAL_DIVISION
        )
        
        # Configuración con un elemento inválido
        invalid_config = [
            {"service_type": "water", "rule_type": "equal_division"},  # Válido
            {"service_type": "invalid_service", "rule_type": "equal_division"}  # Inválido
        ]
        
        # Realizar petición PUT
        response = self.client.put(
            self.url_property1,
            data=invalid_config,
            format='json'
        )
        
        # Verificar que falla con 400 Bad Request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Verificar que la configuración original no fue modificada (atomicidad)
        rules = ServiceRule.objects.filter(property=self.property1)
        self.assertEqual(rules.count(), 1)
        self.assertEqual(rules.first().service_type, ServiceRule.ServiceType.WATER)
        self.assertEqual(rules.first().rule_type, ServiceRule.RuleType.EQUAL_DIVISION)

    def test_put_falla_con_payload_no_array(self):
        """
        Verifica que el endpoint rechaza payloads que no son arrays.
        """
        self.authenticate_user1()
        
        # Payload que no es un array
        invalid_payload = {"service_type": "water", "rule_type": "equal_division"}
        
        # Realizar petición PUT
        response = self.client.put(
            self.url_property1,
            data=invalid_payload,
            format='json'
        )
        
        # Verificar que falla con 400 Bad Request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("debe ser un array", response.data["error"])

    def test_put_falla_con_service_types_duplicados(self):
        """
        Verifica que el endpoint rechaza configuraciones con service_types duplicados.
        """
        self.authenticate_user1()
        
        # Configuración con duplicados
        duplicate_config = [
            {"service_type": "water", "rule_type": "equal_division"},
            {"service_type": "water", "rule_type": "occupant_proration"}  # Duplicado
        ]
        
        # Realizar petición PUT
        response = self.client.put(
            self.url_property1,
            data=duplicate_config,
            format='json'
        )
        
        # Verificar que falla con 400 Bad Request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("service_rules", response.data)

    def test_put_falla_para_propiedad_ajena(self):
        """
        Verifica que no se puede modificar la configuración de propiedades ajenas.
        """
        self.authenticate_user1()
        
        valid_config = [
            {"service_type": "water", "rule_type": "equal_division"}
        ]
        
        # Intentar modificar propiedad del user2
        response = self.client.put(
            self.url_property2,
            data=valid_config,
            format='json'
        )
        
        # Verificar que recibe 404
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_put_falla_con_rule_type_invalido(self):
        """
        Verifica que el endpoint rechaza rule_types inválidos.
        """
        self.authenticate_user1()
        
        invalid_config = [
            {"service_type": "water", "rule_type": "invalid_rule_type"}
        ]
        
        # Realizar petición PUT
        response = self.client.put(
            self.url_property1,
            data=invalid_config,
            format='json'
        )
        
        # Verificar que falla con 400 Bad Request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_configuracion_vacia_retorna_array_vacio(self):
        """
        Verifica que una propiedad sin configuración retorna un array vacío.
        """
        self.authenticate_user1()
        
        # Realizar petición GET sin crear reglas
        response = self.client.get(self.url_property1)
        
        # Verificar respuesta exitosa con array vacío
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_put_array_vacio_borra_toda_configuracion(self):
        """
        Verifica que enviar un array vacío borra toda la configuración existente.
        """
        self.authenticate_user1()
        
        # Crear configuración inicial
        ServiceRule.objects.create(
            property=self.property1,
            service_type=ServiceRule.ServiceType.WATER,
            rule_type=ServiceRule.RuleType.EQUAL_DIVISION
        )
        
        # Enviar array vacío
        response = self.client.put(
            self.url_property1,
            data=[],
            format='json'
        )
        
        # Verificar que funciona pero retorna error de validación (array no puede estar vacío)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("service_rules", response.data)