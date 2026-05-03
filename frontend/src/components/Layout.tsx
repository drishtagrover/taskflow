import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LayoutDashboard, FolderKanban, CheckSquare, Plus, LogOut, ChevronDown, UserCog } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import CreateProjectModal from './CreateProjectModal';
import { Project } from '../types';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(true);

  useEffect(() => {
    api.get<Project[]>('/projects').then((r) => setProjects(r.data)).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const handleProjectCreated = (project: Project) => {
    setProjects((prev) => [project, ...prev]);
    navigate(`/projects/${project.id}`);
  };
  const initials = (name: string) => name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">⚡</div>
          <span className="logo-text">TaskFlow</span>
        </div>

        <div className="sidebar-section">
          <NavLink to="/" end className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
            <LayoutDashboard size={15} /> Dashboard
          </NavLink>
          <NavLink to="/my-tasks" className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
            <CheckSquare size={15} /> My Tasks
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/users" className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
              <UserCog size={15} /> User Management
            </NavLink>
          )}
        </div>

        <div className="sidebar-section" style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 6px' }}>
            <span className="sidebar-section-title" style={{ padding: 0 }}>Projects</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn btn-icon btn-sm" onClick={() => setProjectsOpen((o) => !o)}>
                <ChevronDown size={12} style={{ transform: projectsOpen ? 'rotate(0)' : 'rotate(-90deg)', transition: '0.2s' }} />
              </button>
              <button className="btn btn-icon btn-sm" onClick={() => setShowCreateProject(true)}>
                <Plus size={12} />
              </button>
            </div>
          </div>

          {projectsOpen && projects.map((p) => (
            <NavLink key={p.id} to={`/projects/${p.id}`}
              className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
              <span className="item-dot" style={{ background: p.color }} />
              <span className="truncate">{p.name}</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)' }}>{p.identifier}</span>
            </NavLink>
          ))}
          {projectsOpen && projects.length === 0 && (
            <div style={{ padding: '6px 20px', fontSize: 12, color: 'var(--text3)' }}>No projects yet</div>
          )}
        </div>

        <div className="sidebar-bottom">
          <div className="user-info">
            <div className="avatar" style={{ background: 'var(--accent)' }}>{initials(user?.name || '')}</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
          </div>
          <button className="sidebar-item" onClick={handleLogout}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      {showCreateProject && (
        <CreateProjectModal onClose={() => setShowCreateProject(false)} onCreated={handleProjectCreated} />
      )}
    </div>
  );
}
