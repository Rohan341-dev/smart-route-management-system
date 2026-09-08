from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'severity', 'recipient', 'read', 'created_at')
    list_filter = ('type', 'severity', 'read')
    search_fields = ('title', 'recipient__first_name', 'recipient__last_name')
    date_hierarchy = 'created_at'
