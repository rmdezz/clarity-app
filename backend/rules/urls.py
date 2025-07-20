# backend/rules/urls.py
from django.urls import path
from .views import RuleListCreateAPIView

urlpatterns = [
    # El nombre ahora coincide con el que se usa en las pruebas.
    path('', RuleListCreateAPIView.as_view(), name='rule-create'),
]