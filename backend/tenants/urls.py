# backend/tenants/urls.py
from django.urls import path
from .views import (
    TenantAssignAPIView, TenancyListCreateAPIView, 
    TenancyRetrieveUpdateAPIView, TenancyEndAPIView,
    AvailableTenantsAPIView
)

urlpatterns = [
    # La ruta es relativa a '/api/units/'
    path('<int:unit_pk>/assign-tenant/', TenantAssignAPIView.as_view(), name='tenant-assign'),
    
    # Nuevas rutas para gestión de arrendamientos
    path('<int:unit_id>/tenancies/', TenancyListCreateAPIView.as_view(), name='tenancy-list-create'),
    path('<int:unit_id>/tenants/', AvailableTenantsAPIView.as_view(), name='available-tenants'),
]