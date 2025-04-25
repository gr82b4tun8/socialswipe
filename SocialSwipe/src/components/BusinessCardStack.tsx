// components/BusinessCardStack.tsx
import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import BusinessProfileCard, { BusinessListing } from './BusinessProfileCard'; // Adjust path

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// --- Constants for Horizontal Stacking ---
const CARD_HORIZONTAL_OFFSET = 9;
const CARD_SCALE_DIFF = 0.03;
const MAX_BEHIND_CARDS = 5;

interface BusinessCardStackProps {
    topListing: BusinessListing;
    behindCount: number;
    onLikeBusiness: (managerUserId: string) => void;
    onDismissBusiness: (managerUserId: string) => void;
}

const BusinessCardStack: React.FC<BusinessCardStackProps> = ({
    topListing,
    behindCount,
    onLikeBusiness,
    onDismissBusiness,
}) => {
    const cardsToRender = Math.min(behindCount, MAX_BEHIND_CARDS);

    const renderBehindCards = () => {
        const behindCards = [];
        if (cardsToRender <= 0) return null;

        for (let i = cardsToRender; i >= 1; i--) {
            const scale = 1 - i * CARD_SCALE_DIFF;
            const translateX = i * CARD_HORIZONTAL_OFFSET;
            const zIndex = MAX_BEHIND_CARDS - i + 1;

            behindCards.push(
                <View
                    key={`behind-card-${i}`}
                    style={[
                        styles.cardBase, // Base size, position, shadow
                        styles.placeholderCard, // Specific background and ensures border radius
                        {
                            transform: [{ translateX }, { scale }],
                            zIndex: zIndex,
                        },
                    ]}
                />
            );
        }
        return behindCards;
    };

    return (
        <View style={styles.stackContainer}>
            {/* Render placeholder cards behind */}
            {renderBehindCards()}

            {/* Render the main interactive card on top */}
            {topListing ? (
                // This wrapper View provides size, position, and shadow ONLY
                <View
                    style={[
                        styles.cardBase, // Use base for size/position/shadow
                        // Set background transparent, the BusinessProfileCard will handle its own background
                        { zIndex: MAX_BEHIND_CARDS + 1, backgroundColor: 'transparent' }
                    ]}
                >
                    <BusinessProfileCard
                        listing={topListing}
                        onLikeBusiness={onLikeBusiness}
                        onDismissBusiness={onDismissBusiness}
                    />
                </View>
            ) : null
            }
        </View>
    );
};

const styles = StyleSheet.create({
    stackContainer: {
        flex: 1,
        position: 'relative',
        overflow: 'visible', // Allow transforms/shadows
    },
    cardBase: {
        // Defines size, position, shape, and shadow for ALL cards/wrappers
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 16, // Shape defined here
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        // Default background, overridden by placeholders or wrapper
        // backgroundColor: 'white', // Let the actual components/placeholders define background
    },
    placeholderCard: {
        // Specific style for placeholders
        backgroundColor: '#EE4B2B', // Light grey background
        // Ensure placeholder also respects the border Radius from cardBase
        borderRadius: 16, // Explicitly ensure this matches cardBase
    },
});

export default BusinessCardStack;