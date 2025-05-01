// src/components/MatchBubbleItem.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// import { Feather } from '@expo/vector-icons'; // Keep if you plan to add icons later

// Interface remains the same, expecting raw data
interface ReceivedProfileData {
    user_id: string;
    first_name?: string | null;
    last_name?: string | null; // Still here in case data has it, but we won't use it
    profile_pictures?: string[] | null;
}

interface MatchBubbleItemProps {
    profile: ReceivedProfileData;
    onPress: (profileId: string) => void;
}

const MatchBubbleItem: React.FC<MatchBubbleItemProps> = ({
    profile,
    onPress
}) => {
    if (!profile) { return null; }

    const fallbackImageUrl = 'https://placehold.co/100x100/cccccc/ffffff?text=:)';

    // --- MODIFIED: Use only first_name ---
    const displayName = profile.first_name || 'User';

    // Get the first profile picture URL or fallback (remains the same)
    const imageUrlToDisplay = profile.profile_pictures?.[0] || fallbackImageUrl;

    const handleItemPress = () => {
        onPress(profile.user_id);
    };

    const gradientColors = ['#FFAFBD', '#FFC3A0'];

    return (
        <TouchableOpacity onPress={handleItemPress} activeOpacity={0.8}>
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                // Style remains the same - alignItems: 'center' vertically aligns items
                style={styles.gradientContainer}
            >
                {/* Image stays on the left */}
                <Image
                    source={{ uri: imageUrlToDisplay }}
                    style={styles.image}
                    onError={(e) => console.log(`Image load error for ${profile.user_id}: ${e.nativeEvent.error}`)}
                />

                {/* --- MODIFIED: Spacer View --- */}
                {/* This view now acts as a flexible spacer */}
                <View style={styles.spacer} />

                {/* --- MODIFIED: Name Text --- */}
                {/* Name text is now the last element, pushed to the right */}
                <Text style={styles.name} numberOfLines={1}>{displayName}</Text>

                {/* Optional: Add an icon like a chat bubble here if needed */}
                {/* <Feather name="message-circle" size={22} color="rgba(0,0,0,0.6)" style={styles.actionIcon} /> */}

            </LinearGradient>
        </TouchableOpacity>
    );
};

const ITEM_HEIGHT = 75;
const styles = StyleSheet.create({
    gradientContainer: {
        flexDirection: 'row',
        alignItems: 'center', // Vertically aligns image, spacer, and name
        height: ITEM_HEIGHT,
        borderRadius: ITEM_HEIGHT / 2,
        // Padding applies to left of image and right of name
        paddingLeft: 10, // Keep left padding the same
        paddingRight: 30, // Increase right padding to push name further left
        marginVertical: 6,
        marginHorizontal: 15,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    image: {
        width: 55,
        height: 55,
        borderRadius: 55 / 2,
        // marginRight needed to space image from the spacer/name area
        marginRight: 12,
        backgroundColor: '#e0e0e0',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
    },
    // --- MODIFIED: Renamed infoContainer to spacer ---
    spacer: {
        flex: 1, // Takes up all available space, pushing name to the right
        // No longer needs justifyContent
    },
    name: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        // Removed marginBottom as vertical alignment handled by container
        // Add marginLeft if you have an action icon to its right
        // paddingHorizontal on container provides space on the right edge
        flexShrink: 1, // Allow name to shrink if spacer + image + name is too wide
    },
    detailText: {
        // Style remains unused for now but kept if needed later
        fontSize: 13,
        color: '#555',
    },
    actionIcon: { // Style remains unused but kept if needed later
         padding: 8,
         marginLeft: 8, // Space icon from the name
    }
});

export default MatchBubbleItem;