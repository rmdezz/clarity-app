# backend/properties/urls.py
from django.urls import path
from .views import PropertyListCreateAPIView, PropertyRetrieveAPIView, UnitCreateAPIView

urlpatterns = [
    path('', PropertyListCreateAPIView.as_view(), name='property-list-create'),
    path('<int:pk>/', PropertyRetrieveAPIView.as_view(), name='property-detail'),
    path('<int:property_pk>/units/', UnitCreateAPIView.as_view(), name='unit-create'),
]