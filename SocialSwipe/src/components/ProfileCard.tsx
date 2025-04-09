// src/components/ProfileCard.tsx (Fixed Invalid Hook Call)

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  Dimensions,
  Pressable,
  ActivityIndicator
} from 'react-native';
import { differenceInYears } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

// --- Profile Interface ---
interface Profile { /* ... same as before ... */
    id: string;
    created_at: string;
    updated_at: string;
    first_name: string;
    last_name?: string | null;
    date_of_birth: string;
    gender: string;
    bio?: string | null;
    interests?: string[] | null;
    location?: string | null;
    looking_for?: string | null;
    profile_pictures?: string[] | null;
}

interface ProfileCardProps {
  profile: Profile;
}

// --- calculateAge Function ---
const calculateAge = (dobString: string): number | null => {
  // ... same implementation ...
  try {
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) {
        console.warn("Invalid date of birth received:", dobString);
        return null;
    }
    return differenceInYears(new Date(), dob);
  } catch (e) {
    console.error("Error calculating age:", e);
    return null;
  }
};

// --- Dimensions ---
const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth * 0.9;

// *** STEP 1: Create a separate component for the image item ***
interface CarouselImageItemProps {
    url: string;
}

const CarouselImageItem: React.FC<CarouselImageItemProps> = ({ url }) => {
    // *** Hooks are now called inside a valid component body ***
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    return (
        <View style={styles.carouselItemContainer}>
            {/* Loading indicator shown while loading and no error */}
            {isLoading && !hasError && (
                <ActivityIndicator style={StyleSheet.absoluteFill} size="large" color="#cccccc" />
            )}
            <Image
               source={{ uri: url }}
               style={styles.carouselImage}
               resizeMode="cover"
               onLoadStart={() => { setIsLoading(true); setHasError(false); }} // Reset error state on new load start
               onLoadEnd={() => setIsLoading(false)}
               onError={() => {
                   setIsLoading(false);
                   setHasError(true);
                   console.warn("Failed to load image:", url);
               }}
            />
            {/* Optionally display error overlay */}
            {hasError && (
                 <View style={[StyleSheet.absoluteFill, styles.imageErrorOverlay]}>
                    <Text style={styles.imageErrorText}>Image Error</Text>
                 </View>
            )}
        </View>
    );
};
// *** END of CarouselImageItem component ***


// --- ProfileCard Component ---
const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  const age = calculateAge(profile.date_of_birth);
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0); // This useState is OK here
  const images = profile.profile_pictures || [];

  // Carousel Logic Functions (handleScroll, goToPrev, goToNext) remain the same
  const handleScroll = (event: any) => { /* ... same ... */
      const scrollPosition = event.nativeEvent.contentOffset.x;
      const index = Math.round(scrollPosition / cardWidth);
      if (index !== activeIndex) {
          setActiveIndex(index);
      }
  };
  const goToPrev = () => { /* ... same ... */
       if (activeIndex > 0) {
          flatListRef.current?.scrollToIndex({ index: activeIndex - 1, animated: true });
      }
  };
  const goToNext = () => { /* ... same ... */
       if (activeIndex < images.length - 1) {
          flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
      }
  };


  // *** STEP 2: Modify renderItem to use the new component ***
  // renderImageItem no longer needs useState, move definition outside or keep inside
  const renderImageItem = ({ item: url }: { item: string }) => {
    // Simply render the new component, passing the url
    return <CarouselImageItem url={url} />;
  };
  // *** END modification ***

  return (
    <View style={styles.card}>
      {/* Image Carousel */}
      {images.length > 0 ? (
        <View style={styles.carouselContainer}>
          <FlatList
            // Pass the modified renderImageItem
            renderItem={renderImageItem}
            // ... other FlatList props remain the same ...
            ref={flatListRef}
            data={images}
            keyExtractor={(item, index) => `${item}-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.flatList}
            contentContainerStyle={styles.flatListContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            getItemLayout={(data, index) => (
                { length: cardWidth, offset: cardWidth * index, index }
            )}
          />
          {/* Carousel Controls & Pagination remain the same */}
          {images.length > 1 && ( /* ... controls JSX ... */
             <>
              <Pressable style={[styles.carouselControl, styles.carouselPrev]} onPress={goToPrev} disabled={activeIndex === 0}>
                <Ionicons name="chevron-back" size={24} color={activeIndex === 0 ? '#aaa' : '#fff'} />
              </Pressable>
              <Pressable style={[styles.carouselControl, styles.carouselNext]} onPress={goToNext} disabled={activeIndex === images.length - 1}>
                <Ionicons name="chevron-forward" size={24} color={activeIndex === images.length - 1 ? '#aaa' : '#fff'} />
              </Pressable>
              <View style={styles.paginationContainer}>
                  {images.map((_, index) => (
                      <View key={index} style={[styles.paginationDot, activeIndex === index ? styles.paginationDotActive : {}]}/>
                  ))}
              </View>
            </>
          )}
        </View>
      ) : (
        // Fallback view remains the same
        <View style={[styles.imagePlaceholder, styles.carouselItemContainer]}>
          <Text style={styles.imagePlaceholderText}>No images</Text>
        </View>
      )}

      {/* Card Content remains the same */}
      <View style={styles.content}>
          {/* ... Name, Age, Bio, Interests etc ... */}
           <Text style={styles.nameAgeText}>
              {profile.first_name}
              {age !== null ? `, ${age}` : ''}
            </Text>
            {/* ... other details ... */}
      </View>
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
    // ... all previous styles definitions ...
    // Add style for image error overlay if desired
    imageErrorOverlay: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    imageErrorText: { // Adjusted style
        color: '#fff', // White text on dark overlay
        fontWeight: 'bold',
    },
    // Other styles from previous version:
    card: { /* ... */ },
    carouselContainer: { /* ... */ },
    flatList: { /* ... */ },
    carouselItemContainer: { /* ... */ },
    carouselImage: { /* ... */ },
    imagePlaceholder: { /* ... */ },
    imagePlaceholderText: { /* ... */ },
    carouselControl: { /* ... */ },
    carouselPrev: { /* ... */ },
    carouselNext: { /* ... */ },
    paginationContainer: { /* ... */ },
    paginationDot: { /* ... */ },
    paginationDotActive: { /* ... */ },
    content: { /* ... */ },
    nameAgeText: { /* ... */ },
    detailSection: { /* ... */ },
    sectionTitle: { /* ... */ },
    mutedText: { /* ... */ },
    badgeContainer: { /* ... */ },
    badge: { /* ... */ },
    badgeText: { /* ... */ },

});

export default ProfileCard;