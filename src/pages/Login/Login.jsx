import React, { useState } from 'react';
import api from '../../api';
import './Login.css';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login/email/test', { email, password });
      if (res.data.success) {
        // Verify admin status via check endpoint
        const checkRes = await api.post('/auth/check');
        if (checkRes.data.success && checkRes.data.isAdmin) {
          onLogin({ firstName: checkRes.data.firstName });
        } else {
          setError('Access denied. This account does not have admin privileges.');
        }
      } else {
        setError(res.data.message || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">OglePeek Admin</h1>
          <p className="login-subtitle">Sign in to your admin account</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="login-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@oglepeek.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="login-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button
            className="login-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
