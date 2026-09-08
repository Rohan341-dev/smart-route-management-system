from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from .models import AttendanceRecord
from .serializers import AttendanceRecordSerializer, QRScanSerializer
from students.models import Student
from fleet.models import Bus
from notifications.models import Notification


class ListAttendanceView(generics.ListAPIView):
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Attendance.objects_all().select_related(
            'student', 'bus', 'route', 'driver',
        )
        bus_id = self.request.query_params.get('bus')
        if bus_id:
            qs = qs.filter(bus_id=bus_id)
        route_id = self.request.query_params.get('route')
        if route_id:
            qs = qs.filter(route_id=route_id)
        date = self.request.query_params.get('date')
        if date:
            qs = qs.filter(timestamp__date=date)
        return qs


# alias for clarity
Attendance = AttendanceRecord


class ScanStudentQRView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = QRScanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        qr_data = serializer.validated_data['qr_data']
        bus_id = serializer.validated_data['bus_id']
        driver_id = serializer.validated_data['driver_id']
        action = serializer.validated_data['action']

        # Find student by qr_id
        try:
            student = Student.objects.get(qr_id=qr_data, qr_enabled=True)
        except Student.DoesNotExist:
            return Response(
                {'error': 'Invalid or disabled QR code'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            bus = Bus.objects.get(pk=bus_id)
        except Bus.DoesNotExist:
            return Response(
                {'error': 'Bus not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Determine status and trip_stage
        if action == 'pick':
            new_status = 'picked_up'
            trip_stage = 'pickup'
        else:
            new_status = 'dropped'
            trip_stage = 'dropoff'

        # Create attendance record
        record = AttendanceRecord.objects.create(
            student=student,
            bus=bus,
            route=bus.assigned_route,
            driver_id=driver_id,
            status=new_status,
            method='qr',
            trip_stage=trip_stage,
        )

        # Update student attendance_status
        student.attendance_status = new_status
        student.save(update_fields=['attendance_status', 'updated_at'])

        # Update bus occupancy
        if action == 'pick':
            bus.current_students = max(0, bus.current_students + 1)
        else:
            bus.current_students = max(0, bus.current_students - 1)
        bus.save(update_fields=['current_students', 'updated_at'])

        # Notify parent
        if student.parent:
            if action == 'pick':
                title = 'Student Picked Up'
                message = f'{student.full_name} has been picked up from the bus stop.'
            else:
                title = 'Student Dropped'
                message = f'{student.full_name} has been dropped off at their stop.'

            Notification.objects.create(
                title=title,
                message=message,
                type='attendance',
                severity='info',
                recipient=student.parent,
                student=student,
                bus=bus,
            )

        return Response(
            AttendanceRecordSerializer(record).data,
            status=status.HTTP_201_CREATED,
        )
