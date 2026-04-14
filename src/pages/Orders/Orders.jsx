import React, { useState, useEffect } from 'react';
import api from '../../api';
import './Orders.css';

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
const TABS = ['All', ...STATUS_OPTIONS];

function formatNPR(amount) {
  return 'NPR ' + Number(amount || 0).toLocaleString('en-IN');
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function OrderStatusBadge({ value }) {
  const map = {
    'Pending': 'badge-warning',
    'Confirmed': 'badge-info',
    'Completed': 'badge-success',
    'Cancelled': 'badge-danger',
  };
  return <span className={`badge ${map[value] || 'badge-default'}`}>{value}</span>;
}

function PaymentBadge({ value }) {
  const map = {
    'Paid': 'badge-success',
    'Pending Payment': 'badge-warning',
    'Failed': 'badge-danger',
    'Refunded': 'badge-info',
  };
  return <span className={`badge ${map[value] || 'badge-default'}`}>{value || '-'}</span>;
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState({});

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/admin');
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const counts = {
    All: orders.length,
    Pending: orders.filter(o => o.orderStatus === 'Pending').length,
    Confirmed: orders.filter(o => o.orderStatus === 'Confirmed').length,
    Completed: orders.filter(o => o.orderStatus === 'Completed').length,
    Cancelled: orders.filter(o => o.orderStatus === 'Cancelled').length,
  };

  const filtered = activeTab === 'All'
    ? orders
    : orders.filter(o => o.orderStatus === activeTab);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [orderId]: true }));
    try {
      await api.patch(`/orders/${orderId}/status`, { orderStatus: newStatus });
      setOrders(prev =>
        prev.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o)
      );
    } catch (err) {
      alert('Failed to update order status.');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const toggleExpand = (orderId) => {
    setExpandedOrder(prev => prev === orderId ? null : orderId);
  };

  const getItemsFromOrder = (order) => {
    if (!order.cartId || !order.cartId.items) return [];
    return order.cartId.items;
  };

  const getItemCount = (order) => {
    const items = getItemsFromOrder(order);
    return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  };

  const getCustomerName = (order) => {
    if (order.customer && order.customer.name) return order.customer.name;
    return order.name || '-';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Orders</h1>
      </div>

      {/* Stats bar */}
      <div className="orders-stats-bar">
        {Object.entries(counts).map(([key, count]) => (
          <div key={key} className="orders-stat-item">
            <span className="orders-stat-label">{key}</span>
            <span className="orders-stat-count">{count}</span>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="orders-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`orders-tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            <span className="orders-tab-count">{counts[tab]}</span>
          </button>
        ))}
      </div>

      <div className="section-card">
        {loading ? (
          <div className="skeleton-table">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton skeleton-row" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No {activeTab !== 'All' ? activeTab.toLowerCase() : ''} orders found.</div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Change Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <React.Fragment key={order._id}>
                    <tr className={`order-row${expandedOrder === order._id ? ' expanded' : ''}`}>
                      <td>
                        <button
                          className="expand-btn"
                          onClick={() => toggleExpand(order._id)}
                          title={expandedOrder === order._id ? 'Collapse' : 'Expand'}
                        >
                          {expandedOrder === order._id ? '▼' : '▶'}
                        </button>
                      </td>
                      <td className="order-id-cell">
                        {String(order._id).slice(-8).toUpperCase()}
                      </td>
                      <td>{getCustomerName(order)}</td>
                      <td>{formatNPR(order.totalAmount)}</td>
                      <td>{getItemCount(order)}</td>
                      <td><PaymentBadge value={order.paymentStatus} /></td>
                      <td><OrderStatusBadge value={order.orderStatus} /></td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>
                        <select
                          className="status-select"
                          value={order.orderStatus}
                          onChange={e => handleStatusChange(order._id, e.target.value)}
                          disabled={updatingStatus[order._id]}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    {expandedOrder === order._id && (
                      <tr className="order-detail-row">
                        <td colSpan={9}>
                          <div className="order-detail-panel">
                            <div className="order-detail-meta">
                              <div className="meta-item">
                                <span className="meta-label">Email</span>
                                <span>{order.email || (order.customer && order.customer.email) || '-'}</span>
                              </div>
                              <div className="meta-item">
                                <span className="meta-label">Phone</span>
                                <span>{order.phone || (order.customer && order.customer.phone) || '-'}</span>
                              </div>
                              <div className="meta-item">
                                <span className="meta-label">City</span>
                                <span>{order.city || '-'}</span>
                              </div>
                              <div className="meta-item">
                                <span className="meta-label">Address</span>
                                <span>{order.address || '-'}</span>
                              </div>
                            </div>
                            <div className="order-items-title">Order Items</div>
                            {getItemsFromOrder(order).length === 0 ? (
                              <div className="order-items-empty">No item details available.</div>
                            ) : (
                              <table className="order-items-table">
                                <thead>
                                  <tr>
                                    <th>Product</th>
                                    <th>Color</th>
                                    <th>Qty</th>
                                    <th>Price</th>
                                    <th>Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {getItemsFromOrder(order).map((item, idx) => (
                                    <tr key={idx}>
                                      <td>
                                        {item.productId && item.productId.name
                                          ? item.productId.name
                                          : (item.productName || 'Unknown Product')}
                                      </td>
                                      <td>
                                        {item.variantId && item.variantId.frameColor
                                          ? item.variantId.frameColor
                                          : '-'}
                                      </td>
                                      <td>{item.quantity || 1}</td>
                                      <td>
                                        {formatNPR(
                                          item.variantId && item.variantId.price
                                            ? item.variantId.price
                                            : item.price
                                        )}
                                      </td>
                                      <td>
                                        {formatNPR(
                                          (item.quantity || 1) * (
                                            item.variantId && item.variantId.price
                                              ? item.variantId.price
                                              : (item.price || 0)
                                          )
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
