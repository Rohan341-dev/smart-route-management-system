from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/buses/', include('fleet.bus_urls')),
    path('api/drivers/', include('fleet.driver_urls')),
    path('api/routes/', include('routes.urls')),
    path('api/students/', include('students.urls')),
    path('api/attendance/', include('attendance.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/alerts/', include('safety.alert_urls')),
    path('api/emergency/', include('safety.emergency_urls')),
    path('api/trips/', include('routes.trip_urls')),
    path('api/gps/', include('gps.urls')),
]

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({'status': 'ok', 'service': 'smartbus-api'})

urlpatterns += [
    path('api/health/', health_check),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
