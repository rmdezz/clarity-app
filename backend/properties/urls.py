# backend/properties/urls.py
from django.urls import path, include
from .views import (
    PropertyListCreateAPIView, PropertyRetrieveAPIView, UnitCreateAPIView,
    BillingCycleListCreateAPIView, BillingCycleRetrieveAPIView
)
from rules.views import ServiceConfigurationAPIView

urlpatterns = [
    path('', PropertyListCreateAPIView.as_view(), name='property-list-create'),
    path('<int:pk>/', PropertyRetrieveAPIView.as_view(), name='property-detail'),
    path('<int:property_pk>/units/', UnitCreateAPIView.as_view(), name='unit-create'),
    path('<int:property_pk>/rules/', include('rules.urls')),
    path('<int:property_id>/service-configuration/', ServiceConfigurationAPIView.as_view(), name='service-configuration'),
    path('<int:property_id>/billing-cycles/', BillingCycleListCreateAPIView.as_view(), name='billing-cycle-list-create'),
]