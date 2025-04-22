// src/contexts/DiscoveryContext.tsx (MODIFIED to use business_listings)
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
    useMemo,
} from 'react';
import { supabase } from '../lib/supabaseClient'; // Adjust path
import { useAuth } from './AuthContext'; // Adjust path
import Toast from 'react-native-toast-message';

// --- Define Core Types ---

// Defines the structure of your business listing data from the 'business_listings' table
// Ensure this matches your actual table schema.
export interface BusinessListing {
  id: string; // Unique ID of the listing itself
  manager_user_id: string; // ID of the user who manages this listing (links to auth.users.id)
  business_name: string;
  category: string;
  description?: string | null;
  address_street?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_postal_code?: string | null;
  address_country?: string | null;
  phone_number?: string | null;
  listing_photos?: string[] | null; // Array of photo URLs/paths from Storage
  status?: string;
  created_at?: string;
  updated_at?: string;
  // Add any other relevant fields from your business_listings table
}

// Represents the current user's interaction data fetched from 'profile_likes'
// Assuming 'profile_likes' stores the manager_user_id of the liked listing
export interface UserInteractionData { // Renamed for clarity
  user_id: string; // The current user's ID
  liked_manager_user_ids: string[]; // List of manager_user_ids the user has liked
}

// --- Define Context Shape --- (Updated types)
interface DiscoveryContextType {
    allListings: BusinessListing[]; // Renamed from allProfiles
    currentListing: BusinessListing | null; // Renamed from currentProfile
    likedListingsData: BusinessListing[]; // Renamed from likedProfilesData
    userInteractionData: UserInteractionData | null; // Renamed from userProfileData
    isLoadingListings: boolean; // Renamed from isLoadingProfiles
    fetchDiscoveryData: () => Promise<void>;
    likeListing: (managerUserId: string) => Promise<void>; // Renamed from likeProfile
    dismissListing: (managerUserId: string) => Promise<void>; // Renamed from dismissProfile
    unlikeListing: (managerUserId: string) => Promise<void>; // Renamed from unlikeProfile
    getNextListing: () => void; // Renamed from getNextProfile
    reloadListings: () => void; // Renamed from reloadProfiles
    clearDiscoveryState: () => void;
}

// --- Create Context ---
const DiscoveryContext = createContext<DiscoveryContextType | undefined>(undefined);

// --- Utility: Shuffle Array (Fisher-Yates) --- (Unchanged)
function shuffleArray<T>(array: T[]): T[] {
    // ... (shuffle logic remains the same) ...
    let currentIndex = array.length, randomIndex;
    const newArray = [...array];
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [newArray[currentIndex], newArray[randomIndex]] = [
            newArray[randomIndex], newArray[currentIndex]];
    }
    return newArray;
}


// --- Create Provider Component ---
export const DiscoveryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { session } = useAuth();
    // --- State variables using Listing-related names and types ---
    const [allListings, setAllListings] = useState<BusinessListing[]>([]);
    const [displayableListings, setDisplayableListings] = useState<BusinessListing[]>([]);
    const [currentListing, setCurrentListing] = useState<BusinessListing | null>(null);
    const [likedListingsData, setLikedListingsData] = useState<BusinessListing[]>([]);
    const [userInteractionData, setUserInteractionData] = useState<UserInteractionData | null>(null);
    const [isLoadingListings, setIsLoadingListings] = useState<boolean>(false);
    const [hasFetchedInitial, setHasFetchedInitial] = useState(false);

    // Toast helper (Unchanged)
    const showToast = (options: { title?: string; description: string; type?: 'success' | 'error' | 'info' }) => {
       Toast.show({ /* ... toast options ... */ });
    };

    // --- Core Logic ---

    const clearDiscoveryState = useCallback(() => {
        console.log("DiscoveryContext: Clearing state.");
        setAllListings([]);
        setDisplayableListings([]);
        setCurrentListing(null);
        setLikedListingsData([]);
        setUserInteractionData(null);
        setIsLoadingListings(false);
        setHasFetchedInitial(false);
    }, []);


    const fetchDiscoveryData = useCallback(async () => {
        if (!session?.user?.id) {
            console.log("DiscoveryContext: No user session, cannot fetch data.");
            clearDiscoveryState();
            return;
        }
        const userId = session.user.id;
        console.log("DiscoveryContext: Fetching discovery data for user:", userId);
        setIsLoadingListings(true);
        setHasFetchedInitial(true);

        try {
            // --- Step 1: Fetch IDs of managers liked BY the current user ---
            // *** ASSUMPTION: 'profile_likes' stores the manager_user_id of the liked listing ***
            console.log("DiscoveryContext: 1. Fetching user's liked manager IDs...");
            const { data: likedIdsData, error: likedIdsError } = await supabase
                .from('profile_likes') // <<< Keep table name or update if changed
                .select('liked_listing_id') // <<< Column storing the ID of the liked user/manager
                .eq('liker_user_id', userId);

            if (likedIdsError) {
                console.error("DiscoveryContext: Error fetching liked manager IDs:", likedIdsError);
                if (likedIdsError.code === '42P01') { /* ... handle table not found ... */ }
                throw likedIdsError;
            }

            // Extract the manager IDs the user has liked
            const likedManagerIds = likedIdsData?.map(like => like.liked_listing_id) || [];
            // Update userInteractionData state
            setUserInteractionData({ user_id: userId, liked_manager_user_ids: likedManagerIds });
            console.log("DiscoveryContext: 2. User's liked manager IDs fetched:", likedManagerIds);

            // --- Step 2: Fetch all relevant business listings ---
            console.log("DiscoveryContext: 3. Attempting to fetch all business listings...");
            const { data: businessListingsData, error: listingsError } = await supabase
                .from('business_listings') // <<<--- CHANGED TABLE NAME
                .select('*'); // Select columns matching BusinessListing interface
                // Removed: .eq('profile_type', 'business'); // No longer needed

            console.log("DiscoveryContext: 4. Business listings fetch completed.");

            if (listingsError) {
                console.error("DiscoveryContext: Error fetching business listings:", listingsError);
                 if (listingsError.code === '42P01') {
                     showToast({ title: "Database Error", description: "Table 'business_listings' not found.", type: 'error'});
                 }
                throw listingsError;
            }

            // --- Step 3: Filter, Shuffle, and Set Listings ---
            console.log("DiscoveryContext: 5. Processing fetched business listings...");
            const allFetchedListings: BusinessListing[] = businessListingsData || [];
            setAllListings(allFetchedListings); // Store the raw master list

            // Filter out user's own listings and listings already liked
            const filteredListings = allFetchedListings.filter(listing =>
                listing.manager_user_id !== userId && // Don't show user's own listings
                !likedManagerIds.includes(listing.manager_user_id) // Don't show listings managed by users they already liked
            );

            const shuffled = shuffleArray(filteredListings);
            setDisplayableListings(shuffled);
            setCurrentListing(shuffled[0] || null); // Use renamed state setter

            // --- Step 4: Populate likedListingsData ---
            // Filter the master list to get full data for listings managed by liked users
            const likedFullData = allFetchedListings.filter(listing => likedManagerIds.includes(listing.manager_user_id));
            setLikedListingsData(likedFullData); // Use renamed state setter
            console.log(`DiscoveryContext: Populated likedListingsData with ${likedFullData.length} listings.`);

            console.log(`DiscoveryContext: Fetched ${allFetchedListings.length} total listings, ${shuffled.length} initially displayable.`);
            console.log("DiscoveryContext: 6. State updates done, currentListing is set to:", shuffled[0] || null);

        } catch (error: any) {
            console.error("DiscoveryContext: Error caught in fetchDiscoveryData try block:", error);
            if (error.code !== '42P01') {
                showToast({ title: "Error", description: `Failed to load discovery data: ${error.message || 'Unknown error'}`, type: 'error' });
            }
        } finally {
            console.log("DiscoveryContext: fetchDiscoveryData FINALLY block. Setting isLoadingListings to false.");
            setIsLoadingListings(false); // Use renamed state setter
        }
    }, [session, clearDiscoveryState]);

    // useEffect triggers fetchDiscoveryData based on session (Unchanged logic)
    useEffect(() => {
        if (session && !hasFetchedInitial) {
             fetchDiscoveryData();
        } else if (!session) {
             clearDiscoveryState();
        }
    }, [session, hasFetchedInitial, fetchDiscoveryData, clearDiscoveryState]);


    const getNextListing = useCallback(() => { // Renamed function
        setDisplayableListings(prev => {
            const nextListings = prev.slice(1);
            setCurrentListing(nextListings[0] || null); // Update currentListing
             if (nextListings.length === 0) {
                 console.log("DiscoveryContext: Reached end of displayable listings list.");
             }
            return nextListings;
        });
    }, []);


    const reloadListings = useCallback(() => { // Renamed function
        if (!userInteractionData || !session?.user?.id) {
            showToast({ title: "Error", description: "Cannot reload without user data.", type: 'error' });
            return;
        }
        console.log("DiscoveryContext: Reloading listings...");
        setIsLoadingListings(true); // Use renamed state setter

        // Filter the master list based on current user and updated liked IDs
         const filteredForReload = allListings.filter(listing =>
            listing.manager_user_id !== session.user.id && // Exclude self
            !userInteractionData.liked_manager_user_ids.includes(listing.manager_user_id) // Exclude liked managers
        );

        const shuffled = shuffleArray(filteredForReload);
        setDisplayableListings(shuffled);
        setCurrentListing(shuffled[0] || null); // Use renamed state setter

        console.log(`DiscoveryContext: Reloaded ${shuffled.length} displayable listings.`);
        // Short delay before setting loading false for smoother UI transition
        setTimeout(() => setIsLoadingListings(false), 50); // Use renamed state setter

    }, [allListings, userInteractionData, session?.user?.id]);


    // --- Listing Actions (Targeting profile_likes table) ---

    // Renamed function and parameter for clarity
    const likeListing = useCallback(async (managerUserId: string) => {
        if (!userInteractionData || !session?.user?.id) { showToast({ title: "Error", description: "Please log in to like listings.", type: 'error' }); return; }

        // Find the first listing associated with the manager ID to get the business name for the toast
        const listingToLike = allListings.find(l => l.manager_user_id === managerUserId);
        const displayName = listingToLike?.business_name || 'this business'; // Fallback name

        if (userInteractionData.liked_manager_user_ids.includes(managerUserId)) {
            showToast({ title: "Already Liked", description: `You already liked ${displayName}.`, type: 'info' });
            getNextListing(); // Use renamed function
            return;
        }

        setIsLoadingListings(true); // Use renamed state setter
        const likerId = session.user.id;

        try {
            console.log(`DiscoveryContext: Inserting like - Liker: ${likerId}, Liked Manager: ${managerUserId}`);
            const { error } = await supabase
                .from('profile_likes') // Keep table name or update if changed
                .insert({
                    liker_user_id: likerId,
                    liked_listing_id: managerUserId // <<< Column storing the ID of the liked user/manager
                });

            if (error) {
                if (error.code === '23505') {
                    showToast({ title: "Already Liked", description: `You already liked ${displayName}.`, type: 'info' });
                } else {
                    throw error;
                }
            } else {
                // Update local state immediately for better UX
                const newLikedIds = [...userInteractionData.liked_manager_user_ids, managerUserId];
                setUserInteractionData(prev => prev ? { ...prev, liked_manager_user_ids: newLikedIds } : null);
                // Add all listings managed by this liked user to likedListingsData
                const newlyLikedListings = allListings.filter(l => l.manager_user_id === managerUserId);
                setLikedListingsData(prev => [...prev, ...newlyLikedListings]);

                showToast({ title: "Liked!", description: `You liked ${displayName}.`, type: 'success' });
            }
            getNextListing(); // Use renamed function
        } catch (error: any) {
            console.error("DiscoveryContext: Failed to like listing:", error);
            showToast({ title: "Error", description: `Could not save like: ${error.message}`, type: 'error' });
        } finally {
            setIsLoadingListings(false); // Use renamed state setter
        }
    }, [userInteractionData, session?.user?.id, allListings, getNextListing]);


    // Renamed function and parameter for clarity
    const dismissListing = useCallback(async (managerUserId: string) => {
        if (!userInteractionData || !session?.user?.id) { showToast({ title: "Error", description: "Please log in.", type: 'error' }); return; }

        console.log("DiscoveryContext: Dismissing listings for manager", managerUserId);
        let setLoading = false; // Flag to track if loading state was set

        // If the dismissed listing's manager was liked, unlike them first
        if (userInteractionData.liked_manager_user_ids.includes(managerUserId)) {
            setLoading = true;
            setIsLoadingListings(true); // Use renamed state setter
            console.log("DiscoveryContext: Dismissed manager was liked, removing like from profile_likes table.");
            const likerId = session.user.id;

            try {
                const { error } = await supabase
                    .from('profile_likes') // Keep table name or update if changed
                    .delete()
                    .eq('liker_user_id', likerId)
                    .eq('liked_listing_id', managerUserId); // <<< Column storing the ID of the liked user/manager

                if (error) throw error;

                // Update local state after successful unlike
                const newLikedIds = userInteractionData.liked_manager_user_ids.filter(id => id !== managerUserId);
                setUserInteractionData(prev => prev ? { ...prev, liked_manager_user_ids: newLikedIds } : null);
                setLikedListingsData(prev => prev.filter(l => l.manager_user_id !== managerUserId)); // Remove listings by this manager
                 showToast({ description: "Removed from your liked list.", type: 'info' });

            } catch (error: any) {
                 console.error("DiscoveryContext: Failed to remove like during dismiss:", error);
                 showToast({ title: "Error", description: `Could not remove like: ${error.message}`, type: 'error' });
                 if(setLoading) setIsLoadingListings(false); // Use renamed state setter
                 return; // Don't advance if delete failed
            }
            // No finally block here for loading state, handle below
        }

        // Always advance to the next listing after dismiss (whether like was removed or not)
        getNextListing(); // Use renamed function
        if(setLoading) setIsLoadingListings(false); // Stop loading if it was started for unlike

    }, [userInteractionData, session?.user?.id, getNextListing]);


    // Renamed function and parameter for clarity
    const unlikeListing = useCallback(async (managerUserId: string) => {
        if (!userInteractionData || !session?.user?.id) { showToast({ title: "Error", description: "Please log in.", type: 'error' }); return; }
        if (!userInteractionData.liked_manager_user_ids.includes(managerUserId)) { return; } // Not liked

        setIsLoadingListings(true); // Use renamed state setter
        const likerId = session.user.id;

        try {
            console.log(`DiscoveryContext: Deleting like - Liker: ${likerId}, Liked Manager: ${managerUserId}`);
            const { error } = await supabase
                .from('profile_likes') // Keep table name or update if changed
                .delete()
                .eq('liker_user_id', likerId)
                .eq('liked_listing_id', managerUserId); // <<< Column storing the ID of the liked user/manager

            if (error) throw error;

            // Update local state after successful unlike
            const newLikedIds = userInteractionData.liked_manager_user_ids.filter(id => id !== managerUserId);
            setUserInteractionData(prev => prev ? { ...prev, liked_manager_user_ids: newLikedIds } : null);
            setLikedListingsData(prev => prev.filter(l => l.manager_user_id !== managerUserId)); // Remove listings by this manager

            showToast({ description: "Removed from your liked list.", type: 'success' });

        } catch (error: any) {
            console.error("DiscoveryContext: Failed to unlike listing:", error);
            showToast({ title: "Error", description: `Could not remove like: ${error.message}`, type: 'error' });
        } finally {
            setIsLoadingListings(false); // Use renamed state setter
        }
    }, [userInteractionData, session?.user?.id]);

    // --- Context Value --- (Updated names and types)
    const value = useMemo(() => ({
        allListings,
        currentListing,
        likedListingsData,
        userInteractionData,
        isLoadingListings,
        fetchDiscoveryData,
        likeListing,
        dismissListing,
        unlikeListing,
        reloadListings,
        getNextListing,
        clearDiscoveryState,
    }), [
        allListings, currentListing, likedListingsData, userInteractionData, isLoadingListings,
        fetchDiscoveryData, likeListing, dismissListing, unlikeListing, reloadListings, getNextListing, clearDiscoveryState
    ]);

    // --- Render Provider ---
    return (
        <DiscoveryContext.Provider value={value}>
            {children}
        </DiscoveryContext.Provider>
    );
};

// --- Custom Hook for Consuming Context --- (Updated return type)
export const useDiscovery = (): DiscoveryContextType => {
    const context = useContext(DiscoveryContext);
    if (context === undefined) {
        throw new Error('useDiscovery must be used within a DiscoveryProvider');
    }
    return context;
};
