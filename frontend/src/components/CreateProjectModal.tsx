import { useState, FormEvent } from 'react';
import api from '../api';
import { Project } from '../types';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#ef4444'];

interface Props {
  onClose: () => void;
  onCreated: (project: Project) => void;
}

export default function CreateProjectModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({ name: '', description: '', identifier: '', color: COLORS[0] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const autoIdentifier = (name: string) =>
    name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 5) || name.slice(0, 4).toUpperCase();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm((f) => ({ ...f, name, identifier: f.identifier || autoIdentifier(name) }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post<Project>('/projects/', form);
      onCreated(res.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">New Project</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input className="form-input" placeholder="e.g. Website Redesign" value={form.name} onChange={handleNameChange} required />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Identifier *</label>
              <input className="form-input font-mono" placeholder="WEB" value={form.identifier}
                onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value.toUpperCase().slice(0, 5) }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 6 }}>
                {COLORS.map((c) => (
                  <div key={c} onClick={() => setForm((f) => ({ ...f, color: c }))}
                    style={{ width: 24, height: 24, borderRadius: 6, background: c, cursor: 'pointer',
                      border: form.color === c ? '2px solid white' : '2px solid transparent',
                      transform: form.color === c ? 'scale(1.15)' : 'none' }} />
                ))}
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" placeholder="What's this project about?" value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
