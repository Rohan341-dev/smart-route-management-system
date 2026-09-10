from django.urls import path
from . import views

urlpatterns = [
    path('', views.ListTripView.as_view(), name='trip-list'),
    path('<int:pk>/', views.RetrieveTripView.as_view(), name='trip-detail'),
    path('<int:pk>/status/', views.UpdateTripStatusView.as_view(), name='trip-status'),
    path('<int:pk>/stops/<int:stop_id>/', views.UpdateTripStopView.as_view(), name='trip-stop'),
]
