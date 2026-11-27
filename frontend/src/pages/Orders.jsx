import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { formatDate, formatPrice, shortId } from '../format';
import { LoadState, StatusBadge, useLoad } from '../components/ui';

export default function Orders() {
  const { user } = useAuth();
  const orders = useLoad(() => api(`/orders/${user._id}/allOrders`), [user._id]);
  const issues = useLoad(() => api(`/issues/${user._id}/allIssues`), [user._id]);
  const sorted = [...(orders.data || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <section className="page">
      <h1 className="page-title">Your orders</h1>
      <LoadState loading={orders.loading && !orders.data} error={orders.error} onRetry={orders.reload} label="Loading orders…">
        {sorted.length === 0 ? (
          <div className="empty">
            <p className="empty__title">No orders yet.</p>
            <p>When you place an order it shows up here with its delivery status.</p>
            <Link className="button button--primary" to="/">Browse the shop</Link>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Placed</th>
                <th scope="col">Items</th>
                <th scope="col" className="num">Total</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((o) => (
                <tr key={o._id}>
                  <td data-label="Order"><Link to={`/orders/${o._id}`}>{shortId(o._id)}</Link></td>
                  <td data-label="Placed">{formatDate(o.createdAt)}</td>
                  <td data-label="Items">{o.products.reduce((n, l) => n + l.quantity, 0)}</td>
                  <td data-label="Total" className="num">{formatPrice(o.totalPrice)}</td>
                  <td data-label="Status"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </LoadState>

      <h2 className="section-title">Problems you’ve reported</h2>
      <LoadState loading={issues.loading && !issues.data} error={issues.error} onRetry={issues.reload} label="Loading reports…">
        {(issues.data || []).length === 0 ? (
          <p className="muted">None. If something goes wrong with an order, open it and choose “Report a problem”.</p>
        ) : (
          <ul className="issue-list">
            {issues.data.map((i) => (
              <li key={i._id} className="issue-item">
                <div>
                  <p className="issue-item__title">{i.title}</p>
                  <p className="muted">
                    About order <Link to={`/orders/${i.orderId}`}>{shortId(i.orderId)}</Link>, reported {formatDate(i.createdAt)}
                  </p>
                </div>
                <StatusBadge status={i.status} />
              </li>
            ))}
          </ul>
        )}
      </LoadState>
    </section>
  );
}
