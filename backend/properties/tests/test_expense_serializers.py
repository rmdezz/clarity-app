# backend/properties/tests/test_expense_serializers.py
from django.test import TestCase
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIRequestFactory
from decimal import Decimal
from properties.models import Property, BillingCycle, Expense
from properties.serializers import ExpenseSerializer, ExpenseCreateSerializer
from rules.models import ServiceRule


class ExpenseSerializerTestCase(TestCase):
    """
    Suite de pruebas para los serializers de Expense.
    Verifica validaciones, serialización y deserialización.
    """

    def setUp(self):
        """Configuración inicial para todas las pruebas."""
        self.factory = APIRequestFactory()
        
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
        
        # Crear ciclo de facturación de prueba
        self.billing_cycle_open = BillingCycle.objects.create(
            property=self.property,
            month=7,
            year=2024,
            status=BillingCycle.Status.OPEN
        )
        self.billing_cycle_closed = BillingCycle.objects.create(
            property=self.property,
            month=6,
            year=2024,
            status=BillingCycle.Status.CLOSED
        )
        
        # Crear reglas de servicio de prueba
        self.service_rule = ServiceRule.objects.create(
            property=self.property,
            service_type=ServiceRule.ServiceType.ELECTRICITY,
            rule_type=ServiceRule.RuleType.EQUAL_DIVISION
        )

    def create_test_pdf(self, content=b"Test PDF content"):
        """Crea un archivo PDF de prueba."""
        return SimpleUploadedFile(
            "test_invoice.pdf",
            content,
            content_type="application/pdf"
        )

    # ===== PRUEBAS DE ExpenseSerializer =====

    def test_expense_serializer_serialization(self):
        """
        Prueba la serialización de un gasto existente.
        """
        # Crear un gasto
        pdf_file = self.create_test_pdf()
        expense = Expense.objects.create(
            billing_cycle=self.billing_cycle_open,
            service_type='electricity',
            total_amount=Decimal('150.50'),
            invoice_pdf=pdf_file
        )
        
        # Crear request para contexto
        request = self.factory.get('/')
        request.user = self.user
        
        # Serializar
        serializer = ExpenseSerializer(expense, context={'request': request})
        data = serializer.data
        
        # Verificar campos serializados
        self.assertEqual(data['id'], expense.id)
        self.assertEqual(data['billing_cycle'], self.billing_cycle_open.pk)
        self.assertEqual(data['service_type'], 'electricity')
        self.assertEqual(data['service_type_display'], 'Luz')
        self.assertEqual(data['total_amount'], '150.50')
        self.assertIn('invoice_pdf', data)
        self.assertIn('invoice_pdf_url', data)
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)

    def test_expense_serializer_service_type_display(self):
        """
        Prueba que service_type_display devuelve el nombre correcto.
        """
        pdf_file = self.create_test_pdf()
        expense = Expense.objects.create(
            billing_cycle=self.billing_cycle_open,
            service_type='water',
            total_amount=Decimal('200.00'),
            invoice_pdf=pdf_file
        )
        
        serializer = ExpenseSerializer(expense)
        data = serializer.data
        
        self.assertEqual(data['service_type_display'], 'Agua')

    def test_expense_serializer_invoice_pdf_url(self):
        """
        Prueba que invoice_pdf_url se genera correctamente.
        """
        pdf_file = self.create_test_pdf()
        expense = Expense.objects.create(
            billing_cycle=self.billing_cycle_open,
            service_type='gas',
            total_amount=Decimal('75.25'),
            invoice_pdf=pdf_file
        )
        
        # Con request en contexto
        request = self.factory.get('/')
        serializer = ExpenseSerializer(expense, context={'request': request})
        data = serializer.data
        
        self.assertIsNotNone(data['invoice_pdf_url'])
        self.assertTrue(data['invoice_pdf_url'].endswith('.pdf'))
        
        # Sin request en contexto
        serializer_no_request = ExpenseSerializer(expense)
        data_no_request = serializer_no_request.data
        
        self.assertIsNotNone(data_no_request['invoice_pdf_url'])

    def test_expense_serializer_validation_with_context(self):
        """
        Prueba las validaciones del serializer con contexto de billing_cycle.
        Note: ExpenseSerializer es principalmente para lectura, pero tiene validaciones de contexto.
        """
        # Crear un gasto existente para probar serialización de lectura
        pdf_file = self.create_test_pdf()
        expense = Expense.objects.create(
            billing_cycle=self.billing_cycle_open,
            service_type='electricity',
            total_amount=100.00,
            invoice_pdf=pdf_file
        )
        
        # Serializar para lectura (caso principal de ExpenseSerializer)
        serializer = ExpenseSerializer(expense)
        data = serializer.data
        
        self.assertEqual(data['service_type'], 'electricity')
        self.assertEqual(data['total_amount'], '100.00')
        self.assertIsNotNone(data['invoice_pdf_url'])

    def test_expense_serializer_context_validations(self):
        """
        Prueba las validaciones de contexto del ExpenseSerializer.
        """
        # Datos para crear un gasto con servicio sin regla
        pdf_file = self.create_test_pdf()
        data = {
            'service_type': 'water',  # No hay regla para agua
            'total_amount': '100.00',
            'invoice_pdf': pdf_file,
        }
        
        serializer = ExpenseSerializer(
            data=data,
            context={'billing_cycle': self.billing_cycle_open}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('regla', str(serializer.errors).lower())
        
        # Probar con ciclo cerrado
        pdf_file2 = self.create_test_pdf()
        data2 = {
            'service_type': 'electricity',  # Tiene regla
            'total_amount': '100.00',
            'invoice_pdf': pdf_file2,
        }
        
        serializer2 = ExpenseSerializer(
            data=data2,
            context={'billing_cycle': self.billing_cycle_closed}
        )
        self.assertFalse(serializer2.is_valid())
        self.assertIn('abierto', str(serializer2.errors).lower())

    # ===== PRUEBAS DE ExpenseCreateSerializer =====

    def test_expense_create_serializer_valid_data(self):
        """
        Prueba la validación exitosa del serializer de creación.
        """
        pdf_file = self.create_test_pdf()
        
        data = {
            'service_type': 'electricity',
            'total_amount': 150.50,
            'invoice_pdf': pdf_file
        }
        
        serializer = ExpenseCreateSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        # Verificar datos validados
        self.assertEqual(serializer.validated_data['service_type'], 'electricity')
        self.assertEqual(serializer.validated_data['total_amount'], Decimal('150.50'))
        self.assertEqual(serializer.validated_data['invoice_pdf'], pdf_file)

    def test_expense_create_serializer_invalid_service_type(self):
        """
        Prueba validación de service_type inválido.
        """
        pdf_file = self.create_test_pdf()
        
        data = {
            'service_type': 'invalid_service',
            'total_amount': 100.00,
            'invoice_pdf': pdf_file
        }
        
        serializer = ExpenseCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('service_type', serializer.errors)
        self.assertIn('inválido', str(serializer.errors['service_type'][0]))

    def test_expense_create_serializer_negative_amount(self):
        """
        Prueba validación de monto negativo.
        """
        pdf_file = self.create_test_pdf()
        
        data = {
            'service_type': 'electricity',
            'total_amount': -50.00,
            'invoice_pdf': pdf_file
        }
        
        serializer = ExpenseCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('total_amount', serializer.errors)
        self.assertIn('mayor a 0', str(serializer.errors['total_amount'][0]))

    def test_expense_create_serializer_zero_amount(self):
        """
        Prueba validación de monto cero.
        """
        pdf_file = self.create_test_pdf()
        
        data = {
            'service_type': 'electricity',
            'total_amount': 0,
            'invoice_pdf': pdf_file
        }
        
        serializer = ExpenseCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('total_amount', serializer.errors)

    def test_expense_create_serializer_missing_fields(self):
        """
        Prueba validación cuando faltan campos requeridos.
        """
        # Sin service_type
        data = {
            'total_amount': 100.00,
            'invoice_pdf': self.create_test_pdf()
        }
        serializer = ExpenseCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('service_type', serializer.errors)
        
        # Sin total_amount
        data = {
            'service_type': 'electricity',
            'invoice_pdf': self.create_test_pdf()
        }
        serializer = ExpenseCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('total_amount', serializer.errors)
        
        # Sin invoice_pdf
        data = {
            'service_type': 'electricity',
            'total_amount': 100.00
        }
        serializer = ExpenseCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('invoice_pdf', serializer.errors)

    def test_expense_create_serializer_valid_service_types(self):
        """
        Prueba que todos los tipos de servicio válidos son aceptados.
        """
        valid_services = [
            'electricity', 'water', 'arbitrios', 
            'motor', 'maintenance', 'gas'
        ]
        
        for service in valid_services:
            pdf_file = self.create_test_pdf()
            data = {
                'service_type': service,
                'total_amount': 100.00,
                'invoice_pdf': pdf_file
            }
            
            serializer = ExpenseCreateSerializer(data=data)
            self.assertTrue(
                serializer.is_valid(),
                f"Service type '{service}' should be valid. Errors: {serializer.errors}"
            )

    def test_expense_create_serializer_decimal_precision(self):
        """
        Prueba que el serializer maneja correctamente la precisión decimal.
        """
        pdf_file = self.create_test_pdf()
        
        # Probar con diferentes precisiones decimales
        test_amounts = ['100', '100.5', '100.50', '1234.56', '0.01']
        
        for amount in test_amounts:
            data = {
                'service_type': 'electricity',
                'total_amount': float(amount),
                'invoice_pdf': pdf_file
            }
            
            serializer = ExpenseCreateSerializer(data=data)
            self.assertTrue(
                serializer.is_valid(),
                f"Amount '{amount}' should be valid. Errors: {serializer.errors}"
            )

    def test_expense_create_serializer_no_context_validations(self):
        """
        Prueba que ExpenseCreateSerializer no requiere validaciones de contexto.
        Las validaciones de reglas y ciclo abierto se manejan en la vista.
        """
        pdf_file = self.create_test_pdf()
        data = {
            'service_type': 'water',  # Aunque no tenga regla, debería ser válido en el serializer
            'total_amount': 100.00,
            'invoice_pdf': pdf_file
        }
        
        serializer = ExpenseCreateSerializer(data=data)
        self.assertTrue(
            serializer.is_valid(),
            f"ExpenseCreateSerializer should be valid without context. Errors: {serializer.errors}"
        )

    def tearDown(self):
        """Limpiar archivos de prueba."""
        # Limpiar archivos PDF de prueba
        for expense in Expense.objects.all():
            if expense.invoice_pdf:
                try:
                    expense.invoice_pdf.delete()
                except:
                    pass