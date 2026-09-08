from django.contrib import admin
from .models import GPSDevice, BusLocation, GPSHistory, RouteDeviation


@admin.register(GPSDevice)
class GPSDeviceAdmin(admin.ModelAdmin):
    list_display = ['device_name', 'device_model', 'provider', 'device_identifier', 'imei', 'assigned_bus', 'status', 'last_seen']
    list_filter = ['provider', 'status', 'device_model']
    search_fields = ['device_name', 'device_identifier', 'imei']
    readonly_fields = ['created_at', 'updated_at', 'last_seen']


@admin.register(BusLocation)
class BusLocationAdmin(admin.ModelAdmin):
    list_display = ['bus', 'latitude', 'longitude', 'speed', 'heading', 'gps_status', 'recorded_at']
    list_filter = ['gps_status', 'bus']
    readonly_fields = ['created_at']
    ordering = ['-recorded_at']


@admin.register(GPSHistory)
class GPSHistoryAdmin(admin.ModelAdmin):
    list_display = ['bus', 'latitude', 'longitude', 'speed', 'heading', 'recorded_at']
    list_filter = ['bus']
    ordering = ['-recorded_at']


@admin.register(RouteDeviation)
class RouteDeviationAdmin(admin.ModelAdmin):
    list_display = ['bus', 'route', 'deviation_distance', 'latitude', 'longitude', 'detected_at', 'acknowledged']
    list_filter = ['acknowledged']
    ordering = ['-detected_at']
