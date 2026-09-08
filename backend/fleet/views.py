from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Bus, DriverAssignment
from .serializers import BusSerializer, DriverAssignmentSerializer


class ListBusView(generics.ListAPIView):
    queryset = Bus.objects.all()
    serializer_class = BusSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        bus_status = self.request.query_params.get('status')
        if bus_status:
            qs = qs.filter(status=bus_status)
        return qs


class RetrieveBusView(generics.RetrieveAPIView):
    queryset = Bus.objects.all()
    serializer_class = BusSerializer
    permission_classes = [IsAuthenticated]


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_bus_gps(request, pk):
    bus = get_object_or_404(Bus, pk=pk)
    lat = request.data.get('gps_lat')
    lng = request.data.get('gps_lng')
    speed = request.data.get('speed', bus.speed)
    heading = request.data.get('heading', bus.heading)

    if lat is not None:
        bus.gps_lat = lat
    if lng is not None:
        bus.gps_lng = lng
    bus.speed = speed
    bus.heading = heading
    bus.save(update_fields=['gps_lat', 'gps_lng', 'speed', 'heading', 'updated_at'])

    return Response(BusSerializer(bus).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_bus_status(request, pk):
    bus = get_object_or_404(Bus, pk=pk)
    new_status = request.data.get('status')
    if new_status not in dict(Bus.STATUS_CHOICES):
        return Response(
            {'error': 'Invalid status'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    bus.status = new_status
    bus.save(update_fields=['status', 'updated_at'])
    return Response(BusSerializer(bus).data)


class ListDriverView(generics.ListAPIView):
    serializer_class = DriverAssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DriverAssignment.objects.select_related('driver', 'bus', 'route')


class RetrieveDriverView(generics.RetrieveAPIView):
    serializer_class = DriverAssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return get_object_or_404(
            DriverAssignment.objects.select_related('driver', 'bus', 'route'),
            pk=self.kwargs['pk'],
        )
