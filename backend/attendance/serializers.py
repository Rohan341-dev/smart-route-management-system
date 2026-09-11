from rest_framework import serializers
from .models import AttendanceRecord


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    bus_number = serializers.CharField(source='bus.bus_number', read_only=True)
    route_name = serializers.CharField(source='route.name', read_only=True, default='')
    driver_name = serializers.CharField(source='driver.get_full_name', read_only=True, default='')

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'student', 'student_name', 'student_id',
            'bus', 'bus_number',
            'route', 'route_name', 'driver', 'driver_name',
            'status', 'boarding_time', 'drop_time',
            'date', 'timestamp', 'updated_at', 'method', 'trip_stage',
        ]


class QRScanSerializer(serializers.Serializer):
    qr_data = serializers.CharField()
    action = serializers.ChoiceField(choices=['pick', 'drop'])
