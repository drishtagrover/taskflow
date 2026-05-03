from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from ..models import Project, ProjectMember, User
from ..serializers import ProjectSerializer


class ProjectListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        projects = Project.objects.filter(members__user=request.user).prefetch_related(
            'members__user', 'created_by'
        )
        return Response(ProjectSerializer(projects, many=True).data)

    def post(self, request):
        name = request.data.get('name', '').strip()
        identifier = request.data.get('identifier', '').strip().upper()
        if not name or not identifier:
            return Response({'message': 'Name and identifier required'}, status=status.HTTP_400_BAD_REQUEST)
        if Project.objects.filter(identifier=identifier).exists():
            return Response({'message': 'Identifier already taken'}, status=status.HTTP_400_BAD_REQUEST)

        project = Project.objects.create(
            name=name,
            description=request.data.get('description', ''),
            identifier=identifier,
            color=request.data.get('color', '#6366f1'),
            created_by=request.user,
        )
        ProjectMember.objects.create(project=project, user=request.user, role='admin')
        project.refresh_from_db()
        return Response(ProjectSerializer(project).data, status=status.HTTP_201_CREATED)


class ProjectDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_project(self, pk, user):
        try:
            return Project.objects.prefetch_related('members__user', 'created_by').get(
                pk=pk, members__user=user
            )
        except Project.DoesNotExist:
            return None

    def get(self, request, pk):
        project = self._get_project(pk, request.user)
        if not project:
            return Response({'message': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ProjectSerializer(project).data)

    def put(self, request, pk):
        project = self._get_project(pk, request.user)
        if not project:
            return Response({'message': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
        member = project.members.get(user=request.user)
        if member.role != 'admin':
            return Response({'message': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)

        for field in ['name', 'description', 'color', 'status']:
            if field in request.data:
                setattr(project, field, request.data[field])
        project.save()
        return Response(ProjectSerializer(project).data)

    def delete(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({'message': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        if project.created_by != request.user:
            return Response({'message': 'Only creator can delete'}, status=status.HTTP_403_FORBIDDEN)
        project.delete()
        return Response({'message': 'Project deleted'})


class ProjectMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            project = Project.objects.prefetch_related('members__user').get(pk=pk, members__user=request.user)
        except Project.DoesNotExist:
            return Response({'message': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

        member = project.members.get(user=request.user)
        if member.role != 'admin':
            return Response({'message': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)

        email = request.data.get('email', '').lower()
        role = request.data.get('role', 'member')
        try:
            user_to_add = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if project.members.filter(user=user_to_add).exists():
            return Response({'message': 'Already a member'}, status=status.HTTP_400_BAD_REQUEST)

        ProjectMember.objects.create(project=project, user=user_to_add, role=role)
        project.refresh_from_db()
        return Response(ProjectSerializer(project).data)
