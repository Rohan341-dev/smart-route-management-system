from django.urls import path
from . import views

urlpatterns = [
    path('', views.ListDriverView.as_view(), name='driver-list'),
    path('<int:pk>/', views.RetrieveDriverView.as_view(), name='driver-detail'),
]
