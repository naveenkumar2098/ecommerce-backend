import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { useCart } from '../cart';

export default function Header() {
  const { user, isStaff, signOut } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="wordmark" aria-label="Ohm Supply, go to shop">
          Ohm Supply
        </Link>
        <nav className="site-nav" aria-label="Main">
          <NavLink to="/" end className="site-nav__link">Shop</NavLink>
          {user?.role === 'customer' && <NavLink to="/orders" className="site-nav__link">Orders</NavLink>}
          {isStaff && <NavLink to="/workspace" className="site-nav__link">Workspace</NavLink>}
          <NavLink to="/cart" className="site-nav__link">
            Cart{count > 0 && <span className="cart-count" aria-label={`${count} items`}>{count}</span>}
          </NavLink>
          {user ? (
            <button type="button" className="site-nav__link site-nav__button" onClick={handleSignOut}>
              Sign out
            </button>
          ) : (
            <NavLink to="/sign-in" className="site-nav__link">Sign in</NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
