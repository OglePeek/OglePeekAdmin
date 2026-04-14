import React, { useState, useEffect } from 'react';
import api from '../../api';
import './Users.css';

const PAGE_SIZE = 20;

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const res = await api.get('/customers');
        setUsers(res.data.customers || []);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const stats = {
    total: users.length,
    verified: users.filter(u => u.isVerified).length,
    unverified: users.filter(u => !u.isVerified).length,
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Users</h1>
      </div>

      {/* Stats */}
      <div className="users-stats">
        <div className="stat-card">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Verified</div>
          <div className="stat-value stat-value--green">{stats.verified}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Unverified</div>
          <div className="stat-value stat-value--red">{stats.unverified}</div>
        </div>
      </div>

      {/* Search */}
      <div className="toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={handleSearch}
        />
      </div>

      <div className="section-card">
        {loading ? (
          <div className="skeleton-table">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton skeleton-row" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            {search ? 'No users match your search.' : 'No users found.'}
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Verified</th>
                    <th>Admin</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((user, idx) => (
                    <tr key={user._id}>
                      <td className="row-num">
                        {(safePage - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="user-name-cell">{user.name || '-'}</td>
                      <td className="user-email-cell">{user.email || '-'}</td>
                      <td>{user.phone || '-'}</td>
                      <td>
                        {user.isVerified ? (
                          <span className="verified-badge verified">✓ Verified</span>
                        ) : (
                          <span className="verified-badge unverified">✗ Unverified</span>
                        )}
                      </td>
                      <td>
                        {user.isAdmin ? (
                          <span className="admin-star" title="Admin">★</span>
                        ) : (
                          <span className="no-admin">—</span>
                        )}
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                >
                  ← Previous
                </button>
                <div className="pagination-info">
                  Page {safePage} of {totalPages}
                  <span className="pagination-count">
                    ({filtered.length} users)
                  </span>
                </div>
                <button
                  className="pagination-btn"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
