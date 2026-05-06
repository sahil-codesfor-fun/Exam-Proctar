import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Hardcoded to true just for your frontend testing, bro!
  const [isAuthenticated, setIsAuthenticated] = useState(true); 

  return (
    <AuthContext.Provider value={{ isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};