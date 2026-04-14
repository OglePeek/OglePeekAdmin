import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import api from './api';
import './styles/globals.css';

import Sidebar from './components/Sidebar';
import Login from './pages/Login/Login';
import Overview from './pages/Overview/Overview';
import Products from './pages/Products/Products';
import ProductDetail from './pages/ProductDetail/ProductDetail';
import Orders from './pages/Orders/Orders';
import Users from './pages/Users/Users';

export default function App() {
  const [authState, setAuthState] = useState({ checked: false, isAdmin: false, adminName: '' });

  useEffect(() => {
    api.post('/auth/check')
      .then(res => {
        if (res.data.success && res.data.isAdmin) {
          setAuthState({ checked: true, isAdmin: true, adminName: res.data.firstName || 'Admin' });
        } else {
          setAuthState({ checked: true, isAdmin: false, adminName: '' });
        }
      })
      .catch(() => {
        setAuthState({ checked: true, isAdmin: false, adminName: '' });
      });
  }, []);

  const handleLogin = (data) => {
    setAuthState({ checked: true, isAdmin: true, adminName: data.firstName || 'Admin' });
  };

  const handleLogout = () => {
    api.post('/auth/logout').finally(() => {
      setAuthState({ checked: true, isAdmin: false, adminName: '' });
    });
  };

  if (!authState.checked) {
    return <div className="app-loading">Loading...</div>;
  }

  if (!authState.isAdmin) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar adminName={authState.adminName} onLogout={handleLogout} />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/users" element={<Users />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
