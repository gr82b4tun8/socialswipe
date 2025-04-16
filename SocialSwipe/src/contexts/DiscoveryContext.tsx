// src/contexts/DiscoveryContext.tsx
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
    useMemo,
} from 'react';
import { supabase } from '../lib/supabaseClient'; // Adjust path to your Supabase client
import { useAuth } from './AuthContext'; // Adjust path to your Auth context
import Toast from 'react-native-toast-message'; // Import if using react-native-toast-message

// --- Define Core Types ---
// Matches the Business Profile structure from CreateBusinessProfileScreen and EventCard
export interface BusinessProfile {
    user_id: string;
    business_name: string;
    category: string;
    description?: string | null;
    address_street?: string | null;
    address_city?: string | null;
    address_state?: string | null;
    address_postal_code?: string | null;
    address_country?: string | null;
    phone_number?: string | null;
    business_photo_urls?: string[] | null;
    // Add other profile fields if needed
}

// Represents the current user's interaction data (subset of their profile)
export interface UserInteractionProfile {
    user_id: string;
    liked_profile_user_ids: string[]; // Assumes you added this column (TEXT[] or UUID[])
    // *** REMOVED dismissed_profile_user_ids as we won't persist dismissals ***
}

// --- Define Context Shape ---
interface DiscoveryContextType {
    allProfiles: BusinessProfile[]; // All fetched & potentially discoverable profiles
    currentProfile: BusinessProfile | null; // The profile currently being displayed
    likedProfilesData: BusinessProfile[]; // Full data of liked profiles (optional, could just use IDs)
    userProfileData: UserInteractionProfile | null; // Logged-in user's interaction data
    isLoadingProfiles: boolean; // Loading state for initial fetch/actions
    fetchDiscoveryData: () => Promise<void>; // Renamed from loadInitialData for clarity
    likeProfile: (profileUserId: string) => Promise<void>; // Renamed from saveEvent
    dismissProfile: (profileUserId: string) => Promise<void>; // Renamed from skipEvent - Will handle unliking
    unlikeProfile: (profileUserId: string) => Promise<void>; // Renamed from removeEvent - Still needed for explicit unlikes
    getNextProfile: () => void;
    reloadProfiles: () => void; // *** ADDED reload function type ***
    clearDiscoveryState: () => void;
}

// --- Create Context ---
const DiscoveryContext = createContext<DiscoveryContextType | undefined>(undefined);

// --- Utility: Shuffle Array (Fisher-Yates) ---
function shuffleArray<T>(array: T[]): T[] {
    let currentIndex = array.length, randomIndex;
    const newArray = [...array]; // Create a copy

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [newArray[currentIndex], newArray[randomIndex]] = [
            newArray[randomIndex], newArray[currentIndex]];
    }
    return newArray;
}


// --- Create Provider Component ---
export const DiscoveryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { session } = useAuth(); // Get user session from AuthContext
    const [allProfiles, setAllProfiles] = useState<BusinessProfile[]>([]);
    const [displayableProfiles, setDisplayableProfiles] = useState<BusinessProfile[]>([]); // Filtered & shuffled list
    const [currentProfile, setCurrentProfile] = useState<BusinessProfile | null>(null);
    const [likedProfilesData, setLikedProfilesData] = useState<BusinessProfile[]>([]);
    const [userProfileData, setUserProfileData] = useState<UserInteractionProfile | null>(null);
    const [isLoadingProfiles, setIsLoadingProfiles] = useState<boolean>(false);
    const [hasFetchedInitial, setHasFetchedInitial] = useState(false);

    // Toast function (using react-native-toast-message)
    const showToast = (options: { title?: string; description: string; type?: 'success' | 'error' | 'info' }) => {
        Toast.show({
            type: options.type || 'info',
            text1: options.title,
            text2: options.description,
            position: 'bottom', // Or 'top'
        });
    };

    // --- Core Logic ---

    const fetchDiscoveryData = useCallback(async () => {
        if (!session?.user?.id) {
            console.log("DiscoveryContext: No user session, cannot fetch data.");
            clearDiscoveryState(); // Clear any existing data if user logs out
            return;
        }
        console.log("DiscoveryContext: Fetching discovery data...");
        setIsLoadingProfiles(true);
        setHasFetchedInitial(true); // Mark that initial fetch attempt was made

        try {
            const userId = session.user.id;

            // 1. Fetch current user's interaction profile
            const { data: userInteractionData, error: userError } = await supabase
                .from('profiles')
                // *** REMOVED dismissed_profile_user_ids from select ***
                .select('user_id, liked_profile_user_ids')
                .eq('user_id', userId)
                .single();

            if (userError) throw userError;
            if (!userInteractionData) throw new Error("Logged in user's profile not found.");

            // Ensure arrays exist, default to empty if null/undefined from DB
            // *** REMOVED dismissed_profile_user_ids from object creation ***
            const currentUserProfile: UserInteractionProfile = {
                ...userInteractionData,
                liked_profile_user_ids: userInteractionData.liked_profile_user_ids || [],
            };
            setUserProfileData(currentUserProfile);
            console.log("DiscoveryContext: User profile data fetched.", currentUserProfile);

            // 2. Fetch all business profiles
            const { data: businessProfilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('*') // Select all columns needed for BusinessProfile type
                .eq('profile_type', 'business'); // Filter for businesses

            if (profilesError) throw profilesError;

            // 3. Filter, Shuffle, and Set Profiles
            const allFetchedProfiles: BusinessProfile[] = businessProfilesData || [];
            setAllProfiles(allFetchedProfiles); // Store the raw fetched list

            // *** REMOVED filter using dismissed_profile_user_ids ***
            const filteredProfiles = allFetchedProfiles.filter(profile =>
                profile.user_id !== userId && // Don't show user's own profile
                !currentUserProfile.liked_profile_user_ids.includes(profile.user_id)
            );

            const shuffled = shuffleArray(filteredProfiles);
            setDisplayableProfiles(shuffled); // Store the list ready for display
            setCurrentProfile(shuffled[0] || null); // Set the first profile

             // 4. (Optional) Populate likedProfilesData if needed elsewhere
             const likedFullData = allFetchedProfiles.filter(p => currentUserProfile.liked_profile_user_ids.includes(p.user_id));
             setLikedProfilesData(likedFullData);

            console.log(`DiscoveryContext: Fetched ${allFetchedProfiles.length} total businesses, ${shuffled.length} displayable.`);
            // *** Log to check profile object being set ***
            console.log("DiscoveryContext: State updates done, currentProfile is set to:", shuffled[0] || null);

        } catch (error: any) {
            console.error("DiscoveryContext: Error fetching data:", error);
            showToast({ title: "Error", description: `Failed to load discovery data: ${error.message}`, type: 'error' });
            clearDiscoveryState(); // Clear potentially inconsistent state on error
        } finally {
             // *** Log to check if finally block is reached ***
             console.log("DiscoveryContext: fetchDiscoveryData FINALLY block. Setting isLoadingProfiles to false.");
            setIsLoadingProfiles(false);
        }
    }, [session]); // Dependency on user session

    // Fetch data when the component mounts and when the user session changes
    useEffect(() => {
        if (session && !hasFetchedInitial) {
             fetchDiscoveryData();
        } else if (!session) {
            clearDiscoveryState(); // Clear data on logout
            setHasFetchedInitial(false); // Reset fetch flag
        }
    }, [session, hasFetchedInitial, fetchDiscoveryData]);

    const getNextProfile = useCallback(() => {
        // Remove the current profile from the displayable list and set the next one
        setDisplayableProfiles(prev => {
            const remaining = prev.filter(p => p.user_id !== currentProfile?.user_id);
            setCurrentProfile(remaining[0] || null); // Set next or null if none left
            if (remaining.length === 0 && prev.length > 0) { // Only show if list wasn't initially empty
                 showToast({ title: "That's everyone!", description: "You've seen all profiles for now.", type: 'info' });
            }
            return remaining;
        });
    }, [currentProfile?.user_id]);

    const clearDiscoveryState = useCallback(() => {
        setAllProfiles([]);
        setDisplayableProfiles([]);
        setCurrentProfile(null);
        setLikedProfilesData([]);
        setUserProfileData(null);
        setIsLoadingProfiles(false);
        // Don't reset hasFetchedInitial here, let useEffect handle refetch on session change
    }, []);

    // --- *** ADDED: Reload Profiles Function *** ---
    const reloadProfiles = useCallback(() => {
        if (!userProfileData || !session?.user?.id) {
            showToast({ title: "Error", description: "Cannot reload without user data.", type: 'error' });
            return;
        }
        console.log("DiscoveryContext: Reloading profiles...");
        setIsLoadingProfiles(true); // Briefly show loading indicator

        // Re-filter from the master list, excluding only self and already liked
         const filteredForReload = allProfiles.filter(profile =>
            profile.user_id !== session.user.id &&
            !userProfileData.liked_profile_user_ids.includes(profile.user_id)
        );

        const shuffled = shuffleArray(filteredForReload);
        setDisplayableProfiles(shuffled); // Update list being swiped
        setCurrentProfile(shuffled[0] || null); // Set the first one

        console.log(`DiscoveryContext: Reloaded ${shuffled.length} displayable profiles.`);
        // Set loading back to false after a short delay to allow UI update
        // Using a timeout avoids potential race conditions with rapid UI updates
        setTimeout(() => setIsLoadingProfiles(false), 50);

    }, [allProfiles, userProfileData, session?.user?.id]); // Added dependencies
    // --- End Added Function ---


    // --- Profile Actions ---

    const likeProfile = useCallback(async (profileUserId: string) => {
        if (!userProfileData || !session?.user?.id) {
            showToast({ title: "Error", description: "Please log in first.", type: 'error' });
            return;
        }

        const profileToLike = allProfiles.find(p => p.user_id === profileUserId);
        if (!profileToLike) return; // Should not happen

        if (userProfileData.liked_profile_user_ids.includes(profileUserId)) {
            showToast({ title: "Already Liked", description: `You already liked ${profileToLike.business_name}.`, type: 'info' });
            getNextProfile(); // Still move to next
            return;
        }

        setIsLoadingProfiles(true); // Use loading state for actions too
        const newLikedIds = [...userProfileData.liked_profile_user_ids, profileUserId];

        try {
            // API Call to update user's profile in Supabase
            const { error } = await supabase
                .from('profiles')
                .update({ liked_profile_user_ids: newLikedIds }) // Update only liked list
                .eq('user_id', session.user.id);

            if (error) throw error;

            // Update local state on success
            setUserProfileData(prev => prev ? { ...prev, liked_profile_user_ids: newLikedIds } : null);
            setLikedProfilesData(prev => [...prev, profileToLike]); // Add full data if needed

            showToast({
                title: "Profile Liked!",
                description: `You liked ${profileToLike.business_name}.`,
                type: 'success',
            });

            getNextProfile(); // Move to the next profile

        } catch (error: any) {
            console.error("DiscoveryContext: Failed to like profile:", error);
            showToast({ title: "Error", description: `Could not save like: ${error.message}`, type: 'error' });
            // Keep loading true or false here? If false, user might interact again quickly.
            // Let finally handle it.
        } finally {
            setIsLoadingProfiles(false);
        }
    }, [userProfileData, session?.user?.id, allProfiles, getNextProfile]); // Added allProfiles dependency


    // --- *** MODIFIED dismissProfile to remove like if needed *** ---
    const dismissProfile = useCallback(async (profileUserId: string) => {
        if (!userProfileData || !session?.user?.id) {
            showToast({ title: "Error", description: "Please log in first.", type: 'error' });
            return;
        }

        console.log("DiscoveryContext: Dismissing profile", profileUserId);
        let setLoading = false; // Flag to manage loading state within this function

        // Check if it was previously liked and remove the like if so
        if (userProfileData.liked_profile_user_ids.includes(profileUserId)) {
            setLoading = true; // We will perform an async action
            setIsLoadingProfiles(true); // Indicate activity
            console.log("DiscoveryContext: Dismissed profile was liked, removing like.");
            const newLikedIds = userProfileData.liked_profile_user_ids.filter(id => id !== profileUserId);
            try {
                // Update DB: remove from liked list
                const { error } = await supabase
                    .from('profiles')
                    .update({ liked_profile_user_ids: newLikedIds })
                    .eq('user_id', session.user.id);

                if (error) throw error; // Let outer catch handle toast

                // Update local state immediately AFTER successful DB update
                setUserProfileData(prev => prev ? { ...prev, liked_profile_user_ids: newLikedIds } : null);
                setLikedProfilesData(prev => prev.filter(p => p.user_id !== profileUserId));
                // Optional: Inform user like was removed, or just silently proceed
                // showToast({ description: "Like removed.", type: 'info' });

            } catch (error: any) {
                 console.error("DiscoveryContext: Failed to remove like during dismiss:", error);
                 showToast({ title: "Error", description: `Could not remove like: ${error.message}`, type: 'error' });
                 // Don't proceed to next profile if removing like failed, turn off loading
                 setIsLoadingProfiles(false);
                 return;
            }
            // Note: finally block below will handle setIsLoadingProfiles(false) if needed
        }

        // Always proceed to the next profile after handling potential unlike
        getNextProfile();

        // If we started loading for the unlike operation, turn it off now
        // (This happens after getNextProfile, which is fine as it just removes the card)
        if(setLoading) {
             setIsLoadingProfiles(false);
        }

    }, [userProfileData, session?.user?.id, getNextProfile]); // Removed allProfiles dependency


    const unlikeProfile = useCallback(async (profileUserId: string) => {
        // This function remains useful for unliking from a "Liked Profiles" screen
        if (!userProfileData || !session?.user?.id) {
            showToast({ title: "Error", description: "Please log in.", type: 'error' });
            return;
        }

        if (!userProfileData.liked_profile_user_ids.includes(profileUserId)) return; // Not liked

        setIsLoadingProfiles(true);
        const newLikedIds = userProfileData.liked_profile_user_ids.filter(id => id !== profileUserId);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ liked_profile_user_ids: newLikedIds })
                .eq('user_id', session.user.id);

            if (error) throw error;

            setUserProfileData(prev => prev ? { ...prev, liked_profile_user_ids: newLikedIds } : null);
            setLikedProfilesData(prev => prev.filter(p => p.user_id !== profileUserId));

            showToast({
                description: "Profile removed from your liked list.",
                type: 'success',
            });

        } catch (error: any) {
            console.error("DiscoveryContext: Failed to unlike profile:", error);
            showToast({ title: "Error", description: `Could not remove like: ${error.message}`, type: 'error' });
        } finally {
            setIsLoadingProfiles(false);
        }
    }, [userProfileData, session?.user?.id]);

    // --- Context Value ---
    const value = useMemo(() => ({
        allProfiles,
        currentProfile,
        likedProfilesData,
        userProfileData,
        isLoadingProfiles,
        fetchDiscoveryData,
        likeProfile,
        dismissProfile, // Includes updated logic
        unlikeProfile,
        reloadProfiles, // *** ADDED reloadProfiles ***
        getNextProfile,
        clearDiscoveryState,
    }), [ // *** ADDED reloadProfiles to dependency array ***
        allProfiles, currentProfile, likedProfilesData, userProfileData, isLoadingProfiles,
        fetchDiscoveryData, likeProfile, dismissProfile, unlikeProfile, reloadProfiles, getNextProfile, clearDiscoveryState
    ]);

    // --- Render Provider ---
    return (
        <DiscoveryContext.Provider value={value}>
            {children}
        </DiscoveryContext.Provider>
    );
};

// --- Custom Hook for Consuming Context ---
export const useDiscovery = (): DiscoveryContextType => {
    const context = useContext(DiscoveryContext);
    if (context === undefined) {
        throw new Error('useDiscovery must be used within a DiscoveryProvider');
    }
    return context;
};