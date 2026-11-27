import { useMemo, useState } from 'react';
import { api } from '../../api';
import { useToast } from '../../toast';
import { formatDate, formatPrice, ORDER_STATUSES, shortId, statusText } from '../../format';
import { LoadState, useLoad } from '../../components/ui';

export default function ManageOrders() {
  const list = useLoad(() => api('/orders'), []);
  const [filter, setFilter] = useState('all');
  const notify = useToast();

  const visible = useMemo(
    () => (list.data || []).filter((o) => filter === 'all' || o.status === filter),
    [list.data, filter]
  );

  const setStatus = async (o, status) => {
    try {
      const updated = await api(`/orders/${o._id}`, { method: 'PUT', body: { status } });
      list.setData(list.data.map((x) => (x._id === o._id ? { ...updated, user: o.user } : x)));
      notify(`Order ${shortId(o._id)} marked ${statusText(status).toLowerCase()}`);
    } catch (err) {
      notify(err.message);
    }
  };

  return (
    <section className="ws-section">
      <div className="ws-section__head">
        <h2 className="section-title">Orders</h2>
        <FilterSelect id="order-filter" value={filter} onChange={setFilter} options={ORDER_STATUSES} />
      </div>
      <LoadState loading={list.loading && !list.data} error={list.error} onRetry={list.reload} label="Loading orders…">
        {visible.length === 0 ? (
          <p className="muted">{filter === 'all' ? 'No orders have been placed yet.' : `No ${statusText(filter).toLowerCase()} orders.`}</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Customer</th>
                <th scope="col">Placed</th>
                <th scope="col" className="num">Total</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => (
                <tr key={o._id}>
                  <td data-label="Order">{shortId(o._id)}</td>
                  <td data-label="Customer">
                    {o.user ? <>{o.user.name}<span className="muted block">{o.user.email}</span></> : <span className="muted">Deleted account</span>}
                  </td>
                  <td data-label="Placed">{formatDate(o.createdAt)}</td>
                  <td data-label="Total" className="num">{formatPrice(o.totalPrice)}</td>
                  <td data-label="Status">
                    {o.status === 'cancelled' ? (
                      <span className="badge badge--cancelled">Cancelled</span>
                    ) : (
                      <>
                        <label className="visually-hidden" htmlFor={`status-${o._id}`}>Status of order {shortId(o._id)}</label>
                        <select id={`status-${o._id}`} className="select" value={o.status} onChange={(e) => setStatus(o, e.target.value)}>
                          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{statusText(s)}</option>)}
                        </select>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </LoadState>
      <p className="muted small">Cancelling returns the order’s items to stock. A cancelled order can’t be reopened.</p>
    </section>
  );
}

export function FilterSelect({ id, value, onChange, options, label = 'Show' }) {
  return (
    <div className="filter">
      <label htmlFor={id} className="filter__label">{label}</label>
      <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="all">All</option>
        {options.map((s) => <option key={s} value={s}>{statusText(s)}</option>)}
      </select>
    </div>
  );
}
