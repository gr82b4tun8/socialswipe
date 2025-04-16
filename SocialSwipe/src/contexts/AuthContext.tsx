// src/contexts/AuthContext.tsx (FIXED)
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useCallback // <-- Import useCallback
} from 'react';
import { supabase } from '@/lib/supabaseClient'; // Adjust path if needed
import { Session, User } from '@supabase/supabase-js';

// Define an interface for your profile data (Adjust properties as needed)
interface Profile {
  id: string;
  profile_type: 'personal' | 'business' | null;
  first_name?: string;
  business_name?: string;
  // Add other profile fields you expect from your 'profiles' table
  // e.g., last_name?: string; date_of_birth?: string; etc.
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loadingAuth: boolean;
  loadingProfile: boolean;
  refreshProfile: () => Promise<void>; // <-- ADDED refresh function type
}

// Create context with a default value
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loadingAuth: true,
  loadingProfile: true,
  refreshProfile: async () => {}, // <-- Add default empty async function
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // --- Fetch Profile Logic (wrapped in useCallback) ---
  const fetchProfile = useCallback(async (userId: string | undefined) => {
    // Accept undefined userId for easier handling
    if (!userId) {
      console.log('[AuthContext] fetchProfile called without userId, clearing profile.');
      setProfile(null);
      setLoadingProfile(false); // Stop loading if no user
      return;
    }

    console.log('[AuthContext] Attempting to fetch profile for user ID:', userId);
    setLoadingProfile(true); // Start loading profile
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`*, profile_type`) // Select all columns and explicitly profile_type
        .eq('user_id', userId)
        .single();

      // Log the raw response regardless of error for debugging
      console.log('[AuthContext] Profile fetch response:', { data, error, status });

      if (error && status !== 406) { // 406 means no row found (expected if profile not created yet)
        console.error('[AuthContext] Error fetching profile:', error);
        throw error; // Throw other errors
      }

      if (data) {
        console.log('[AuthContext] Profile data found, setting profile state. Profile Type:', data.profile_type);
        setProfile(data as Profile); // Set profile state
      } else {
        console.log('[AuthContext] No profile row found for user.');
        setProfile(null); // Set profile to null if no row exists yet
      }

    } catch (error) {
      console.error('[AuthContext] CATCH block: Error during profile fetch:', error);
      setProfile(null); // Ensure profile is null on error
    } finally {
      setLoadingProfile(false); // Stop loading profile, regardless of outcome
    }
  }, []); // <-- useCallback dependency array is empty (fetch logic itself doesn't depend on context state)


  // --- Manual Refresh Function --- <<< --- ADDED --- >>>
  const refreshProfile = useCallback(async () => {
    console.log("[AuthContext] Manual refreshProfile called.");
    const currentUserId = session?.user?.id; // Get ID from current session state
    await fetchProfile(currentUserId); // Re-run fetch logic
  }, [session, fetchProfile]); // <-- Depends on current session and the memoized fetchProfile function


  // --- Effect for Initial Session Check AND Profile Fetch ---
  useEffect(() => {
    let isMounted = true; // Prevent state updates on unmounted component

    // 1. Check initial session
    setLoadingAuth(true);
    setLoadingProfile(true); // Also loading profile initially
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
        if (!isMounted) return;
        console.log("[AuthContext] Initial session fetched:", initialSession ? 'Exists' : 'None');
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        // --- Fetch profile if initial session exists ---
        // Use the memoized fetchProfile, pass the ID directly
        await fetchProfile(initialSession?.user?.id);
        // --- End Profile Fetch ---

        // Set loadingAuth false AFTER the initial profile fetch attempt
        setLoadingAuth(false);
    }).catch((error) => {
        if (!isMounted) return;
        console.error("[AuthContext] Error getting initial session:", error);
        setLoadingAuth(false);
        setLoadingProfile(false); // Also stop profile loading on error
    });

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, updatedSession) => {
        if (!isMounted) return;
        console.log("[AuthContext] Auth state changed. New session:", updatedSession ? 'Exists' : 'None', 'Event:', _event);

        // Capture the current user ID *before* potentially triggering re-renders with setState
        const currentUserId = updatedSession?.user?.id;
        // Read previous user ID from the current state *before* updating it
        const previousUserId = user?.id; // <<< --- FIX: Read previous user ID from state --- >>>

        // Update session and user state
        setSession(updatedSession);
        setUser(updatedSession?.user ?? null);

        // --- Fetch profile logic based on the auth change ---
        if (currentUserId) {
            // Fetch profile if:
            // 1. It's a new user (ID changed from previous state)
            // 2. Or if the profile state is currently null (e.g., first login, or after failed fetch)
            if (!previousUserId || previousUserId !== currentUserId || !profile) {
                console.log("[AuthContext] Auth change detected new user or missing profile, fetching profile.");
                // Fetch profile using the ID from the updated session
                await fetchProfile(currentUserId);
            } else {
                console.log("[AuthContext] Skipping profile fetch on auth change, user seems unchanged and profile exists.");
                // <<< --- FIX: Ensure loading is false if we skip the fetch --- >>>
                if (isMounted) setLoadingProfile(false);
            }
        } else {
            // Logged out, clear profile
            console.log("[AuthContext] Auth change detected logout, clearing profile.");
            if (isMounted) {
                setProfile(null);
                setLoadingProfile(false); // Not loading profile if logged out
            }
        }
        // --- End Profile Fetch ---

        // Auth state is resolved, so initial auth loading is done (if not already).
        // This might run even if fetchProfile is still running, which is generally okay.
        if (isMounted) setLoadingAuth(false);
      }
    );

    // 3. Cleanup subscription on unmount
    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  // <<< --- FIX: REMOVED 'profile' from dependency array to prevent loop --- >>>
  // The effect should only depend on the memoized 'fetchProfile' function reference.
  // It does NOT need to depend on 'profile' or 'user' state directly in the deps array,
  // as changes to those are handled *within* the auth listener callback logic.
  }, [fetchProfile]); // <-- CORRECTED Dependency Array


  // Context value now includes profile and separate loading states AND refresh function
  const value = {
    session,
    user,
    profile,
    loadingAuth,
    loadingProfile,
    refreshProfile, // <-- Provide refresh function
  };

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