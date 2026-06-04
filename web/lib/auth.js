'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from './api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [pantryId, setPantryId] = useState(null);
  const [ready, setReady] = useState(false);

  // Restaura a sessão salva ao carregar.
  useEffect(() => {
    try {
      const u = localStorage.getItem('valia:user');
      const p = localStorage.getItem('valia:pantryId');
      if (u) setUser(JSON.parse(u));
      if (p) setPantryId(p);
    } catch {}
    setReady(true);
  }, []);

  function persist(data) {
    localStorage.setItem('valia:token', data.token);
    localStorage.setItem('valia:user', JSON.stringify(data.user));
    if (data.pantryId) localStorage.setItem('valia:pantryId', data.pantryId);
    setUser(data.user);
    if (data.pantryId) setPantryId(data.pantryId);
  }

  async function signIn(credentials) {
    const data = await authService.login(credentials);
    persist(data);
  }

  async function signUp(payload) {
    const data = await authService.register(payload);
    persist(data);
  }

  function signOut() {
    localStorage.removeItem('valia:token');
    localStorage.removeItem('valia:user');
    localStorage.removeItem('valia:pantryId');
    setUser(null);
    setPantryId(null);
  }

  return (
    <AuthContext.Provider value={{ user, pantryId, ready, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
