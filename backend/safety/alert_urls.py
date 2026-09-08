from django.urls import path
from . import views

urlpatterns = [
    path('', views.ListAlertView.as_view(), name='alert-list'),
    path('<int:pk>/acknowledge/', views.acknowledge_alert, name='alert-acknowledge'),
]
