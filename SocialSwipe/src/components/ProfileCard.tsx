// src/components/ProfileCard.tsx
// MODIFIED: Reduced fixed carouselHeight and content spacing for smaller size

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  Dimensions,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { differenceInYears } from "date-fns";
import { Ionicons } from "@expo/vector-icons";

// --- Profile Interface ---
interface Profile {
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
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const cardWidth = screenWidth * 0.9;

// --- ADJUSTED HEIGHT for image area ---
// Changed from percentage to a fixed pixel value for more consistent sizing
// Adjust this value (e.g., 280, 320, 350) to fine-tune the size
const carouselHeight = 300;
// --- END ADJUSTMENT ---


// --- CarouselImageItem Component --- (Remains the same)
interface CarouselImageItemProps { url: string; }
const CarouselImageItem: React.FC<CarouselImageItemProps> = ({ url }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  return (
    <View style={styles.carouselItemContainer}>
      {isLoading && !hasError && (<ActivityIndicator style={StyleSheet.absoluteFill} size="large" color="#cccccc" />)}
      <Image source={{ uri: url }} style={styles.carouselImage} resizeMode="cover"
        onLoadStart={() => { setIsLoading(true); setHasError(false); }}
        onLoadEnd={() => setIsLoading(false)}
        onError={(error) => { setIsLoading(false); setHasError(true); console.warn("Failed to load image:", url, error.nativeEvent?.error); }}
      />
      {hasError && (<View style={[StyleSheet.absoluteFill, styles.imageErrorOverlay]}><Ionicons name="alert-circle-outline" size={40} color="#fff" /><Text style={styles.imageErrorText}>Image Error</Text></View>)}
    </View>
  );
};
// --- END of CarouselImageItem component ---


// --- ProfileCard Component --- (Logic remains the same)
const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  const age = calculateAge(profile.date_of_birth);
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const images = Array.isArray(profile.profile_pictures) ? profile.profile_pictures : [];
  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x; const index = Math.round(scrollPosition / cardWidth);
    if (index !== activeIndex) { setActiveIndex(index); }
  };
  const goToPrev = () => { if (activeIndex > 0) { flatListRef.current?.scrollToIndex({ index: activeIndex - 1, animated: true }); }};
  const goToNext = () => { if (activeIndex < images.length - 1) { flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true }); }};
  const renderImageItem = ({ item: url }: { item: string }) => { return <CarouselImageItem url={url} />; };

  return (
    <View style={styles.card}>
      {/* Image Section */}
      {images.length > 0 ? (
        <View style={styles.carouselContainer}>
          <FlatList ref={flatListRef} data={images} renderItem={renderImageItem} keyExtractor={(item, index) => `${item}-${index}`} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={handleScroll} scrollEventThrottle={16} style={styles.flatList} contentContainerStyle={styles.flatListContent} getItemLayout={(data, index) => ({ length: cardWidth, offset: cardWidth * index, index, })} bounces={false} />
          {images.length > 1 && (
            <>
              <Pressable style={[styles.carouselControl, styles.carouselPrev]} onPress={goToPrev} disabled={activeIndex === 0} ><Ionicons name="chevron-back-circle-outline" size={36} color={activeIndex === 0 ? "rgba(255, 255, 255, 0.3)" : "#fff"} /></Pressable>
              <Pressable style={[styles.carouselControl, styles.carouselNext]} onPress={goToNext} disabled={activeIndex === images.length - 1} ><Ionicons name="chevron-forward-circle-outline" size={36} color={activeIndex === images.length - 1 ? "rgba(255, 255, 255, 0.3)" : "#fff"} /></Pressable>
              <View style={styles.paginationContainer}>{images.map((_, index) => ( <View key={index} style={[ styles.paginationDot, activeIndex === index ? styles.paginationDotActive : {}, ]} /> ))}</View>
            </>
          )}
        </View>
      ) : (
        <View style={styles.imagePlaceholder}><Ionicons name="camera-outline" size={50} color="#ccc" /><Text style={styles.imagePlaceholderText}>No profile pictures</Text></View>
      )}

      {/* Content Section */}
      <View style={styles.content}>
        <Text style={styles.nameAgeText}>{profile.first_name}{age !== null ? `, ${age}` : ""}</Text>
        {profile.gender && <Text style={styles.detailText}><Text style={styles.detailLabel}>Gender:</Text> {profile.gender}</Text>}
        {profile.location && <Text style={styles.detailText}><Text style={styles.detailLabel}>Location:</Text> {profile.location}</Text>}
        {profile.bio && (<View style={styles.detailSection}><Text style={styles.detailLabel}>About Me</Text><Text style={styles.bioText}>{profile.bio}</Text></View>)}
        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.detailSection}><Text style={styles.detailLabel}>Interests</Text><View style={styles.badgeContainer}>{profile.interests.map((interest, index) => (<View key={index} style={styles.badge}><Text style={styles.badgeText}>{interest.charAt(0).toUpperCase()}</Text></View>))}</View></View>)}
        {profile.looking_for && (<View style={styles.detailSection}><Text style={styles.detailLabel}>Looking For</Text><Text style={styles.detailTextValue}>{profile.looking_for}</Text></View>)}
      </View>
    </View>
  );
};


// --- Styles ---
// Adjusted for smaller card size
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff', borderRadius: 12, marginVertical: 10,
    marginHorizontal: (screenWidth - cardWidth) / 2, width: cardWidth,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.20, shadowRadius: 1.41,
    elevation: 2, overflow: 'hidden',
  },
  // --- Image Area Styles ---
  carouselContainer: {
    height: carouselHeight,   // *** USE FIXED HEIGHT ***
    width: '100%', backgroundColor: '#e0e0e0',
  },
  flatList: { flex: 1 }, flatListContent: {},
  carouselItemContainer: {
    width: cardWidth, height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#e9e9e9',
  },
  carouselImage: { width: '100%', height: '100%', },
  imagePlaceholder: {
    height: carouselHeight,   // *** USE FIXED HEIGHT ***
    width: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0',
  },
  imagePlaceholderText: { marginTop: 10, color: '#b0b0b0', fontSize: 14, },
  imageErrorOverlay: { justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)", },
  imageErrorText: { color: "#fff", fontWeight: "bold", marginTop: 5, },

  // --- Content Area Styles (Reduced Spacing) ---
  content: {
    paddingHorizontal: 15,
    paddingVertical: 15, // Reduced vertical padding
  },
  nameAgeText: {
    fontSize: 22, fontWeight: 'bold', color: '#333',
    marginBottom: 10, // Reduced margin
  },
   detailSection: {
     marginBottom: 10, // Reduced margin
   },
   detailLabel: {
       fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 4,
   },
   detailText: {
       fontSize: 15, color: '#333', marginBottom: 6, lineHeight: 20,
   },
   detailTextValue: {
        fontSize: 15, color: '#333',
    },
   bioText: {
       fontSize: 15, color: '#444', lineHeight: 21,
   },
   // --- Badge Styles (Circular) ---
   badgeContainer: { flexDirection: 'row', flexWrap: 'wrap', },
   badge: {
       backgroundColor: '#FF6347', height: 30, width: 30, borderRadius: 15,
       justifyContent: 'center', alignItems: 'center',
       marginRight: 8, marginBottom: 8,
       shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.18, shadowRadius: 1.00,
       elevation: 1,
   },
   badgeText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', },

  // --- Carousel Controls & Pagination Styles --- (Unchanged)
  carouselControl: { position: 'absolute', top: '50%', marginTop: -22, padding: 5, borderRadius: 22, },
  carouselPrev: { left: 10, }, carouselNext: { right: 10, },
  paginationContainer: { position: 'absolute', flexDirection: 'row', bottom: 10, alignSelf: 'center', backgroundColor: 'rgba(0, 0, 0, 0.4)', borderRadius: 10, paddingVertical: 5, paddingHorizontal: 8, },
  paginationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.6)', marginHorizontal: 4, },
  paginationDotActive: { backgroundColor: '#ffffff', width: 9, height: 9, borderRadius: 4.5, },
});

export default ProfileCard;