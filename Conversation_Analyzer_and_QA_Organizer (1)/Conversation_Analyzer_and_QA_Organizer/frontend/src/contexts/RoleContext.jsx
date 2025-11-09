import { createContext, useContext, useState, useEffect } from 'react';

const RoleContext = createContext();

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export const RoleProvider = ({ children }) => {
  const [role, setRole] = useState(() => {
    // Load role from localStorage on mount
    return localStorage.getItem('userRole') || null;
  });
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('userName') || '';
  });

  const login = (selectedRole, name = '') => {
    setRole(selectedRole);
    setUserName(name);
    localStorage.setItem('userRole', selectedRole);
    if (name) {
      localStorage.setItem('userName', name);
    }
  };

  const logout = () => {
    setRole(null);
    setUserName('');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
  };

  return (
    <RoleContext.Provider value={{ role, userName, login, logout }}>
      {children}
    </RoleContext.Provider>
  );
};

