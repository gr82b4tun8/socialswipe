// src/components/MatchBubbleItem.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons'; // Optional: if you want icons

// Assuming your profile data structure matches this (adjust as needed)
// This might come from your individual_profiles table structure
interface MatchedProfile {
    user_id: string; // or just id
    full_name?: string; // Adjust if you use first_name, last_name etc.
    profile_photo_url?: string | null;
    // Add any other relevant fields you might want to display
}

interface MatchBubbleItemProps {
    profile: MatchedProfile;
    onPress: (profileId: string) => void; // Function to handle tap on the bubble
}

const MatchBubbleItem: React.FC<MatchBubbleItemProps> = ({
    profile,
    onPress
}) => {
    if (!profile) { return null; }

    const fallbackImageUrl = 'https://placehold.co/100x100/cccccc/ffffff?text=:)'; // Simple fallback
    const displayName = profile.full_name || 'User'; // Fallback display name

    const handleItemPress = () => {
        onPress(profile.user_id); // Pass the profile's user_id
    };

    // Example gradient - choose colors you like
    const gradientColors = ['#FFAFBD', '#FFC3A0']; // Example: Pink/Peach gradient

    return (
        <TouchableOpacity onPress={handleItemPress} activeOpacity={0.8}>
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                style={styles.gradientContainer}
            >
                <Image
                    source={{ uri: profile.profile_photo_url || fallbackImageUrl }}
                    style={styles.image}
                    onError={(e) => console.log(`Image load error for ${profile.user_id}: ${e.nativeEvent.error}`)}
                />
                <View style={styles.infoContainer}>
                    <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
                    {/* You could add more info here if needed, e.g., location, common interests */}
                    {/* <Text style={styles.detailText} numberOfLines={1}>Tap to chat!</Text> */}
                </View>
                {/* Optional: Add an icon like a chat bubble */}
                {/* <Feather name="message-circle" size={22} color="rgba(0,0,0,0.6)" style={styles.actionIcon} /> */}
            </LinearGradient>
        </TouchableOpacity>
    );
};

// Adapted Styles from LikedListingItem
const ITEM_HEIGHT = 75;
const styles = StyleSheet.create({
    gradientContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: ITEM_HEIGHT,
        borderRadius: ITEM_HEIGHT / 2, // Make it a perfect bubble end
        paddingHorizontal: 10, // Padding inside the gradient
        marginVertical: 6, // Space between bubbles
        marginHorizontal: 15, // Space from screen edges
        overflow: 'hidden', // Ensures gradient respects border radius
        // Shadow for depth (optional)
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    image: {
        width: 55, // Slightly smaller than height for padding effect
        height: 55,
        borderRadius: 55 / 2, // Perfect circle
        marginRight: 12, // Space between image and text
        backgroundColor: '#e0e0e0', // Fallback bg color while image loads
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)', // Subtle white border
    },
    infoContainer: {
        flex: 1, // Take remaining space
        justifyContent: 'center', // Center text vertically
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333', // Darker text for readability on light gradients
        marginBottom: 3,
    },
    detailText: { // Optional: For subtitle text
        fontSize: 13,
        color: '#555',
    },
    actionIcon: { // Optional: Style for an icon on the right
         padding: 8,
         marginLeft: 8,
    }
});

export default MatchBubbleItem;