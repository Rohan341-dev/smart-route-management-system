from rest_framework import serializers
from .models import GPSDevice, BusLocation, GPSHistory, RouteDeviation


class GPSDeviceSerializer(serializers.ModelSerializer):
    assigned_bus_number = serializers.CharField(source='assigned_bus.bus_number', read_only=True, default=None)

    class Meta:
        model = GPSDevice
        fields = [
            'id', 'device_name', 'device_model', 'provider',
            'device_identifier', 'imei', 'assigned_bus', 'assigned_bus_number',
            'status', 'last_seen', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'last_seen']


class BusLocationSerializer(serializers.ModelSerializer):
    bus_number = serializers.CharField(source='bus.bus_number', read_only=True)

    class Meta:
        model = BusLocation
        fields = [
            'id', 'bus', 'bus_number', 'gps_device',
            'latitude', 'longitude', 'speed', 'heading',
            'accuracy', 'gps_status', 'gsm_signal',
            'recorded_at', 'created_at',
        ]


class NormalizedGPSSerializer(serializers.Serializer):
    device_id = serializers.CharField()
    bus_id = serializers.CharField()
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    speed = serializers.FloatField()
    heading = serializers.FloatField()
    gps_status = serializers.CharField()
    gsm_signal = serializers.CharField()
    last_updated = serializers.CharField()


class GPSHistorySerializer(serializers.ModelSerializer):
    bus_number = serializers.CharField(source='bus.bus_number', read_only=True)

    class Meta:
        model = GPSHistory
        fields = [
            'id', 'bus', 'bus_number', 'latitude', 'longitude',
            'speed', 'heading', 'recorded_at',
        ]


class RouteDeviationSerializer(serializers.ModelSerializer):
    bus_number = serializers.CharField(source='bus.bus_number', read_only=True)

    class Meta:
        model = RouteDeviation
        fields = [
            'id', 'bus', 'bus_number', 'route', 'deviation_distance',
            'latitude', 'longitude', 'detected_at', 'acknowledged',
        ]
        read_only_fields = ['detected_at']
