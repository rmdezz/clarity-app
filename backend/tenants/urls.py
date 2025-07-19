# backend/tenants/urls.py
from django.urls import path
from .views import TenantAssignAPIView

urlpatterns = [
    # La ruta es relativa a '/api/units/'
    path('<int:unit_pk>/assign-tenant/', TenantAssignAPIView.as_view(), name='tenant-assign'),
]