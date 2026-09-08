from django.db import models
from django.conf import settings


class Route(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('completed', 'Completed'),
    )

    name = models.CharField(max_length=100)
    vehicle = models.ForeignKey(
        'fleet.Bus',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='routes',
    )
    driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='routes',
    )
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='active')
    distance = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    estimated_time = models.PositiveIntegerField(help_text='Estimated time in minutes', default=0)
    total_students = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'routes_route'
        ordering = ['name']

    def __str__(self):
        return self.name


class RouteStop(models.Model):
    STOP_TYPE_CHOICES = (
        ('pickup', 'Pickup'),
        ('dropoff', 'Dropoff'),
        ('both', 'Both'),
    )

    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='stops')
    name = models.CharField(max_length=100)
    lat = models.DecimalField(max_digits=9, decimal_places=6)
    lng = models.DecimalField(max_digits=9, decimal_places=6)
    time = models.TimeField(null=True, blank=True)
    students_count = models.PositiveIntegerField(default=0)
    order = models.PositiveIntegerField(default=0)
    stop_type = models.CharField(max_length=10, choices=STOP_TYPE_CHOICES, default='both')

    class Meta:
        db_table = 'routes_stop'
        ordering = ['order']

    def __str__(self):
        return f"{self.route.name} - {self.name}"


class Trip(models.Model):
    STATUS_CHOICES = (
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    vehicle = models.ForeignKey(
        'fleet.Bus',
        on_delete=models.CASCADE,
        related_name='trips',
    )
    driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='trips',
    )
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='trips')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='scheduled')
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    students_picked_up = models.PositiveIntegerField(default=0)
    students_dropped = models.PositiveIntegerField(default=0)
    total_students = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'routes_trip'
        ordering = ['-created_at']

    def __str__(self):
        return f"Trip {self.id} - {self.route.name}"
