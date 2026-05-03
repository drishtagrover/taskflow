from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from ..serializers import RegisterSerializer, UserSerializer


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = get_tokens_for_user(user)
            return Response({
                'token': tokens['access'],
                'refresh': tokens['refresh'],
                'user': UserSerializer(user).data,
            }, status=status.HTTP_201_CREATED)
        return Response({'message': list(serializer.errors.values())[0][0]}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from django.contrib.auth import authenticate
        email = request.data.get('email', '').lower()
        password = request.data.get('password', '')
        user = authenticate(request, username=email, password=password)
        if not user:
            return Response({'message': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
        tokens = get_tokens_for_user(user)
        return Response({
            'token': tokens['access'],
            'refresh': tokens['refresh'],
            'user': UserSerializer(user).data,
        })


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
