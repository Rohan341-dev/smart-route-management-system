from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Student
from .serializers import StudentSerializer, CreateStudentSerializer


class ListStudentView(generics.ListAPIView):
    serializer_class = StudentSerializer
    permission_classes = [AllowAny]

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
    permission_classes = [AllowAny]


class CreateStudentView(generics.CreateAPIView):
    serializer_class = CreateStudentSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = serializer.save()
        read_serializer = StudentSerializer(student)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)


class UpdateStudentView(generics.UpdateAPIView):
    queryset = Student.objects.select_related('parent', 'assigned_bus', 'assigned_route')
    serializer_class = StudentSerializer
    permission_classes = [AllowAny]


class DeleteStudentView(generics.DestroyAPIView):
    queryset = Student.objects.all()
    permission_classes = [AllowAny]
