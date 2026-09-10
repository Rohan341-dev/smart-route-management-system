from django.urls import path
from . import views

urlpatterns = [
    path('', views.ListRouteView.as_view(), name='route-list'),
    path('create/', views.CreateRouteView.as_view(), name='route-create'),
    path('<int:pk>/', views.RetrieveRouteView.as_view(), name='route-detail'),
    path('<int:pk>/update/', views.UpdateRouteView.as_view(), name='route-update'),
    path('<int:pk>/delete/', views.DeleteRouteView.as_view(), name='route-delete'),
    path('trips/', views.ListTripView.as_view(), name='trip-list'),
    path('trips/<int:pk>/', views.RetrieveTripView.as_view(), name='trip-detail'),
    path('trips/<int:pk>/status/', views.UpdateTripStatusView.as_view(), name='trip-status'),
    path('trips/<int:pk>/stops/<int:stop_id>/', views.UpdateTripStopView.as_view(), name='trip-stop'),
]
