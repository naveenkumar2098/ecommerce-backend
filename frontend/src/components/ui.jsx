import { useCallback, useEffect, useState } from 'react';
import { ORDER_STEPS, statusText } from '../format';

export function Field({ label, error, hint, id, as = 'input', children, ...props }) {
  const fieldId = id || `f-${label.toLowerCase().replace(/\W+/g, '-')}`;
  const Tag = as;
  const describedBy = [hint && `${fieldId}-hint`, error && `${fieldId}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label className="field__label" htmlFor={fieldId}>{label}</label>
      <Tag
        id={fieldId}
        className="field__control"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        {...props}
      >
        {children}
      </Tag>
      {hint && <p id={`${fieldId}-hint`} className="field__hint">{hint}</p>}
      {error && <p id={`${fieldId}-error`} className="field__error">{error}</p>}
    </div>
  );
}

export function FormError({ error }) {
  if (!error) return null;
  return <p className="form-error" role="alert">{error}</p>;
}

export function StatusBadge({ status }) {
  return <span className={`badge badge--${status}`}>{statusText(status)}</span>;
}

// Processing → shipped → delivered is a real sequence, so it's shown as one.
export function OrderSteps({ status }) {
  if (status === 'cancelled') {
    return <p className="order-steps order-steps--cancelled">This order was cancelled. Any stock it held has been released.</p>;
  }
  const current = ORDER_STEPS.indexOf(status);
  return (
    <ol className="order-steps" aria-label="Order progress">
      {ORDER_STEPS.map((step, i) => (
        <li
          key={step}
          className={i <= current ? 'order-steps__step is-done' : 'order-steps__step'}
          aria-current={i === current ? 'step' : undefined}
        >
          {statusText(step)}
        </li>
      ))}
    </ol>
  );
}

// Loads data on mount and on demand; keeps the last result while reloading.
export function useLoad(loader, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await loader();
      setState({ data, error: null, loading: false });
    } catch (error) {
      setState((s) => ({ ...s, error, loading: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    run();
  }, [run]);
  return { ...state, reload: run, setData: (data) => setState((s) => ({ ...s, data })) };
}

export function LoadState({ loading, error, onRetry, children, label = 'Loading…' }) {
  if (error) {
    return (
      <div className="load-error" role="alert">
        <p>{error.message}</p>
        {onRetry && <button type="button" className="button button--quiet" onClick={onRetry}>Try again</button>}
      </div>
    );
  }
  if (loading) return <p className="page-status">{label}</p>;
  return children;
}

// Two-step destructive button: first click arms it, second click confirms.
export function ConfirmButton({ label, confirmLabel, onConfirm, disabled }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return undefined;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      className={armed ? 'button button--danger' : 'button button--quiet'}
      disabled={disabled}
      onClick={() => (armed ? (setArmed(false), onConfirm()) : setArmed(true))}
    >
      {armed ? confirmLabel : label}
    </button>
  );
}
