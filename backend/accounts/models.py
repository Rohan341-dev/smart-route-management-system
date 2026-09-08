from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('driver', 'Driver'),
        ('parent', 'Parent'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='admin')
    phone = models.CharField(max_length=20, blank=True)
    profile_image = models.ImageField(upload_to='profiles/', blank=True, null=True)

    class Meta:
        db_table = 'smartbus_user'

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"


class DriverProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='driver_profile')
    driver_id = models.CharField(max_length=20, unique=True)
    license_number = models.CharField(max_length=50)
    license_expiry = models.DateField(null=True, blank=True)
    emergency_contact = models.CharField(max_length=20, blank=True)
    safety_score = models.IntegerField(default=100)
    status = models.CharField(max_length=20, default='active')

    def __str__(self):
        return f"Driver: {self.user.get_full_name()} ({self.driver_id})"


class ParentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='parent_profile')
    address = models.TextField(blank=True)

    def __str__(self):
        return f"Parent: {self.user.get_full_name()}"
