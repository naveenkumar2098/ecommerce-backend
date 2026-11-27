import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { useToast } from '../toast';
import { formatDate, formatPrice, shortId } from '../format';
import { Field, FormError, LoadState, OrderSteps, StatusBadge, useLoad } from '../components/ui';

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const order = useLoad(() => api(`/orders/${id}`), [id]);
  const issues = useLoad(() => api(`/issues/${user._id}/allIssues`), [user._id]);

  if (order.error?.status === 404 || order.error?.status === 400) {
    return (
      <section className="page narrow">
        <h1 className="page-title">Order not found</h1>
        <p className="lede">It may belong to a different account.</p>
        <Link className="button" to="/orders">See your orders</Link>
      </section>
    );
  }

  const o = order.data;
  const related = (issues.data || []).filter((i) => String(i.orderId) === id);

  return (
    <LoadState loading={order.loading && !o} error={order.error} onRetry={order.reload} label="Loading order…">
      {o && (
        <section className="page order">
          <Link className="back-link" to="/orders">Your orders</Link>
          <h1 className="page-title">Order {shortId(o._id)}</h1>
          <p className="muted">Placed {formatDate(o.createdAt)}</p>
          <OrderSteps status={o.status} />

          <table className="table">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col" className="num">Qty</th>
                <th scope="col" className="num">Unit price</th>
              </tr>
            </thead>
            <tbody>
              {o.products.map((line) => (
                <tr key={line._id}>
                  <td data-label="Item">
                    {line.product ? (
                      <Link to={`/products/${line.product._id}`}>{line.product.name}</Link>
                    ) : (
                      <span className="muted">Product no longer listed</span>
                    )}
                  </td>
                  <td data-label="Qty" className="num">{line.quantity}</td>
                  <td data-label="Unit price" className="num">{line.product ? formatPrice(line.product.price) : 'n/a'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={2}>Total charged</th>
                <td className="num price">{formatPrice(o.totalPrice)}</td>
              </tr>
            </tfoot>
          </table>

          <h2 className="section-title">Problems with this order</h2>
          {related.length > 0 && (
            <ul className="issue-list">
              {related.map((i) => (
                <li key={i._id} className="issue-item">
                  <div>
                    <p className="issue-item__title">{i.title}</p>
                    <p className="muted">{i.description}</p>
                  </div>
                  <StatusBadge status={i.status} />
                </li>
              ))}
            </ul>
          )}
          <ReportProblem orderId={o._id} onReported={issues.reload} />
        </section>
      )}
    </LoadState>
  );
}

function ReportProblem({ orderId, onReported }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const notify = useToast();

  if (!open) {
    return (
      <button type="button" className="button" onClick={() => setOpen(true)}>
        Report a problem
      </button>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setFields({});
    try {
      await api('/issues', { method: 'POST', body: { title, description, orderId } });
      notify('Problem reported. Support will follow up.');
      setOpen(false);
      setTitle('');
      setDescription('');
      onReported();
    } catch (err) {
      setFields(err.fields || {});
      if (!Object.keys(err.fields || {}).length) setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form panel" onSubmit={submit} noValidate>
      <Field label="What went wrong?" placeholder="For example: arrived damaged" value={title} onChange={(e) => setTitle(e.target.value)} error={fields.title} required />
      <Field
        label="Details"
        as="textarea"
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        hint="Include anything that helps support sort it out quickly."
        error={fields.description}
        required
      />
      <FormError error={error} />
      <div className="button-row">
        <button className="button button--primary" type="submit" disabled={busy}>
          {busy ? 'Reporting…' : 'Report problem'}
        </button>
        <button className="button button--quiet" type="button" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}
