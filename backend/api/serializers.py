from rest_framework import serializers
from .models import User, Project, ProjectMember, Task


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'avatar', 'role', 'created_at']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['name', 'email', 'password']

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError('Email already in use')
        return value.lower()

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class CreateUserSerializer(serializers.ModelSerializer):
    """Used by admins to create users with explicit role and password."""
    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(choices=['admin', 'member'], default='member')

    class Meta:
        model = User
        fields = ['name', 'email', 'password', 'role']

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError('Email already in use')
        return value.lower()

    def create(self, validated_data):
        role = validated_data.pop('role', 'member')
        return User.objects.create_user(role=role, **validated_data)


class ProjectMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ProjectMember
        fields = ['user', 'role', 'joined_at']


class ProjectSerializer(serializers.ModelSerializer):
    members = ProjectMemberSerializer(many=True, read_only=True)
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'identifier', 'color', 'status',
                  'members', 'created_by', 'created_at', 'updated_at']


class TaskSerializer(serializers.ModelSerializer):
    assignee = UserSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    project = serializers.SerializerMethodField()
    assignee_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'project', 'assignee', 'assignee_id',
                  'created_by', 'status', 'priority', 'due_date', 'task_number',
                  'created_at', 'updated_at']

    def get_project(self, obj):
        return {
            'id': str(obj.project.id),
            'name': obj.project.name,
            'identifier': obj.project.identifier,
            'color': obj.project.color,
        }


class TaskCreateSerializer(serializers.ModelSerializer):
    assignee_id = serializers.UUIDField(required=False, allow_null=True)
    project_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Task
        fields = ['title', 'description', 'project_id', 'assignee_id',
                  'status', 'priority', 'due_date']
