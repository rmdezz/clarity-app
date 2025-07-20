# backend/tenants/services/tenancy_service.py

from django.core.exceptions import ValidationError
from django.utils import timezone
from typing import Optional
from .tenancy_validation_service import TenancyValidationService


class TenancyService:
    """
    Servicio principal para operaciones de arrendamientos.
    """
    
    @staticmethod
    def get_current_tenancy(unit, date=None):
        """
        Obtiene el arrendamiento actual para una unidad en una fecha específica.
        """
        from ..models import Tenancy
        
        if date is None:
            date = timezone.now().date()
        
        try:
            return Tenancy.objects.get(
                unit=unit,
                start_date__lte=date,
                end_date__isnull=True  # Arrendamiento activo
            )
        except Tenancy.DoesNotExist:
            try:
                return Tenancy.objects.get(
                    unit=unit,
                    start_date__lte=date,
                    end_date__gte=date
                )
            except Tenancy.DoesNotExist:
                return None
    
    @staticmethod
    def get_active_tenancy(unit):
        """
        Obtiene el arrendamiento activo (sin fecha de fin) para una unidad.
        """
        from ..models import Tenancy
        
        try:
            return Tenancy.objects.get(unit=unit, end_date__isnull=True)
        except Tenancy.DoesNotExist:
            return None
    
    @staticmethod
    def create_tenancy(unit, tenant, start_date, number_of_occupants, end_date=None):
        """
        Crea un nuevo arrendamiento con validaciones.
        """
        from ..models import Tenancy
        
        # Validar fechas
        TenancyValidationService.validate_dates(start_date, end_date)
        
        # Verificar superposiciones
        overlapping = TenancyValidationService.check_overlapping_tenancies(
            unit, start_date, end_date
        )
        
        if overlapping:
            overlapping_desc = overlapping[0]
            raise ValidationError(
                f"Este arrendamiento se superpone con un arrendamiento existente "
                f"({overlapping_desc.tenant.name}: {overlapping_desc.start_date} - "
                f"{overlapping_desc.end_date or 'Activo'})."
            )
        
        # Crear el arrendamiento
        tenancy = Tenancy.objects.create(
            unit=unit,
            tenant=tenant,
            start_date=start_date,
            end_date=end_date,
            number_of_occupants=number_of_occupants
        )
        
        return tenancy
    
    @staticmethod
    def end_tenancy(tenancy, end_date):
        """
        Finaliza un arrendamiento estableciendo la fecha de fin.
        """
        # Validar fechas básicas
        TenancyValidationService.validate_dates(tenancy.start_date, end_date)
        
        # Validar contra arrendamientos futuros
        TenancyValidationService.validate_end_date_against_future_tenancies(tenancy, end_date)
        
        tenancy.end_date = end_date
        tenancy.save()
        
        return tenancy
    
    @staticmethod
    def get_tenancy_history(unit):
        """
        Obtiene el historial completo de arrendamientos para una unidad.
        """
        from ..models import Tenancy
        
        return Tenancy.objects.filter(unit=unit).order_by('-start_date')