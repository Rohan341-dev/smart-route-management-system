from rest_framework import serializers
from .models import Student


class StudentSerializer(serializers.ModelSerializer):
    assigned_bus_number = serializers.CharField(
        source='assigned_bus.bus_number', read_only=True, default=''
    )
    assigned_route_name = serializers.CharField(
        source='assigned_route.name', read_only=True, default=''
    )
    parent_name = serializers.CharField(
        source='parent.get_full_name', read_only=True
    )

    class Meta:
        model = Student
        fields = [
            'id', 'student_id', 'full_name', 'class_name', 'section',
            'parent', 'parent_name',
            'assigned_bus', 'assigned_bus_number',
            'assigned_route', 'assigned_route_name',
            'qr_id', 'qr_enabled', 'attendance_status',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['qr_id']
