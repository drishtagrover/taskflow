import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import PriorityIcon from '../components/PriorityIcon';
import { format } from 'date-fns';
import { CheckSquare } from 'lucide-react';
import { Task } from '../types';

type Filter = 'active' | 'done' | 'all';

export default function MyTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('active');
  const navigate = useNavigate();

  useEffect(() => {
    api.get<Task[]>('/tasks/my-tasks').then((r) => setTasks(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = tasks.filter((t) => {
    if (filter === 'active') return !['done', 'cancelled'].includes(t.status);
    if (filter === 'done') return t.status === 'done';
    return true;
  });

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div className="spinner" />
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you</p>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: 3 }}>
          {([{ key: 'active', label: 'Active' }, { key: 'done', label: 'Completed' }, { key: 'all', label: 'All' }] as { key: Filter; label: string }[]).map((f) => (
            <button key={f.key} className={`btn btn-sm${filter === f.key ? ' btn-primary' : ' btn-ghost'}`}
              style={{ border: 'none' }} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-body" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <div style={{ marginBottom: 12 }}><CheckSquare size={40} style={{ opacity: 0.2 }} /></div>
            <h3>No tasks</h3>
            <p>Tasks assigned to you will appear here</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ paddingLeft: 32 }}>Task</th>
                <th style={{ width: 130 }}>Status</th>
                <th style={{ width: 100 }}>Priority</th>
                <th style={{ width: 160 }}>Project</th>
                <th style={{ width: 120, paddingRight: 32 }}>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((task) => (
                <tr key={task.id} onClick={() => navigate(`/projects/${task.project?.id}`)} style={{ cursor: 'pointer' }}>
                  <td style={{ paddingLeft: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <PriorityIcon priority={task.priority} />
                      <span style={{ color: 'var(--text)', fontSize: 13.5 }}>{task.title}</span>
                    </div>
                  </td>
                  <td><StatusBadge status={task.status} /></td>
                  <td><span style={{ fontSize: 12, textTransform: 'capitalize', color: 'var(--text2)' }}>{task.priority}</span></td>
                  <td>
                    {task.project && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 7, height: 7, borderRadius: 50, background: task.project.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.project.name}</span>
                      </div>
                    )}
                  </td>
                  <td style={{
                    fontSize: 12,
                    color: task.due_date && new Date(task.due_date) < new Date() && !['done', 'cancelled'].includes(task.status) ? 'var(--red)' : 'var(--text2)',
                    paddingRight: 32,
                  }}>
                    {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
