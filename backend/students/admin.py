from django.contrib import admin
from .models import Student


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'full_name', 'class_name', 'section', 'assigned_bus', 'attendance_status', 'qr_enabled')
    list_filter = ('class_name', 'attendance_status', 'qr_enabled')
    search_fields = ('student_id', 'full_name')
