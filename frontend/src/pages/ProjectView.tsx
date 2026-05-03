import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Users, LayoutGrid, List } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import CreateTaskModal from '../components/CreateTaskModal';
import TaskDetailModal from '../components/TaskDetailModal';
import StatusBadge from '../components/StatusBadge';
import PriorityIcon from '../components/PriorityIcon';
import AddMemberModal from '../components/AddMemberModal';
import { format } from 'date-fns';
import { Project, Task } from '../types';

const STATUS_COLUMNS: { key: Task['status']; label: string; color: string }[] = [
  { key: 'backlog', label: 'Backlog', color: '#636d87' },
  { key: 'todo', label: 'Todo', color: '#9ca3af' },
  { key: 'in_progress', label: 'In Progress', color: '#60a5fa' },
  { key: 'in_review', label: 'In Review', color: '#fbbf24' },
  { key: 'done', label: 'Done', color: '#34d399' },
];

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tab, setTab] = useState<'tasks' | 'members'>('tasks');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get<Project>(`/projects/${id}`),
      api.get<Task[]>(`/tasks/project/${id}`),
    ]).then(([p, t]) => {
      setProject(p.data);
      setTasks(t.data);
    }).catch(() => navigate('/projects'))
      .finally(() => setLoading(false));
  }, [id]);

  const isAdmin = project?.members?.find((m) => m.user.id === user?.id)?.role === 'admin';
  const filteredTasks = filterStatus ? tasks.filter((t) => t.status === filterStatus) : tasks;
  const tasksByStatus = (status: Task['status']) => filteredTasks.filter((t) => t.status === status);
  const initials = (name: string) => name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 60 }}>
      <div className="spinner" />
    </div>
  );
  if (!project) return null;

  return (
    <>
      <div className="page-header" style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: project.color }} />
          <div>
            <h1 className="page-title" style={{ fontSize: 18 }}>{project.name}</h1>
            <p className="page-subtitle" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="font-mono" style={{ fontSize: 11 }}>{project.identifier}</span>
              {project.description && <><span>·</span><span>{project.description}</span></>}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', marginRight: 4 }}>
            {project.members.slice(0, 4).map((m, i) => (
              <div key={m.user.id} className="avatar avatar-sm"
                style={{ background: `hsl(${m.user.id.charCodeAt(0) * 7 % 360},60%,45%)`, marginLeft: i > 0 ? -6 : 0, border: '2px solid var(--bg2)', zIndex: 4 - i }}
                title={m.user.name}>
                {initials(m.user.name)}
              </div>
            ))}
            {project.members.length > 4 && (
              <div className="avatar avatar-sm" style={{ background: 'var(--bg4)', color: 'var(--text2)', marginLeft: -6, border: '2px solid var(--bg2)' }}>
                +{project.members.length - 4}
              </div>
            )}
          </div>
          {isAdmin && (
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAddMember(true)}>
              <Users size={13} /> Members
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreateTask(true)}>
            <Plus size={13} /> New Task
          </button>
        </div>
      </div>

      <div className="tabs">
        {(['tasks', 'members'] as const).map((t) => (
          <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'tasks' && (
        <>
          <div style={{ padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 2, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 7, padding: 3 }}>
              <button className={`btn btn-sm${view === 'board' ? ' btn-primary' : ' btn-ghost'}`} style={{ border: 'none', padding: '4px 10px' }} onClick={() => setView('board')}>
                <LayoutGrid size={13} /> Board
              </button>
              <button className={`btn btn-sm${view === 'list' ? ' btn-primary' : ' btn-ghost'}`} style={{ border: 'none', padding: '4px 10px' }} onClick={() => setView('list')}>
                <List size={13} /> List
              </button>
            </div>
            <select className="form-input" style={{ width: 'auto', fontSize: 12, padding: '5px 10px' }}
              value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All statuses</option>
              {['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled'].map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
            <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 4 }}>{filteredTasks.length} tasks</span>
          </div>

          <div className="page-body" style={{ padding: view === 'board' ? '24px 32px' : '0' }}>
            {view === 'board' ? (
              <div className="kanban-board">
                {STATUS_COLUMNS.map((col) => {
                  const colTasks = tasksByStatus(col.key);
                  return (
                    <div key={col.key} className="kanban-col">
                      <div className="kanban-col-header">
                        <div className="kanban-col-title">
                          <div style={{ width: 8, height: 8, borderRadius: 50, background: col.color }} />
                          {col.label}
                        </div>
                        <span className="kanban-col-count">{colTasks.length}</span>
                      </div>
                      <div className="kanban-cards">
                        {colTasks.map((task) => (
                          <div key={task.id} className="kanban-card" onClick={() => setSelectedTask(task)}>
                            <div className="kanban-card-title">{task.title}</div>
                            <div className="kanban-card-meta">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <PriorityIcon priority={task.priority} />
                                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)' }}>{project.identifier}-{task.task_number}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {task.due_date && (
                                  <span style={{ fontSize: 10, color: new Date(task.due_date) < new Date() ? 'var(--red)' : 'var(--text3)' }}>
                                    {format(new Date(task.due_date), 'MMM d')}
                                  </span>
                                )}
                                {task.assignee && (
                                  <div className="avatar avatar-sm" style={{ background: `hsl(${task.assignee.id.charCodeAt(0) * 7 % 360},60%,45%)` }}>
                                    {initials(task.assignee.name)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px', fontSize: 12, color: 'var(--text3)', border: '1px dashed var(--border)', borderRadius: 7, background: 'none', cursor: 'pointer', width: '100%' }}
                          onClick={() => setShowCreateTask(true)}>
                          <Plus size={12} /> Add task
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                {filteredTasks.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <h3>No tasks yet</h3>
                    <p style={{ marginBottom: 16 }}>Create your first task to get started</p>
                    <button className="btn btn-primary" onClick={() => setShowCreateTask(true)}>
                      <Plus size={14} /> New Task
                    </button>
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: 70 }}>ID</th>
                        <th>Title</th>
                        <th style={{ width: 130 }}>Status</th>
                        <th style={{ width: 100 }}>Priority</th>
                        <th style={{ width: 140 }}>Assignee</th>
                        <th style={{ width: 110 }}>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map((task) => (
                        <tr key={task.id} onClick={() => setSelectedTask(task)} style={{ cursor: 'pointer' }}>
                          <td className="font-mono" style={{ fontSize: 11, color: 'var(--text3)' }}>{project.identifier}-{task.task_number}</td>
                          <td style={{ color: 'var(--text)', fontWeight: 400 }}>{task.title}</td>
                          <td><StatusBadge status={task.status} /></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <PriorityIcon priority={task.priority} />
                              <span style={{ fontSize: 12, textTransform: 'capitalize', color: 'var(--text2)' }}>{task.priority}</span>
                            </div>
                          </td>
                          <td>
                            {task.assignee ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div className="avatar avatar-sm" style={{ background: `hsl(${task.assignee.id.charCodeAt(0) * 7 % 360},60%,45%)` }}>
                                  {initials(task.assignee.name)}
                                </div>
                                <span style={{ fontSize: 12 }}>{task.assignee.name}</span>
                              </div>
                            ) : <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>}
                          </td>
                          <td style={{ fontSize: 12, color: task.due_date && new Date(task.due_date) < new Date() ? 'var(--red)' : 'var(--text2)' }}>
                            {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'members' && (
        <div className="page-body">
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 500 }}>Team Members ({project.members.length})</h3>
              {isAdmin && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddMember(true)}>
                  <Plus size={13} /> Add Member
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {project.members.map((m) => (
                <div key={m.user.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8 }}>
                  <div className="avatar" style={{ background: `hsl(${m.user.id.charCodeAt(0) * 7 % 360},60%,45%)` }}>
                    {initials(m.user.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{m.user.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{m.user.email}</div>
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 500,
                    background: m.role === 'admin' ? 'rgba(124,106,245,0.15)' : 'var(--bg4)',
                    color: m.role === 'admin' ? 'var(--accent)' : 'var(--text3)',
                  }}>
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCreateTask && id && (
        <CreateTaskModal projectId={id} members={project.members} onClose={() => setShowCreateTask(false)}
          onCreated={(task) => setTasks((prev) => [task, ...prev])} />
      )}
      {showAddMember && id && (
        <AddMemberModal projectId={id} onClose={() => setShowAddMember(false)}
          onAdded={(updatedProject) => setProject(updatedProject)} />
      )}
      {selectedTask && (
        <TaskDetailModal task={{ ...selectedTask, project: { id: project.id, name: project.name, identifier: project.identifier, color: project.color } }}
          members={project.members} isAdmin={!!isAdmin} onClose={() => setSelectedTask(null)}
          onUpdated={(updated) => { setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t)); setSelectedTask(updated); }}
          onDeleted={(taskId) => { setTasks((prev) => prev.filter((t) => t.id !== taskId)); setSelectedTask(null); }} />
      )}
    </>
  );
}
