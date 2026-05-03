from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('api.urls.auth')),
    path('api/projects/', include('api.urls.projects')),
    path('api/tasks/', include('api.urls.tasks')),
    path('api/users/', include('api.urls.users')),
]
