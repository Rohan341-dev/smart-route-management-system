from rest_framework import serializers
from .models import AttendanceRecord


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    bus_number = serializers.CharField(source='bus.bus_number', read_only=True)
    route_name = serializers.CharField(source='route.name', read_only=True)
    driver_name = serializers.CharField(source='driver.get_full_name', read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'student', 'student_name', 'bus', 'bus_number',
            'route', 'route_name', 'driver', 'driver_name',
            'status', 'timestamp', 'method', 'trip_stage',
        ]


class QRScanSerializer(serializers.Serializer):
    qr_data = serializers.CharField()
    bus_id = serializers.IntegerField()
    driver_id = serializers.IntegerField()
    action = serializers.ChoiceField(choices=['pick', 'drop'])
