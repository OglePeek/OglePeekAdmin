import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar({ adminName, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-text">OglePeek</span>
        <span className="sidebar-brand-sub">Admin</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
        >
          <span className="sidebar-icon">📊</span>
          <span>Overview</span>
        </NavLink>
        <NavLink
          to="/products"
          className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
        >
          <span className="sidebar-icon">📦</span>
          <span>Products</span>
        </NavLink>
        <NavLink
          to="/orders"
          className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
        >
          <span className="sidebar-icon">📋</span>
          <span>Orders</span>
        </NavLink>
        <NavLink
          to="/users"
          className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
        >
          <span className="sidebar-icon">👥</span>
          <span>Users</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-admin-name">{adminName}</div>
        <button className="sidebar-logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}
