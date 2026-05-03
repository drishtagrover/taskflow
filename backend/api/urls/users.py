from django.urls import path
from api.views.users import UserSearchView, UserProfileView, AdminUserListCreateView, AdminUserDetailView

urlpatterns = [
    path('search', UserSearchView.as_view()),
    path('profile', UserProfileView.as_view()),
    # Admin-only user management
    path('admin/users', AdminUserListCreateView.as_view()),
    path('admin/users/<uuid:pk>', AdminUserDetailView.as_view()),
]
