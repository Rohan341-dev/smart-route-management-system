from django.urls import path
from . import views

urlpatterns = [
    path('', views.ListStudentView.as_view(), name='student-list'),
    path('create/', views.CreateStudentView.as_view(), name='student-create'),
    path('<int:pk>/', views.RetrieveStudentView.as_view(), name='student-detail'),
    path('<int:pk>/update/', views.UpdateStudentView.as_view(), name='student-update'),
    path('<int:pk>/delete/', views.DeleteStudentView.as_view(), name='student-delete'),
]
