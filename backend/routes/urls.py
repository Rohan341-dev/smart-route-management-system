from django.urls import path
from . import views

urlpatterns = [
    path('', views.ListRouteView.as_view(), name='route-list'),
    path('<int:pk>/', views.RetrieveRouteView.as_view(), name='route-detail'),
]
