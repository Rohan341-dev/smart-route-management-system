from django.urls import path
from . import views

urlpatterns = [
    path('', views.ListStudentView.as_view(), name='student-list'),
    path('<int:pk>/', views.RetrieveStudentView.as_view(), name='student-detail'),
]
