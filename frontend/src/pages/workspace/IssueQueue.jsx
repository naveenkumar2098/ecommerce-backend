import { useState } from 'react';
import { api } from '../../api';
import { useToast } from '../../toast';
import { formatDate, ISSUE_STATUSES, shortId, statusText } from '../../format';
import { LoadState, useLoad } from '../../components/ui';
import { FilterSelect } from './ManageOrders';

export default function IssueQueue() {
  const [filter, setFilter] = useState('open');
  const list = useLoad(() => api(filter === 'all' ? '/issues' : `/issues?status=${filter}`), [filter]);
  const notify = useToast();

  const setStatus = async (issue, status) => {
    try {
      await api(`/issues/${issue._id}`, { method: 'PUT', body: { status } });
      notify(`“${issue.title}” marked ${statusText(status).toLowerCase()}`);
      list.reload();
    } catch (err) {
      notify(err.message);
    }
  };

  return (
    <section className="ws-section">
      <div className="ws-section__head">
        <h2 className="section-title">Issues</h2>
        <FilterSelect id="issue-filter" value={filter} onChange={setFilter} options={ISSUE_STATUSES} />
      </div>
      <LoadState loading={list.loading && !list.data} error={list.error} onRetry={list.reload} label="Loading issues…">
        {(list.data || []).length === 0 ? (
          <p className="muted">
            {filter === 'all' ? 'No customer has reported a problem yet.' : `No ${statusText(filter).toLowerCase()} issues right now.`}
          </p>
        ) : (
          <ul className="issue-list">
            {list.data.map((i) => (
              <li key={i._id} className="issue-item issue-item--staff">
                <div>
                  <p className="issue-item__title">{i.title}</p>
                  <p className="issue-item__desc">{i.description}</p>
                  <p className="muted small">
                    {i.userId ? `${i.userId.name} (${i.userId.email})` : 'Deleted account'}, order {shortId(i.orderId)}, reported {formatDate(i.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="visually-hidden" htmlFor={`issue-${i._id}`}>Status of “{i.title}”</label>
                  <select id={`issue-${i._id}`} className="select" value={i.status} onChange={(e) => setStatus(i, e.target.value)}>
                    {ISSUE_STATUSES.map((s) => <option key={s} value={s}>{statusText(s)}</option>)}
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </LoadState>
    </section>
  );
}
