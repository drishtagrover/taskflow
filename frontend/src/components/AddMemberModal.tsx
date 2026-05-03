import { useState, FormEvent } from 'react';
import api from '../api';
import { Project } from '../types';

interface Props {
  projectId: string;
  onClose: () => void;
  onAdded: (project: Project) => void;
}

export default function AddMemberModal({ projectId, onClose, onAdded }: Props) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post<Project>(`/projects/${projectId}/members`, { email, role });
      onAdded(res.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <h2 className="modal-title">Add Team Member</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input className="form-input" type="email" placeholder="colleague@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required autoFocus />
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>User must have an account on TaskFlow</span>
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-input" value={role} onChange={(e) => setRole(e.target.value as 'member' | 'admin')}>
              <option value="member">Member — can view and manage tasks</option>
              <option value="admin">Admin — full project control</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
