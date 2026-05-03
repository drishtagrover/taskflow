import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban } from 'lucide-react';
import api from '../api';
import CreateProjectModal from '../components/CreateProjectModal';
import { format } from 'date-fns';
import { Project } from '../types';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get<Project[]>('/projects').then((r) => setProjects(r.data)).finally(() => setLoading(false));
  }, []);

  const initials = (name: string) =>
    name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div className="spinner" />
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} in your workspace</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> New Project
        </button>
      </div>

      <div className="page-body">
        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FolderKanban size={40} style={{ opacity: 0.3 }} /></div>
            <h3>No projects yet</h3>
            <p style={{ marginBottom: 20 }}>Create your first project to start organizing work</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Create Project
            </button>
          </div>
        ) : (
          <div className="grid-3">
            {projects.map((p) => (
              <div key={p.id} className="card card-hover" onClick={() => navigate(`/projects/${p.id}`)}
                style={{ borderTop: `3px solid ${p.color}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', background: 'var(--bg3)', padding: '2px 8px', borderRadius: 4 }}>
                    {p.identifier}
                  </span>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 100,
                    background: p.status === 'active' ? 'rgba(52,211,153,0.12)' : 'var(--bg3)',
                    color: p.status === 'active' ? 'var(--green)' : 'var(--text3)',
                    border: p.status === 'active' ? '1px solid rgba(52,211,153,0.25)' : '1px solid var(--border)',
                  }}>
                    {p.status}
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>{p.name}</h3>
                {p.description && (
                  <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 14, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
                    {p.description}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex' }}>
                    {p.members.slice(0, 4).map((m, i) => (
                      <div key={m.user.id} className="avatar avatar-sm"
                        style={{ background: `hsl(${m.user.id.charCodeAt(0) * 7 % 360},60%,45%)`, marginLeft: i > 0 ? -6 : 0, border: '2px solid var(--bg2)' }}
                        title={`${m.user.name} (${m.role})`}>
                        {initials(m.user.name)}
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                    Updated {format(new Date(p.updated_at), 'MMM d')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={(p) => { setProjects((prev) => [p, ...prev]); navigate(`/projects/${p.id}`); }}
        />
      )}
    </>
  );
}
