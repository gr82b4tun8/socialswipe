// src/screens/ProfilePromptScreen.tsx (Corrected)

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView, // Use SafeAreaView for full-screen components
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';

// --- Navigation Type (Define your stack params) ---
// Ensure this matches the navigator where this screen is used
type RootStackParamList = {
    ProfilePrompt: undefined;
    CreateProfile: undefined;
    // Add other screens in this stack
};

// Get the specific navigation prop type for this screen
type ProfilePromptNavigationProp = NavigationProp<RootStackParamList, 'ProfilePrompt'>;
// --- End Navigation Type ---


const ProfilePromptScreen: React.FC = () => { // <--- Function definition starts here
    // Hook into navigation
    const navigation = useNavigation<ProfilePromptNavigationProp>();

    // Function to handle navigation
    const goToCreateProfile = () => {
        navigation.navigate('CreateProfile'); // Navigate to the Create Profile screen
    };

    return (
        // SafeAreaView ensures content isn't hidden by notches or system bars
        <SafeAreaView style={styles.screenContainer}>
            {/* This inner View acts like the Card */}
            <View style={styles.cardContainer}>
                {/* Card Header Equivalent */}
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Complete Your Profile</Text>
                    <Text style={styles.cardDescription}>
                        You need to create your profile before you can fully use the app.
                    </Text>
                </View>

                {/* Card Content Equivalent */}
                <View style={styles.cardContent}>
                    <Text style={styles.messageText}>
                        Let's get your profile set up so others can discover you!
                    </Text>

                    {/* Button Equivalent */}
                    <TouchableOpacity
                        style={styles.button}
                        onPress={goToCreateProfile} // Call navigation function on press
                        activeOpacity={0.7} // Standard opacity feedback on press
                    >
                        <Text style={styles.buttonText}>Create My Profile</Text>
                    </TouchableOpacity>
                </View>
                {/* End Card Content View */}

            </View>
            {/* End Card Container View */}

        </SafeAreaView>
        // End SafeAreaView
    );
// Missing closing brace for the function was here
}; // <-- **** ADDED MISSING CLOSING BRACE ****

// --- Styles ---
// (Make sure your styles definition is complete here)
const styles = StyleSheet.create({
    // Styles the entire screen container
    screenContainer: {
        flex: 1, // Take up the whole screen
        justifyContent: 'center', // Center content vertically
        alignItems: 'center', // Center content horizontally
        backgroundColor: '#F0F2F5', // A light background color (adjust as needed)
        padding: 16, // Padding around the edges
    },
    // Styles the card-like view
    cardContainer: {
        width: '100%', // Card takes full width within padding
        maxWidth: 400, // Max width similar to max-w-md
        backgroundColor: '#FFFFFF', // White background for the card
        borderRadius: 12, // Rounded corners
        padding: 24, // Inner padding for the card content
        alignItems: 'center', // Center card content horizontally
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        // Elevation for Android
        elevation: 3,
    },
    // Styles the header section of the card
    cardHeader: {
        marginBottom: 20, // Space below the header
        alignItems: 'center', // Center header text
    },
    // Styles the main title text
    cardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1C1C1E', // Dark text color
        marginBottom: 8,
        textAlign: 'center',
    },
    // Styles the description text below the title
    cardDescription: {
        fontSize: 15,
        color: '#6A6A6E', // Muted text color
        textAlign: 'center',
        lineHeight: 21, // Improve readability
    },
    // Styles the content area below the header
    cardContent: {
        width: '100%', // Ensure content uses card width
        alignItems: 'center', // Center items like the button
    },
    // Styles the paragraph message text
    messageText: {
        fontSize: 16,
        color: '#3C3C43', // Standard text color
        textAlign: 'center',
        marginBottom: 24, // Space below the message, before the button
        lineHeight: 22,
    },
    // Styles the main action button
    button: {
        backgroundColor: '#007AFF', // Primary button color (iOS blue)
        paddingVertical: 14, // Vertical padding for button height
        paddingHorizontal: 30, // Horizontal padding for button width
        borderRadius: 8, // Rounded corners for the button
        width: '80%', // Make button reasonably wide
        alignItems: 'center', // Center text inside button
    },
    // Styles the text inside the button
    buttonText: {
        color: '#FFFFFF', // White text on the button
        fontSize: 17,
        fontWeight: '600', // Medium weight
    },
});

// Make sure you have the export default line
export default ProfilePromptScreen;