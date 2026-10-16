import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

function Navbar() {
const { user, logout, isAdmin } = useAuth();
const navigate = useNavigate();
const location = useLocation();
const [menuOpen, setMenuOpen] = useState(false);

useEffect(() => {
setMenuOpen(false);
}, [location.pathname]);

useEffect(() => {
if (!menuOpen) return undefined;

const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    setMenuOpen(false);
  }
};

document.addEventListener('keydown', handleKeyDown);

return () => {
  document.removeEventListener('keydown', handleKeyDown);
};

}, [menuOpen]);

const handleLogout = () => {
logout();
setMenuOpen(false);
navigate('/');
};

const navLinkClass = ({ isActive }) =>
`navbar-link${isActive ? ' active' : ''}`;

return (
<nav className="navbar" aria-label="Main navigation">
<Link
to="/"
className="navbar-logo"
onClick={() => setMenuOpen(false)}
>
Stori Zetu
</Link>

  <button
    type="button"
    className="navbar-menu-toggle"
    aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
    aria-expanded={menuOpen}
    aria-controls="navbar-links"
    onClick={() => setMenuOpen((open) => !open)}
  >
    <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
  </button>

  <div
    id="navbar-links"
    className={`navbar-links${menuOpen ? ' is-open' : ''}`}
  >
    <NavLink to="/" end className={navLinkClass}>
      Books
    </NavLink>

    {user ? (
      <>
        <NavLink to="/cart" className={navLinkClass}>
          Cart
        </NavLink>

        <NavLink to="/my-orders" className={navLinkClass}>
          My Orders
        </NavLink>

        {isAdmin && (
          <NavLink to="/admin" className={navLinkClass}>
            Admin
          </NavLink>
        )}

        <span className="navbar-user">
          Hi, {user.username}
        </span>

        <button
          type="button"
          className="navbar-logout"
          onClick={handleLogout}
        >
          Logout
        </button>
      </>
    ) : (
      <>
        <NavLink to="/login" className={navLinkClass}>
          Login
        </NavLink>

        <NavLink to="/register" className="navbar-register">
          Register
        </NavLink>
      </>
    )}
  </div>
</nav>

);
}

export default Navbar;