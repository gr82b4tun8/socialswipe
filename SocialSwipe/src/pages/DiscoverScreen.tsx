// Example Path: src/screens/DiscoverScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'; // Import RN components
import { useEvents} from '../contexts/EventContext'; // Adjust path if needed
import EventCard from '../components/EventCard'; // Adjust path if needed

const DiscoverScreen: React.FC = () => {
  // Assume useEvent provides loading state as well, or adjust if needed
  const { currentEvent, saveEvent, skipEvent, isLoadingEvents } = useEvents();

  // Optional: Handle loading state
  if (isLoadingEvents) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6347" /> {/* Example color */}
      </View>
    );
  }

  return (
    // Equivalent of <div className="container py-2 flex flex-col items-center h-full">
    <View style={styles.container}>
      {/* Equivalent of <div className="flex-1 flex items-center justify-center w-full"> */}
      <View style={styles.contentArea}>
        {currentEvent ? (
          // Equivalent of <div className="w-full max-w-md">
          <View style={styles.cardContainer}>
            <EventCard
              event={currentEvent}
              // These props trigger functions based on actions within EventCard
              onSwipeRight={() => saveEvent(currentEvent.id)}
              onSwipeLeft={skipEvent}
            />
          </View>
        ) : (
          // Equivalent of <div className="text-center p-6 bg-white rounded-lg shadow-sm">
          <View style={styles.noEventsCard}>
            {/* Equivalent of <h2 className="text-xl font-semibold mb-2"> */}
            <Text style={styles.noEventsTitle}>No more events!</Text>
            {/* Equivalent of <p className="text-event-muted"> */}
            <Text style={styles.noEventsText}>
              Check back later for new events in your area.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1, // Takes full height
    alignItems: 'center', // Center children horizontally
    // paddingVertical: 8, // Equivalent of py-2 (adjust value as needed)
    backgroundColor: '#f0f0f0', // Example background color for the screen
  },
  contentArea: {
    flex: 1, // Takes remaining space
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
    width: '100%', // Takes full width
  },
  cardContainer: {
    width: '90%', // Use percentage or fixed width
    maxWidth: 400, // Equivalent of max-w-md (adjust value)
    // The EventCard itself will likely define its aspect ratio/height
  },
  noEventsCard: {
    textAlign: 'center', // Note: textAlign is inherited by Text, not directly on View
    padding: 24, // Equivalent of p-6 (adjust value)
    backgroundColor: '#ffffff',
    borderRadius: 12, // Example value for rounded-lg
    // Shadow properties (adjust values for desired effect)
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: 1, // Lighter shadow for shadow-sm
    },
    shadowOpacity: 0.20, // Adjust opacity
    shadowRadius: 1.41,
    elevation: 2, // Android shadow
    alignItems: 'center', // Center text since textAlign isn't on View
    marginHorizontal: 20, // Add some horizontal margin
  },
  noEventsTitle: {
    fontSize: 20, // Equivalent of text-xl
    fontWeight: '600', // Equivalent of font-semibold
    marginBottom: 8, // Equivalent of mb-2
    color: '#333', // Example color
  },
  noEventsText: {
    fontSize: 14,
    color: '#6c757d', // Placeholder for 'text-event-muted' - ADJUST THIS COLOR
  },
  // Optional style for loading indicator container
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DiscoverScreen;