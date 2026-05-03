import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle2, Clock, FolderKanban } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import PriorityIcon from '../components/PriorityIcon';
import { Task, Project } from '../types';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [overdue, setOverdue] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Task[]>('/tasks/my-tasks'),
      api.get<Task[]>('/tasks/overdue'),
      api.get<Project[]>('/projects'),
    ]).then(([t, o, p]) => {
      setMyTasks(t.data);
      setOverdue(o.data);
      setProjects(p.data);
    }).finally(() => setLoading(false));
  }, []);

  const inProgress = myTasks.filter((t) => t.status === 'in_progress');

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 60 }}>
      <div className="spinner" />
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's happening across your workspace</p>
        </div>
      </div>

      <div className="page-body">
        <div className="grid-4" style={{ marginBottom: 28 }}>
          {[
            { label: 'My Tasks', value: myTasks.length, icon: <CheckCircle2 size={18} />, color: 'var(--accent)' },
            { label: 'In Progress', value: inProgress.length, icon: <Clock size={18} />, color: 'var(--blue)' },
            { label: 'Overdue', value: overdue.length, icon: <AlertTriangle size={18} />, color: 'var(--red)' },
            { label: 'Projects', value: projects.length, icon: <FolderKanban size={18} />, color: 'var(--green)' },
          ].map((s) => (
            <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 24, fontFamily: 'var(--serif)', fontWeight: 300, color: 'var(--text)' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <AlertTriangle size={15} color="var(--red)" />
              <h3 style={{ fontSize: 14, fontWeight: 500 }}>Overdue Tasks</h3>
              {overdue.length > 0 && <span className="badge" style={{ background: 'rgba(248,113,113,0.15)', color: 'var(--red)', marginLeft: 'auto' }}>{overdue.length}</span>}
            </div>
            {overdue.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6 }}>No overdue tasks!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {overdue.slice(0, 5).map((task) => (
                  <div key={task.id} onClick={() => navigate(`/projects/${task.project.id}`)}
                    style={{ padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8, cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)' }}>{task.project?.identifier}-{task.task_number}</span>
                      <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--red)' }}>Due {task.due_date ? format(new Date(task.due_date), 'MMM d') : ''}</span>
                      <span style={{ fontSize: 11, color: 'var(--text3)', background: 'rgba(0,0,0,0.2)', padding: '1px 6px', borderRadius: 4 }}>{task.project?.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Clock size={15} color="var(--blue)" />
              <h3 style={{ fontSize: 14, fontWeight: 500 }}>My Recent Tasks</h3>
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => navigate('/my-tasks')}>View all</button>
            </div>
            {myTasks.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <p style={{ fontSize: 13, color: 'var(--text3)' }}>No tasks assigned to you</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {myTasks.slice(0, 5).map((task) => (
                  <div key={task.id} onClick={() => navigate(`/projects/${task.project.id}`)}
                    style={{ padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8, cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <PriorityIcon priority={task.priority} />
                      <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                      <StatusBadge status={task.status} />
                    </div>
                    <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text3)' }}>{task.project?.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {projects.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 14, color: 'var(--text2)' }}>Your Projects</h3>
            <div className="grid-3">
              {projects.map((p) => (
                <div key={p.id} className="card card-hover" onClick={() => navigate(`/projects/${p.id}`)}
                  style={{ borderLeft: `3px solid ${p.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 50, background: p.color }} />
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>{p.identifier}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, padding: '2px 7px', borderRadius: 4, background: 'var(--bg3)', color: p.status === 'active' ? 'var(--green)' : 'var(--text3)' }}>{p.status}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>{p.name}</div>
                  {p.description && <div style={{ fontSize: 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>}
                  <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text3)' }}>{p.members.length} member{p.members.length !== 1 ? 's' : ''}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
