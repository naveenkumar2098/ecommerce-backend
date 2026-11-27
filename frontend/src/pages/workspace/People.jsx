import { api } from '../../api';
import { useAuth } from '../../auth';
import { useToast } from '../../toast';
import { formatDate, ROLES, statusText } from '../../format';
import { ConfirmButton, LoadState, useLoad } from '../../components/ui';

export default function People() {
  const { user: me } = useAuth();
  const list = useLoad(() => api('/users'), []);
  const notify = useToast();

  const setRole = async (u, role) => {
    try {
      const updated = await api(`/users/${u._id}`, { method: 'PUT', body: { role } });
      list.setData(list.data.map((x) => (x._id === u._id ? updated : x)));
      notify(`${u.name} is now ${statusText(role).toLowerCase()}`);
    } catch (err) {
      notify(err.message);
    }
  };

  const remove = async (u) => {
    try {
      await api(`/users/${u._id}`, { method: 'DELETE' });
      list.setData(list.data.filter((x) => x._id !== u._id));
      notify(`Deleted ${u.name}’s account`);
    } catch (err) {
      notify(err.message);
    }
  };

  return (
    <section className="ws-section">
      <h2 className="section-title">People</h2>
      <p className="muted">Everyone signs up as a customer. Change a role here to give someone staff access.</p>
      <LoadState loading={list.loading && !list.data} error={list.error} onRetry={list.reload} label="Loading accounts…">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Joined</th>
              <th scope="col">Role</th>
              <th scope="col"><span className="visually-hidden">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {(list.data || []).map((u) => {
              const self = u._id === me._id;
              return (
                <tr key={u._id}>
                  <td data-label="Name">{u.name}{self && ' (you)'}<span className="muted block">{u.email}</span></td>
                  <td data-label="Joined">{formatDate(u.createdAt)}</td>
                  <td data-label="Role">
                    <label className="visually-hidden" htmlFor={`role-${u._id}`}>Role of {u.name}</label>
                    <select id={`role-${u._id}`} className="select" value={u.role} disabled={self} onChange={(e) => setRole(u, e.target.value)}>
                      {ROLES.map((r) => <option key={r} value={r}>{statusText(r)}</option>)}
                    </select>
                  </td>
                  <td data-label="Actions" className="actions">
                    {!self && <ConfirmButton label="Delete" confirmLabel="Confirm delete" onConfirm={() => remove(u)} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </LoadState>
    </section>
  );
}
