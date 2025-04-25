// components/BusinessCardStack.tsx
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import BusinessProfileCard, { BusinessListing } from './BusinessProfileCard'; // Adjust path
// --- Import Individual Profile Card and its type ---
import ProfileCard from './ProfileCard'; // Adjust path to your ProfileCard component
// Assuming IndividualProfile type is defined elsewhere or imported correctly
import { Profile as IndividualProfile } from '../screens/EditProfileScreen'; // Example Import - Adjust path/type name

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// --- Constants for Horizontal Stacking ---
const CARD_HORIZONTAL_OFFSET = 9;
const CARD_SCALE_DIFF = 0.03;
const MAX_BEHIND_CARDS = 5; // Max liker profile cards to show

interface BusinessCardStackProps {
    topListing: BusinessListing | null; // Allow null if stack can be empty
    onLikeBusiness: (managerUserId: string, listingId: string) => void;
    onDismissBusiness: (managerUserId: string, listingId: string) => void;

    // --- New Prop: Array of Liker Profiles ---
    /** An array of individual user profiles who liked the topListing */
    likerProfiles?: IndividualProfile[]; // Array of profiles to display behind
}

const BusinessCardStack: React.FC<BusinessCardStackProps> = ({
    topListing,
    onLikeBusiness,
    onDismissBusiness,
    // --- Destructure new prop, default to empty array ---
    likerProfiles = [],
}) => {

    // Determine how many liker cards to actually render based on MAX_BEHIND_CARDS
    const cardsToRenderCount = Math.min(likerProfiles.length, MAX_BEHIND_CARDS);

    const renderLikerProfileCards = () => {
        const behindCards = [];
        if (cardsToRenderCount <= 0) return null;

        // Loop through the liker profiles that we need to render (up to the limit)
        // We loop backwards so the first profile in the array is closest behind (highest zIndex)
        for (let i = cardsToRenderCount - 1; i >= 0; i--) {
            const profileToShow = likerProfiles[i];

            // Calculate position: profile at index 0 is 1st behind, index 1 is 2nd behind, etc.
            const positionBehind = i + 1;

            const scale = 1 - positionBehind * CARD_SCALE_DIFF;
            const translateX = positionBehind * CARD_HORIZONTAL_OFFSET;
            // ZIndex: closest behind (i=0 => positionBehind=1) has highest zIndex
            const zIndex = MAX_BEHIND_CARDS - positionBehind + 1;


            behindCards.push(
                <View
                    // Use a unique key, like the user_id from the profile
                    key={profileToShow.user_id || `liker-card-${i}`}
                    style={[
                        styles.cardBase, // Base size, position, shadow
                        // Wrapper MUST be transparent so ProfileCard's background shows
                        { backgroundColor: 'transparent' },
                        {
                            transform: [{ translateX }, { scale }],
                            zIndex: zIndex,
                        },
                    ]}
                >
                    {/* Render the actual ProfileCard component */}
                    <ProfileCard
                        profile={profileToShow}
                        isBehindCard={true} // Optional prop
                        // Add any other necessary props for ProfileCard
                    />
                </View>
            );
        }
        // The loop adds cards from furthest to closest, so the order in the array is correct for rendering.
        return behindCards;
    };

    return (
        <View style={styles.stackContainer}>
            {/* Render Liker Profile cards behind */}
            {renderLikerProfileCards()}

            {/* Render the main interactive Business card on top */}
            {topListing ? (
                // Wrapper for the top card (size, position, shadow)
                <View
                    style={[
                        styles.cardBase, // Use base for size/position/shadow
                        // Background transparent, BusinessProfileCard handles its own background
                        { zIndex: MAX_BEHIND_CARDS + 1, backgroundColor: 'transparent' }
                    ]}
                >
                    <BusinessProfileCard
                        listing={topListing}
                         // Pass listing ID along with manager ID
                        onLikeBusiness={() => onLikeBusiness(topListing.manager_user_id, topListing.id)}
                        onDismissBusiness={() => onDismissBusiness(topListing.manager_user_id, topListing.id)}
                    />
                </View>
            ) : (
                 // Optional: Render something when the stack is empty
                 null
            )
            }
        </View>
    );
};

// --- Styles (Keep existing styles) ---
const styles = StyleSheet.create({
    stackContainer: {
        flex: 1,
        position: 'relative',
        overflow: 'visible', // Allow transforms/shadows outside bounds
        alignItems: 'center', // Center stack horizontally if needed
        justifyContent: 'center', // Center stack vertically if needed
    },
    cardBase: {
        // Defines size, position, shape, and shadow for ALL cards/wrappers
        position: 'absolute',
        width: '90%', // Example: Use percentage of container
        height: '90%', // Example: Use percentage of container
        alignSelf: 'center', // Ensure absolute positioned items are centered
        borderRadius: 16, // Shape defined here
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        // Default background is removed - let components define it
    },
    // placeholderCard style is no longer used in renderLikerProfileCards
    // Keep it if you might use it elsewhere or as a fallback
    placeholderCard: {
        backgroundColor: '#EE4B2B',
        borderRadius: 16,
    },
});

export default BusinessCardStack;