import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api.js';
import { UserRole } from '../types.js';

interface AuthEmployee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  departmentId: string;
  departmentName?: string;
  position: string;
  avatarUrl?: string;
}

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  employee?: AuthEmployee;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_CREDENTIALS: Record<UserRole, { email: string; pass: string; title: string; desc: string }> = {
  ADMIN: {
    email: 'admin@hrflow.internal',
    pass: 'AdminPassword123!',
    title: 'System Administrator',
    desc: 'Platform governance, full audit logs & system health',
  },
  HR: {
    email: 'hr@hrflow.internal',
    pass: 'HrPassword123!',
    title: 'HR Director',
    desc: 'Workforce directory, holiday policies & company analytics',
  },
  MANAGER: {
    email: 'manager@hrflow.internal',
    pass: 'ManagerPassword123!',
    title: 'Engineering Manager',
    desc: 'Direct report approvals, team attendance & leave oversight',
  },
  EMPLOYEE: {
    email: 'employee@hrflow.internal',
    pass: 'EmployeePassword123!',
    title: 'Senior Engineer (Employee)',
    desc: 'Daily punch in/out, leave balance tracking & requests',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('hrflow_token');
      const storedUser = localStorage.getItem('hrflow_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem('hrflow_token');
          localStorage.removeItem('hrflow_user');
        }
      } else {
        // Auto-login default employee demo account for seamless first-visit experience
        try {
          const res = await authApi.login({
            email: DEMO_CREDENTIALS.EMPLOYEE.email,
            password: DEMO_CREDENTIALS.EMPLOYEE.pass,
          });
          if (res.data?.accessToken) {
            localStorage.setItem('hrflow_token', res.data.accessToken);
            localStorage.setItem('hrflow_user', JSON.stringify(res.data.user));
            setUser(res.data.user);
          }
        } catch (e) {
          console.warn('Auto-login failed:', e);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login({ email, password });
      if (res.data?.accessToken) {
        localStorage.setItem('hrflow_token', res.data.accessToken);
        localStorage.setItem('hrflow_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.warn('Logout API failed:', e);
    } finally {
      localStorage.removeItem('hrflow_token');
      localStorage.removeItem('hrflow_user');
      setUser(null);
    }
  };

  const switchRole = async (role: UserRole) => {
    const cred = DEMO_CREDENTIALS[role];
    if (cred) {
      await login(cred.email, cred.pass);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
