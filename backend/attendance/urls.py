from django.urls import path
from . import views

urlpatterns = [
    path('', views.ListAttendanceView.as_view(), name='attendance-list'),
    path('scan/', views.ScanStudentQRView.as_view(), name='attendance-scan'),
]
