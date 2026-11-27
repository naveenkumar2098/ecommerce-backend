import { useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { useToast } from '../../toast';
import { formatPrice } from '../../format';
import StockMeter from '../../components/StockMeter';
import { ConfirmButton, Field, FormError, LoadState, useLoad } from '../../components/ui';

const EMPTY = { name: '', description: '', price: '', stock: '', category: '' };

export default function ManageProducts() {
  const { user } = useAuth();
  const list = useLoad(() => api('/products/manage'), []);
  const [editing, setEditing] = useState(null); // null | 'new' | product id
  const notify = useToast();

  const replace = (updated) => list.setData(list.data.map((p) => (p._id === updated._id ? updated : p)));

  const toggle = async (p) => {
    try {
      const updated = await api(`/products/${p._id}/toggle`, { method: 'PATCH' });
      replace(updated);
      notify(updated.isActive ? `${p.name} is on sale` : `${p.name} is hidden from the shop`);
    } catch (err) {
      notify(err.message);
    }
  };

  const remove = async (p) => {
    try {
      await api(`/products/${p._id}`, { method: 'DELETE' });
      list.setData(list.data.filter((x) => x._id !== p._id));
      notify(`Deleted ${p.name}`);
    } catch (err) {
      notify(err.message);
    }
  };

  const saved = (product, isNew) => {
    list.setData(isNew ? [product, ...list.data] : list.data.map((p) => (p._id === product._id ? product : p)));
    setEditing(null);
    notify(isNew ? `Added ${product.name}` : `Saved ${product.name}`);
  };

  return (
    <section className="ws-section">
      <div className="ws-section__head">
        <h2 className="section-title">{user.role === 'admin' ? 'All products' : 'Your products'}</h2>
        {editing !== 'new' && (
          <button type="button" className="button button--primary" onClick={() => setEditing('new')}>
            Add product
          </button>
        )}
      </div>

      {editing === 'new' && <ProductForm onSaved={(p) => saved(p, true)} onCancel={() => setEditing(null)} />}

      <LoadState loading={list.loading && !list.data} error={list.error} onRetry={list.reload} label="Loading products…">
        {(list.data || []).length === 0 ? (
          <div className="empty">
            <p className="empty__title">No products yet.</p>
            <p>Add your first product and it goes on sale in the shop straight away.</p>
          </div>
        ) : (
          <ul className="manage-list">
            {list.data.map((p) =>
              editing === p._id ? (
                <li key={p._id}>
                  <ProductForm product={p} onSaved={(x) => saved(x, false)} onCancel={() => setEditing(null)} />
                </li>
              ) : (
                <li key={p._id} className={p.isActive ? 'manage-row' : 'manage-row is-hidden'}>
                  <div className="manage-row__main">
                    <p className="manage-row__name">{p.name}</p>
                    <p className="muted">
                      {p.category} {!p.isActive && <span className="badge badge--closed">Hidden from shop</span>}
                    </p>
                  </div>
                  <p className="price">{formatPrice(p.price)}</p>
                  <StockMeter stock={p.stock} />
                  <div className="button-row">
                    <button type="button" className="button button--quiet" onClick={() => setEditing(p._id)}>Edit</button>
                    <button type="button" className="button button--quiet" onClick={() => toggle(p)}>
                      {p.isActive ? 'Hide from shop' : 'Put on sale'}
                    </button>
                    <ConfirmButton label="Delete" confirmLabel="Confirm delete" onConfirm={() => remove(p)} />
                  </div>
                </li>
              )
            )}
          </ul>
        )}
      </LoadState>
    </section>
  );
}

function ProductForm({ product, onSaved, onCancel }) {
  const [values, setValues] = useState(
    product
      ? { name: product.name, description: product.description, price: String(product.price), stock: String(product.stock), category: product.category }
      : EMPTY
  );
  const [fields, setFields] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const bind = (name) => ({ value: values[name], onChange: (e) => setValues((v) => ({ ...v, [name]: e.target.value })), error: fields[name] });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setFields({});
    const body = { ...values, price: values.price === '' ? '' : Number(values.price), stock: values.stock === '' ? '' : Number(values.stock) };
    try {
      const saved = product
        ? await api(`/products/${product._id}`, { method: 'PUT', body })
        : await api('/products', { method: 'POST', body });
      onSaved(saved);
    } catch (err) {
      setFields(err.fields || {});
      if (!Object.keys(err.fields || {}).length) setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const prefix = product ? `edit-${product._id}` : 'new';
  return (
    <form className="form panel product-form" onSubmit={submit} noValidate>
      <h3 className="panel__title">{product ? `Edit ${product.name}` : 'New product'}</h3>
      <Field id={`${prefix}-name`} label="Name" required {...bind('name')} />
      <Field id={`${prefix}-category`} label="Category" placeholder="Audio, Power, Cables…" required {...bind('category')} />
      <Field id={`${prefix}-description`} label="Description" as="textarea" rows={3} required {...bind('description')} />
      <div className="form-grid">
        <Field id={`${prefix}-price`} label="Price (USD)" type="number" min="0" step="0.01" inputMode="decimal" required {...bind('price')} />
        <Field id={`${prefix}-stock`} label="Units in stock" type="number" min="0" step="1" inputMode="numeric" required {...bind('stock')} />
      </div>
      <FormError error={error} />
      <div className="button-row">
        <button type="submit" className="button button--primary" disabled={busy}>
          {busy ? 'Saving…' : product ? 'Save changes' : 'Add product'}
        </button>
        <button type="button" className="button button--quiet" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
