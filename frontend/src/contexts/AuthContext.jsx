import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.get('/auth/profile')
        .then(res => { setUser(res.data); })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = useCallback((userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('role', userData.role);
    setToken(userData.token);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = !!token && !!user;
  const isTeacher = user?.role === 'teacher' || user?.role === 'faculty';
  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'superadmin';

  const contextValue = useMemo(() => ({
    user,
    token,
    loading,
    isAuthenticated,
    isTeacher,
    isStudent,
    isAdmin,
    isSuperAdmin,
    login,
    logout
  }), [user, token, loading, isAuthenticated, isTeacher, isStudent, isAdmin, isSuperAdmin, login, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };