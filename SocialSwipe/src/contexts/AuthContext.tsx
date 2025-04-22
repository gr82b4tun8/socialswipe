// src/contexts/AuthContext.tsx (SIMPLIFIED)
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  // useCallback removed as fetchProfile is removed
} from 'react';
import { supabase } from '@/lib/supabaseClient'; // Adjust path if needed
import { Session, User } from '@supabase/supabase-js';

// Profile interface REMOVED - Profile fetching/state is no longer managed here.

// Interface for the context value (simplified)
interface AuthContextType {
  session: Session | null;
  user: User | null;
  loadingAuth: boolean;
  // Removed: profile, loadingProfile, refreshProfile
}

// Create context with a default value reflecting the simplified state
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loadingAuth: true,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  // Removed: profile state, loadingProfile state

  // Removed: fetchProfile function
  // Removed: refreshProfile function

  // Effect for Initial Session Check and Auth State Changes ONLY
  useEffect(() => {
    let isMounted = true; // Prevent state updates on unmounted component

    // 1. Check initial session
    setLoadingAuth(true);
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
        if (!isMounted) return;
        console.log("[AuthContext] Initial session fetched:", initialSession ? 'Exists' : 'None');
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        // No profile fetch here anymore
        setLoadingAuth(false); // Auth loading stops after session check
      }).catch((error) => {
        if (!isMounted) return;
        console.error("[AuthContext] Error getting initial session:", error);
        setLoadingAuth(false);
      });

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, updatedSession) => {
        if (!isMounted) return;
        console.log("[AuthContext] Auth state changed. New session:", updatedSession ? 'Exists' : 'None', 'Event:', _event);

        // Update session and user state ONLY
        setSession(updatedSession);
        setUser(updatedSession?.user ?? null);

        // No profile fetch logic needed here based on auth changes

        // Auth state is resolved, ensure loading is false.
        setLoadingAuth(false);
      }
    );

    // 3. Cleanup subscription on unmount
    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
    // Dependency array is empty as it only runs once on mount and cleans up
  }, []);

  // Context value now only includes auth state
  const value = {
    session,
    user,
    loadingAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the simplified AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // Returns only { session, user, loadingAuth }
  return context;
};