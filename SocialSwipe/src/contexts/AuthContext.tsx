// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Adjust path if needed
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  // You could add login/logout functions here later if needed
}

// Create context with a default value
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
       console.error("AuthContext: Error getting initial session:", error);
       setLoading(false);
    });


    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        // If the listener provides the session, we're definitely not loading the initial state anymore
        if (loading) setLoading(false);
      }
    );

    // 3. Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, [loading]); // Rerun effect if loading state changes (might happen if listener fires fast)

  const value = {
    session,
    user,
    loading,
  };

  // Don't render children until initial auth check is complete
  // Or render children immediately and let them handle loading state individually
  // Let's render immediately to avoid layout shifts
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};