from rest_framework import serializers
from .models import Route, RouteStop, Trip


class RouteStopSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteStop
        fields = [
            'id', 'route', 'name', 'lat', 'lng', 'time',
            'students_count', 'order', 'stop_type',
        ]


class RouteSerializer(serializers.ModelSerializer):
    stops = RouteStopSerializer(many=True, read_only=True)
    vehicle_number = serializers.CharField(
        source='vehicle.bus_number', read_only=True, default=''
    )
    driver_name = serializers.CharField(
        source='driver.get_full_name', read_only=True, default=''
    )

    class Meta:
        model = Route
        fields = [
            'id', 'name', 'vehicle', 'vehicle_number', 'driver', 'driver_name',
            'status', 'distance', 'estimated_time', 'total_students',
            'stops', 'created_at', 'updated_at',
        ]


class TripSerializer(serializers.ModelSerializer):
    route_name = serializers.CharField(source='route.name', read_only=True)
    vehicle_number = serializers.CharField(
        source='vehicle.bus_number', read_only=True
    )
    driver_name = serializers.CharField(
        source='driver.get_full_name', read_only=True
    )

    class Meta:
        model = Trip
        fields = [
            'id', 'vehicle', 'vehicle_number', 'driver', 'driver_name',
            'route', 'route_name', 'status', 'start_time', 'end_time',
            'students_picked_up', 'students_dropped', 'total_students',
            'created_at', 'updated_at',
        ]
