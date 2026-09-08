from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source='student.full_name', read_only=True, default=''
    )

    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'type', 'severity',
            'recipient', 'student', 'student_name', 'bus',
            'read', 'created_at',
        ]
        read_only_fields = ['created_at']
