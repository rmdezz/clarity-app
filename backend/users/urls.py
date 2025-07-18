# backend/users/urls.py

from django.urls import path
from .views.auth_views import LoginAPIView, UserRegistrationAPIView

urlpatterns = [
    path('register', UserRegistrationAPIView.as_view(), name='register-user'),
    path('login', LoginAPIView.as_view(), name='token_obtain_pair'),
]