import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import apiClient from '@/api/client';

type User = {
  id: string;
  email: string;
  phoneNumber: string;
  userType: 'client' | 'service_provider' | 'admin';
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Navigation logic moved to useProtectedRoute hook to avoid navigation context errors
  // during initial render.
  
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        const userData = await SecureStore.getItemAsync('user_data');

        if (token && userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Failed to load user', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const signIn = async (token: string, newUser: User) => {
    try {
      await SecureStore.setItemAsync('auth_token', token);
      await SecureStore.setItemAsync('user_data', JSON.stringify(newUser));
      setUser(newUser);
      
      // Navigation is handled by the useEffect above or manually in the login component
    } catch (error) {
      console.error('Sign in failed', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user_data');
      setUser(null);
      // Navigation handled by useProtectedRoute
    } catch (error) {
      console.error('Sign out failed', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
