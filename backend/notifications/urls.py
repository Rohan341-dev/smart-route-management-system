from django.urls import path
from . import views

urlpatterns = [
    path('', views.ListNotificationView.as_view(), name='notification-list'),
    path('<int:pk>/read/', views.mark_notification_read, name='notification-read'),
]
