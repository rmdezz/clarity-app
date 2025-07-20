# backend/rules/logic.py
from decimal import Decimal

def calculate_equal_division(total_amount: Decimal, unit_count: int) -> Decimal:
    """
    Calcula la porción de un gasto bajo una regla de división equitativa.
    
    Returns:
        La cantidad que corresponde a cada unidad.
    """
    if unit_count <= 0:
        return Decimal('0.00')
    
    # Usar el tipo Decimal para precisión monetaria.
    return (total_amount / Decimal(unit_count)).quantize(Decimal('0.01'))

def calculate_occupant_proration(total_amount: Decimal, units: list) -> list[Decimal]:
    """
    Calcula la porción de un gasto bajo una regla de prorrateo por ocupante.
    """
    occupant_counts = [unit.tenant.number_of_occupants for unit in units if hasattr(unit, 'tenant')]
    total_occupants = sum(occupant_counts)

    if total_occupants <= 0:
        return [Decimal('0.00')] * len(units)

    portions = []
    for count in occupant_counts:
        share = (total_amount * Decimal(count) / Decimal(total_occupants)).quantize(Decimal('0.01'))
        portions.append(share)
    
    return portions