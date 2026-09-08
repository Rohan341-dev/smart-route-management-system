from django.db import models
from django.conf import settings


class AttendanceRecord(models.Model):
    STATUS_CHOICES = (
        ('waiting', 'Waiting'),
        ('picked_up', 'Picked Up'),
        ('on_bus', 'On Bus'),
        ('dropped', 'Dropped'),
        ('absent', 'Absent'),
    )
    METHOD_CHOICES = (
        ('qr', 'QR'),
        ('manual', 'Manual'),
    )
    TRIP_STAGE_CHOICES = (
        ('pickup', 'Pickup'),
        ('dropoff', 'Dropoff'),
    )

    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='attendance_records',
    )
    bus = models.ForeignKey(
        'fleet.Bus',
        on_delete=models.CASCADE,
        related_name='attendance_records',
    )
    route = models.ForeignKey(
        'routes.Route',
        on_delete=models.CASCADE,
        related_name='attendance_records',
    )
    driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='attendance_records',
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='waiting')
    timestamp = models.DateTimeField(auto_now_add=True)
    method = models.CharField(max_length=10, choices=METHOD_CHOICES, default='qr')
    trip_stage = models.CharField(max_length=10, choices=TRIP_STAGE_CHOICES, default='pickup')

    class Meta:
        db_table = 'attendance_record'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.student} - {self.status} ({self.timestamp})"
