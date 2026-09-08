from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, DriverProfile, ParentProfile


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_active')
    list_filter = ('role', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('SmartBus', {'fields': ('role', 'phone', 'profile_image')}),
    )


@admin.register(DriverProfile)
class DriverProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'driver_id', 'license_number', 'safety_score', 'status')
    list_filter = ('status',)
    search_fields = ('driver_id', 'user__first_name', 'user__last_name')


@admin.register(ParentProfile)
class ParentProfileAdmin(admin.ModelAdmin):
    list_display = ('user',)
