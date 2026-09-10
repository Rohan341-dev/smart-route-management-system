from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
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
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        route_status = self.request.query_params.get('status')
        if route_status:
            qs = qs.filter(status=route_status)
        return qs


class RetrieveRouteView(generics.RetrieveAPIView):
    queryset = Route.objects.prefetch_related('stops')
    serializer_class = RouteSerializer
    permission_classes = [AllowAny]


class CreateRouteView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        name = request.data.get('name', '').strip()
        if not name:
            return Response({'error': 'Route name is required'}, status=status.HTTP_400_BAD_REQUEST)

        stops_data = request.data.get('stops', [])
        distance = request.data.get('distance', 0)
        estimated_time = request.data.get('estimated_time', 0)
        total_students = request.data.get('total_students', 0)

        route = Route.objects.create(
            name=name,
            distance=distance,
            estimated_time=estimated_time,
            total_students=total_students,
            status='active',
        )

        for i, stop_data in enumerate(stops_data):
            RouteStop.objects.create(
                route=route,
                name=stop_data.get('name', f'Stop {i+1}'),
                lat=stop_data.get('lat', 0),
                lng=stop_data.get('lng', 0),
                time=stop_data.get('time'),
                students_count=stop_data.get('students_count', 0),
                order=stop_data.get('order', i + 1),
                stop_type=stop_data.get('stop_type', 'pickup'),
            )

        route.refresh_from_db()
        return Response(RouteSerializer(route).data, status=status.HTTP_201_CREATED)


class UpdateRouteView(APIView):
    permission_classes = [AllowAny]

    def put(self, request, pk):
        route = get_object_or_404(Route, pk=pk)

        route.name = request.data.get('name', route.name)
        route.distance = request.data.get('distance', route.distance)
        route.estimated_time = request.data.get('estimated_time', route.estimated_time)
        route.total_students = request.data.get('total_students', route.total_students)
        route.status = request.data.get('status', route.status)
        route.save()

        # Replace stops if provided
        stops_data = request.data.get('stops')
        if stops_data is not None:
            route.stops.all().delete()
            for i, stop_data in enumerate(stops_data):
                RouteStop.objects.create(
                    route=route,
                    name=stop_data.get('name', f'Stop {i+1}'),
                    lat=stop_data.get('lat', 0),
                    lng=stop_data.get('lng', 0),
                    time=stop_data.get('time'),
                    students_count=stop_data.get('students_count', 0),
                    order=stop_data.get('order', i + 1),
                    stop_type=stop_data.get('stop_type', 'pickup'),
                )

        route.refresh_from_db()
        return Response(RouteSerializer(route).data)


class DeleteRouteView(APIView):
    permission_classes = [AllowAny]

    def delete(self, request, pk):
        route = get_object_or_404(Route, pk=pk)
        route.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ListTripView(generics.ListAPIView):
    queryset = Trip.objects.select_related('vehicle', 'driver', 'route')
    serializer_class = TripSerializer
    permission_classes = [AllowAny]

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
    permission_classes = [AllowAny]


class UpdateTripStatusView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
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


class UpdateTripStopView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk, stop_id):
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
