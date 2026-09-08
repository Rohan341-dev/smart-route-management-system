from django.contrib import admin
from .models import Route, RouteStop, Trip


class RouteStopInline(admin.TabularInline):
    model = RouteStop
    extra = 0


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ('name', 'vehicle', 'driver', 'status', 'distance', 'estimated_time', 'total_students')
    list_filter = ('status',)
    search_fields = ('name',)
    inlines = [RouteStopInline]


@admin.register(RouteStop)
class RouteStopAdmin(admin.ModelAdmin):
    list_display = ('name', 'route', 'order', 'stop_type', 'students_count')
    list_filter = ('stop_type',)
    search_fields = ('name',)


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ('id', 'route', 'vehicle', 'driver', 'status', 'start_time', 'end_time', 'students_picked_up', 'students_dropped')
    list_filter = ('status',)
