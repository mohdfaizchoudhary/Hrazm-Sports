import { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user_data');

    let cachedUser = null;
    if (token && savedUser) {
      try {
        cachedUser = JSON.parse(savedUser);
        setUser(cachedUser);
        setLoading(false);
      } catch {
        setUser(null);
      }
    }

    if (token) {
      API.get('/auth/profile/')
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('user_data', JSON.stringify(res.data));
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          if (!cachedUser) setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await API.post('/auth/login/', { email, password });
    const accessToken = res.data.access || res.data.tokens?.access;
    const refreshToken = res.data.refresh || res.data.tokens?.refresh;
    const userData = res.data.user;

    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user_data', JSON.stringify(userData));
    setUser(userData);
    return res.data;
  };

  const register = async (formData) => {
    const res = await API.post('/auth/register/', formData);
    const accessToken = res.data.access || res.data.tokens?.access;
    const refreshToken = res.data.refresh || res.data.tokens?.refresh;
    const userData = res.data.user;

    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user_data', JSON.stringify(userData));
    setUser(userData);
    return res.data;
  };

  const loginWithGoogle = async (credential) => {
    const res = await API.post('/auth/google/', { token: credential });
    const accessToken = res.data.access || res.data.tokens?.access;
    const refreshToken = res.data.refresh || res.data.tokens?.refresh;
    const userData = res.data.user;

    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user_data', JSON.stringify(userData));
    setUser(userData);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};