// components/BusinessCardStack.tsx
import React, { useState } from 'react'; // <-- Import useState
import {
    View,
    StyleSheet,
    Dimensions,
    TouchableOpacity, // <-- Import TouchableOpacity
    Modal,          // <-- Import Modal
    SafeAreaView,   // <-- Import SafeAreaView for modal content
    Button,         // <-- Import Button for closing modal (or use custom component)
} from 'react-native';
import BusinessProfileCard, { BusinessListing } from './BusinessProfileCard'; // Adjust path
import ProfileCard from './ProfileCard'; // Adjust path to your ProfileCard component
import { Profile as IndividualProfile } from '../screens/EditProfileScreen'; // Example Import - Adjust path/type name

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// --- Constants for Horizontal Stacking ---
// --- ADJUSTED: Reduced offset to make cards stick out less ---
const CARD_HORIZONTAL_OFFSET = -26; // Previous: 9. Adjust this value as needed (e.g., 3, 5, or even 0 or negative)
const CARD_SCALE_DIFF = 0.03;
const MAX_BEHIND_CARDS = 5;

interface BusinessCardStackProps {
    topListing: BusinessListing | null;
    onLikeBusiness: (managerUserId: string, listingId: string) => void;
    onDismissBusiness: (managerUserId: string, listingId: string) => void;
    likerProfiles?: IndividualProfile[];
}

const BusinessCardStack: React.FC<BusinessCardStackProps> = ({
    topListing,
    onLikeBusiness,
    onDismissBusiness,
    likerProfiles = [],
}) => {
    // --- State for managing the selected profile for modal view ---
    const [selectedProfile, setSelectedProfile] = useState<IndividualProfile | null>(null);

    const cardsToRenderCount = Math.min(likerProfiles.length, MAX_BEHIND_CARDS);

    // --- Function to handle opening the modal ---
    const handleProfilePress = (profile: IndividualProfile) => {
        setSelectedProfile(profile);
    };

    // --- Function to handle closing the modal ---
    const handleCloseModal = () => {
        setSelectedProfile(null);
    };

    const renderLikerProfileCards = () => {
        const behindCards = [];
        if (cardsToRenderCount <= 0) return null;

        for (let i = cardsToRenderCount - 1; i >= 0; i--) {
            const profileToShow = likerProfiles[i];
            const positionBehind = i + 1;
            const scale = 1 - positionBehind * CARD_SCALE_DIFF;
            const translateX = positionBehind * CARD_HORIZONTAL_OFFSET;
            const zIndex = MAX_BEHIND_CARDS - positionBehind + 1;

            behindCards.push(
                // --- Use TouchableOpacity to make the card pressable ---
                <TouchableOpacity
                    // Apply key to the TouchableOpacity now
                    key={profileToShow.user_id || `liker-card-${i}`}
                    style={[
                        styles.cardBase,
                        { backgroundColor: 'transparent' }, // Wrapper is transparent
                        {
                            transform: [{ translateX }, { scale }],
                            zIndex: zIndex,
                        },
                    ]}
                    // --- Handle press event ---
                    onPress={() => handleProfilePress(profileToShow)}
                    activeOpacity={0.8} // Optional: visual feedback on press
                >
                    {/* Render the actual ProfileCard component inside */}
                    <ProfileCard
                        profile={profileToShow}
                        isBehindCard={true} // Keep this prop if ProfileCard uses it for styling
                    />
                </TouchableOpacity>
            );
        }
        return behindCards;
    };

    return (
        <View style={styles.stackContainer}>
            {/* Render Liker Profile cards behind */}
            {renderLikerProfileCards()}

            {/* Render the main interactive Business card on top */}
            {topListing ? (
                <View
                    style={[
                        styles.cardBase,
                        { zIndex: MAX_BEHIND_CARDS + 1, backgroundColor: 'transparent' }
                    ]}
                    // Prevent clicks on the area behind the main card from triggering underlying touchables
                    pointerEvents="box-none"
                >
                    <BusinessProfileCard
                        listing={topListing}
                        onLikeBusiness={() => onLikeBusiness(topListing.manager_user_id, topListing.id)}
                        onDismissBusiness={() => onDismissBusiness(topListing.manager_user_id, topListing.id)}
                    />
                </View>
            ) : null}

            {/* --- Modal for displaying selected profile --- */}
            <Modal
                animationType="slide" // Or 'fade', 'none'
                transparent={false}    // Set to false for a full background
                visible={selectedProfile !== null} // Show modal when a profile is selected
                onRequestClose={handleCloseModal} // Handle back button press on Android
            >
                {/* Use SafeAreaView to avoid notches/status bars */}
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        {/* Render the full ProfileCard - maybe without specific 'behind' styling */}
                        {selectedProfile && (
                            <ProfileCard
                                profile={selectedProfile}
                                isBehindCard={false} // Ensure it uses standard display style
                                // You might need a different/larger version of ProfileCard here
                                // or pass props to adjust its appearance for full screen.
                            />
                        )}
                        {/* Add a button or touchable to close the modal */}
                        <Button title="Close" onPress={handleCloseModal} />
                         {/* Alternative: Close button using TouchableOpacity
                         <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                             <Text style={styles.closeButtonText}>Close</Text>
                         </TouchableOpacity>
                         */}
                    </View>
                </SafeAreaView>
            </Modal>
        </View>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    stackContainer: {
        flex: 1,
        position: 'relative',
        overflow: 'visible',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardBase: {
        position: 'absolute',
        width: '90%',
        height: '90%',
        alignSelf: 'center',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    // --- Styles for the Modal ---
    modalContainer: {
        flex: 1,
        backgroundColor: 'white', // Or your app's background color
    },
    modalContent: {
        flex: 1,
        alignItems: 'center', // Center profile card horizontally
        justifyContent: 'center', // Center profile card vertically (adjust as needed)
        padding: 20, // Add some padding around the content
    },
    // --- Optional: Styles for a custom close button ---
    /*
    closeButton: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#cccccc',
        borderRadius: 8,
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    */
    // placeholderCard style is no longer used/needed based on current logic
});

export default BusinessCardStack;