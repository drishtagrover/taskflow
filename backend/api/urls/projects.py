from django.urls import path
from api.views.projects import ProjectListCreateView, ProjectDetailView, ProjectMembersView

urlpatterns = [
    path('', ProjectListCreateView.as_view()),
    path('<uuid:pk>', ProjectDetailView.as_view()),
    path('<uuid:pk>/members', ProjectMembersView.as_view()),
]
