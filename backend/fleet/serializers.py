from rest_framework import serializers
from .models import Bus, DriverAssignment


class BusSerializer(serializers.ModelSerializer):
    assigned_driver_name = serializers.CharField(
        source='assigned_driver.get_full_name', read_only=True, default=''
    )
    assigned_route_name = serializers.CharField(
        source='assigned_route.name', read_only=True, default=''
    )

    class Meta:
        model = Bus
        fields = [
            'id', 'bus_number', 'registration_number', 'capacity', 'status',
            'assigned_driver', 'assigned_driver_name',
            'assigned_route', 'assigned_route_name',
            'gps_lat', 'gps_lng', 'speed', 'heading', 'current_students',
            'created_at', 'updated_at',
        ]


class DriverAssignmentSerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(
        source='driver.get_full_name', read_only=True
    )
    bus_number = serializers.CharField(
        source='bus.bus_number', read_only=True
    )
    route_name = serializers.CharField(
        source='route.name', read_only=True
    )

    class Meta:
        model = DriverAssignment
        fields = [
            'id', 'driver', 'driver_name', 'bus', 'bus_number',
            'route', 'route_name', 'date', 'status',
            'created_at', 'updated_at',
        ]
