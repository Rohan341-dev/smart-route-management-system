from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPE_CHOICES = (
        ('attendance', 'Attendance'),
        ('bus_tracking', 'Bus Tracking'),
        ('safety', 'Safety'),
        ('schedule', 'Schedule'),
        ('general', 'General'),
    )
    SEVERITY_CHOICES = (
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('critical', 'Critical'),
    )

    title = models.CharField(max_length=200)
    message = models.TextField()
    type = models.CharField(max_length=15, choices=TYPE_CHOICES, default='general')
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='info')
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
    )
    bus = models.ForeignKey(
        'fleet.Bus',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
    )
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications_notification'
        ordering = ['-created_at']

    def __str__(self):
        return self.title
