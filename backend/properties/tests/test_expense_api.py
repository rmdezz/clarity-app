# backend/properties/tests/test_expense_api.py
from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from properties.models import Property, BillingCycle, Expense
from rules.models import ServiceRule
import tempfile
import os


class ExpenseAPITestCase(TestCase):
    """
    Suite completa de pruebas para la API de gastos.
    Implementa todos los criterios de aceptación de HU-12.
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
        
        # Crear ciclos de facturación de prueba
        self.billing_cycle_open = BillingCycle.objects.create(
            property=self.property1,
            month=7,
            year=2024,
            status=BillingCycle.Status.OPEN
        )
        self.billing_cycle_closed = BillingCycle.objects.create(
            property=self.property1,
            month=6,
            year=2024,
            status=BillingCycle.Status.CLOSED
        )
        self.billing_cycle_user2 = BillingCycle.objects.create(
            property=self.property2,
            month=7,
            year=2024,
            status=BillingCycle.Status.OPEN
        )
        
        # Crear reglas de servicio de prueba
        self.service_rule_electricity = ServiceRule.objects.create(
            property=self.property1,
            service_type=ServiceRule.ServiceType.ELECTRICITY,
            rule_type=ServiceRule.RuleType.EQUAL_DIVISION
        )
        self.service_rule_water = ServiceRule.objects.create(
            property=self.property1,
            service_type=ServiceRule.ServiceType.WATER,
            rule_type=ServiceRule.RuleType.EQUAL_DIVISION
        )
        
        # URLs para las pruebas
        self.url_expenses = reverse(
            'expense-list-create',
            kwargs={'cycle_id': self.billing_cycle_open.pk}
        )
        self.url_expenses_closed = reverse(
            'expense-list-create',
            kwargs={'cycle_id': self.billing_cycle_closed.pk}
        )
        self.url_expenses_user2 = reverse(
            'expense-list-create',
            kwargs={'cycle_id': self.billing_cycle_user2.pk}
        )

    def authenticate_user1(self):
        """Autentica al usuario 1 (David)."""
        self.client.force_authenticate(user=self.user1)

    def authenticate_user2(self):
        """Autentica al usuario 2."""
        self.client.force_authenticate(user=self.user2)

    def create_test_pdf(self, content=b"Test PDF content"):
        """Crea un archivo PDF de prueba."""
        return SimpleUploadedFile(
            "test_invoice.pdf",
            content,
            content_type="application/pdf"
        )

    # ===== PRUEBAS DE CREACIÓN DE GASTOS (POST) =====

    def test_create_expense_success(self):
        """
        [CA-12.2] Prueba la creación exitosa de un gasto.
        """
        self.authenticate_user1()
        
        pdf_file = self.create_test_pdf()
        
        payload = {
            'service_type': 'electricity',
            'total_amount': '150.50',
            'invoice_pdf': pdf_file
        }
        
        response = self.client.post(self.url_expenses, data=payload, format='multipart')
        
        # Verificar respuesta exitosa
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['service_type'], 'electricity')
        self.assertEqual(response.data['service_type_display'], 'Luz')
        self.assertEqual(response.data['total_amount'], '150.50')
        self.assertEqual(response.data['billing_cycle'], self.billing_cycle_open.pk)
        self.assertIn('invoice_pdf_url', response.data)
        
        # Verificar que se creó en la base de datos
        expense = Expense.objects.get(id=response.data['id'])
        self.assertEqual(expense.billing_cycle, self.billing_cycle_open)
        self.assertEqual(expense.service_type, 'electricity')
        self.assertEqual(str(expense.total_amount), '150.50')
        self.assertTrue(expense.invoice_pdf.name.endswith('.pdf'))

    def test_create_expense_without_service_rule_returns_409(self):
        """
        [CA-12.2] Prueba que crear un gasto sin regla configurada retorna 409.
        """
        self.authenticate_user1()
        
        pdf_file = self.create_test_pdf()
        
        # Intentar crear gasto para servicio sin regla configurada
        payload = {
            'service_type': 'gas',  # No hay regla para gas
            'total_amount': '100.00',
            'invoice_pdf': pdf_file
        }
        
        response = self.client.post(self.url_expenses, data=payload, format='multipart')
        
        # Verificar respuesta 409 Conflict
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("error", response.data)
        self.assertIn("regla", response.data["error"].lower())

    def test_create_expense_closed_cycle_returns_409(self):
        """
        [CA-12.2] Prueba que crear un gasto en ciclo cerrado retorna 409.
        """
        self.authenticate_user1()
        
        # Crear regla para el ciclo cerrado también
        ServiceRule.objects.create(
            property=self.property1,
            service_type=ServiceRule.ServiceType.GAS,
            rule_type=ServiceRule.RuleType.EQUAL_DIVISION
        )
        
        pdf_file = self.create_test_pdf()
        
        payload = {
            'service_type': 'gas',
            'total_amount': '100.00',
            'invoice_pdf': pdf_file
        }
        
        response = self.client.post(self.url_expenses_closed, data=payload, format='multipart')
        
        # Verificar respuesta 409 Conflict
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("error", response.data)
        self.assertIn("abierto", response.data["error"].lower())

    def test_create_expense_invalid_service_type_returns_400(self):
        """
        Prueba que un service_type inválido retorna 400.
        """
        self.authenticate_user1()
        
        pdf_file = self.create_test_pdf()
        
        payload = {
            'service_type': 'invalid_service',
            'total_amount': '100.00',
            'invoice_pdf': pdf_file
        }
        
        response = self.client.post(self.url_expenses, data=payload, format='multipart')
        
        # Verificar respuesta 400 Bad Request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_expense_negative_amount_returns_400(self):
        """
        Prueba que un monto negativo retorna 400.
        """
        self.authenticate_user1()
        
        pdf_file = self.create_test_pdf()
        
        payload = {
            'service_type': 'electricity',
            'total_amount': '-50.00',
            'invoice_pdf': pdf_file
        }
        
        response = self.client.post(self.url_expenses, data=payload, format='multipart')
        
        # Verificar respuesta 400 Bad Request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_expense_without_pdf_returns_400(self):
        """
        Prueba que crear un gasto sin PDF retorna 400.
        """
        self.authenticate_user1()
        
        payload = {
            'service_type': 'electricity',
            'total_amount': '100.00',
            # Sin invoice_pdf
        }
        
        response = self.client.post(self.url_expenses, data=payload, format='multipart')
        
        # Verificar respuesta 400 Bad Request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_expense_unauthorized_cycle_returns_404(self):
        """
        [CA-12.2] Prueba que un usuario no puede crear gastos en ciclos ajenos.
        """
        self.authenticate_user1()  # Usuario 1 intenta acceder a ciclo de usuario 2
        
        pdf_file = self.create_test_pdf()
        
        payload = {
            'service_type': 'electricity',
            'total_amount': '100.00',
            'invoice_pdf': pdf_file
        }
        
        response = self.client.post(self.url_expenses_user2, data=payload, format='multipart')
        
        # Verificar respuesta 404 Not Found
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_expense_unauthenticated_returns_401(self):
        """
        Prueba que se requiere autenticación para crear gastos.
        """
        pdf_file = self.create_test_pdf()
        
        payload = {
            'service_type': 'electricity',
            'total_amount': '100.00',
            'invoice_pdf': pdf_file
        }
        
        response = self.client.post(self.url_expenses, data=payload, format='multipart')
        
        # Verificar respuesta 401 Unauthorized
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ===== PRUEBAS DE LISTADO DE GASTOS (GET) =====

    def test_list_expenses_success(self):
        """
        Prueba el listado exitoso de gastos de un ciclo.
        """
        self.authenticate_user1()
        
        # Crear algunos gastos de prueba
        expense1 = Expense.objects.create(
            billing_cycle=self.billing_cycle_open,
            service_type='electricity',
            total_amount=150.50,
            invoice_pdf=self.create_test_pdf()
        )
        expense2 = Expense.objects.create(
            billing_cycle=self.billing_cycle_open,
            service_type='water',
            total_amount=200.00,
            invoice_pdf=self.create_test_pdf()
        )
        
        response = self.client.get(self.url_expenses)
        
        # Verificar respuesta exitosa
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 2)
        
        # Verificar orden (más reciente primero)
        self.assertEqual(response.data[0]['id'], expense2.id)
        self.assertEqual(response.data[1]['id'], expense1.id)

    def test_list_expenses_empty_cycle(self):
        """
        Prueba el listado cuando no hay gastos en el ciclo.
        """
        self.authenticate_user1()
        
        response = self.client.get(self.url_expenses)
        
        # Verificar respuesta exitosa con lista vacía
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_list_expenses_unauthorized_cycle_returns_404(self):
        """
        Prueba que un usuario no puede listar gastos de ciclos ajenos.
        """
        self.authenticate_user1()  # Usuario 1 intenta acceder a ciclo de usuario 2
        
        response = self.client.get(self.url_expenses_user2)
        
        # Verificar respuesta 404 Not Found
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_expenses_unauthenticated_returns_401(self):
        """
        Prueba que se requiere autenticación para listar gastos.
        """
        response = self.client.get(self.url_expenses)
        
        # Verificar respuesta 401 Unauthorized
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ===== PRUEBAS DEL MODELO EXPENSE =====

    def test_expense_model_string_representation(self):
        """
        Prueba la representación en string del modelo Expense.
        """
        expense = Expense.objects.create(
            billing_cycle=self.billing_cycle_open,
            service_type='electricity',
            total_amount=150.50,
            invoice_pdf=self.create_test_pdf()
        )
        
        expected_string = f"electricity - S/ 150.50 ({self.billing_cycle_open})"
        self.assertEqual(str(expense), expected_string)

    def test_expense_model_ordering(self):
        """
        Prueba que los gastos se ordenan correctamente (más reciente primero).
        """
        expense1 = Expense.objects.create(
            billing_cycle=self.billing_cycle_open,
            service_type='electricity',
            total_amount=100.00,
            invoice_pdf=self.create_test_pdf()
        )
        expense2 = Expense.objects.create(
            billing_cycle=self.billing_cycle_open,
            service_type='water',
            total_amount=200.00,
            invoice_pdf=self.create_test_pdf()
        )
        
        expenses = list(Expense.objects.all())
        
        # Verificar orden: más reciente primero
        self.assertEqual(expenses[0], expense2)
        self.assertEqual(expenses[1], expense1)

    def test_expense_file_upload_path(self):
        """
        Prueba que los archivos PDF se suben a la ruta correcta.
        """
        expense = Expense.objects.create(
            billing_cycle=self.billing_cycle_open,
            service_type='electricity',
            total_amount=150.50,
            invoice_pdf=self.create_test_pdf()
        )
        
        # Verificar que el archivo se sube a la carpeta 'invoices/'
        self.assertTrue(expense.invoice_pdf.name.startswith('invoices/'))
        self.assertTrue(expense.invoice_pdf.name.endswith('.pdf'))

    # ===== PRUEBAS DE INTEGRACIÓN =====

    def test_complete_expense_workflow(self):
        """
        [CA-12.4] Prueba el flujo completo de creación de gasto como David.
        """
        self.authenticate_user1()
        
        # David está en la página del ciclo de "Julio 2024"
        self.assertEqual(self.billing_cycle_open.month, 7)
        self.assertEqual(self.billing_cycle_open.year, 2024)
        
        # David selecciona "Agua", ingresa "1500.00" y adjunta PDF
        pdf_file = self.create_test_pdf(b"Factura de agua - Julio 2024")
        
        payload = {
            'service_type': 'water',
            'total_amount': '1500.00',
            'invoice_pdf': pdf_file
        }
        
        # Al enviar el formulario, la solicitud se envía al backend
        response = self.client.post(self.url_expenses, data=payload, format='multipart')
        
        # Tras una respuesta exitosa, el nuevo gasto aparece en la lista
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verificar que el gasto "Agua - S/ 1500.00" fue creado
        expense = Expense.objects.get(id=response.data['id'])
        self.assertEqual(expense.service_type, 'water')
        self.assertEqual(str(expense.total_amount), '1500.00')
        self.assertTrue(expense.invoice_pdf.name)
        
        # Verificar que aparece en el listado
        list_response = self.client.get(self.url_expenses)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 1)
        self.assertEqual(list_response.data[0]['service_type_display'], 'Agua')
        self.assertEqual(list_response.data[0]['total_amount'], '1500.00')

    def tearDown(self):
        """Limpiar archivos de prueba."""
        # Limpiar archivos PDF de prueba
        for expense in Expense.objects.all():
            if expense.invoice_pdf:
                try:
                    expense.invoice_pdf.delete()
                except:
                    pass