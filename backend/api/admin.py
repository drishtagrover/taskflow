from django.contrib import admin
from .models import User, Project, ProjectMember, Task

admin.site.register(User)
admin.site.register(Project)
admin.site.register(ProjectMember)
admin.site.register(Task)
