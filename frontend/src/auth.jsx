import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from './api';

const AuthContext = createContext(null);

export const STAFF_ROLES = ['admin', 'supplier', 'support'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!getToken());

  const loadMe = useCallback(async () => {
    try {
      setUser(await api('/auth/me'));
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (getToken()) loadMe();
    const onSignedOut = () => setUser(null);
    window.addEventListener('ohm:signed-out', onSignedOut);
    return () => window.removeEventListener('ohm:signed-out', onSignedOut);
  }, [loadMe]);

  const signIn = useCallback(
    async (email, password) => {
      const { token } = await api('/auth/login', { method: 'POST', body: { email, password } });
      setToken(token);
      await loadMe();
    },
    [loadMe]
  );

  const signUp = useCallback(
    async (name, email, password) => {
      const { token } = await api('/auth/register', { method: 'POST', body: { name, email, password } });
      setToken(token);
      await loadMe();
    },
    [loadMe]
  );

  const acceptToken = useCallback(
    async (token) => {
      setToken(token);
      await loadMe();
    },
    [loadMe]
  );

  const signOut = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // Tokens are stateless; dropping it locally is what signs the user out.
    }
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      isStaff: !!user && STAFF_ROLES.includes(user.role),
      signIn,
      signUp,
      signOut,
      acceptToken,
      refresh: loadMe,
    }),
    [user, ready, signIn, signUp, signOut, acceptToken, loadMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
