from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from ..models import Task, Project, User
from ..serializers import TaskSerializer


def check_project_access(project_id, user):
    try:
        return Project.objects.get(pk=project_id, members__user=user)
    except Project.DoesNotExist:
        return None


class ProjectTasksView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        project = check_project_access(project_id, request.user)
        if not project:
            return Response({'message': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        tasks = Task.objects.filter(project=project).select_related('assignee', 'created_by', 'project')
        if s := request.query_params.get('status'):
            tasks = tasks.filter(status=s)
        if p := request.query_params.get('priority'):
            tasks = tasks.filter(priority=p)
        if a := request.query_params.get('assignee'):
            tasks = tasks.filter(assignee_id=a)

        return Response(TaskSerializer(tasks, many=True).data)


class MyTasksView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tasks = Task.objects.filter(assignee=request.user).select_related(
            'assignee', 'created_by', 'project'
        ).order_by('due_date', '-created_at')
        return Response(TaskSerializer(tasks, many=True).data)


class OverdueTasksView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_projects = Project.objects.filter(members__user=request.user)
        tasks = Task.objects.filter(
            project__in=user_projects,
            due_date__lt=timezone.now().date(),
        ).exclude(status__in=['done', 'cancelled']).select_related(
            'assignee', 'created_by', 'project'
        ).order_by('due_date')
        return Response(TaskSerializer(tasks, many=True).data)


class TaskListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        project_id = request.data.get('projectId') or request.data.get('project_id')
        title = request.data.get('title', '').strip()
        if not title or not project_id:
            return Response({'message': 'Title and project required'}, status=status.HTTP_400_BAD_REQUEST)

        project = check_project_access(project_id, request.user)
        if not project:
            return Response({'message': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        assignee = None
        if assignee_id := request.data.get('assignee'):
            try:
                assignee = User.objects.get(pk=assignee_id)
            except User.DoesNotExist:
                pass

        task = Task.objects.create(
            title=title,
            description=request.data.get('description', ''),
            project=project,
            assignee=assignee,
            created_by=request.user,
            status=request.data.get('status', 'todo'),
            priority=request.data.get('priority', 'none'),
            due_date=request.data.get('dueDate') or request.data.get('due_date') or None,
        )
        return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)


class TaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_task(self, pk, user):
        try:
            task = Task.objects.select_related('assignee', 'created_by', 'project').get(pk=pk)
            if not task.project.members.filter(user=user).exists():
                return None, 'forbidden'
            return task, None
        except Task.DoesNotExist:
            return None, 'not_found'

    def get(self, request, pk):
        task, err = self._get_task(pk, request.user)
        if err == 'not_found':
            return Response({'message': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)
        if err == 'forbidden':
            return Response({'message': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        return Response(TaskSerializer(task).data)

    def put(self, request, pk):
        task, err = self._get_task(pk, request.user)
        if err:
            return Response({'message': 'Not found or access denied'}, status=status.HTTP_404_NOT_FOUND)

        fields_map = {
            'title': 'title', 'description': 'description',
            'status': 'status', 'priority': 'priority',
        }
        for req_key, model_key in fields_map.items():
            if req_key in request.data:
                setattr(task, model_key, request.data[req_key])

        due = request.data.get('dueDate') or request.data.get('due_date')
        if 'dueDate' in request.data or 'due_date' in request.data:
            task.due_date = due or None

        if 'assignee' in request.data:
            assignee_id = request.data.get('assignee')
            if assignee_id:
                try:
                    task.assignee = User.objects.get(pk=assignee_id)
                except User.DoesNotExist:
                    task.assignee = None
            else:
                task.assignee = None

        task.save()
        task.refresh_from_db()
        return Response(TaskSerializer(task).data)

    def delete(self, request, pk):
        task, err = self._get_task(pk, request.user)
        if err:
            return Response({'message': 'Not found or access denied'}, status=status.HTTP_404_NOT_FOUND)

        member = task.project.members.filter(user=request.user).first()
        if not member:
            return Response({'message': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        if member.role != 'admin' and task.created_by != request.user:
            return Response({'message': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

        task.delete()
        return Response({'message': 'Task deleted'})
