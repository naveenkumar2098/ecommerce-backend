import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth, STAFF_ROLES } from '../auth';
import { Field, FormError } from '../components/ui';

const useAfterSignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  return (role) => {
    const from = location.state?.from;
    navigate(from || (STAFF_ROLES.includes(role) ? '/workspace' : '/'), { replace: true });
  };
};

function useForm(initial) {
  const [values, setValues] = useState(initial);
  const [fields, setFields] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const bind = (name) => ({
    name,
    value: values[name],
    onChange: (e) => setValues((v) => ({ ...v, [name]: e.target.value })),
  });
  const submit = (action) => async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setFields({});
    try {
      await action(values);
    } catch (err) {
      setFields(err.fields || {});
      setError(Object.keys(err.fields || {}).length ? '' : err.message);
    } finally {
      setBusy(false);
    }
  };
  return { values, bind, submit, fields, error, busy };
}

export function SignIn() {
  const { signIn } = useAuth();
  const after = useAfterSignIn();
  const form = useForm({ email: '', password: '' });

  return (
    <section className="page narrow">
      <h1 className="page-title">Sign in</h1>
      <form className="form" onSubmit={form.submit(async ({ email, password }) => {
        await signIn(email, password);
        const me = await api('/auth/me');
        after(me.role);
      })} noValidate>
        <Field label="Email" type="email" autoComplete="email" required error={form.fields.email} {...form.bind('email')} />
        <Field label="Password" type="password" autoComplete="current-password" required error={form.fields.password} {...form.bind('password')} />
        <FormError error={form.error && (form.error === 'Invalid credentials' ? 'That email and password don’t match an account.' : form.error)} />
        <button className="button button--primary" type="submit" disabled={form.busy}>
          {form.busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="form-links">
        <Link to="/forgot-password">Forgot your password?</Link>
        <span>New here? <Link to="/sign-up">Create an account</Link></span>
      </p>
    </section>
  );
}

export function SignUp() {
  const { signUp } = useAuth();
  const after = useAfterSignIn();
  const form = useForm({ name: '', email: '', password: '' });

  return (
    <section className="page narrow">
      <h1 className="page-title">Create an account</h1>
      <form className="form" onSubmit={form.submit(async ({ name, email, password }) => {
        await signUp(name, email, password);
        after('customer');
      })} noValidate>
        <Field label="Name" autoComplete="name" required error={form.fields.name} {...form.bind('name')} />
        <Field label="Email" type="email" autoComplete="email" required error={form.fields.email} {...form.bind('email')} />
        <Field
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          hint="At least 6 characters."
          error={form.fields.password}
          {...form.bind('password')}
        />
        <FormError error={form.error} />
        <button className="button button--primary" type="submit" disabled={form.busy}>
          {form.busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="form-links">
        <span>Already have an account? <Link to="/sign-in">Sign in</Link></span>
      </p>
    </section>
  );
}

export function ForgotPassword() {
  const [sentMessage, setSentMessage] = useState('');
  const form = useForm({ email: '' });

  return (
    <section className="page narrow">
      <h1 className="page-title">Reset your password</h1>
      {sentMessage ? (
        <>
          <p className="lede">{sentMessage}. The link works for 10 minutes.</p>
          <Link className="button" to="/sign-in">Back to sign in</Link>
        </>
      ) : (
        <>
          <p className="lede">Enter the email you signed up with and we’ll send you a reset link.</p>
          <form className="form" onSubmit={form.submit(async ({ email }) => {
            const res = await api('/auth/forgotpassword', { method: 'POST', body: { email } });
            setSentMessage(res.message);
          })} noValidate>
            <Field label="Email" type="email" autoComplete="email" required error={form.fields.email} {...form.bind('email')} />
            <FormError error={form.error} />
            <button className="button button--primary" type="submit" disabled={form.busy}>
              {form.busy ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        </>
      )}
    </section>
  );
}

export function ResetPassword() {
  const { token } = useParams();
  const { acceptToken } = useAuth();
  const navigate = useNavigate();
  const form = useForm({ password: '' });

  return (
    <section className="page narrow">
      <h1 className="page-title">Choose a new password</h1>
      <form className="form" onSubmit={form.submit(async ({ password }) => {
        const res = await api(`/auth/resetpassword/${token}`, { method: 'PUT', body: { password } });
        await acceptToken(res.token);
        navigate('/', { replace: true });
      })} noValidate>
        <Field
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          hint="At least 6 characters."
          error={form.fields.password}
          {...form.bind('password')}
        />
        <FormError
          error={form.error && (form.error === 'Invalid or expired token'
            ? 'This reset link has expired or was already used. Request a new one.'
            : form.error)}
        />
        <button className="button button--primary" type="submit" disabled={form.busy}>
          {form.busy ? 'Saving…' : 'Save new password'}
        </button>
      </form>
      <p className="form-links"><Link to="/forgot-password">Request a new link</Link></p>
    </section>
  );
}
