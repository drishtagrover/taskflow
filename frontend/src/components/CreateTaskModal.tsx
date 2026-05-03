import { useState, FormEvent } from 'react';
import api from '../api';
import { Task, ProjectMember } from '../types';

interface Props {
  projectId: string;
  members: ProjectMember[];
  onClose: () => void;
  onCreated: (task: Task) => void;
}

export default function CreateTaskModal({ projectId, members, onClose, onCreated }: Props) {
  const [form, setForm] = useState({ title: '', description: '', assignee: '', status: 'todo' as Task['status'], priority: 'none' as Task['priority'], dueDate: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const payload = { ...form, projectId, assignee: form.assignee || null, dueDate: form.dueDate || null };
      const res = await api.post<Task>('/tasks/', payload);
      onCreated(res.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">New Task</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" placeholder="Task title" value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" placeholder="Add details..." value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Task['status'] }))}>
                {['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled'].map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Task['priority'] }))}>
                {['none', 'urgent', 'high', 'medium', 'low'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select className="form-input" value={form.assignee} onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}>
                <option value="">Unassigned</option>
                {members?.map((m) => (
                  <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
