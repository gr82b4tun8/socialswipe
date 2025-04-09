import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity, // Can use Pressable as well
    ScrollView,
    Dimensions,
    Platform,
    LayoutAnimation,
    UIManager,
    ImageBackground,
} from 'react-native';
// REMOVED: import Swiper from 'react-native-deck-swiper';
// REMOVED: import LinearGradient from 'react-native-linear-gradient';
// CHANGE: Use @expo/vector-icons
import { Feather, Ionicons } from '@expo/vector-icons'; // Using Feather & Ionicons from Expo

import { Event, Attendee } from '@/types'; // Adjust import path as needed
import { formatDate } from '@/lib/utils'; // Adjust import path as needed

// Enable LayoutAnimation for Android (Keep this)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Avatar Component (Keep this - no native issues) ---
interface AvatarProps {
    uri?: string;
    fallbackText: string;
    size?: number;
}
const Avatar: React.FC<AvatarProps> = ({ uri, fallbackText, size = 56 }) => {
    // ... (Avatar component implementation remains the same)
    const avatarStyle = { /* ... */ };
    const imageStyle = { /* ... */ };
    const fallbackTextStyle = { /* ... */ };
    return (
        <View style={avatarStyle}>
            {uri ? (
                <Image source={{ uri }} style={imageStyle} resizeMode="cover" />
            ) : (
                <Text style={fallbackTextStyle}>{fallbackText.charAt(0).toUpperCase()}</Text>
            )}
        </View>
    );
};
// --- End Avatar Component ---

// --- Event Card Props (Remove swiper-specific ones) ---
interface EventCardProps {
    event: Event;
    onSwipeRight: (eventId: string) => void; // Keep prop name for now, but triggered by button
    onSwipeLeft: (eventId: string) => void; // Keep prop name for now, but triggered by button
    onViewProfile: (attendeeId: string) => void;
}

// --- Event Card Component (Modified) ---
const EventCard: React.FC<EventCardProps> = ({
    event,
    onSwipeRight,
    onSwipeLeft,
    onViewProfile,
}) => {
    const [showDetails, setShowDetails] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const toggleDetails = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowDetails(!showDetails);
    };

    // handleScroll is likely unused without the horizontal scroll buttons now,
    // but keep it if you adapt the attendee scroll view in other ways
    const handleScroll = (direction: 'left' | 'right') => {
        // ... (handleScroll implementation) ...
    };

    if (!event) {
        // Handle case where event might be null/undefined if passed unexpectedly
        return <View style={styles.card}><Text>No event data.</Text></View>;
    }

    const formattedDate = formatDate(event.date);

    return (
        // Container for the static card + action buttons
        <View style={styles.container}>
            {/* Main static card structure */}
            <View style={styles.card}>
                <ImageBackground
                    source={{ uri: event.image }}
                    style={styles.imageBackground}
                    resizeMode="cover"
                >
                    {/* Gradient Replacement: Semi-transparent View */}
                    <View style={styles.gradientOverlay}>
                        {/* Content inside overlay */}
                        <View style={styles.contentOverlay}>
                            <View style={styles.titleRow}>
                                <Text style={styles.title}>{event.title}</Text>
                                {/* Price Badge */}
                                {event.price !== undefined && (
                                     <View style={[styles.badge, styles.priceBadge]}>
                                         <Text style={styles.priceBadgeText}>
                                             {event.price === 0 ? 'Free' : `$ ${event.price}`}
                                         </Text>
                                     </View>
                                )}
                            </View>

                            <View style={styles.infoRow}>
                                {/* Use Feather from @expo/vector-icons */}
                                <Feather name="map-pin" size={14} color="#FFFFFFCC" style={styles.icon} />
                                <Text style={styles.infoText} numberOfLines={1}>
                                    {event.location} • {formattedDate}
                                </Text>
                            </View>

                            {/* Category Badges */}
                            <View style={styles.badgeRow}>
                                {event.categories.slice(0, 2).map((category, index) => (
                                    <View key={index} style={[styles.badge, styles.categoryBadge]}>
                                        <Text style={styles.categoryBadgeText}>{category}</Text>
                                    </View>
                                ))}
                                {event.categories.length > 2 && (
                                     <View style={[styles.badge, styles.categoryBadge]}>
                                         <Text style={styles.categoryBadgeText}>+{event.categories.length - 2}</Text>
                                     </View>
                                )}
                            </View>

                            {/* Attendees Section */}
                            <View style={styles.attendeesSection}>
                                <View style={styles.attendeesHeader}>
                                    <Text style={styles.attendeesCountText}>
                                        {event.attendeesCount} attending
                                    </Text>
                                    {/* Details Toggle Button */}
                                    <TouchableOpacity onPress={toggleDetails} style={styles.detailsButton}>
                                        {/* Use Feather from @expo/vector-icons */}
                                        <Feather
                                            name={showDetails ? "chevron-up" : "chevron-down"}
                                            size={24}
                                            color="#FFFFFF"
                                        />
                                    </TouchableOpacity>
                                </View>

                                {/* Attendees Carousel (remains ScrollView) */}
                                <View style={styles.attendeesCarouselContainer}>
                                    <ScrollView
                                        ref={scrollViewRef}
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.attendeesScroll}
                                        scrollEventThrottle={16}
                                    >
                                        {event.attendees.map((attendee: Attendee) => (
                                            <TouchableOpacity
                                                key={attendee.id}
                                                onPress={() => onViewProfile(attendee.id)}
                                                style={styles.attendeeItem}
                                            >
                                                <Avatar
                                                    uri={attendee.image}
                                                    fallbackText={attendee.name}
                                                    size={56}
                                                />
                                                <Text style={styles.attendeeName} numberOfLines={1}>
                                                    {attendee.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>

                            {/* Collapsible Event Details */}
                            {showDetails && (
                                <View style={styles.detailsContainer}>
                                    <Text style={styles.detailsDescription}>{event.description}</Text>
                                     <View style={styles.detailsInfoRow}>
                                        {/* Use Feather from @expo/vector-icons */}
                                         <Feather name="calendar" size={16} color="#FFFFFFCC" style={styles.icon} />
                                         <Text style={styles.detailsInfoText}>{formattedDate}</Text>
                                     </View>
                                      <View style={styles.detailsInfoRow}>
                                        {/* Use Feather from @expo/vector-icons */}
                                         <Feather name="clock" size={16} color="#FFFFFFCC" style={styles.icon} />
                                         <Text style={styles.detailsInfoText}>{event.time}</Text>
                                      </View>
                                </View>
                            )}
                        </View>
                    </View>
                    {/* End Gradient Replacement */}
                </ImageBackground>
            </View>

             {/* Action Buttons (Replaced Swiper Buttons) */}
             <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity
                      style={[styles.actionButton, styles.skipButton]}
                      // Trigger the function passed from DiscoverScreen directly
                      onPress={() => onSwipeLeft(event.id)}
                  >
                      {/* Use Ionicons from @expo/vector-icons */}
                      <Ionicons name="close" size={32} color="#F15A6A" />
                  </TouchableOpacity>
                  <TouchableOpacity
                      style={[styles.actionButton, styles.likeButton]}
                      // Trigger the function passed from DiscoverScreen directly
                      onPress={() => onSwipeRight(event.id)}
                  >
                      {/* Use Ionicons from @expo/vector-icons */}
                      <Ionicons name="heart" size={30} color="#FFFFFF" />
                  </TouchableOpacity>
             </View>

        </View> // End container
    );
};

// --- Styles ---
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: { // Container for the whole component
        flex: 1, // Take available space in DiscoverScreen's cardContainer
        // backgroundColor: 'lightyellow', // Debug
    },
    card: { // Styles for the main card view itself
        flex: 1, // Card should fill its container space
        borderRadius: 16,
        backgroundColor: '#fff', // Background if image fails
        overflow: 'hidden',
        // Shadow/Elevation can remain
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    imageBackground: {
        flex: 1,
        justifyContent: 'flex-end', // Align content overlay to bottom
    },
    // Gradient Replacement Style
    gradientOverlay: {
        flex: 1, // Take full space of ImageBackground
        backgroundColor: 'rgba(0,0,0,0.4)', // Semi-transparent overlay
        justifyContent: 'flex-end', // Align content to bottom
    },
    contentOverlay: { // Padding for content inside the overlay
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 100, // Push content down (adjust as needed)
    },
    titleRow: { /* ... same */ },
    title: { /* ... same */ },
    infoRow: { /* ... same */ },
    infoText: { /* ... same */ },
    badgeRow: { /* ... same */ },
    badge: { /* ... same */ },
    priceBadge: { /* ... same */ },
    priceBadgeText: { /* ... same */ },
    categoryBadge: { /* ... same */ },
    categoryBadgeText: { /* ... same */ },
    attendeesSection: { /* ... same */ },
    attendeesHeader: { /* ... same */ },
    attendeesCountText: { /* ... same */ },
    detailsButton: { /* ... same */ },
    attendeesCarouselContainer: { // Renamed from carouselContainer
        marginHorizontal: -16, // Allow scrollview content to reach edges
    },
    attendeesScroll: { /* ... same */ },
    attendeeItem: { /* ... same */ },
    attendeeName: { /* ... same */ },
    detailsContainer: { /* ... same */ },
    detailsDescription: { /* ... same */ },
    detailsInfoRow: { /* ... same */ },
    detailsInfoText: { /* ... same */ },
    icon: { /* ... same */ },
     // Action Buttons (Now part of the static card layout)
     actionButtonsContainer: {
         flexDirection: 'row',
         justifyContent: 'space-evenly', // Space out buttons
         alignItems: 'center',
         paddingVertical: 15, // Add padding around buttons
         // Removed absolute positioning
     },
     actionButton: { /* ... same style as before ... */
         width: 64,
         height: 64,
         borderRadius: 32,
         justifyContent: 'center',
         alignItems: 'center',
        // marginHorizontal: 20, // Use space-evenly instead
         backgroundColor: '#FFFFFF',
         shadowColor: '#000',
         shadowOffset: { width: 0, height: 2 },
         shadowOpacity: 0.3,
         shadowRadius: 4,
         elevation: 6,
     },
     skipButton: { /* ... same */ },
     likeButton: { /* ... same */ },
});

export default EventCard;

// --- Type Definitions (Keep or move) ---
// ... (Event, Attendee types) ...