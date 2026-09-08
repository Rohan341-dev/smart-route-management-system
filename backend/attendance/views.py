import json
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
        qs = AttendanceRecord.objects.select_related(
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


class ScanStudentQRView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = QRScanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        qr_data = serializer.validated_data['qr_data']
        action = serializer.validated_data['action']

        # Parse QR payload — extract studentId from format SMARTBUS:STUDENT:STU-001
        student_id = None
        qr_str = qr_data.strip()
        if qr_str.startswith('SMARTBUS:STUDENT:'):
            student_id = qr_str.replace('SMARTBUS:STUDENT:', '').strip()
        else:
            try:
                payload = json.loads(qr_str)
                if isinstance(payload, dict) and payload.get('type') == 'SMARTBUS_STUDENT':
                    student_id = payload.get('studentId')
            except (json.JSONDecodeError, TypeError, AttributeError):
                student_id = qr_str

        if not student_id:
            return Response(
                {'error': 'Invalid QR code format'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Find student by student_id
        try:
            student = Student.objects.get(student_id=student_id, qr_enabled=True)
        except Student.DoesNotExist:
            return Response(
                {'error': f'Invalid or disabled QR code for student {student_id}'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Derive bus from student's assigned bus (don't trust frontend bus_id)
        bus = student.assigned_bus
        if not bus:
            return Response(
                {'error': f'Student {student.full_name} is not assigned to any bus'},
                status=status.HTTP_400_BAD_REQUEST,
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
            driver=request.user,
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

        return Response({
            'success': True,
            'student': {
                'id': student.student_id,
                'name': student.full_name,
            },
            'status': new_status,
            'message': f'Student {"picked up" if action == "pick" else "dropped"} successfully',
            'record': AttendanceRecordSerializer(record).data,
        }, status=status.HTTP_201_CREATED)
