from django.contrib import admin
from .models import AttendanceRecord


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ('student', 'bus', 'route', 'driver', 'status', 'method', 'trip_stage', 'timestamp')
    list_filter = ('status', 'method', 'trip_stage')
    search_fields = ('student__full_name', 'bus__bus_number')
    date_hierarchy = 'timestamp'
