from django.contrib import admin
from .models import Bus, DriverAssignment


@admin.register(Bus)
class BusAdmin(admin.ModelAdmin):
    list_display = ('bus_number', 'registration_number', 'capacity', 'status', 'assigned_driver', 'current_students')
    list_filter = ('status',)
    search_fields = ('bus_number', 'registration_number')


@admin.register(DriverAssignment)
class DriverAssignmentAdmin(admin.ModelAdmin):
    list_display = ('driver', 'bus', 'route', 'date', 'status')
    list_filter = ('status', 'date')
    search_fields = ('driver__first_name', 'driver__last_name', 'bus__bus_number')
