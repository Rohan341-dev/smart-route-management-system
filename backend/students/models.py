import uuid
from django.db import models
from django.conf import settings


def student_photo_path(instance, filename):
    ext = filename.split('.')[-1].lower()
    return f"students/photos/{instance.student_id}.{ext}"


class Student(models.Model):
    ATTENDANCE_CHOICES = (
        ('not.boarded', 'Not Boarded'),
        ('waiting', 'Waiting'),
        ('picked_up', 'Picked Up'),
        ('on_bus', 'On Bus'),
        ('dropped', 'Dropped'),
        ('absent', 'Absent'),
    )

    student_id = models.CharField(max_length=20, unique=True)
    full_name = models.CharField(max_length=150)
    class_name = models.CharField(max_length=20)
    section = models.CharField(max_length=10, blank=True)
    parent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='children',
    )
    assigned_bus = models.ForeignKey(
        'fleet.Bus',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students',
    )
    assigned_route = models.ForeignKey(
        'routes.Route',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students',
    )
    qr_id = models.CharField(max_length=64, unique=True, default=uuid.uuid4)
    qr_enabled = models.BooleanField(default=True)
    photo = models.ImageField(upload_to=student_photo_path, null=True, blank=True)
    attendance_status = models.CharField(
        max_length=15, choices=ATTENDANCE_CHOICES, default='not.boarded'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'students_student'
        ordering = ['class_name', 'full_name']

    def __str__(self):
        return f"{self.full_name} ({self.student_id})"
