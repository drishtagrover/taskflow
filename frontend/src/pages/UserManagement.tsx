import { useState, useEffect, FormEvent } from 'react';
import { Shield, Plus, Trash2, Pencil, X, Check, UserCog } from 'lucide-react';
import api from '../api';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

interface CreateUserForm {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'member';
}

interface EditState {
  userId: string;
  role: 'admin' | 'member';
  name: string;
  password: string;
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateUserForm>({ name: '', email: '', password: '', role: 'member' });
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [editError, setEditError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Redirect non-admins
  if (currentUser?.role !== 'admin') return <Navigate to="/" />;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get<User[]>('/users/admin/users');
      setUsers(res.data);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      const res = await api.post<User>('/users/admin/users', form);
      setUsers((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
      setForm({ name: '', email: '', password: '', role: 'member' });
      setShowCreate(false);
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  const startEdit = (u: User) => {
    setEditState({ userId: u.id, role: u.role, name: u.name, password: '' });
    setEditError('');
  };

  const saveEdit = async () => {
    if (!editState) return;
    setEditError('');
    try {
      const payload: any = { role: editState.role, name: editState.name };
      if (editState.password) payload.password = editState.password;
      const res = await api.put<User>(`/users/admin/users/${editState.userId}`, payload);
      setUsers((prev) => prev.map((u) => (u.id === editState.userId ? res.data : u)));
      setEditState(null);
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await api.delete(`/users/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setDeleteConfirm(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const initials = (name: string) =>
    name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserCog size={22} /> User Management
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>
            Create users, assign roles, and manage access.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowCreate(true); setCreateError(''); }}>
          <Plus size={14} /> New User
        </button>
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <h2 className="modal-title">Create New User</h2>
            {createError && <div className="alert alert-error">{createError}</div>}
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jane Doe" required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jane@company.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 6 characters" required minLength={6} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'member' })}>
                  <option value="member">Member — can access assigned projects</option>
                  <option value="admin">Admin — full system access</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createLoading}>
                  {createLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <span className="spinner" />
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>No users found</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['User', 'Email', 'Role', 'Joined', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isEditing = editState?.userId === u.id;
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', background: isEditing ? 'var(--bg2)' : undefined }}>
                    {/* Name */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: 12, background: 'var(--accent)', flexShrink: 0 }}>
                          {initials(u.name)}
                        </div>
                        {isEditing ? (
                          <input className="form-input" style={{ padding: '4px 8px', fontSize: 13, width: 150 }}
                            value={editState.name} onChange={(e) => setEditState({ ...editState, name: e.target.value })} />
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 500 }}>
                            {u.name}
                            {isSelf && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--text3)', background: 'var(--bg3)', padding: '1px 5px', borderRadius: 4 }}>you</span>}
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Email */}
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text2)' }}>{u.email}</td>
                    {/* Role */}
                    <td style={{ padding: '12px 16px' }}>
                      {isEditing ? (
                        <select className="form-input" style={{ padding: '4px 8px', fontSize: 13, width: 110 }}
                          value={editState.role} onChange={(e) => setEditState({ ...editState, role: e.target.value as 'admin' | 'member' })}>
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                          background: u.role === 'admin' ? 'rgba(139,92,246,0.15)' : 'var(--bg3)',
                          color: u.role === 'admin' ? '#a78bfa' : 'var(--text3)',
                        }}>
                          {u.role === 'admin' && <Shield size={10} />}
                          {u.role === 'admin' ? 'Admin' : 'Member'}
                        </span>
                      )}
                    </td>
                    {/* Joined */}
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text3)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    {/* Actions */}
                    <td style={{ padding: '12px 16px' }}>
                      {isSelf ? (
                        <span style={{ fontSize: 12, color: 'var(--text3)' }}>—</span>
                      ) : isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input className="form-input" type="password" style={{ padding: '4px 8px', fontSize: 12, width: 140 }}
                              placeholder="New password (optional)" value={editState.password}
                              onChange={(e) => setEditState({ ...editState, password: e.target.value })} />
                            <button className="btn btn-icon btn-sm" title="Save" onClick={saveEdit} style={{ color: '#4ade80' }}>
                              <Check size={14} />
                            </button>
                            <button className="btn btn-icon btn-sm" title="Cancel" onClick={() => { setEditState(null); setEditError(''); }}>
                              <X size={14} />
                            </button>
                          </div>
                          {editError && <span style={{ fontSize: 11, color: 'var(--danger)' }}>{editError}</span>}
                        </div>
                      ) : deleteConfirm === u.id ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: 'var(--danger)' }}>Delete?</span>
                          <button className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff', padding: '2px 8px' }}
                            onClick={() => handleDelete(u.id)}>Yes</button>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px' }}
                            onClick={() => setDeleteConfirm(null)}>No</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-icon btn-sm" title="Edit" onClick={() => startEdit(u)}>
                            <Pencil size={13} />
                          </button>
                          <button className="btn btn-icon btn-sm" title="Delete" style={{ color: 'var(--danger)' }}
                            onClick={() => setDeleteConfirm(u.id)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
