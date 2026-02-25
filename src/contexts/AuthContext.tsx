import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/user';
import { mockUsers } from '@/data/mockUsers';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Omit<User, 'id' | 'isActive' | 'lastLogin'> & { password: string }) => Promise<boolean>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Get users from localStorage or use mock data
      const usersData = localStorage.getItem('users');
      const users = usersData ? JSON.parse(usersData) : mockUsers;
      
      // Find user by email
      const foundUser = users.find((u: User & { password?: string }) => u.email === email);
      
      if (!foundUser) {
        return false;
      }

      // For demo purposes, accept any password for existing users
      // In real app, you'd verify the password hash
      const userWithoutPassword = { ...foundUser };
      delete userWithoutPassword.password;
      
      // Update last login
      userWithoutPassword.lastLogin = new Date();
      
      setUser(userWithoutPassword);
      setIsAuthenticated(true);
      
      // Save to localStorage
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (userData: Omit<User, 'id' | 'isActive' | 'lastLogin'> & { password: string }): Promise<boolean> => {
    try {
      // Get existing users from localStorage or use mock data
      const usersData = localStorage.getItem('users');
      const users = usersData ? JSON.parse(usersData) : [...mockUsers];
      
      // Check if email already exists
      if (users.find((u: User) => u.email === userData.email)) {
        return false;
      }
      
      // Create new user
      const newUser: User & { password: string } = {
        ...userData,
        id: `user_${Date.now()}`,
        isActive: true,
        lastLogin: new Date(),
      };
      
      // Add to users array
      users.push(newUser);
      
      // Save users to localStorage
      localStorage.setItem('users', JSON.stringify(users));
      
      // Auto-login the new user
      const userWithoutPassword = { ...newUser };
      delete userWithoutPassword.password;
      
      setUser(userWithoutPassword);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
  };

  const value: AuthState = {
    user,
    isAuthenticated,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};