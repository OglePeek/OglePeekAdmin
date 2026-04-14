import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';
import './ProductDetail.css';

const FRAME_STYLES = ['Aviator', 'Wayfarer', 'Round', 'Cat Eye', 'Rectangle', 'Square', 'Oval', 'Clubmaster'];
const PRODUCT_TYPES = ['Sunglasses', 'Eyeglasses', 'Blue Light', 'Sports'];
const FRAME_TYPES = ['Full Rim', 'Half Rim', 'Rimless'];
const LENS_TYPES = ['UV400', 'Polarized', 'Anti-Reflective', 'Photochromic', 'Blue Light Block'];
const GENDERS = ['Male', 'Female', 'Unisex'];
const MATERIALS = ['Acetate', 'Metal', 'Titanium', 'TR90', 'Wood', 'Mixed'];

const EMPTY_VARIANT_FORM = {
  frameColor: '',
  price: '',
  inStock: '',
  size: '',
};

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Add variant modal
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [variantForm, setVariantForm] = useState(EMPTY_VARIANT_FORM);
  const [variantFiles, setVariantFiles] = useState([]);
  const [variantSubmitting, setVariantSubmitting] = useState(false);
  const [variantError, setVariantError] = useState('');
  const addFileRef = useRef();

  // Edit variant modal
  const [showEditVariant, setShowEditVariant] = useState(false);
  const [editVariant, setEditVariant] = useState(null);
  const [editVariantForm, setEditVariantForm] = useState(EMPTY_VARIANT_FORM);
  const [editVariantFiles, setEditVariantFiles] = useState([]);
  const [editVariantSubmitting, setEditVariantSubmitting] = useState(false);
  const [editVariantError, setEditVariantError] = useState('');
  const editFileRef = useRef();

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/product/${id}`);
      const p = res.data.product || res.data;
      setProduct(p);
      setEditForm({
        name: p.name || '',
        frameStyle: p.frameStyle || FRAME_STYLES[0],
        description: p.description || '',
        productType: p.productType || PRODUCT_TYPES[0],
        frameType: p.frameType || FRAME_TYPES[0],
        lens: p.lens || LENS_TYPES[0],
        gender: p.gender || GENDERS[0],
        material: p.material || MATERIALS[0],
      });
      setVariants(p.variants || []);
    } catch (err) {
      console.error('Failed to fetch product:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const handleEditFormChange = (e) => {
    setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveProduct = async () => {
    setEditSaving(true);
    setEditError('');
    try {
      await api.put(`/product/${id}`, editForm);
      await fetchProduct();
      setEditing(false);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update product.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditError('');
    if (product) {
      setEditForm({
        name: product.name || '',
        frameStyle: product.frameStyle || FRAME_STYLES[0],
        description: product.description || '',
        productType: product.productType || PRODUCT_TYPES[0],
        frameType: product.frameType || FRAME_TYPES[0],
        lens: product.lens || LENS_TYPES[0],
        gender: product.gender || GENDERS[0],
        material: product.material || MATERIALS[0],
      });
    }
  };

  // Add variant
  const handleAddVariantSubmit = async (e) => {
    e.preventDefault();
    setVariantError('');
    if (variantFiles.length === 0) {
      setVariantError('At least one image is required.');
      return;
    }
    setVariantSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('frameColor', variantForm.frameColor);
      fd.append('price', variantForm.price);
      fd.append('inStock', variantForm.inStock);
      if (variantForm.size) fd.append('size', variantForm.size);
      for (const file of variantFiles) {
        fd.append('images', file);
      }
      await api.post(`/variant/${id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setShowAddVariant(false);
      setVariantForm(EMPTY_VARIANT_FORM);
      setVariantFiles([]);
      await fetchProduct();
    } catch (err) {
      setVariantError(err.response?.data?.message || 'Failed to create variant.');
    } finally {
      setVariantSubmitting(false);
    }
  };

  // Edit variant
  const openEditVariant = (variant) => {
    setEditVariant(variant);
    setEditVariantForm({
      frameColor: variant.frameColor || '',
      price: variant.price || '',
      inStock: variant.inStock || '',
      size: variant.size || '',
    });
    setEditVariantFiles([]);
    setEditVariantError('');
    setShowEditVariant(true);
  };

  const handleEditVariantSubmit = async (e) => {
    e.preventDefault();
    setEditVariantError('');
    setEditVariantSubmitting(true);
    try {
      const fd = new FormData();
      if (editVariantForm.frameColor) fd.append('frameColor', editVariantForm.frameColor);
      if (editVariantForm.price) fd.append('price', editVariantForm.price);
      if (editVariantForm.inStock !== '') fd.append('inStock', editVariantForm.inStock);
      if (editVariantForm.size) fd.append('size', editVariantForm.size);
      for (const file of editVariantFiles) {
        fd.append('images', file);
      }
      await api.put(`/variant/${editVariant._id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setShowEditVariant(false);
      setEditVariant(null);
      await fetchProduct();
    } catch (err) {
      setEditVariantError(err.response?.data?.message || 'Failed to update variant.');
    } finally {
      setEditVariantSubmitting(false);
    }
  };

  // Delete variant
  const handleDeleteVariant = async (variantId) => {
    if (!window.confirm('Delete this variant? This will also remove its images from Cloudinary.')) return;
    try {
      await api.delete(`/variant/${variantId}`);
      await fetchProduct();
    } catch (err) {
      alert('Failed to delete variant.');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton skeleton-title-bar" />
        <div className="detail-layout">
          <div className="skeleton skeleton-info-card" />
          <div className="skeleton skeleton-variants" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-container">
        <Link to="/products" className="back-link">← Back to Products</Link>
        <div className="empty-state">Product not found.</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="detail-breadcrumb">
        <Link to="/products" className="back-link">← Back to Products</Link>
      </div>

      {/* Product Info Card */}
      <div className="detail-card">
        <div className="detail-card-header">
          <h2 className="detail-card-title">{product.name}</h2>
          {!editing ? (
            <button className="btn-outline btn-sm" onClick={() => setEditing(true)}>Edit</button>
          ) : (
            <div className="action-btns">
              <button className="btn-outline btn-sm" onClick={handleCancelEdit} disabled={editSaving}>Cancel</button>
              <button className="btn-primary btn-sm" onClick={handleSaveProduct} disabled={editSaving}>
                {editSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {editError && <div className="form-error" style={{ margin: '0 24px 16px' }}>{editError}</div>}

        <div className="product-info-grid">
          {editing ? (
            <>
              <div className="info-field">
                <span className="info-label">Name</span>
                <input className="form-input" name="name" value={editForm.name} onChange={handleEditFormChange} />
              </div>
              <div className="info-field">
                <span className="info-label">Frame Style</span>
                <select className="form-select" name="frameStyle" value={editForm.frameStyle} onChange={handleEditFormChange}>
                  {FRAME_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="info-field">
                <span className="info-label">Product Type</span>
                <select className="form-select" name="productType" value={editForm.productType} onChange={handleEditFormChange}>
                  {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="info-field">
                <span className="info-label">Frame Type</span>
                <select className="form-select" name="frameType" value={editForm.frameType} onChange={handleEditFormChange}>
                  {FRAME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="info-field">
                <span className="info-label">Lens</span>
                <select className="form-select" name="lens" value={editForm.lens} onChange={handleEditFormChange}>
                  {LENS_TYPES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="info-field">
                <span className="info-label">Gender</span>
                <select className="form-select" name="gender" value={editForm.gender} onChange={handleEditFormChange}>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="info-field">
                <span className="info-label">Material</span>
                <select className="form-select" name="material" value={editForm.material} onChange={handleEditFormChange}>
                  {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="info-field info-field--full">
                <span className="info-label">Description</span>
                <textarea className="form-textarea" name="description" value={editForm.description} onChange={handleEditFormChange} rows={3} />
              </div>
            </>
          ) : (
            <>
              <div className="info-field">
                <span className="info-label">Frame Style</span>
                <span className="info-value">{product.frameStyle || '-'}</span>
              </div>
              <div className="info-field">
                <span className="info-label">Product Type</span>
                <span className="info-value">{product.productType || '-'}</span>
              </div>
              <div className="info-field">
                <span className="info-label">Frame Type</span>
                <span className="info-value">{product.frameType || '-'}</span>
              </div>
              <div className="info-field">
                <span className="info-label">Lens</span>
                <span className="info-value">{product.lens || '-'}</span>
              </div>
              <div className="info-field">
                <span className="info-label">Gender</span>
                <span className="info-value">{product.gender || '-'}</span>
              </div>
              <div className="info-field">
                <span className="info-label">Material</span>
                <span className="info-value">{product.material || '-'}</span>
              </div>
              {product.description && (
                <div className="info-field info-field--full">
                  <span className="info-label">Description</span>
                  <span className="info-value">{product.description}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Variants Section */}
      <div className="detail-card" style={{ marginTop: 20 }}>
        <div className="detail-card-header">
          <h2 className="detail-card-title">Variants ({variants.length})</h2>
          <button className="btn-primary btn-sm" onClick={() => {
            setVariantForm(EMPTY_VARIANT_FORM);
            setVariantFiles([]);
            setVariantError('');
            setShowAddVariant(true);
          }}>
            + Add Variant
          </button>
        </div>

        {variants.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 24px' }}>
            No variants yet. Add the first variant for this product.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Color</th>
                  <th>Price</th>
                  <th>In Stock</th>
                  <th>Reserved</th>
                  <th>Size</th>
                  <th>Images</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {variants.map(variant => (
                  <tr key={variant._id}>
                    <td>{variant.frameColor || '-'}</td>
                    <td>NPR {Number(variant.price || 0).toLocaleString('en-IN')}</td>
                    <td>{variant.inStock ?? '-'}</td>
                    <td>{variant.reserved ?? 0}</td>
                    <td>{variant.size || '-'}</td>
                    <td>{variant.images ? variant.images.length : 0}</td>
                    <td>
                      <div className="action-btns">
                        <button
                          className="btn-sm btn-outline"
                          onClick={() => openEditVariant(variant)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-sm btn-danger"
                          onClick={() => handleDeleteVariant(variant._id)}
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

      {/* Add Variant Modal */}
      {showAddVariant && (
        <div className="modal-overlay" onClick={() => setShowAddVariant(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Variant</h2>
              <button className="modal-close" onClick={() => setShowAddVariant(false)}>✕</button>
            </div>
            <form className="modal-form" onSubmit={handleAddVariantSubmit}>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Frame Color *</label>
                  <input
                    className="form-input"
                    value={variantForm.frameColor}
                    onChange={e => setVariantForm(p => ({ ...p, frameColor: e.target.value }))}
                    required
                    placeholder="e.g. Matte Black"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Size</label>
                  <input
                    className="form-input"
                    value={variantForm.size}
                    onChange={e => setVariantForm(p => ({ ...p, size: e.target.value }))}
                    placeholder="e.g. Medium"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Price (NPR) *</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={variantForm.price}
                    onChange={e => setVariantForm(p => ({ ...p, price: e.target.value }))}
                    required
                    placeholder="e.g. 2500"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">In Stock *</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={variantForm.inStock}
                    onChange={e => setVariantForm(p => ({ ...p, inStock: e.target.value }))}
                    required
                    placeholder="e.g. 10"
                  />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Images *</label>
                <input
                  ref={addFileRef}
                  className="form-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={e => setVariantFiles(Array.from(e.target.files))}
                />
                {variantFiles.length > 0 && (
                  <span className="file-count">{variantFiles.length} file(s) selected</span>
                )}
              </div>
              {variantError && <div className="form-error">{variantError}</div>}
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowAddVariant(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={variantSubmitting}>
                  {variantSubmitting ? 'Uploading...' : 'Add Variant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Variant Modal */}
      {showEditVariant && editVariant && (
        <div className="modal-overlay" onClick={() => setShowEditVariant(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Variant</h2>
              <button className="modal-close" onClick={() => setShowEditVariant(false)}>✕</button>
            </div>
            <form className="modal-form" onSubmit={handleEditVariantSubmit}>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Frame Color</label>
                  <input
                    className="form-input"
                    value={editVariantForm.frameColor}
                    onChange={e => setEditVariantForm(p => ({ ...p, frameColor: e.target.value }))}
                    placeholder="e.g. Matte Black"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Size</label>
                  <input
                    className="form-input"
                    value={editVariantForm.size}
                    onChange={e => setEditVariantForm(p => ({ ...p, size: e.target.value }))}
                    placeholder="e.g. Medium"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Price (NPR)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={editVariantForm.price}
                    onChange={e => setEditVariantForm(p => ({ ...p, price: e.target.value }))}
                    placeholder="e.g. 2500"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">In Stock</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={editVariantForm.inStock}
                    onChange={e => setEditVariantForm(p => ({ ...p, inStock: e.target.value }))}
                    placeholder="e.g. 10"
                  />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Add New Images (optional)</label>
                <input
                  ref={editFileRef}
                  className="form-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={e => setEditVariantFiles(Array.from(e.target.files))}
                />
                {editVariantFiles.length > 0 && (
                  <span className="file-count">{editVariantFiles.length} file(s) selected</span>
                )}
                {editVariant.images && editVariant.images.length > 0 && (
                  <span className="file-count" style={{ color: 'var(--text-light)' }}>
                    Current: {editVariant.images.length} image(s)
                  </span>
                )}
              </div>
              {editVariantError && <div className="form-error">{editVariantError}</div>}
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowEditVariant(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={editVariantSubmitting}>
                  {editVariantSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
