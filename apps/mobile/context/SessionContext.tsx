import { use, createContext, type PropsWithChildren } from 'react';
import { useStorageState } from '@/hooks/useStorageState';

type User = {
  id: string;
  email: string;
  phoneNumber: string;
  userType: 'client' | 'service_provider' | 'admin';
};

const AuthContext = createContext<{
  signIn: (token: string, user: User) => void;
  signOut: () => void;
  session?: string | null;
  user?: User | null;
  isLoading: boolean;
}>({
  signIn: () => null,
  signOut: () => null,
  session: null,
  user: null,
  isLoading: false,
});

// Use this hook to access the session
export function useSession() {
  const value = use(AuthContext);
  if (!value) {
    throw new Error('useSession must be wrapped in a <SessionProvider />');
  }

  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState('session');
  const [[isLoadingUser, userStr], setUserStr] = useStorageState('user');

  const user = userStr ? JSON.parse(userStr) as User : null;

  return (
    <AuthContext.Provider
      value={{
        signIn: (token: string, userData: User) => {
          setSession(token);
          setUserStr(JSON.stringify(userData));
        },
        signOut: () => {
          setSession(null);
          setUserStr(null);
        },
        session,
        user,
        isLoading: isLoading || isLoadingUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
