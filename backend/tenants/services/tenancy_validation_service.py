# backend/tenants/services/tenancy_validation_service.py

from django.core.exceptions import ValidationError
from typing import List


class TenancyValidationService:
    """
    Servicio especializado en validaciones de arrendamientos.
    """
    
    @staticmethod
    def validate_dates(start_date, end_date=None):
        """
        Valida las fechas de un arrendamiento.
        """
        if end_date and start_date and end_date < start_date:
            raise ValidationError("La fecha de fin no puede ser anterior a la fecha de inicio.")
    
    @staticmethod
    def check_overlapping_tenancies(unit, start_date, end_date=None, exclude_tenancy_id=None):
        """
        Verifica si un período de arrendamiento se superpone con arrendamientos existentes.
        
        Returns:
            List[Tenancy]: Lista de arrendamientos que se superponen
        """
        from ..models import Tenancy
        
        existing_tenancies = Tenancy.objects.filter(unit=unit)
        
        if exclude_tenancy_id:
            existing_tenancies = existing_tenancies.exclude(pk=exclude_tenancy_id)
        
        overlapping = []
        
        for existing in existing_tenancies:
            if TenancyValidationService._periods_overlap(
                start_date, end_date, 
                existing.start_date, existing.end_date
            ):
                overlapping.append(existing)
        
        return overlapping
    
    @staticmethod
    def _periods_overlap(start1, end1, start2, end2):
        """
        Determina si dos períodos se superponen.
        """
        # Si el primer período no tiene fin (es activo)
        if not end1:
            return not end2 or end2 >= start1
        
        # Si el segundo período no tiene fin (es activo)
        if not end2:
            return end1 >= start2
        
        # Ambos períodos tienen fechas de fin
        return start1 <= end2 and end1 >= start2
    
    @staticmethod
    def validate_end_date_against_future_tenancies(tenancy, end_date):
        """
        Valida que finalizar un arrendamiento no afecte arrendamientos futuros.
        """
        from ..models import Tenancy
        
        future_tenancies = Tenancy.objects.filter(
            unit=tenancy.unit,
            start_date__gt=tenancy.start_date
        ).exclude(pk=tenancy.pk)
        
        for future in future_tenancies:
            if future.start_date <= end_date:
                raise ValidationError(
                    f"No se puede finalizar el arrendamiento en {end_date} porque hay "
                    f"un arrendamiento posterior que inicia el {future.start_date}."
                )