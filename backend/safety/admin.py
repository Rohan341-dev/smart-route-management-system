from django.contrib import admin
from .models import DriverAlert, SOSAlert


@admin.register(DriverAlert)
class DriverAlertAdmin(admin.ModelAdmin):
    list_display = ('driver', 'bus', 'alert_type', 'severity', 'acknowledged', 'created_at')
    list_filter = ('alert_type', 'severity', 'acknowledged')
    search_fields = ('driver__first_name', 'driver__last_name')
    date_hierarchy = 'created_at'


@admin.register(SOSAlert)
class SOSAlertAdmin(admin.ModelAdmin):
    list_display = ('driver', 'vehicle', 'status', 'escalation_level', 'created_at')
    list_filter = ('status', 'escalation_level')
    search_fields = ('driver__first_name', 'driver__last_name')
    date_hierarchy = 'created_at'
