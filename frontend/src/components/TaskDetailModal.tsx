import { useState } from 'react';
import { format } from 'date-fns';
import { X, Trash2 } from 'lucide-react';
import api from '../api';
import PriorityIcon from './PriorityIcon';
import { Task, ProjectMember } from '../types';

interface Props {
  task: Task;
  members: ProjectMember[];
  isAdmin: boolean;
  onClose: () => void;
  onUpdated: (task: Task) => void;
  onDeleted: (id: string) => void;
}

export default function TaskDetailModal({ task, members, isAdmin, onClose, onUpdated, onDeleted }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    assignee: task.assignee?.id || '',
    dueDate: task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.put<Task>(`/tasks/${task.id}`, {
        ...form, assignee: form.assignee || null, dueDate: form.dueDate || null,
      });
      onUpdated(res.data);
      setEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Update failed');
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${task.id}`);
      onDeleted(task.id);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleStatusChange = async (status: Task['status']) => {
    try {
      const res = await api.put<Task>(`/tasks/${task.id}`, { status });
      onUpdated(res.data);
    } catch {}
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>{task.project?.identifier}-{task.task_number}</span>
            </div>
            {editing ? (
              <input className="form-input" style={{ fontSize: 16 }} value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            ) : (
              <h2 style={{ fontSize: 17, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>{task.title}</h2>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-danger btn-sm btn-icon" onClick={handleDelete} title="Delete">
              <Trash2 size={13} />
            </button>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><X size={14} /></button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input" value={editing ? form.status : task.status}
              onChange={(e) => editing
                ? setForm((f) => ({ ...f, status: e.target.value as Task['status'] }))
                : handleStatusChange(e.target.value as Task['status'])}>
              {(['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled'] as Task['status'][]).map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Priority</label>
            {editing ? (
              <select className="form-input" value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Task['priority'] }))}>
                {(['none', 'urgent', 'high', 'medium', 'low'] as Task['priority'][]).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 9 }}>
                <PriorityIcon priority={task.priority} />
                <span style={{ fontSize: 13, color: 'var(--text2)', textTransform: 'capitalize' }}>{task.priority}</span>
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Assignee</label>
            {editing ? (
              <select className="form-input" value={form.assignee}
                onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}>
                <option value="">Unassigned</option>
                {members?.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
              </select>
            ) : (
              <div style={{ paddingTop: 9, fontSize: 13, color: 'var(--text2)' }}>
                {task.assignee ? task.assignee.name : <span style={{ color: 'var(--text3)' }}>Unassigned</span>}
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            {editing ? (
              <input type="date" className="form-input" value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
            ) : (
              <div style={{ paddingTop: 9, fontSize: 13, color: task.due_date ? 'var(--text2)' : 'var(--text3)' }}>
                {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'No due date'}
              </div>
            )}
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Description</label>
          {editing ? (
            <textarea className="form-input" value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4} placeholder="Add description..." />
          ) : (
            <div style={{ padding: '9px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: task.description ? 'var(--text2)' : 'var(--text3)', minHeight: 60, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {task.description || 'No description'}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>Created by {task.created_by?.name}</span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>·</span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{format(new Date(task.created_at), 'MMM d, yyyy')}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {editing ? (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={loading}>
                  {loading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : 'Save'}
                </button>
              </>
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
