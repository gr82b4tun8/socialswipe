// src/components/ProfileCardStack.tsx (New File)

import React, { useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Swiper from 'react-native-deck-swiper';

// Import your ProfileCard and its type definition
import ProfileCard from './ProfileCard'; // Adjust path if needed
import { Profile as IndividualProfile } from '../screens/EditProfileScreen'; // Adjust path/name

interface ProfileCardStackProps {
    profiles: IndividualProfile[];
    onSwipeLeft: (profileId: string) => void; // Pass profile ID on swipe
    onSwipeRight: (profileId: string) => void; // Pass profile ID on swipe
    onSwipedAll?: () => void; // Optional: callback when stack is empty
}

const { height: screenHeight } = Dimensions.get('window');

const ProfileCardStack: React.FC<ProfileCardStackProps> = ({
    profiles,
    onSwipeLeft,
    onSwipeRight,
    onSwipedAll = () => {}, // Default empty function
}) => {
    const swiperRef = useRef<Swiper<IndividualProfile>>(null);

    if (!profiles || profiles.length === 0) {
        // Handled by parent, but good practice
        return null;
    }

    const handleSwipedLeft = (index: number) => {
        if (profiles[index]) {
            onSwipeLeft(profiles[index].id); // Assuming profile has 'id' field which is the user_id
        }
    };

    const handleSwipedRight = (index: number) => {
         if (profiles[index]) {
            onSwipeRight(profiles[index].id); // Assuming profile has 'id' field
        }
    };

    return (
        <View style={styles.container}>
            <Swiper
                ref={swiperRef}
                cards={profiles}
                renderCard={(profile) => {
                    // Ensure profile is valid before rendering
                    return profile ? <ProfileCard profile={profile} /> : null;
                }}
                onSwipedLeft={handleSwipedLeft}
                onSwipedRight={handleSwipedRight}
                onSwipedAll={onSwipedAll}
                cardIndex={0}
                backgroundColor={'transparent'} // Use parent background
                stackSize={Math.min(3, profiles.length)} // Show 3 cards max in stack
                stackSeparation={-10} // Adjust vertical separation
                overlayLabels={{
                    left: { title: 'NOPE', style: { label: styles.overlayLabel, wrapper: styles.overlayWrapperLeft } },
                    right: { title: 'LIKE', style: { label: styles.overlayLabel, wrapper: styles.overlayWrapperRight } },
                }}
                animateOverlayLabelsOpacity
                animateCardOpacity
                swipeBackCard // Allows swiping back (optional)
                infinite={false} // Don't loop when stack is empty
                cardVerticalMargin={20} // Add some vertical margin if cards touch top/bottom
                 // Make cards fill more of the container width
                 containerStyle={styles.swiperContainer}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        // backgroundColor: 'lightblue', // For debugging layout
    },
     swiperContainer: {
        flexGrow: 1, // Allow swiper to take available space
         // backgroundColor: 'lightcoral', // For debugging swiper container size
         marginTop: 10, // Adjust top margin as needed
         marginBottom: 30, // Add margin at bottom
     },
    overlayLabel: {
        fontSize: 45,
        fontWeight: 'bold',
        color: 'white',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    overlayWrapperLeft: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        marginTop: 30,
        marginLeft: -30,
        transform: [{ rotate: '15deg'}], // Tilt label
    },
    overlayWrapperRight: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        marginTop: 30,
        marginLeft: 30,
        transform: [{ rotate: '-15deg'}], // Tilt label
    },
});

export default ProfileCardStack;