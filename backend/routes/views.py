from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Route, RouteStop, Trip
from .serializers import (
    RouteSerializer,
    RouteStopSerializer,
    TripSerializer,
)


class ListRouteView(generics.ListAPIView):
    queryset = Route.objects.prefetch_related('stops')
    serializer_class = RouteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        route_status = self.request.query_params.get('status')
        if route_status:
            qs = qs.filter(status=route_status)
        return qs


class RetrieveRouteView(generics.RetrieveAPIView):
    queryset = Route.objects.prefetch_related('stops')
    serializer_class = RouteSerializer
    permission_classes = [IsAuthenticated]


class ListTripView(generics.ListAPIView):
    queryset = Trip.objects.select_related('vehicle', 'driver', 'route')
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        trip_status = self.request.query_params.get('status')
        if trip_status:
            qs = qs.filter(status=trip_status)
        route_id = self.request.query_params.get('route')
        if route_id:
            qs = qs.filter(route_id=route_id)
        return qs


class RetrieveTripView(generics.RetrieveAPIView):
    queryset = Trip.objects.select_related('vehicle', 'driver', 'route')
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_trip_status(request, pk):
    trip = get_object_or_404(Trip, pk=pk)
    new_status = request.data.get('status')
    if new_status not in dict(Trip.STATUS_CHOICES):
        return Response(
            {'error': 'Invalid status'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    trip.status = new_status
    if new_status == 'in_progress' and not trip.start_time:
        trip.start_time = timezone.now()
    elif new_status == 'completed':
        trip.end_time = timezone.now()

    trip.save(update_fields=['status', 'start_time', 'end_time', 'updated_at'])
    return Response(TripSerializer(trip).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_trip_stop(request, pk, stop_id):
    trip = get_object_or_404(Trip, pk=pk)
    stop = get_object_or_404(RouteStop, pk=stop_id, route=trip.route)

    students_count = request.data.get('students_count')
    if students_count is not None:
        stop.students_count = students_count
        stop.save(update_fields=['students_count'])

    action = request.data.get('action')
    if action == 'pick':
        trip.students_picked_up += (students_count or 0)
    elif action == 'drop':
        trip.students_dropped += (students_count or 0)

    trip.save(update_fields=['students_picked_up', 'students_dropped', 'updated_at'])
    return Response(TripSerializer(trip).data)
