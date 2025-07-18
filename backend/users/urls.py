# backend/users/urls.py

from django.urls import path
from .views.auth_views import UserRegistrationAPIView

urlpatterns = [
    path('register', UserRegistrationAPIView.as_view(), name='register-user'),
]