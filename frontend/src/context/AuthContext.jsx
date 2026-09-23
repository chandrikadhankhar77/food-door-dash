import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authService } from '../services/authService';
import { TOKEN_KEY, USER_KEY } from '../utils/constants';
import { getErrorMessage } from '../utils/formatPrice';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const persist = useCallback((nextUser, nextToken) => {
    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken);
      setToken(nextToken);
    }
    if (nextUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
    }
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setLoading(false);
      return null;
    }
    try {
      const data = await authService.me();
      const nextUser = data?.user || data;
      persist(nextUser, storedToken);
      return nextUser;
    } catch {
      clear();
      return null;
    } finally {
      setLoading(false);
    }
  }, [clear, persist]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    const nextToken = data.token;
    if (!nextToken) throw new Error('No token returned from login');
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    // Fetch full profile (addresses, restaurant link, etc.)
    try {
      const meData = await authService.me();
      const nextUser = meData?.user || meData || data.user;
      persist(nextUser, nextToken);
      return nextUser;
    } catch {
      const nextUser = data.user || data;
      persist(nextUser, nextToken);
      return nextUser;
    }
  };

  const register = async (payload) => {
    const data = await authService.register(payload);
    const nextToken = data.token;
    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken);
      setToken(nextToken);
      try {
        const meData = await authService.me();
        const nextUser = meData?.user || meData || data.user;
        persist(nextUser, nextToken);
        return nextUser;
      } catch {
        const nextUser = data.user || data;
        persist(nextUser, nextToken);
        return nextUser;
      }
    }
    return data.user || data;
  };

  const logout = () => {
    clear();
  };

  const updateProfile = async (payload) => {
    const data = await authService.updateProfile(payload);
    const nextUser = data.user || data;
    persist(nextUser, token);
    return nextUser;
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
      updateProfile,
      refreshUser,
      setUser: (u) => persist(u, token),
      getErrorMessage,
    }),
    [user, token, loading, persist, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
