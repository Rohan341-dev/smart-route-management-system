from django.urls import path
from . import views

urlpatterns = [
    path('', views.TriggerEmergencyView.as_view(), name='emergency-trigger'),
    path('<int:pk>/respond/', views.respond_emergency, name='emergency-respond'),
    path('<int:pk>/resolve/', views.resolve_emergency, name='emergency-resolve'),
]
