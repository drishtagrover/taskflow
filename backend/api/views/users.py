from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from ..models import User
from ..serializers import UserSerializer, CreateUserSerializer


class IsAdminRole:
    """Mixin: only users with role='admin' can proceed."""
    def check_admin(self, request):
        if request.user.role != 'admin':
            return Response({'message': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return None


class UserSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        email = request.query_params.get('email', '')
        if not email:
            return Response({'message': 'Email query required'}, status=status.HTTP_400_BAD_REQUEST)
        users = User.objects.filter(email__icontains=email).exclude(pk=request.user.pk)[:10]
        return Response(UserSerializer(users, many=True).data)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        if name := request.data.get('name'):
            user.name = name
        if 'avatar' in request.data:
            user.avatar = request.data['avatar']
        user.save()
        return Response(UserSerializer(user).data)


class AdminUserListCreateView(IsAdminRole, APIView):
    """Admin only: list all users or create a new user with a role."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        err = self.check_admin(request)
        if err:
            return err
        users = User.objects.all().order_by('name')
        return Response(UserSerializer(users, many=True).data)

    def post(self, request):
        err = self.check_admin(request)
        if err:
            return err
        serializer = CreateUserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(
            {'message': list(serializer.errors.values())[0][0]},
            status=status.HTTP_400_BAD_REQUEST
        )


class AdminUserDetailView(IsAdminRole, APIView):
    """Admin only: update role/name or deactivate a user."""
    permission_classes = [IsAuthenticated]

    def _get_user(self, pk):
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None

    def put(self, request, pk):
        err = self.check_admin(request)
        if err:
            return err
        target = self._get_user(pk)
        if not target:
            return Response({'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        if str(target.pk) == str(request.user.pk):
            return Response({'message': 'Cannot modify your own account here'}, status=status.HTTP_400_BAD_REQUEST)

        if 'role' in request.data:
            if request.data['role'] not in ('admin', 'member'):
                return Response({'message': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)
            target.role = request.data['role']
        if 'name' in request.data:
            target.name = request.data['name']
        if 'is_active' in request.data:
            target.is_active = bool(request.data['is_active'])
        if 'password' in request.data and request.data['password']:
            if len(request.data['password']) < 6:
                return Response({'message': 'Password must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)
            target.set_password(request.data['password'])

        target.save()
        return Response(UserSerializer(target).data)

    def delete(self, request, pk):
        err = self.check_admin(request)
        if err:
            return err
        target = self._get_user(pk)
        if not target:
            return Response({'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        if str(target.pk) == str(request.user.pk):
            return Response({'message': 'Cannot delete your own account'}, status=status.HTTP_400_BAD_REQUEST)
        target.delete()
        return Response({'message': 'User deleted'})

