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
        source='parent.get_full_name', read_only=True, default=''
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


class CreateStudentSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    class_name = serializers.CharField(max_length=20)
    section = serializers.CharField(max_length=10, required=False, default='')
    parent_name = serializers.CharField(max_length=150)
    parent_phone = serializers.CharField(max_length=20)
    assigned_bus = serializers.CharField(max_length=50, required=False, allow_blank=True, allow_null=True)
    assigned_route = serializers.CharField(max_length=50, required=False, allow_blank=True, allow_null=True)

    def _find_or_create_parent(self, parent_name, parent_phone):
        from accounts.models import User
        if parent_phone:
            parent = User.objects.filter(phone=parent_phone, role='parent').first()
            if parent:
                return parent
        parts = parent_name.strip().split(' ', 1)
        first_name = parts[0] if parts else parent_name
        last_name = parts[1] if len(parts) > 1 else ''
        username = parent_phone if parent_phone else f"parent_{parent_name.lower().replace(' ', '_')}"
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1
        return User.objects.create_user(
            username=username,
            first_name=first_name,
            last_name=last_name,
            phone=parent_phone or '',
            role='parent',
        )

    def _resolve_bus(self, bus_value):
        from fleet.models import Bus
        if not bus_value:
            return None
        try:
            return Bus.objects.get(pk=int(bus_value))
        except (ValueError, Bus.DoesNotExist):
            pass
        try:
            return Bus.objects.get(bus_number=bus_value)
        except Bus.DoesNotExist:
            return None

    def _resolve_route(self, route_value):
        from routes.models import Route
        if not route_value:
            return None
        try:
            return Route.objects.get(pk=int(route_value))
        except (ValueError, Route.DoesNotExist):
            pass
        try:
            return Route.objects.get(name=route_value)
        except Route.DoesNotExist:
            return None

    def create(self, validated_data):
        parent_name = validated_data.pop('parent_name')
        parent_phone = validated_data.pop('parent_phone')
        bus_value = validated_data.pop('assigned_bus', None)
        route_value = validated_data.pop('assigned_route', None)

        parent = self._find_or_create_parent(parent_name, parent_phone)
        bus = self._resolve_bus(bus_value)
        route = self._resolve_route(route_value)

        last_student = Student.objects.order_by('-id').first()
        next_num = (last_student.id + 1) if last_student else 1
        student_id = f"STU-{str(next_num).zfill(3)}"

        return Student.objects.create(
            student_id=student_id,
            parent=parent,
            assigned_bus=bus,
            assigned_route=route,
            **validated_data,
        )
