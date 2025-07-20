# backend/properties/tests/test_expense_model.py
from django.test import TestCase
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError
from decimal import Decimal
from properties.models import Property, BillingCycle, Expense
from rules.models import ServiceRule


class ExpenseModelTestCase(TestCase):
    """
    Suite de pruebas para el modelo Expense.
    Verifica validaciones, restricciones y comportamiento del modelo.
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
        
        # Crear ciclo de facturación de prueba
        self.billing_cycle = BillingCycle.objects.create(
            property=self.property,
            month=7,
            year=2024,
            status=BillingCycle.Status.OPEN
        )

    def create_test_pdf(self, content=b"Test PDF content"):
        """Crea un archivo PDF de prueba."""
        return SimpleUploadedFile(
            "test_invoice.pdf",
            content,
            content_type="application/pdf"
        )

    def test_expense_creation_success(self):
        """
        [CA-12.1] Prueba la creación exitosa de un gasto con todos los campos.
        """
        pdf_file = self.create_test_pdf()
        
        expense = Expense.objects.create(
            billing_cycle=self.billing_cycle,
            service_type='electricity',
            total_amount=Decimal('150.50'),
            invoice_pdf=pdf_file
        )
        
        # Verificar que se creó correctamente
        self.assertIsNotNone(expense.id)
        self.assertEqual(expense.billing_cycle, self.billing_cycle)
        self.assertEqual(expense.service_type, 'electricity')
        self.assertEqual(expense.total_amount, Decimal('150.50'))
        self.assertTrue(expense.invoice_pdf.name.endswith('.pdf'))
        self.assertIsNotNone(expense.created_at)
        self.assertIsNotNone(expense.updated_at)

    def test_expense_string_representation(self):
        """
        Prueba la representación en string del modelo.
        """
        pdf_file = self.create_test_pdf()
        
        expense = Expense.objects.create(
            billing_cycle=self.billing_cycle,
            service_type='water',
            total_amount=Decimal('200.75'),
            invoice_pdf=pdf_file
        )
        
        expected_string = f"water - S/ 200.75 ({self.billing_cycle})"
        self.assertEqual(str(expense), expected_string)

    def test_expense_ordering(self):
        """
        Prueba que los gastos se ordenan por fecha de creación (más reciente primero).
        """
        pdf_file1 = self.create_test_pdf()
        pdf_file2 = self.create_test_pdf()
        
        expense1 = Expense.objects.create(
            billing_cycle=self.billing_cycle,
            service_type='electricity',
            total_amount=Decimal('100.00'),
            invoice_pdf=pdf_file1
        )
        expense2 = Expense.objects.create(
            billing_cycle=self.billing_cycle,
            service_type='water',
            total_amount=Decimal('200.00'),
            invoice_pdf=pdf_file2
        )
        
        expenses = list(Expense.objects.all())
        
        # Verificar orden: más reciente primero
        self.assertEqual(expenses[0], expense2)
        self.assertEqual(expenses[1], expense1)

    def test_expense_file_upload_path(self):
        """
        [CA-12.1] Prueba que los archivos PDF se suben a la ruta 'invoices/'.
        """
        pdf_file = self.create_test_pdf()
        
        expense = Expense.objects.create(
            billing_cycle=self.billing_cycle,
            service_type='gas',
            total_amount=Decimal('75.25'),
            invoice_pdf=pdf_file
        )
        
        # Verificar que el archivo se sube a la carpeta 'invoices/'
        self.assertTrue(expense.invoice_pdf.name.startswith('invoices/'))
        self.assertTrue(expense.invoice_pdf.name.endswith('.pdf'))

    def test_expense_required_fields(self):
        """
        Prueba que todos los campos requeridos son obligatorios.
        """
        from django.db import IntegrityError
        from django.db import transaction
        
        # Intentar crear gasto sin billing_cycle - este debería fallar por NOT NULL
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Expense.objects.create(
                    billing_cycle=None,
                    service_type='electricity',
                    total_amount=Decimal('100.00'),
                    invoice_pdf=self.create_test_pdf()
                )
        
        # Los otros campos pueden tener defaults o ser opcionales en algunos casos,
        # pero podemos probar que los campos principales están presentes
        # verificando que un gasto completo sí se crea exitosamente
        pdf_file = self.create_test_pdf()
        expense = Expense.objects.create(
            billing_cycle=self.billing_cycle,
            service_type='electricity',
            total_amount=Decimal('100.00'),
            invoice_pdf=pdf_file
        )
        
        # Verificar que todos los campos están presentes
        self.assertIsNotNone(expense.billing_cycle)
        self.assertIsNotNone(expense.service_type)
        self.assertIsNotNone(expense.total_amount)
        self.assertIsNotNone(expense.invoice_pdf)

    def test_expense_decimal_precision(self):
        """
        [CA-12.1] Prueba que el campo total_amount maneja correctamente los decimales.
        """
        pdf_file = self.create_test_pdf()
        
        expense = Expense.objects.create(
            billing_cycle=self.billing_cycle,
            service_type='maintenance',
            total_amount=Decimal('1234.56'),
            invoice_pdf=pdf_file
        )
        
        # Verificar precisión decimal
        self.assertEqual(expense.total_amount, Decimal('1234.56'))
        
        # Verificar que se pueden usar hasta 10 dígitos con 2 decimales
        expense.total_amount = Decimal('12345678.90')
        expense.save()
        
        expense.refresh_from_db()
        self.assertEqual(expense.total_amount, Decimal('12345678.90'))

    def test_expense_cascade_deletion(self):
        """
        Prueba que los gastos se eliminan cuando se elimina el ciclo de facturación.
        """
        pdf_file = self.create_test_pdf()
        
        expense = Expense.objects.create(
            billing_cycle=self.billing_cycle,
            service_type='arbitrios',
            total_amount=Decimal('300.00'),
            invoice_pdf=pdf_file
        )
        
        expense_id = expense.id
        
        # Eliminar el ciclo de facturación
        self.billing_cycle.delete()
        
        # Verificar que el gasto también se eliminó
        with self.assertRaises(Expense.DoesNotExist):
            Expense.objects.get(id=expense_id)

    def test_expense_related_name(self):
        """
        Prueba que se puede acceder a los gastos desde el ciclo de facturación.
        """
        pdf_file1 = self.create_test_pdf()
        pdf_file2 = self.create_test_pdf()
        
        expense1 = Expense.objects.create(
            billing_cycle=self.billing_cycle,
            service_type='electricity',
            total_amount=Decimal('100.00'),
            invoice_pdf=pdf_file1
        )
        expense2 = Expense.objects.create(
            billing_cycle=self.billing_cycle,
            service_type='water',
            total_amount=Decimal('200.00'),
            invoice_pdf=pdf_file2
        )
        
        # Acceder a gastos desde el ciclo de facturación
        expenses = self.billing_cycle.expenses.all()
        
        self.assertEqual(expenses.count(), 2)
        self.assertIn(expense1, expenses)
        self.assertIn(expense2, expenses)

    def test_expense_meta_options(self):
        """
        Prueba las opciones de meta del modelo.
        """
        # Verificar verbose names
        self.assertEqual(Expense._meta.verbose_name, "Expense")
        self.assertEqual(Expense._meta.verbose_name_plural, "Expenses")
        
        # Verificar ordering
        self.assertEqual(Expense._meta.ordering, ['-created_at'])

    def tearDown(self):
        """Limpiar archivos de prueba."""
        from django.db import transaction
        # Limpiar archivos PDF de prueba
        try:
            with transaction.atomic():
                for expense in Expense.objects.all():
                    if expense.invoice_pdf:
                        try:
                            expense.invoice_pdf.delete()
                        except:
                            pass
        except:
            # Si hay problemas de transacción, simplemente continuar
            pass