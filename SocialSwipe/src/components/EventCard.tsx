// src/components/EventCard.tsx (Example RN Path)

import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Platform,
    LayoutAnimation, // For simple layout animations
    UIManager, // Needed for LayoutAnimation on Android
    ImageBackground,
} from 'react-native';
import Swiper from 'react-native-deck-swiper'; // Import the swiper
import Icon from 'react-native-vector-icons/Feather'; // Using Feather icons
import LinearGradient from 'react-native-linear-gradient'; // For the gradient overlay
// Assuming Event type is defined elsewhere, e.g., in context or types file
import { Event, Attendee } from '@/types'; // Adjust import path as needed
import { formatDate } from '@/lib/utils'; // Adjust import path as needed

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Simple Avatar Component --- (Could be moved to its own file)
interface AvatarProps {
    uri?: string;
    fallbackText: string;
    size?: number;
}
const Avatar: React.FC<AvatarProps> = ({ uri, fallbackText, size = 56 }) => {
    const avatarStyle = {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#CCCCCC', // Fallback background
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        overflow: 'hidden', // Clip the image
    };
    const imageStyle = {
        width: '100%',
        height: '100%',
    };
    const fallbackTextStyle = {
        color: '#FFFFFF',
        fontSize: size * 0.5, // Adjust font size based on avatar size
        fontWeight: 'bold',
    };

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


// --- Event Card Props ---
interface EventCardProps {
    event: Event; // The event object to display
    onSwipeRight: (eventId: string) => void; // Function called on swipe right
    onSwipeLeft: (eventId: string) => void; // Function called on swipe left
    onViewProfile: (attendeeId: string) => void; // Function called when tapping an attendee
    onSwipedAll?: () => void; // Optional: called when the last card is swiped
    cardIndex?: number; // Optional: index if part of a larger stack
}

// --- Event Card Component ---
const EventCard: React.FC<EventCardProps> = ({
    event,
    onSwipeRight,
    onSwipeLeft,
    onViewProfile,
    onSwipedAll = () => {}, // Default empty function
    cardIndex = 0, // Default index
}) => {
    const [showDetails, setShowDetails] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const swiperRef = useRef<Swiper<Event>>(null);

    const toggleDetails = () => {
        // Animate layout changes when details are shown/hidden
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowDetails(!showDetails);
    };

    const handleScroll = (direction: 'left' | 'right') => {
        if (scrollViewRef.current) {
            // Adjust scroll amount based on your avatar size + spacing
            const scrollAmount = direction === 'left' ? -150 : 150;
            scrollViewRef.current.scrollTo({ x: scrollAmount, animated: true });
        }
    };

    const formattedDate = formatDate(event.date); // Use your date formatting function

    // The function that renders the actual content of each card in the swiper
    const renderCardContent = useCallback((cardData: Event | undefined) => {
        if (!cardData) {
            // Return a placeholder or null if cardData is somehow undefined
             return <View style={styles.card}><Text>Error loading event</Text></View>;
        }

        // Main card structure
        return (
            <View style={styles.card}>
                <ImageBackground
                    source={{ uri: cardData.image }}
                    style={styles.imageBackground}
                    resizeMode="cover"
                >
                    {/* Gradient Overlay */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
                        style={styles.gradient}
                    >
                        {/* Content inside gradient */}
                        <View style={styles.contentOverlay}>
                            <View style={styles.titleRow}>
                                <Text style={styles.title}>{cardData.title}</Text>
                                {/* Price Badge */}
                                {cardData.price !== undefined && (
                                     <View style={[styles.badge, styles.priceBadge]}>
                                        <Text style={styles.priceBadgeText}>
                                            $ {cardData.price === 0 ? 'Free' : cardData.price}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.infoRow}>
                                <Icon name="map-pin" size={14} color="#FFFFFFCC" style={styles.icon} />
                                <Text style={styles.infoText} numberOfLines={1}>
                                    {cardData.location} • {formattedDate}
                                </Text>
                            </View>

                            {/* Category Badges */}
                            <View style={styles.badgeRow}>
                                {cardData.categories.slice(0, 2).map((category, index) => (
                                    <View key={index} style={[styles.badge, styles.categoryBadge]}>
                                        <Text style={styles.categoryBadgeText}>{category}</Text>
                                    </View>
                                ))}
                                {cardData.categories.length > 2 && (
                                    <View style={[styles.badge, styles.categoryBadge]}>
                                        <Text style={styles.categoryBadgeText}>+{cardData.categories.length - 2}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Attendees Section */}
                            <View style={styles.attendeesSection}>
                                <View style={styles.attendeesHeader}>
                                    <Text style={styles.attendeesCountText}>
                                        {cardData.attendeesCount} attending
                                    </Text>
                                    {/* Details Toggle Button */}
                                    <TouchableOpacity onPress={toggleDetails} style={styles.detailsButton}>
                                        <Icon
                                            name={showDetails ? "chevron-up" : "chevron-down"}
                                            size={24}
                                            color="#FFFFFF"
                                         />
                                    </TouchableOpacity>
                                </View>

                                {/* Attendees Carousel */}
                                <View style={styles.carouselContainer}>
                                   {/* Scroll Left Button - Kept simple for now */}
                                    {/* <TouchableOpacity style={[styles.scrollButton, styles.scrollButtonLeft]} onPress={() => handleScroll('left')}>
                                        <Icon name="chevron-left" size={20} color="#FFF" />
                                    </TouchableOpacity> */}

                                    <ScrollView
                                        ref={scrollViewRef}
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.attendeesScroll}
                                        scrollEventThrottle={16} // Optional: for smoother scroll handling if needed
                                    >
                                        {cardData.attendees.map((attendee: Attendee) => (
                                            <TouchableOpacity
                                                key={attendee.id}
                                                onPress={() => onViewProfile(attendee.id)}
                                                style={styles.attendeeItem}
                                            >
                                                <Avatar
                                                    uri={attendee.image}
                                                    fallbackText={attendee.name}
                                                    size={56} // Match style size
                                                />
                                                <Text style={styles.attendeeName} numberOfLines={1}>
                                                    {attendee.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>

                                    {/* Scroll Right Button */}
                                    {/* <TouchableOpacity style={[styles.scrollButton, styles.scrollButtonRight]} onPress={() => handleScroll('right')}>
                                        <Icon name="chevron-right" size={20} color="#FFF" />
                                    </TouchableOpacity> */}
                                </View>
                            </View>

                            {/* Collapsible Event Details */}
                            {showDetails && (
                                <View style={styles.detailsContainer}>
                                    <Text style={styles.detailsDescription}>{cardData.description}</Text>
                                    <View style={styles.detailsInfoRow}>
                                        <Icon name="calendar" size={16} color="#FFFFFFCC" style={styles.icon} />
                                        <Text style={styles.detailsInfoText}>{formattedDate}</Text>
                                    </View>
                                     <View style={styles.detailsInfoRow}>
                                        <Icon name="clock" size={16} color="#FFFFFFCC" style={styles.icon} />
                                        <Text style={styles.detailsInfoText}>{cardData.time}</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </LinearGradient>
                </ImageBackground>
            </View>
        );
     }, [event, showDetails, formattedDate, onViewProfile]); // Dependencies for useCallback

    // Render the Swiper component
    return (
         <View style={styles.container}>
            <Swiper
                ref={swiperRef}
                cards={[event]} // Pass the single event in an array for the swiper
                renderCard={renderCardContent} // Use the render function defined above
                cardIndex={cardIndex} // Current index
                backgroundColor={'transparent'} // Make swiper background transparent
                onSwipedRight={() => onSwipeRight(event.id)} // Pass event ID
                onSwipedLeft={() => onSwipeLeft(event.id)} // Pass event ID
                onSwipedAll={onSwipedAll} // Callback when all cards are swiped
                stackSize={1} // Show only one card visually in the stack
                stackSeparation={0} // No visual separation for stacked cards below
                animateCardOpacity // Fade card opacity on swipe
                // swipeBackCard // Optional: allow swiping back (might need extra logic)
                containerStyle={styles.swiperContainer}
                 // Use vertical swipe for Tinder-like effect? Default is horizontal.
                // verticalSwipe={false}
                // horizontalSwipe={true}
                 // Infinite loop (set to false if you only have one batch of events)
                 infinite={false} // IMPORTANT: set based on your Discover logic
                 // Custom animation parameters if needed
                 // outputRotationRange={["-15deg", "0deg", "15deg"]}
            />
            {/* Action Buttons positioned below the swiper area */}
            {event && ( // Only show buttons if there's an event card visible
                <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.skipButton]}
                        onPress={() => swiperRef.current?.swipeLeft()} // Programmatically swipe
                    >
                        <Icon name="x" size={32} color="#F15A6A" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.likeButton]}
                        onPress={() => swiperRef.current?.swipeRight()} // Programmatically swipe
                    >
                        <Icon name="heart" size={30} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
             )}
        </View>
    );
};


// --- Styles ---
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
     container: { // Container for the whole component (Swiper + Buttons)
        flex: 1,
        // backgroundColor: 'lightblue', // For debugging layout
        position: 'relative', // To position action buttons
        marginBottom: 60, // Make space for action buttons below
    },
     swiperContainer: {
        flex: 1,
        // backgroundColor: 'lightcoral', // For debugging layout
        height: screenHeight * 0.75, // Make swiper take significant height
        // You might adjust height based on your Discover screen layout
    },
    card: {
        flex: 1, // Card should fill the swiper's render area
        borderRadius: 16,
        borderWidth: 0, // No border needed if using shadow/elevation
        // backgroundColor: '#fff', // Background if image fails to load
        overflow: 'hidden', // Clip image and gradient
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        // Elevation for Android
        elevation: 5,
    },
    imageBackground: {
        flex: 1, // ImageBackground takes full card space
        justifyContent: 'flex-end', // Align gradient and content to the bottom
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        // Height can be adjusted, make it large enough for content
        // Height will be determined by the contentOverlay padding + content height
        paddingTop: 100, // Push gradient start higher, adjust as needed
    },
    contentOverlay: {
        paddingHorizontal: 16,
        paddingBottom: 16, // Bottom padding inside the gradient
        paddingTop: 10, // Minimal top padding inside gradient start
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 26,
        fontWeight: 'bold',
        flexShrink: 1, // Allow title to shrink if price badge is wide
        marginRight: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
        marginBottom: 8,
    },
    infoText: {
        color: '#FFFFFFCC', // White with some transparency
        fontSize: 14,
        marginLeft: 4,
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap', // Allow badges to wrap
        marginBottom: 12,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12, // Pill shape
        marginRight: 6,
        marginBottom: 4, // Spacing for wrapped badges
        borderWidth: 1,
    },
    priceBadge: {
        backgroundColor: 'rgba(0, 122, 255, 0.3)', // Bluish semi-transparent
        borderColor: 'rgba(0, 122, 255, 0.6)',
        marginLeft: 'auto', // Push price badge to the right
    },
    priceBadgeText: {
        color: '#E0F2FF', // Light blue text
        fontSize: 14,
        fontWeight: '600',
    },
    categoryBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    categoryBadgeText: {
        color: '#FFFFFFE6',
        fontSize: 12,
    },
    attendeesSection: {
        marginTop: 8,
         // backgroundColor: 'rgba(255,0,0,0.1)', // Debugging bg
    },
    attendeesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    attendeesCountText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '500',
    },
    detailsButton: {
        padding: 5, // Touch target
    },
     carouselContainer: {
        position: 'relative', // For positioning scroll buttons if used
        marginHorizontal: -16, // Allow scrollview to reach edges of padding
    },
    attendeesScroll: {
        paddingHorizontal: 16, // Inner padding for scroll content
        paddingVertical: 8,
    },
    attendeeItem: {
        marginRight: 12,
        alignItems: 'center',
        width: 60, // Fixed width for wrapping text
    },
    // Styles for the simple Avatar component are inline above
    attendeeName: {
        color: '#FFFFFFE6',
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
     scrollButton: { // Styles if using scroll buttons
        position: 'absolute',
        top: '50%',
        marginTop: -16, // Adjust based on button height (32/2)
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 16,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    scrollButtonLeft: {
        left: 5,
    },
    scrollButtonRight: {
        right: 5,
    },
    detailsContainer: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.2)',
    },
    detailsDescription: {
        color: '#FFFFFFE6',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 10,
    },
    detailsInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    detailsInfoText: {
        color: '#FFFFFFCC',
        fontSize: 14,
        marginLeft: 8,
    },
    icon: {
        marginRight: 4, // Consistent icon spacing
    },
    // Action Buttons (Like/Skip)
     actionButtonsContainer: {
        position: 'absolute',
        bottom: -15, // Position below the swiper area (adjust based on container margin)
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: 'lightgreen', // Debugging
        paddingBottom: 10, // Ensure buttons don't touch screen edge
    },
    actionButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 20,
        backgroundColor: '#FFFFFF', // Default background
        // Shadow iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        // Elevation Android
        elevation: 6,
    },
    skipButton: {
        // Custom styles for skip button if needed
         backgroundColor: '#FFF', // White background
    },
    likeButton: {
        backgroundColor: '#62D9A3', // Example Like button color (Green)
    },
});

export default EventCard;


// --- Type Definitions (Example - Place these in a central types file) ---
// export interface Attendee {
//   id: string;
//   name: string;
//   image?: string; // Optional image URI
// }

// export interface Event {
//   id: string;
//   title: string;
//   description: string;
//   image: string; // Image URI
//   date: string; // Or Date object
//   time: string;
//   location: string;
//   price: number; // Or string 'Free'
//   categories: string[];
//   attendeesCount: number;
//   attendees: Attendee[];
// }
// --- End Type Definitions ---