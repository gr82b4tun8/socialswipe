// src/lib/supabaseClient.ts (Updated Access)
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

// Access variables via process.env
// We'll configure Babel to load these from .env during local dev
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Runtime check - crucial!
if (!supabaseUrl || !supabaseAnonKey) {
    // In development, provide a more helpful error message.
    // In production (using EAS Secrets), this check helps catch missing secrets.
    const message = "Supabase URL or Anon Key is missing. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in your .env file (for local dev) or EAS Secrets (for builds).";
    console.error(message);
    // Optionally, throw an error in development to halt execution
    if (__DEV__) { // __DEV__ is a global variable available in React Native/Expo
         throw new Error(message);
    }
    // In production, you might want to log this error to your monitoring service
    // and potentially show a user-friendly error state in the UI.
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// AppState listener remains the same...
AppState.addEventListener('change', (state) => {
    if (state === 'active') {
        supabase.auth.startAutoRefresh();
    } else {
        supabase.auth.stopAutoRefresh();
    }
});