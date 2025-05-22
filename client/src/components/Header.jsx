import React, { useContext } from 'react';
import { Link, NavLink } from 'react-router-dom';
import AuthContext from '../context/AuthContext'; // Імпортуємо AuthContext

function Header() {
  const { isLoggedIn, user, logout } = useContext(AuthContext); // Отримуємо дані та функцію logout з контексту

  return (
    <header className="app-header">
      <div className="header-top">
        <Link to="/" className="logo-link"><h1>WebMeteo</h1></Link>
        <nav className="main-nav">
          <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            Головна
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            Відділ аналітики
          </NavLink>
          {isLoggedIn ? (
            <>
              {user && <span className="nav-item username-display">Вітаємо, {user.username}!</span>}
              <button onClick={logout} className="nav-item logout-button">Вийти</button>
            </>
          ) : (
            <NavLink to="/auth" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              Авторизація
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;