# TaskFlow — Changes Applied

## 1. PostgreSQL Migration

**Backend `requirements.txt`** — added `psycopg2-binary==2.9.9`

**Backend `taskflow/settings.py`** — database config now reads from env vars:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'taskflow'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}
```

**`.env.example`** — updated with PostgreSQL variables.

### Setup steps
```bash
# Create the database
psql -U postgres -c "CREATE DATABASE taskflow;"

# Copy and fill env file
cp .env.example .env
# Set DB_PASSWORD (and SECRET_KEY) in .env

# Install deps and migrate
pip install -r requirements.txt
python manage.py migrate
```

---

## 2. Role-Based Access Control

### Global roles: `admin` and `member`

A new `role` field (`admin` | `member`, default `member`) was added to the **User model**.

**Who is admin?** The superuser you create with `createsuperuser` gets `role='admin'` automatically. You can also promote any user via the UI.

### Admin capabilities
- See **"User Management"** link in the sidebar
- Create new users with a name, email, password, and role
- Edit any user's name, role, or reset their password
- Delete users

### Member capabilities
- Login normally with email + password
- Access only projects they are a member of (unchanged behaviour)
- Cannot access `/users` — redirected to dashboard

### New API endpoints
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/users/admin/users` | Admin only |
| POST | `/api/users/admin/users` | Admin only |
| PUT | `/api/users/admin/users/<id>` | Admin only |
| DELETE | `/api/users/admin/users/<id>` | Admin only |

### Migration
A migration `0002_user_role.py` is included that adds the `role` column.
Existing users get `member` by default; update your superuser manually if needed:

```bash
python manage.py shell -c "
from api.models import User
User.objects.filter(is_superuser=True).update(role='admin')
"
```

### Frontend changes
- `User` type now includes `role: 'admin' | 'member'`
- Sidebar shows **User Management** link only for admins
- New page `/users` — full user management table with inline edit, role change, password reset, delete

---

## File Summary of Changes

### Backend
- `taskflow/settings.py` — PostgreSQL config
- `requirements.txt` — psycopg2-binary added
- `.env.example` — DB vars added
- `api/models.py` — `role` field on User; UserManager updated
- `api/serializers.py` — `role` in UserSerializer; new `CreateUserSerializer`
- `api/views/users.py` — new `AdminUserListCreateView`, `AdminUserDetailView`
- `api/urls/users.py` — `/admin/users` and `/admin/users/<uuid>` routes
- `api/migrations/0002_user_role.py` — migration for role field

### Frontend
- `src/types/index.ts` — `role` added to User interface
- `src/App.tsx` — `/users` route added
- `src/components/Layout.tsx` — User Management link (admin only)
- `src/pages/UserManagement.tsx` — new page (create, edit, delete users)
