import { Navigate, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth';
import { statusText } from '../../format';

export const SECTIONS = [
  { to: 'products', label: 'Products', roles: ['admin', 'supplier'] },
  { to: 'orders', label: 'Orders', roles: ['admin'] },
  { to: 'issues', label: 'Issues', roles: ['admin', 'support'] },
  { to: 'people', label: 'People', roles: ['admin'] },
];

export const sectionsFor = (role) => SECTIONS.filter((s) => s.roles.includes(role));

export default function Workspace() {
  const { user } = useAuth();
  const sections = sectionsFor(user.role);
  return (
    <div className="page workspace">
      <div className="workspace__head">
        <h1 className="page-title">Workspace</h1>
        <p className="muted">Signed in as {user.name}, {statusText(user.role).toLowerCase()}</p>
      </div>
      {sections.length > 1 && (
        <nav className="tabs" aria-label="Workspace sections">
          {sections.map((s) => (
            <NavLink key={s.to} to={s.to} className="tabs__tab">{s.label}</NavLink>
          ))}
        </nav>
      )}
      <Outlet />
    </div>
  );
}

export function WorkspaceHome() {
  const { user } = useAuth();
  return <Navigate to={sectionsFor(user.role)[0].to} replace />;
}
