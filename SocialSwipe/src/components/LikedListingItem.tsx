// src/components/LikedListingItem.tsx (Updated for Press Handling)

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BusinessListing } from '../contexts/DiscoveryContext'; // Adjust path
import { Feather } from '@expo/vector-icons';

interface LikedListingItemProps {
    listing: BusinessListing;
    onUnlike: (listingId: string) => void;
    // --- ADDED: onPress prop ---
    onPress?: (listingId: string) => void;
}

const LikedListingItem: React.FC<LikedListingItemProps> = ({
    listing,
    onUnlike,
    // --- ADDED: Destructure onPress ---
    onPress
}) => {

    // --- Data Extraction (No changes needed here) ---
    const locationParts = [listing.address_city, listing.address_state].filter(Boolean);
    const formattedLocation = locationParts.join(', ');
    const primaryImageUrl = listing.listing_photos?.[0];
    const fallbackImageUrl = 'https://placehold.co/100x100/cccccc/ffffff?text=No+Img';

    // --- Handlers ---
    const handleUnlikePress = () => {
        onUnlike(listing.id);
    };

    // --- ADDED: Handler for the main item press ---
    const handleItemPress = () => {
        if (onPress) {
            onPress(listing.id); // Pass the listing ID
        }
    };

    // --- Render Logic ---
    if (!listing) { return null; }
    const gradientColors = ['#A0E7E5', '#B4F8C8']; // Example gradient

    return (
        // --- CHANGED: Wrap in TouchableOpacity ---
        <TouchableOpacity onPress={handleItemPress} activeOpacity={0.8}>
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                style={styles.gradientContainer}
            >
                <Image source={{ uri: primaryImageUrl || fallbackImageUrl }} style={styles.image} onError={(e) => console.log(`Image load error: ${e.nativeEvent.error}`)} />
                <View style={styles.infoContainer}>
                    <Text style={styles.name} numberOfLines={1}>{listing.business_name || 'Unnamed Business'}</Text>
                    {formattedLocation ? (
                        <View style={styles.detailRow}>
                            <Feather name="map-pin" size={13} color="#444" style={styles.icon} />
                            <Text style={styles.detailText} numberOfLines={1}>{formattedLocation}</Text>
                        </View>
                    ) : null}
                    {listing.category ? (
                         <View style={styles.detailRow}>
                             <Text style={[styles.detailText, styles.categoryText]} numberOfLines={1}>{listing.category}</Text>
                         </View>
                    ) : null}
                </View>
                {/* Keep unlike button inside, but make sure the main TouchableOpacity works */}
                <TouchableOpacity onPress={handleUnlikePress} style={styles.unlikeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Feather name="x-circle" size={24} color="#E57373" />
                </TouchableOpacity>
            </LinearGradient>
        </TouchableOpacity>
    );
};

// Styles remain the same as the previous "fun" version
const ITEM_HEIGHT = 75;
const styles = StyleSheet.create({
    gradientContainer: {
        flexDirection: 'row', alignItems: 'center', height: ITEM_HEIGHT,
        borderRadius: ITEM_HEIGHT / 2, paddingHorizontal: 10, marginVertical: 6,
        marginHorizontal: 15, overflow: 'hidden', shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1,
        shadowRadius: 3, elevation: 3,
    },
    image: {
        width: 55, height: 55, borderRadius: 55 / 2, marginRight: 10,
        backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    infoContainer: { flex: 1, justifyContent: 'center', },
    name: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 3, },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, },
    icon: { marginRight: 5, },
    detailText: { fontSize: 13, color: '#555', flexShrink: 1, },
    categoryText: { fontWeight: '500', },
    unlikeButton: { padding: 8, marginLeft: 8, justifyContent: 'center', alignItems: 'center', },
});


export default LikedListingItem;