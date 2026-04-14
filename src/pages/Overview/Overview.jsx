import React, { useState, useEffect } from 'react';
import api from '../../api';
import './Overview.css';

function formatNPR(amount) {
  if (amount === null || amount === undefined) return 'NPR 0';
  return 'NPR ' + Number(amount).toLocaleString('en-IN');
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function StatusBadge({ value, type }) {
  const paymentColors = {
    'Paid': 'badge-success',
    'Pending Payment': 'badge-warning',
    'Failed': 'badge-danger',
    'Refunded': 'badge-info',
  };
  const orderColors = {
    'Pending': 'badge-warning',
    'Confirmed': 'badge-info',
    'Completed': 'badge-success',
    'Cancelled': 'badge-danger',
  };
  const colorMap = type === 'payment' ? paymentColors : orderColors;
  const cls = colorMap[value] || 'badge-default';
  return <span className={`badge ${cls}`}>{value}</span>;
}

export default function Overview() {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, users: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [productsRes, ordersRes, usersRes] = await Promise.all([
          api.get('/product/all'),
          api.get('/orders/admin'),
          api.get('/customers'),
        ]);

        const products = productsRes.data.products || productsRes.data || [];
        const orders = ordersRes.data.orders || [];
        const users = usersRes.data.customers || [];

        const revenue = orders
          .filter(o => o.paymentStatus === 'Paid')
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        setStats({
          products: products.length,
          orders: orders.length,
          revenue,
          users: users.length,
        });

        setRecentOrders(orders.slice(0, 10));
      } catch (err) {
        console.error('Overview fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Overview</h1>
        </div>
        <div className="stats-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card skeleton-card">
              <div className="skeleton skeleton-label" />
              <div className="skeleton skeleton-value" />
            </div>
          ))}
        </div>
        <div className="section-card">
          <div className="skeleton-table">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton skeleton-row" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Overview</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Products</div>
          <div className="stat-value">{stats.products}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{stats.orders}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value stat-value--small">{formatNPR(stats.revenue)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{stats.users}</div>
        </div>
      </div>

      <div className="section-card">
        <h2 className="section-title">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <div className="empty-state">No orders found.</div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order._id}>
                    <td className="order-id-cell">
                      {String(order._id).slice(-8).toUpperCase()}
                    </td>
                    <td>
                      {order.customer
                        ? (order.customer.name || order.name || '-')
                        : (order.name || '-')}
                    </td>
                    <td>{formatNPR(order.totalAmount)}</td>
                    <td>
                      <StatusBadge value={order.paymentStatus} type="payment" />
                    </td>
                    <td>
                      <StatusBadge value={order.orderStatus} type="order" />
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
