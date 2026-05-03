from django.urls import path
from api.views.tasks import (
    ProjectTasksView, MyTasksView, OverdueTasksView,
    TaskListCreateView, TaskDetailView
)

urlpatterns = [
    path('', TaskListCreateView.as_view()),
    path('my-tasks', MyTasksView.as_view()),
    path('overdue', OverdueTasksView.as_view()),
    path('project/<uuid:project_id>', ProjectTasksView.as_view()),
    path('<uuid:pk>', TaskDetailView.as_view()),
]
