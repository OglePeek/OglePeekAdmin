import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import './Products.css';

const FRAME_STYLES = ['Aviator', 'Wayfarer', 'Round', 'Cat Eye', 'Rectangle', 'Square', 'Oval', 'Clubmaster'];
const PRODUCT_TYPES = ['Sunglasses', 'Eyeglasses', 'Blue Light', 'Sports'];
const FRAME_TYPES = ['Full Rim', 'Half Rim', 'Rimless'];
const LENS_TYPES = ['UV400', 'Polarized', 'Anti-Reflective', 'Photochromic', 'Blue Light Block'];
const GENDERS = ['Male', 'Female', 'Unisex'];
const MATERIALS = ['Acetate', 'Metal', 'Titanium', 'TR90', 'Wood', 'Mixed'];

const EMPTY_FORM = {
  name: '',
  frameStyle: FRAME_STYLES[0],
  description: '',
  productType: PRODUCT_TYPES[0],
  frameType: FRAME_TYPES[0],
  lens: LENS_TYPES[0],
  gender: GENDERS[0],
  material: MATERIALS[0],
};

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/product/all');
      setProducts(res.data.products || res.data || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filtered = products.filter(p =>
    p.name && p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    try {
      await api.delete(`/product/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      alert('Failed to delete product. Please try again.');
    }
  };

  const handleFormChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/product', form);
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchProducts();
    } catch (err) {
      setFormError(
        err.response?.data?.message || 'Failed to create product. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        <button className="btn-primary" onClick={openModal}>+ Add Product</button>
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="section-card">
        {loading ? (
          <div className="skeleton-table">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton skeleton-row" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            {search ? 'No products match your search.' : 'No products found. Add your first product.'}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Frame Style</th>
                  <th>Type</th>
                  <th>Gender</th>
                  <th>Variants</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(product => (
                  <tr
                    key={product._id}
                    className="clickable-row"
                    onClick={() => navigate(`/products/${product._id}`)}
                  >
                    <td className="product-name-cell">{product.name}</td>
                    <td>{product.frameStyle || '-'}</td>
                    <td>{product.productType || product.type || '-'}</td>
                    <td>{product.gender || '-'}</td>
                    <td>{product.variants ? product.variants.length : 0}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="action-btns">
                        <button
                          className="btn-sm btn-outline"
                          onClick={() => navigate(`/products/${product._id}`)}
                        >
                          Manage
                        </button>
                        <button
                          className="btn-sm btn-danger"
                          onClick={e => handleDelete(e, product._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Product</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form className="modal-form" onSubmit={handleAddProduct}>
              <div className="form-field">
                <label className="form-label">Name *</label>
                <input
                  className="form-input"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Classic Aviator"
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Frame Style</label>
                  <select className="form-select" name="frameStyle" value={form.frameStyle} onChange={handleFormChange}>
                    {FRAME_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Product Type</label>
                  <select className="form-select" name="productType" value={form.productType} onChange={handleFormChange}>
                    {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Product description..."
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Frame Type</label>
                  <select className="form-select" name="frameType" value={form.frameType} onChange={handleFormChange}>
                    {FRAME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Lens</label>
                  <select className="form-select" name="lens" value={form.lens} onChange={handleFormChange}>
                    {LENS_TYPES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Gender</label>
                  <select className="form-select" name="gender" value={form.gender} onChange={handleFormChange}>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Material</label>
                  <select className="form-select" name="material" value={form.material} onChange={handleFormChange}>
                    {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              {formError && <div className="form-error">{formError}</div>}

              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
