// src/contexts/DiscoveryContext.tsx (MODIFIED to use listing.id for likes)
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

export interface BusinessListing {
  id: string; // <<< PRIMARY KEY OF THE LISTING - Used for liking
  manager_user_id: string; // ID of the user who manages this listing
  business_name: string;
  category: string;
  description?: string | null;
  address_street?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_postal_code?: string | null;
  address_country?: string | null;
  phone_number?: string | null;
  listing_photos?: string[] | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

// Represents the current user's interaction data
export interface UserInteractionData {
  user_id: string; // The current user's ID
  // --- CHANGED --- store liked LISTING IDs, not manager IDs
  liked_listing_ids: string[];
}

// --- Define Context Shape ---
interface DiscoveryContextType {
    allListings: BusinessListing[];
    currentListing: BusinessListing | null;
    likedListingsData: BusinessListing[]; // Full data for liked listings
    userInteractionData: UserInteractionData | null; // Contains liked_listing_ids
    isLoadingListings: boolean;
    fetchDiscoveryData: () => Promise<void>;
    // --- CHANGED --- Functions now operate on listingId
    likeListing: (listingId: string) => Promise<void>;
    dismissListing: (listingId: string) => Promise<void>; // Dismiss operates on the currently shown listing ID
    unlikeListing: (listingId: string) => Promise<void>;
    getNextListing: () => void;
    reloadListings: () => void;
    clearDiscoveryState: () => void;
}

// --- Create Context ---
const DiscoveryContext = createContext<DiscoveryContextType | undefined>(undefined);

// --- Utility: Shuffle Array (Fisher-Yates) --- (Unchanged)
function shuffleArray<T>(array: T[]): T[] {
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
    // --- State variables ---
    const [allListings, setAllListings] = useState<BusinessListing[]>([]);
    const [displayableListings, setDisplayableListings] = useState<BusinessListing[]>([]);
    const [currentListing, setCurrentListing] = useState<BusinessListing | null>(null);
    const [likedListingsData, setLikedListingsData] = useState<BusinessListing[]>([]); // Stores full BusinessListing objects that are liked
    const [userInteractionData, setUserInteractionData] = useState<UserInteractionData | null>(null); // Stores liked listing IDs
    const [isLoadingListings, setIsLoadingListings] = useState<boolean>(false);
    const [hasFetchedInitial, setHasFetchedInitial] = useState(false);

    // Toast helper (Unchanged)
    const showToast = (options: { title?: string; description: string; type?: 'success' | 'error' | 'info' }) => {
       Toast.show({ type: options.type || 'info', text1: options.title, text2: options.description });
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
            // --- Step 1: Fetch IDs of LISTINGS liked BY the current user ---
            console.log("DiscoveryContext: 1. Fetching user's liked listing IDs...");
            const { data: likedIdsData, error: likedIdsError } = await supabase
                .from('profile_likes')
                // --- CHANGED --- Select the correct column
                .select('liked_listing_id')
                .eq('liker_user_id', userId);

            if (likedIdsError) {
                console.error("DiscoveryContext: Error fetching liked listing IDs:", likedIdsError);
                if (likedIdsError.code === '42P01') { /* ... */ }
                throw likedIdsError;
            }

            // Extract the LISTING IDs the user has liked
            // --- CHANGED --- Use correct map property and variable name
            const likedListingIds = likedIdsData?.map(like => like.liked_listing_id) || [];
            // Update userInteractionData state with liked LISTING IDs
            // --- CHANGED --- Use correct property name
            setUserInteractionData({ user_id: userId, liked_listing_ids: likedListingIds });
            console.log("DiscoveryContext: 2. User's liked listing IDs fetched:", likedListingIds);

            // --- Step 2: Fetch all relevant business listings ---
            console.log("DiscoveryContext: 3. Attempting to fetch all business listings...");
            const { data: businessListingsData, error: listingsError } = await supabase
                .from('business_listings')
                .select('*');

            console.log("DiscoveryContext: 4. Business listings fetch completed.");

            if (listingsError) {
                console.error("DiscoveryContext: Error fetching business listings:", listingsError);
                if (listingsError.code === '42P01') { /* ... */ }
                throw listingsError;
            }

            // --- Step 3: Filter, Shuffle, and Set Listings ---
            console.log("DiscoveryContext: 5. Processing fetched business listings...");
            const allFetchedListings: BusinessListing[] = businessListingsData || [];
            setAllListings(allFetchedListings); // Store the raw master list

            // Filter out user's own listings and listings already liked (by LISTING ID)
            const filteredListings = allFetchedListings.filter(listing =>
                listing.manager_user_id !== userId && // Don't show user's own listings
                // --- CHANGED --- Filter based on listing.id and likedListingIds
                !likedListingIds.includes(listing.id)
            );

            const shuffled = shuffleArray(filteredListings);
            setDisplayableListings(shuffled);
            setCurrentListing(shuffled[0] || null);

            // --- Step 4: Populate likedListingsData ---
            // Filter the master list to get full data for listings that are liked (by LISTING ID)
             // --- CHANGED --- Filter based on listing.id and likedListingIds
            const likedFullData = allFetchedListings.filter(listing => likedListingIds.includes(listing.id));
            setLikedListingsData(likedFullData);
            console.log(`DiscoveryContext: Populated likedListingsData with ${likedFullData.length} listings.`);

            console.log(`DiscoveryContext: Fetched ${allFetchedListings.length} total listings, ${shuffled.length} initially displayable.`);
            console.log("DiscoveryContext: 6. State updates done, currentListing is set to:", shuffled[0] || null);

        } catch (error: any) {
            console.error("DiscoveryContext: Error caught in fetchDiscoveryData try block:", error);
            if (error.code !== '42P01') { /* ... */ }
        } finally {
            console.log("DiscoveryContext: fetchDiscoveryData FINALLY block. Setting isLoadingListings to false.");
            setIsLoadingListings(false);
        }
    }, [session, clearDiscoveryState]);

    // useEffect (Unchanged logic)
    useEffect(() => {
        if (session && !hasFetchedInitial) {
             fetchDiscoveryData();
        } else if (!session) {
             clearDiscoveryState();
        }
    }, [session, hasFetchedInitial, fetchDiscoveryData, clearDiscoveryState]);


    // getNextListing (Unchanged logic)
    const getNextListing = useCallback(() => {
        setDisplayableListings(prev => {
            const nextListings = prev.slice(1);
            setCurrentListing(nextListings[0] || null);
             if (nextListings.length === 0) { /* ... */ }
            return nextListings;
        });
    }, []);


    const reloadListings = useCallback(() => {
        if (!userInteractionData || !session?.user?.id) { /* ... */ return; }
        console.log("DiscoveryContext: Reloading listings...");
        setIsLoadingListings(true);

        // Filter the master list based on current user and updated liked LISTING IDs
         const filteredForReload = allListings.filter(listing =>
             listing.manager_user_id !== session.user!.id &&
             // --- CHANGED --- Filter based on listing.id
             !userInteractionData.liked_listing_ids.includes(listing.id)
         );

        const shuffled = shuffleArray(filteredForReload);
        setDisplayableListings(shuffled);
        setCurrentListing(shuffled[0] || null);

        console.log(`DiscoveryContext: Reloaded ${shuffled.length} displayable listings.`);
        setTimeout(() => setIsLoadingListings(false), 50);

    }, [allListings, userInteractionData, session?.user?.id]);


    // --- Listing Actions (Targeting profile_likes table with listing IDs) ---

    // --- CHANGED --- Accepts listingId instead of managerUserId
    const likeListing = useCallback(async (listingId: string) => {
        if (!userInteractionData || !session?.user?.id) { /* ... */ return; }

        // Find the listing being liked for the display name
        const listingToLike = allListings.find(l => l.id === listingId);
        const displayName = listingToLike?.business_name || 'this listing'; // Fallback name

        // --- CHANGED --- Check liked_listing_ids
        if (userInteractionData.liked_listing_ids.includes(listingId)) {
            showToast({ title: "Already Liked", description: `You already liked ${displayName}.`, type: 'info' });
            // getNextListing(); // Decide if you want to advance if already liked
            return; // Don't proceed if already liked
        }

        // setIsLoadingListings(true); // Optional: set loading for like action
        const likerId = session.user.id;

        try {
             // --- CHANGED --- Log using listingId
            console.log(`DiscoveryContext: Inserting like - Liker: ${likerId}, Liked Listing ID: ${listingId}`);
            const { error } = await supabase
                .from('profile_likes')
                .insert({
                    liker_user_id: likerId,
                    // --- CHANGED --- Insert liked_listing_id
                    liked_listing_id: listingId
                });

            if (error) {
                if (error.code === '23505') { // Handle potential duplicate error
                    showToast({ title: "Already Liked", description: `Database confirms you already liked ${displayName}.`, type: 'info' });
                     // Sync state if needed
                    if (!userInteractionData.liked_listing_ids.includes(listingId)) {
                        setUserInteractionData(prev => prev ? { ...prev, liked_listing_ids: [...prev.liked_listing_ids, listingId] } : null);
                        if(listingToLike) setLikedListingsData(prev => [...prev, listingToLike]);
                    }
                } else if (error.code === '23503') { // Foreign Key violation
                     console.error("Foreign Key Violation! Listing ID likely doesn't exist:", listingId, error);
                     showToast({ title: "Error", description: `Cannot like listing: It may no longer exist.`, type: 'error' });
                }
                else {
                    throw error; // Re-throw other errors
                }
            } else {
                // Success: Update local state immediately
                // --- CHANGED --- Update liked_listing_ids
                const newLikedIds = [...userInteractionData.liked_listing_ids, listingId];
                setUserInteractionData(prev => prev ? { ...prev, liked_listing_ids: newLikedIds } : null);
                // Add the specific liked listing to likedListingsData state if found
                if(listingToLike) {
                    setLikedListingsData(prev => [...prev, listingToLike]);
                }

                showToast({ title: "Liked!", description: `You liked ${displayName}.`, type: 'success' });
            }
             // --- CHANGED --- Advance only AFTER trying to like
             getNextListing();
        } catch (error: any) {
            // Log error already handled if specific code not caught above
            if (error.code !== '23505' && error.code !== '23503') {
                console.error("DiscoveryContext: Failed to like listing:", error);
                showToast({ title: "Error", description: `Could not save like: ${error.message}`, type: 'error' });
            }
        } finally {
             // setIsLoadingListings(false); // Turn off loading if set
        }
    }, [userInteractionData, session?.user?.id, allListings, getNextListing]); // Dependencies updated


    // --- CHANGED --- Accepts listingId instead of managerUserId
    // Dismiss removes the current card and unlikes it *if* it was liked
    const dismissListing = useCallback(async (listingId: string) => {
        if (!userInteractionData || !session?.user?.id) { /* ... */ return; }
        const likerId = session.user.id;

        console.log("DiscoveryContext: Dismissing listing with ID:", listingId);

        // Optimistic UI: Advance to the next card immediately
        getNextListing();

        // Check if the dismissed listing was liked, and remove the like from DB asynchronously
        // --- CHANGED --- Check liked_listing_ids
        if (userInteractionData.liked_listing_ids.includes(listingId)) {
            console.log("DiscoveryContext: Dismissed listing was liked, removing like from DB (async).");
            try {
                const { error } = await supabase
                    .from('profile_likes')
                    .delete()
                    .eq('liker_user_id', likerId)
                    // --- CHANGED --- Match liked_listing_id
                    .eq('liked_listing_id', listingId);

                if (error) throw error; // Log error below if delete fails

                // Update local state AFTER successful delete
                // --- CHANGED --- Update liked_listing_ids
                const newLikedIds = userInteractionData.liked_listing_ids.filter(id => id !== listingId);
                setUserInteractionData(prev => prev ? { ...prev, liked_listing_ids: newLikedIds } : null);
                // --- CHANGED --- Remove from likedListingsData based on listing id
                setLikedListingsData(prev => prev.filter(l => l.id !== listingId));
                console.log("DiscoveryContext: Successfully removed prior like from local state for listing:", listingId);

            } catch (error: any) {
                console.error("DiscoveryContext: Failed to remove like during dismiss (background task):", error);
                // Don't necessarily disrupt UI, but log it. State might be inconsistent until next fetch.
            }
        }
    }, [userInteractionData, session?.user?.id, getNextListing]); // Dependencies updated


    // --- CHANGED --- Accepts listingId instead of managerUserId
    const unlikeListing = useCallback(async (listingId: string) => {
        if (!userInteractionData || !session?.user?.id) { /* ... */ return; }
        const likerId = session.user.id;

        // --- CHANGED --- Check liked_listing_ids
        if (!userInteractionData.liked_listing_ids.includes(listingId)) {
             console.log("DiscoveryContext: Attempted to unlike a listing not in the liked list. ID:", listingId);
             return; // Not liked, nothing to do
        }

        setIsLoadingListings(true); // Show loading for explicit unlike

        try {
             // --- CHANGED --- Log using listingId
            console.log(`DiscoveryContext: Deleting like - Liker: ${likerId}, Liked Listing ID: ${listingId}`);
            const { error } = await supabase
                .from('profile_likes')
                .delete()
                .eq('liker_user_id', likerId)
                 // --- CHANGED --- Match liked_listing_id
                .eq('liked_listing_id', listingId);

            if (error) throw error;

            // Update local state AFTER successful delete
             // --- CHANGED --- Update liked_listing_ids
            const newLikedIds = userInteractionData.liked_listing_ids.filter(id => id !== listingId);
            setUserInteractionData(prev => prev ? { ...prev, liked_listing_ids: newLikedIds } : null);
             // --- CHANGED --- Remove from likedListingsData based on listing id
            setLikedListingsData(prev => prev.filter(l => l.id !== listingId));

            showToast({ description: "Removed from your liked list.", type: 'success' });

        } catch (error: any) {
            console.error("DiscoveryContext: Failed to unlike listing:", error);
            showToast({ title: "Error", description: `Could not remove like: ${error.message}`, type: 'error' });
        } finally {
            setIsLoadingListings(false);
        }
    }, [userInteractionData, session?.user?.id]); // Dependencies updated

    // --- Context Value --- (Ensure all functions use the updated signatures)
    const value = useMemo(() => ({
        allListings,
        currentListing,
        likedListingsData,
        userInteractionData,
        isLoadingListings,
        fetchDiscoveryData,
        likeListing,       // Now expects listingId
        dismissListing,    // Now expects listingId
        unlikeListing,     // Now expects listingId
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

// --- Custom Hook for Consuming Context ---
export const useDiscovery = (): DiscoveryContextType => {
    const context = useContext(DiscoveryContext);
    if (context === undefined) {
        throw new Error('useDiscovery must be used within a DiscoveryProvider');
    }
    return context;
};