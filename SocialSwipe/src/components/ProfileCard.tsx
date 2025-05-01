// src/components/ProfileCard.tsx
import React, { useState, useRef, useCallback } from "react";
import {
	View,
	Text,
	Image,
	StyleSheet,
	FlatList,
	Dimensions,
	Pressable,
	ActivityIndicator,
	GestureResponderEvent, // Import this type
} from "react-native";
import { differenceInYears } from "date-fns";
import { Ionicons } from "@expo/vector-icons";

// --- Profile Interface --- (Assuming this is defined elsewhere or keep it here)
export interface Profile { // Make sure to export if needed elsewhere
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
	isVisible?: boolean; // Changed to optional as it might not always be passed from ProfileScreen
	// --- ADDED: Callback for liking (assuming it's optional or handled differently in ProfileScreen context) ---
	onLike?: (profileId: string) => void;
}

// --- calculateAge Function --- (Unchanged)
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
const { height: screenHeight } = Dimensions.get("window");
const { width: screenWidth } = Dimensions.get("window"); // Removed screenHeight as it's not directly needed now
// Card width is used for FlatList layout calculation
const cardWidth = screenWidth * 0.95; // Keep card width based on screen width

// ****** REMOVED: carouselHeight constant is no longer needed ******
// const carouselHeight = screenHeight * 0.4;

// --- CarouselImageItem Component --- (Unchanged, includes error handling)
interface CarouselImageItemProps { url: string; }
const CarouselImageItem: React.FC<CarouselImageItemProps> = ({ url }) => {
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);
	return (
		<View style={styles.carouselItemContainer}>
			{isLoading && !hasError && (<ActivityIndicator style={StyleSheet.absoluteFill} size="large" color="#cccccc" />)}
			<Image
				source={{ uri: url }}
				style={styles.carouselImage}
				resizeMode="cover" // Keep 'cover' or change to 'contain' based on desired look within aspect ratio
				onLoadStart={() => { setIsLoading(true); setHasError(false); }}
				onLoadEnd={() => setIsLoading(false)}
				onError={(error) => {
					setIsLoading(false);
					setHasError(true);
					console.warn("Failed to load image:", url, error.nativeEvent?.error);
				}}
			/>
			{hasError && (
				<View style={[StyleSheet.absoluteFill, styles.imageErrorOverlay]}>
					<Ionicons name="alert-circle-outline" size={40} color="#fff" />
					<Text style={styles.imageErrorText}>Image Error</Text>
				</View>
			)}
		</View>
	);
};

// --- ProfileCard Component ---
const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onLike, isVisible }) => {
	const age = calculateAge(profile.date_of_birth);
	const flatListRef = useRef<FlatList>(null);
	const [activeIndex, setActiveIndex] = useState(0);
	// State for double tap
	const lastTap = useRef<number | null>(null);
	const DOUBLE_PRESS_DELAY = 300; // milliseconds

	// Use profile pictures safely
	const images = Array.isArray(profile.profile_pictures) ? profile.profile_pictures : [];

	// Reset active index if visibility changes (e.g., navigating between profiles)
	// --- Unchanged ---
	React.useEffect(() => {
		if (isVisible !== undefined) {
			if (isVisible) {
				setActiveIndex(0);
				// flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
			}
		} else {
			setActiveIndex(0);
		}
	}, [isVisible, profile.id]);

	// --- handleScroll unchanged ---
	const handleScroll = (event: any) => {
		const scrollPosition = event.nativeEvent.contentOffset.x;
		// Use the specific cardWidth used in getItemLayout for calculation
		const index = Math.round(scrollPosition / cardWidth);
		if (index !== activeIndex) {
			setActiveIndex(index);
		}
	};

	// --- goToPrevImage / goToNextImage unchanged ---
	const goToPrevImage = useCallback(() => {
		if (activeIndex > 0) {
			flatListRef.current?.scrollToIndex({ index: activeIndex - 1, animated: true });
		}
	}, [activeIndex]);

	const goToNextImage = useCallback(() => {
		if (activeIndex < images.length - 1) {
			flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
		}
	}, [activeIndex, images.length]);

	// --- Double Tap Handler unchanged ---
	const handleDoubleTap = useCallback(() => {
		if (onLike) {
			onLike(profile.id);
		}
	}, [profile.id, onLike]);

	// --- Single Tap Handler unchanged ---
	const handleTap = useCallback((event: GestureResponderEvent) => {
		const now = Date.now();
		if (lastTap.current && (now - lastTap.current) < DOUBLE_PRESS_DELAY) {
			handleDoubleTap();
			lastTap.current = null;
		} else {
			lastTap.current = now;
		}
	}, [handleDoubleTap]);

	// --- renderImageItem unchanged ---
	const renderImageItem = useCallback(({ item: url }: { item: string }) => {
		return <CarouselImageItem url={url} />;
	}, []);

	// --- Render ---
	if (!profile) return null;

	return (
		// --- Pressable root element unchanged ---
		<Pressable onPress={onLike ? handleTap : undefined} style={styles.card} disabled={!onLike}>
			{/* Image Section */}
			{/* The container now uses aspectRatio */}
			<View style={styles.carouselContainer}>
				{images.length > 0 ? (
					<>
						{/* FlatList configuration unchanged */}
						<FlatList
							ref={flatListRef}
							data={images}
							renderItem={renderImageItem}
							keyExtractor={(item, index) => `${profile.id}-img-${index}`}
							horizontal
							pagingEnabled
							showsHorizontalScrollIndicator={false}
							onScroll={handleScroll}
							scrollEventThrottle={16}
							style={styles.flatList}
							contentContainerStyle={styles.flatListContent}
							// getItemLayout still uses cardWidth for horizontal measurements
							getItemLayout={(data, index) => ({
								length: cardWidth, // Width of each item
								offset: cardWidth * index,
								index,
							})}
							bounces={false}
							initialNumToRender={1}
							maxToRenderPerBatch={3}
							windowSize={5}
							removeClippedSubviews={true}
						/>
						{/* Image Navigation (Chevrons & Dots) unchanged */}
						{images.length > 1 && (
							<>
								{/* Chevrons */}
								<Pressable
									style={[styles.carouselControl, styles.carouselPrev]}
									onPress={goToPrevImage}
									disabled={activeIndex === 0}
									hitSlop={10}
								>
									<Ionicons name="chevron-back-circle" size={36} color={activeIndex === 0 ? "rgba(255, 255, 255, 0.4)" : "#fff"} style={styles.controlIconShadow} />
								</Pressable>
								<Pressable
									style={[styles.carouselControl, styles.carouselNext]}
									onPress={goToNextImage}
									disabled={activeIndex === images.length - 1}
									hitSlop={10}
								>
									<Ionicons name="chevron-forward-circle" size={36} color={activeIndex === images.length - 1 ? "rgba(255, 255, 255, 0.4)" : "#fff"} style={styles.controlIconShadow}/>
								</Pressable>

								{/* Pagination Dots */}
								<View style={styles.paginationContainer}>
									{images.map((_, index) => (
										<View
											key={index}
											style={[
												styles.paginationDot,
												activeIndex === index ? styles.paginationDotActive : {},
											]}
										/>
									))}
								</View>
							</>
						)}
					</>
				) : (
					// Placeholder now uses aspectRatio as well
					<View style={styles.imagePlaceholder}>
						<Ionicons name="camera-outline" size={60} color="#ccc" />
						<Text style={styles.imagePlaceholderText}>No profile pictures</Text>
					</View>
				)}
			</View>

			{/* Content Section --- Unchanged --- */}
			<View style={styles.content}>
				<Text style={styles.nameAgeText}>
					{profile.first_name}
					{age !== null ? `, ${age}` : ""}
				</Text>
				{profile.gender && (
					<Text style={styles.detailText}>
						<Text style={styles.detailLabel}>Gender:</Text> {profile.gender}
					</Text>
				)}
				{profile.location && (
					<Text style={styles.detailText}>
						<Text style={styles.detailLabel}>Location:</Text> {profile.location}
					</Text>
				)}
				{profile.bio && (
					<View style={styles.detailSection}>
						<Text style={styles.detailLabel}>About Me</Text>
						<Text style={styles.bioText}>{profile.bio}</Text>
					</View>
				)}
				{profile.interests && profile.interests.length > 0 && (
					<View style={styles.detailSection}>
						<Text style={styles.detailLabel}>Interests</Text>
						<View style={styles.badgeContainer}>
							{profile.interests.map((interest, index) => (
								<View key={index} style={styles.badge}>
									<Text style={styles.badgeText}>{interest}</Text>
								</View>
							))}
						</View>
					</View>
				)}
				{profile.looking_for && (
					<View style={styles.detailSection}>
						<Text style={styles.detailLabel}>Looking For</Text>
						<Text style={styles.detailTextValue}>{profile.looking_for}</Text>
					</View>
				)}
			</View>
		</Pressable> // End of main Pressable
	);
};

// --- Styles ---
const styles = StyleSheet.create({
	card: {
		// Style unchanged
		backgroundColor: '#ffffff',
		width: cardWidth, // Use the constant defined above (screenWidth * 0.95)
		alignSelf: 'center',
		overflow: 'hidden',
		marginBottom: 10,
		borderRadius: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2, },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,

	},
	// --- Image Area Styles ---
	carouselContainer: {
		// *** CHANGED: Removed height, added aspectRatio ***
		// height: carouselHeight, // Removed
		aspectRatio: 3 / 4, // Use a portrait aspect ratio (e.g., 3:4). Adjust as needed (e.g., 1 for square, 4/5, etc.)
		width: '100%', // Keep width 100% of the card
		backgroundColor: '#e0e0e0',
		position: 'relative',
		borderTopLeftRadius: 12,
		borderTopRightRadius: 12,
		overflow: 'hidden', // Keep this to enforce border radius on image/flatlist
	},
	flatList: {
		// Style unchanged (FlatList fills the carouselContainer)
		flex: 1,
	},
	flatListContent: {
		// Style unchanged
	},
	carouselItemContainer: {
		// Style unchanged (Takes full dimensions of its slot in the FlatList)
		// Its width is determined by FlatList's getItemLayout (cardWidth)
		// Its height will now be determined by the carouselContainer's aspectRatio calculation
		width: cardWidth, // Match the getItemLayout length
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#e9e9e9',
	},
	carouselImage: {
		// Style unchanged (Image fills its container)
		width: '100%',
		height: '100%',
		// resizeMode: 'cover', // Keep 'cover' or change to 'contain'
	},
	imagePlaceholder: {
		// *** CHANGED: Use the same aspectRatio as the container ***
		// height: carouselHeight, // Removed
		aspectRatio: 3 / 4, // Match the carouselContainer aspectRatio
		width: '100%',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#f0f0f0',
		borderTopLeftRadius: 12,
		borderTopRightRadius: 12,
	},
	imagePlaceholderText: { // Style unchanged
		marginTop: 10,
		color: '#b0b0b0',
		fontSize: 16,
	},
	imageErrorOverlay: { // Style unchanged
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0,0,0,0.6)",
	},
	imageErrorText: { // Style unchanged
		color: "#fff",
		fontWeight: "bold",
		marginTop: 5,
	},

	// --- Content Area Styles --- (All styles below unchanged)
	content: {
		paddingHorizontal: 15,
		paddingTop: 15,
		paddingBottom: 10,
	},
	nameAgeText: {
		fontSize: 22,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 10,
	},
	detailSection: {
		marginBottom: 10,
	},
	detailLabel: {
		fontSize: 13,
		fontWeight: '600',
		color: '#666',
		marginBottom: 4,
		textTransform: 'uppercase',
	},
	detailText: {
		fontSize: 15,
		color: '#444',
		marginBottom: 6,
		lineHeight: 20,
	},
	detailTextValue: {
		fontSize: 15,
		color: '#444',
		lineHeight: 20,
	},
	bioText: {
		fontSize: 15,
		color: '#444',
		lineHeight: 21,
	},
	badgeContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginTop: 2,
	},
	badge: {
		backgroundColor: '#FFA07A',
		borderRadius: 15,
		paddingVertical: 5,
		paddingHorizontal: 10,
		marginRight: 6,
		marginBottom: 6,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.15,
		shadowRadius: 1.00,
		elevation: 1,
	},
	badgeText: {
		color: '#FFFFFF',
		fontSize: 12,
		fontWeight: '600',
	},

	// --- Carousel Controls & Pagination Styles --- (Unchanged)
	carouselControl: {
		position: 'absolute',
		top: '50%',
		marginTop: -18, // Adjust if icon size changes
		zIndex: 10,
	},
	carouselPrev: { left: 8 },
	carouselNext: { right: 8 },
	controlIconShadow: {
		textShadowColor: 'rgba(0, 0, 0, 0.6)',
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 2,
	},
	paginationContainer: {
		position: 'absolute',
		bottom: 8,
		left: 0,
		right: 0,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 5,
		zIndex: 10,
	},
	paginationDot: {
		width: 7,
		height: 7,
		borderRadius: 3.5,
		backgroundColor: 'rgba(255, 255, 255, 0.6)',
		marginHorizontal: 4,
		borderWidth: 0.5,
		borderColor: 'rgba(0, 0, 0, 0.3)',
	},
	paginationDotActive: {
		backgroundColor: '#ffffff',
		width: 8,
		height: 8,
		borderRadius: 4,
		borderColor: 'rgba(0, 0, 0, 0.0)',
	},
});

// Memoize for performance
export default React.memo(ProfileCard);