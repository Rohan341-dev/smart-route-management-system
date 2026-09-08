from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from .models import DriverAlert, SOSAlert
from .serializers import DriverAlertSerializer, SOSAlertSerializer
from notifications.models import Notification


class ListAlertView(generics.ListAPIView):
    serializer_class = DriverAlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = DriverAlert.objects.select_related('driver', 'bus')
        alert_type = self.request.query_params.get('type')
        if alert_type:
            qs = qs.filter(alert_type=alert_type)
        severity = self.request.query_params.get('severity')
        if severity:
            qs = qs.filter(severity=severity)
        acknowledged = self.request.query_params.get('acknowledged')
        if acknowledged is not None:
            qs = qs.filter(acknowledged=acknowledged.lower() == 'true')
        return qs


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def acknowledge_alert(request, pk):
    alert = get_object_or_404(DriverAlert, pk=pk)
    alert.acknowledged = True
    alert.save(update_fields=['acknowledged'])
    return Response(DriverAlertSerializer(alert).data)


class TriggerEmergencyView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        vehicle_id = request.data.get('vehicle_id')
        driver_id = request.data.get('driver_id')
        lat = request.data.get('lat', 0)
        lng = request.data.get('lng', 0)
        reason = request.data.get('reason', '')

        sos = SOSAlert.objects.create(
            vehicle_id=vehicle_id,
            driver_id=driver_id,
            lat=lat,
            lng=lng,
            reason=reason,
            status='active',
        )

        # Notify all admins
        from accounts.models import User
        admins = User.objects.filter(role='admin')
        for admin_user in admins:
            Notification.objects.create(
                title='SOS Alert Triggered',
                message=f'Emergency SOS triggered by driver. Reason: {reason}',
                type='safety',
                severity='critical',
                recipient=admin_user,
                bus_id=vehicle_id,
            )

        return Response(
            SOSAlertSerializer(sos).data,
            status=status.HTTP_201_CREATED,
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_emergency(request, pk):
    sos = get_object_or_404(SOSAlert, pk=pk)
    sos.status = 'responded'
    sos.save(update_fields=['status', 'updated_at'])
    return Response(SOSAlertSerializer(sos).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resolve_emergency(request, pk):
    sos = get_object_or_404(SOSAlert, pk=pk)
    sos.status = 'resolved'
    sos.save(update_fields=['status', 'updated_at'])
    return Response(SOSAlertSerializer(sos).data)
