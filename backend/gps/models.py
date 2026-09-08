from django.db import models
from django.conf import settings


class GPSDevice(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('maintenance', 'Maintenance'),
    )
    PROVIDER_CHOICES = (
        ('sinotrack', 'SinoTrack'),
        ('other', 'Other'),
    )

    device_name = models.CharField(max_length=100)
    device_model = models.CharField(max_length=50, default='ST-901A')
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, default='sinotrack')
    device_identifier = models.CharField(max_length=100, unique=True, help_text='SinoTrack device ID or serial number')
    imei = models.CharField(max_length=20, blank=True, default='')
    assigned_bus = models.OneToOneField(
        'fleet.Bus',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='gps_device',
    )
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='active')
    last_seen = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'gps_device'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.device_name} ({self.device_identifier})"


class BusLocation(models.Model):
    bus = models.ForeignKey(
        'fleet.Bus',
        on_delete=models.CASCADE,
        related_name='locations',
    )
    gps_device = models.ForeignKey(
        GPSDevice,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='locations',
    )
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    speed = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    heading = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    accuracy = models.DecimalField(max_digits=6, decimal_places=2, default=0, null=True, blank=True)
    gps_status = models.CharField(max_length=10, default='online', blank=True)
    gsm_signal = models.CharField(max_length=10, default='good', blank=True)
    recorded_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'gps_bus_location'
        ordering = ['-recorded_at']
        indexes = [
            models.Index(fields=['bus', '-recorded_at']),
            models.Index(fields=['recorded_at']),
        ]

    def __str__(self):
        return f"Location of {self.bus} at {self.recorded_at}"


class GPSHistory(models.Model):
    bus = models.ForeignKey(
        'fleet.Bus',
        on_delete=models.CASCADE,
        related_name='gps_history',
    )
    gps_device = models.ForeignKey(
        GPSDevice,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    speed = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    heading = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    recorded_at = models.DateTimeField()

    class Meta:
        db_table = 'gps_history'
        ordering = ['-recorded_at']
        indexes = [
            models.Index(fields=['bus', 'recorded_at']),
        ]

    def __str__(self):
        return f"History of {self.bus} at {self.recorded_at}"


class RouteDeviation(models.Model):
    bus = models.ForeignKey(
        'fleet.Bus',
        on_delete=models.CASCADE,
        related_name='route_deviations',
    )
    route = models.ForeignKey(
        'routes.Route',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    deviation_distance = models.DecimalField(max_digits=6, decimal_places=2, help_text='Meters from route')
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    detected_at = models.DateTimeField(auto_now_add=True)
    acknowledged = models.BooleanField(default=False)

    class Meta:
        db_table = 'gps_route_deviation'
        ordering = ['-detected_at']

    def __str__(self):
        return f"Deviation: {self.bus} - {self.deviation_distance}m at {self.detected_at}"
