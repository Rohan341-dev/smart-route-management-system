from datetime import timedelta
from decimal import Decimal

from django.utils import timezone as django_timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from fleet.models import Bus
from .models import GPSDevice, BusLocation, GPSHistory, RouteDeviation
from .serializers import (
    GPSDeviceSerializer, BusLocationSerializer,
    GPSHistorySerializer, RouteDeviationSerializer,
)
from .services.sinotrack_service import get_sinotrack_service


# ─── GPS Device Management ──────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def gps_device_list_create(request):
    if request.method == 'GET':
        devices = GPSDevice.objects.select_related('assigned_bus').all()
        serializer = GPSDeviceSerializer(devices, many=True)
        return Response(serializer.data)

    serializer = GPSDeviceSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def gps_device_detail(request, pk):
    try:
        device = GPSDevice.objects.select_related('assigned_bus').get(pk=pk)
    except GPSDevice.DoesNotExist:
        return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = GPSDeviceSerializer(device)
        return Response(serializer.data)

    if request.method == 'DELETE':
        device.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = GPSDeviceSerializer(device, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def gps_device_assign(request, pk):
    """Assign a GPS device to a bus."""
    try:
        device = GPSDevice.objects.get(pk=pk)
    except GPSDevice.DoesNotExist:
        return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)

    bus_id = request.data.get('bus_id')
    if bus_id:
        try:
            bus = Bus.objects.get(pk=bus_id)
        except Bus.DoesNotExist:
            return Response({'error': 'Bus not found'}, status=status.HTTP_404_NOT_FOUND)

        # Unassign any other device from this bus
        GPSDevice.objects.filter(assigned_bus=bus).exclude(pk=pk).update(assigned_bus=None)
        device.assigned_bus = bus
        device.save()
    else:
        device.assigned_bus = None
        device.save()

    serializer = GPSDeviceSerializer(device)
    return Response(serializer.data)


# ─── SinoTrack Sync ──────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_sinotrack_devices(request):
    """Fetch devices from SinoTrack and create/update local GPSDevice records."""
    service = get_sinotrack_service()
    service.authenticate()
    devices = service.fetch_devices()

    if not devices:
        # Try fetching from local config if SinoTrack API is unreachable
        return Response({
            'message': 'No devices returned from SinoTrack. Check API credentials.',
            'synced': 0,
        })

    synced = 0
    for device_data in devices:
        device, created = GPSDevice.objects.update_or_create(
            device_identifier=device_data['device_id'],
            defaults={
                'device_name': device_data['device_name'],
                'device_model': device_data['device_model'],
                'imei': device_data.get('imei', ''),
                'provider': 'sinotrack',
                'status': device_data['status'],
                'last_seen': device_data.get('last_seen'),
            },
        )
        synced += 1

    return Response({'message': f'Synced {synced} devices', 'synced': synced})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_sinotrack_locations(request):
    """
    Fetch latest GPS locations from SinoTrack for all configured devices.
    Updates BusLocation (latest), GPSHistory (archive), and Bus model GPS fields.
    """
    service = get_sinotrack_service()
    service.authenticate()
    locations = service.fetch_all_locations()

    if not locations:
        return Response({
            'message': 'No locations returned from SinoTrack.',
            'synced': 0,
        })

    synced = 0
    for loc_data in locations:
        try:
            device = GPSDevice.objects.select_related('assigned_bus').get(
                device_identifier=loc_data['device_id']
            )
        except GPSDevice.DoesNotExist:
            logger.warning(f"GPS device not found: {loc_data['device_id']}")
            continue

        if not device.assigned_bus:
            continue

        bus = device.assigned_bus
        recorded_at = loc_data.get('last_updated', django_timezone.now())

        # Update Bus model GPS fields
        bus.gps_lat = Decimal(str(loc_data['latitude']))
        bus.gps_lng = Decimal(str(loc_data['longitude']))
        bus.speed = Decimal(str(loc_data['speed']))
        bus.heading = Decimal(str(loc_data['heading']))
        bus.save(update_fields=['gps_lat', 'gps_lng', 'speed', 'heading', 'updated_at'])

        # Create BusLocation (latest snapshot)
        BusLocation.objects.create(
            bus=bus,
            gps_device=device,
            latitude=Decimal(str(loc_data['latitude'])),
            longitude=Decimal(str(loc_data['longitude'])),
            speed=Decimal(str(loc_data['speed'])),
            heading=Decimal(str(loc_data['heading'])),
            gps_status=loc_data['gps_status'],
            gsm_signal=loc_data['gsm_signal'],
            recorded_at=recorded_at,
        )

        # Store in GPSHistory (archive)
        GPSHistory.objects.create(
            bus=bus,
            gps_device=device,
            latitude=Decimal(str(loc_data['latitude'])),
            longitude=Decimal(str(loc_data['longitude'])),
            speed=Decimal(str(loc_data['speed'])),
            heading=Decimal(str(loc_data['heading'])),
            recorded_at=recorded_at,
        )

        # Update device last_seen
        device.last_seen = recorded_at
        device.save(update_fields=['last_seen'])

        synced += 1

    return Response({'message': f'Synced {synced} locations', 'synced': synced})


# ─── Live GPS Endpoints ──────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bus_latest_location(request, bus_id):
    """Get the latest GPS location for a specific bus."""
    try:
        bus = Bus.objects.get(pk=bus_id)
    except Bus.DoesNotExist:
        return Response({'error': 'Bus not found'}, status=status.HTTP_404_NOT_FOUND)

    location = BusLocation.objects.filter(bus=bus).first()
    if not location:
        return Response({
            'bus_id': bus.bus_number,
            'latitude': float(bus.gps_lat),
            'longitude': float(bus.gps_lng),
            'speed': float(bus.speed),
            'heading': float(bus.heading),
            'gps_status': 'unknown',
            'last_updated': None,
        })

    serializer = BusLocationSerializer(location)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def fleet_latest_locations(request):
    """
    Get latest GPS location for ALL active buses.
    Used by admin LiveFleet map.
    """
    devices = GPSDevice.objects.filter(
        status='active',
        assigned_bus__isnull=False,
    ).select_related('assigned_bus')

    locations = []
    for device in devices:
        bus = device.assigned_bus
        latest = BusLocation.objects.filter(bus=bus).first()
        if latest:
            locations.append({
                'device_id': device.device_identifier,
                'bus_id': bus.bus_number,
                'bus_db_id': bus.pk,
                'latitude': float(latest.latitude),
                'longitude': float(latest.longitude),
                'speed': float(latest.speed),
                'heading': float(latest.heading),
                'gps_status': latest.gps_status,
                'gsm_signal': latest.gsm_signal,
                'last_updated': latest.recorded_at.isoformat() if latest.recorded_at else None,
                'bus_status': bus.status,
                'current_students': bus.current_students,
                'capacity': bus.capacity,
            })
        else:
            locations.append({
                'device_id': device.device_identifier,
                'bus_id': bus.bus_number,
                'bus_db_id': bus.pk,
                'latitude': float(bus.gps_lat),
                'longitude': float(bus.gps_lng),
                'speed': 0,
                'heading': 0,
                'gps_status': 'unknown',
                'gsm_signal': 'unknown',
                'last_updated': None,
                'bus_status': bus.status,
                'current_students': bus.current_students,
                'capacity': bus.capacity,
            })

    return Response(locations)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def parent_bus_location(request):
    """
    Get GPS location ONLY for the bus assigned to the parent's child.
    Scoped: parent can never see all fleet GPS data.
    """
    user = request.user
    from students.models import Student
    children = Student.objects.filter(parent=user)
    if not children.exists():
        return Response({'error': 'No children found'}, status=status.HTTP_404_NOT_FOUND)

    child_bus_ids = children.values_list('assigned_bus_id', flat=True).distinct()
    buses = Bus.objects.filter(pk__in=child_bus_ids)

    result = []
    for bus in buses:
        location = BusLocation.objects.filter(bus=bus).first()
        result.append({
            'bus_id': bus.bus_number,
            'bus_db_id': bus.pk,
            'latitude': float(location.latitude) if location else float(bus.gps_lat),
            'longitude': float(location.longitude) if location else float(bus.gps_lng),
            'speed': float(location.speed) if location else float(bus.speed),
            'heading': float(location.heading) if location else float(bus.heading),
            'gps_status': location.gps_status if location else 'unknown',
            'last_updated': location.recorded_at.isoformat() if location and location.recorded_at else None,
            'bus_status': bus.status,
            'current_students': bus.current_students,
            'capacity': bus.capacity,
        })

    return Response(result)


# ─── GPS History ─────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def gps_history(request, bus_id):
    """
    Get GPS history for a bus within a date range.
    Query params: start_date, end_date (ISO format)
    Used for trip history playback.
    """
    try:
        bus = Bus.objects.get(pk=bus_id)
    except Bus.DoesNotExist:
        return Response({'error': 'Bus not found'}, status=status.HTTP_404_NOT_FOUND)

    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')

    queryset = GPSHistory.objects.filter(bus=bus)

    if start_date:
        queryset = queryset.filter(recorded_at__gte=start_date)
    if end_date:
        queryset = queryset.filter(recorded_at__lte=end_date)

    # Default to today if no dates provided
    if not start_date and not end_date:
        today = django_timezone.now().date()
        queryset = queryset.filter(recorded_at__date=today)

    queryset = queryset[:1000]  # Limit to prevent overload

    serializer = GPSHistorySerializer(queryset, many=True)
    return Response(serializer.data)


# ─── Route Deviation ─────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def route_deviation_list(request):
    """List all route deviations (unacknowledged first)."""
    deviations = RouteDeviation.objects.select_related('bus', 'route').all()[:50]
    serializer = RouteDeviationSerializer(deviations, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def acknowledge_deviation(request, pk):
    """Acknowledge a route deviation."""
    try:
        deviation = RouteDeviation.objects.get(pk=pk)
    except RouteDeviation.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    deviation.acknowledged = True
    deviation.save(update_fields=['acknowledged'])
    return Response({'status': 'acknowledged'})


# ─── Utility ─────────────────────────────────────────────────────────

import logging
logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def gps_health_check(request):
    """Check SinoTrack API connectivity and device status."""
    service = get_sinotrack_service()
    credentials_configured = bool(service.config.get_username() and service.config.get_api_key())

    if not credentials_configured:
        return Response({
            'status': 'demo_mode',
            'message': 'SinoTrack credentials not configured. Using demo GPS data.',
            'devices_configured': GPSDevice.objects.count(),
        })

    authenticated = service.authenticate()
    devices = service.fetch_devices() if authenticated else []

    return Response({
        'status': 'connected' if authenticated else 'auth_failed',
        'message': 'SinoTrack connected' if authenticated else 'SinoTrack authentication failed',
        'devices_online': len([d for d in devices if d.get('status') == 'active']),
        'devices_total': len(devices),
    })
