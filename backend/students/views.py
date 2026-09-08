from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Student
from .serializers import StudentSerializer


class ListStudentView(generics.ListAPIView):
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Student.objects.select_related('parent', 'assigned_bus', 'assigned_route')
        bus_id = self.request.query_params.get('bus')
        if bus_id:
            qs = qs.filter(assigned_bus_id=bus_id)
        route_id = self.request.query_params.get('route')
        if route_id:
            qs = qs.filter(assigned_route_id=route_id)
        return qs


class RetrieveStudentView(generics.RetrieveAPIView):
    queryset = Student.objects.select_related('parent', 'assigned_bus', 'assigned_route')
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]
