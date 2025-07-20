# backend/rules/tests/test_rule_logic.py
from decimal import Decimal
from django.test import TestCase
from ..logic import calculate_equal_division, calculate_occupant_proration 

class RuleLogicTest(TestCase):
    def test_calculate_equal_division(self):
        """Prueba la lógica de cálculo de división equitativa."""
        self.assertEqual(calculate_equal_division(Decimal('100.00'), 4), Decimal('25.00'))
        self.assertEqual(calculate_equal_division(Decimal('100.00'), 3), Decimal('33.33'))
        self.assertEqual(calculate_equal_division(Decimal('0.00'), 5), Decimal('0.00'))
        self.assertEqual(calculate_equal_division(Decimal('150.50'), 0), Decimal('0.00'))
    
    def test_calculate_occupant_proration(self):
        """Prueba la lógica de cálculo de prorrateo por ocupante."""
        # Mock de unidades con ocupantes
        units = [
            {'occupants': 1},
            {'occupants': 2},
            {'occupants': 2},
        ]
        total_amount = Decimal('100.00')
        
        # Simular una lista de objetos simples para la prueba de lógica
        class MockUnit:
            def __init__(self, occupants):
                self.tenant = None
                if occupants > 0:
                    class MockTenant:
                        def __init__(self, occ):
                            self.number_of_occupants = occ
                    self.tenant = MockTenant(occupants)

        mock_units = [MockUnit(u['occupants']) for u in units]
        
        result = calculate_occupant_proration(total_amount, mock_units)
        
        # Total Ocupantes = 5. Porción por ocupante = $20.
        # Resultado esperado: [20.00, 40.00, 40.00]
        self.assertEqual(len(result), 3)
        self.assertEqual(result[0], Decimal('20.00'))
        self.assertEqual(result[1], Decimal('40.00'))
        self.assertEqual(result[2], Decimal('40.00'))