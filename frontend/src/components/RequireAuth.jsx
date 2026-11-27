import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';

export default function RequireAuth({ roles, children }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <p className="page-status">Loading your account…</p>;
  if (!user) return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) {
    return (
      <section className="page narrow">
        <h1 className="page-title">Not available for your account</h1>
        <p className="lede">This page is for {roles.join(' or ')} accounts. You're signed in as {user.role}.</p>
        <Link className="button" to="/">Go to the shop</Link>
      </section>
    );
  }
  return children;
}
