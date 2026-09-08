from django.urls import path
from . import views

urlpatterns = [
    # GPS Device CRUD
    path('devices/', views.gps_device_list_create, name='gps-device-list'),
    path('devices/<int:pk>/', views.gps_device_detail, name='gps-device-detail'),
    path('devices/<int:pk>/assign/', views.gps_device_assign, name='gps-device-assign'),

    # SinoTrack sync
    path('sync/devices/', views.sync_sinotrack_devices, name='sinotrack-sync-devices'),
    path('sync/locations/', views.sync_sinotrack_locations, name='sinotrack-sync-locations'),

    # Live GPS
    path('bus/<int:bus_id>/latest/', views.bus_latest_location, name='bus-latest-location'),
    path('fleet/locations/', views.fleet_latest_locations, name='fleet-locations'),
    path('parent/location/', views.parent_bus_location, name='parent-bus-location'),

    # History
    path('history/<int:bus_id>/', views.gps_history, name='gps-history'),

    # Route deviation
    path('deviations/', views.route_deviation_list, name='route-deviation-list'),
    path('deviations/<int:pk>/acknowledge/', views.acknowledge_deviation, name='acknowledge-deviation'),

    # Health check
    path('health/', views.gps_health_check, name='gps-health-check'),
]
