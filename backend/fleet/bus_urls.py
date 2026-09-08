from django.urls import path
from . import views

urlpatterns = [
    path('', views.ListBusView.as_view(), name='bus-list'),
    path('<int:pk>/', views.RetrieveBusView.as_view(), name='bus-detail'),
    path('<int:pk>/gps/', views.update_bus_gps, name='bus-gps'),
    path('<int:pk>/status/', views.update_bus_status, name='bus-status'),
]
