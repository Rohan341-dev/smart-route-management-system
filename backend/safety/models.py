from django.db import models
from django.conf import settings


class DriverAlert(models.Model):
    ALERT_TYPE_CHOICES = (
        ('speed', 'Speed Limit'),
        ('harsh_brake', 'Harsh Braking'),
        ('route_deviation', 'Route Deviation'),
        ('stop_violation', 'Stop Violation'),
        ('general', 'General'),
    )
    SEVERITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    )

    driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='driver_alerts',
    )
    bus = models.ForeignKey(
        'fleet.Bus',
        on_delete=models.CASCADE,
        related_name='driver_alerts',
    )
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPE_CHOICES, default='general')
    message = models.TextField()
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='medium')
    acknowledged = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'safety_driver_alert'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.alert_type} - {self.driver} ({self.severity})"


class SOSAlert(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('responded', 'Responded'),
        ('resolved', 'Resolved'),
    )

    vehicle = models.ForeignKey(
        'fleet.Bus',
        on_delete=models.CASCADE,
        related_name='sos_alerts',
    )
    driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sos_alerts',
    )
    lat = models.DecimalField(max_digits=9, decimal_places=6, default=0)
    lng = models.DecimalField(max_digits=9, decimal_places=6, default=0)
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    escalation_level = models.PositiveIntegerField(default=0)
    escalation_timer = models.PositiveIntegerField(
        help_text='Seconds before next escalation', default=0,
    )
    primary_contact = models.CharField(max_length=20, blank=True)
    secondary_contact = models.CharField(max_length=20, blank=True)
    authority_contact = models.CharField(max_length=20, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'safety_sos_alert'
        ordering = ['-created_at']

    def __str__(self):
        return f"SOS from {self.driver} - {self.status}"
