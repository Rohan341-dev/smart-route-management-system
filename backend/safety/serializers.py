from rest_framework import serializers
from .models import DriverAlert, SOSAlert


class DriverAlertSerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(source='driver.get_full_name', read_only=True)
    bus_number = serializers.CharField(source='bus.bus_number', read_only=True)

    class Meta:
        model = DriverAlert
        fields = [
            'id', 'driver', 'driver_name', 'bus', 'bus_number',
            'alert_type', 'message', 'severity', 'acknowledged', 'created_at',
        ]


class SOSAlertSerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(source='driver.get_full_name', read_only=True)
    vehicle_number = serializers.CharField(source='vehicle.bus_number', read_only=True)

    class Meta:
        model = SOSAlert
        fields = [
            'id', 'vehicle', 'vehicle_number', 'driver', 'driver_name',
            'lat', 'lng', 'reason', 'status', 'escalation_level',
            'escalation_timer', 'primary_contact', 'secondary_contact',
            'authority_contact', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
