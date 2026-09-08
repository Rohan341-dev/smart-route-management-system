from django.db import models
from django.conf import settings


class Bus(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('maintenance', 'Maintenance'),
    )

    bus_number = models.CharField(max_length=20, unique=True)
    registration_number = models.CharField(max_length=30, unique=True)
    capacity = models.PositiveIntegerField(default=40)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='active')
    assigned_driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_buses',
    )
    assigned_route = models.ForeignKey(
        'routes.Route',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='buses',
    )
    gps_lat = models.DecimalField(max_digits=9, decimal_places=6, default=0)
    gps_lng = models.DecimalField(max_digits=9, decimal_places=6, default=0)
    speed = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    heading = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    current_students = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'fleet_bus'

    def __str__(self):
        return f"Bus {self.bus_number}"


class DriverAssignment(models.Model):
    STATUS_CHOICES = (
        ('assigned', 'Assigned'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='driver_assignments',
    )
    bus = models.ForeignKey(Bus, on_delete=models.CASCADE, related_name='assignments')
    route = models.ForeignKey(
        'routes.Route',
        on_delete=models.CASCADE,
        related_name='driver_assignments',
    )
    date = models.DateField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='assigned')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'fleet_driver_assignment'
        unique_together = ('driver', 'bus', 'date')

    def __str__(self):
        return f"{self.driver} -> {self.bus} on {self.date}"
