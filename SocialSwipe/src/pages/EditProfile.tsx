// CONVERTED for React Native / Expo Go
// Includes ArrayBuffer fix for image upload
// Corrected Supabase table name for update operation
// Added MAX_PROFILE_PHOTOS constant

import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput, Pressable, Image,
    ActivityIndicator, Alert, SafeAreaView, Platform // Platform check often needed
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigation } from '@react-navigation/native';
// Assuming you have a type definition for your stack navigator
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabaseClient'; // Adjust path
import { useAuth } from '../contexts/AuthContext'; // Adjust path
import { v4 as uuidv4 } from 'uuid'; // Ensure uuid is installed
import 'react-native-get-random-values'; // Ensure polyfill is imported (usually in App.tsx)
import * as ImagePicker from 'expo-image-picker';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons'; // Expo icons
import { format, parseISO, startOfToday, subYears } from 'date-fns';

// --- Constant for Max Photos ---
const MAX_PROFILE_PHOTOS = 6;

// --- Re-use Validation Schema ---
const profileSchema = z.object({
    firstName: z.string().min(1, { message: "First name is required." }),
    lastName: z.string().optional(),
    // Keep dob as Date object for picker compatibility
    dob: z.date({ required_error: "Date of birth is required." }).refine(
        (date) => date <= subYears(startOfToday(), 18), // Check if date is on or before 18 years ago
        { message: "Must be 18+" }
    ),
    gender: z.string().min(1, { message: "Please select a gender identity." }),
    bio: z.string().max(500, { message: "Bio must be 500 characters or less." }).optional(),
    location: z.string().optional(),
    lookingFor: z.string().optional(),
});
type ProfileFormData = z.infer<typeof profileSchema>;

// --- Profile type ---
interface Profile {
    id: string; created_at: string; updated_at: string; first_name: string;
    last_name?: string | null; date_of_birth: string; gender: string;
    bio?: string | null; interests?: string[] | null; location?: string | null;
    looking_for?: string | null; profile_pictures?: string[] | null;
    // Ensure all fields match your DB table exactly
    user_id: string; // Assuming you have user_id
    liked_profile_user_ids?: string[] | null;
    // dismissed_profile_user_ids?: string[] | null; // Removed based on previous step
    // Add any other fields like business ones if this can edit both types
}

// Define your Navigation Stack Param List if not done globally
// Ensure this matches the navigator where EditProfile resides
type YourSpecificNavigatorParamList = {
    ProfileTab: undefined; // Example name for the profile tab screen
    Login: undefined;
    EditProfile: undefined; // Current screen
    // ... other screens in this specific navigator
};
type EditProfileScreenNavigationProp = NativeStackNavigationProp<YourSpecificNavigatorParamList, 'EditProfile'>;


const EditProfileScreen: React.FC = () => {
    const navigation = useNavigation<EditProfileScreenNavigationProp>();
    const { user, loading: authLoading } = useAuth(); // Assuming useAuth provides user object with id
    const [initialLoading, setInitialLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- State ---
    const [currentProfilePictures, setCurrentProfilePictures] = useState<string[]>([]); // URLs from DB
    const [newImageAssets, setNewImageAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
    const [interests, setInterests] = useState<string[]>([]);
    const [interestInput, setInterestInput] = useState('');
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

    // --- React Hook Form Setup ---
    const form = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: '', lastName: '', dob: undefined, gender: '', bio: '', location: '', lookingFor: '',
        },
    });
    const { handleSubmit, control, formState: { errors }, reset, watch } = form;
    const watchedDob = watch('dob');

    // --- Fetch Existing Profile Data ---
    useEffect(() => {
        if (!authLoading && user) {
            const fetchProfileData = async () => {
                setInitialLoading(true);
                console.log("[EditProfile] Fetching profile data...");
                try {
                    const { data, error, status } = await supabase
                        .from('individual_profiles') // <<< CORRECT: Fetching from individual_profiles
                        .select('*')
                        .eq('user_id', user.id)
                        .single();

                    console.log("[EditProfile] Profile fetch response:", { status, error, hasData: !!data });

                    if (error && status !== 406) {
                        console.error("[EditProfile] Supabase error fetching profile:", error);
                        throw error;
                    }
                    if (data) {
                        reset({
                            firstName: data.first_name || '', lastName: data.last_name || '',
                            dob: data.date_of_birth ? parseISO(data.date_of_birth) : undefined,
                            gender: data.gender || '', bio: data.bio || '',
                            location: data.location || '', lookingFor: data.looking_for || '',
                        });
                        setInterests(data.interests || []);
                        setCurrentProfilePictures(data.profile_pictures || []);
                        console.log("[EditProfile] Profile data loaded into form.");
                    } else {
                        console.warn("[EditProfile] No profile data found for user.");
                        Toast.show({ type: 'info', text1: 'Profile not found', text2: 'Please create a profile first.' });
                        navigation.goBack();
                    }
                } catch (error: any) {
                    console.error("[EditProfile] Failed to fetch profile data:", error);
                    Toast.show({ type: 'error', text1: 'Failed to load data', text2: error.message });
                    navigation.goBack();
                } finally {
                    setInitialLoading(false);
                    console.log("[EditProfile] Finished initial loading.");
                }
            };
            fetchProfileData();
        } else if (!authLoading && !user) {
            console.log("[EditProfile] No user session, navigating to Login.");
            // Ensure 'Login' exists in YourSpecificNavigatorParamList or adjust as needed
            navigation.navigate('Login' as any); // Using 'as any' for simplicity if types differ
        }
    }, [user, authLoading, reset, navigation]);

    // --- Image Handling ---
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Sorry, we need camera roll permissions!');
            return;
        }

        const currentTotal = currentProfilePictures.length + newImageAssets.length;
        // Use the constant
        if (currentTotal >= MAX_PROFILE_PHOTOS) {
            Toast.show({ type: 'info', text1: 'Limit Reached', text2: `Max ${MAX_PROFILE_PHOTOS} photos allowed.` });
            return;
        }

        try {
            const selectionLimit = MAX_PROFILE_PHOTOS - currentTotal; // Calculate remaining slots
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                quality: 0.8,
                selectionLimit: selectionLimit, // Use calculated limit
            });

            console.log('[EditProfile] ImagePicker result:', JSON.stringify(result, null, 2));

            if (!result.canceled && result.assets) {
                const combined = [...newImageAssets, ...result.assets];
                // Slice based on the *overall* limit, considering existing photos
                const limitedNewAssets = combined.slice(0, MAX_PROFILE_PHOTOS - currentProfilePictures.length);
                if (combined.length > limitedNewAssets.length) {
                    Toast.show({ type: 'info', text1: 'Limit Exceeded', text2: `Selected images exceed the limit of ${MAX_PROFILE_PHOTOS}.` });
                }
                setNewImageAssets(limitedNewAssets);
                console.log(`[EditProfile] Added ${result.assets.length} new image assets. Total new: ${limitedNewAssets.length}`);
            } else {
                console.log("[EditProfile] Image picking cancelled or no assets selected.");
            }
        } catch (pickerError) {
            console.error("[EditProfile] Error launching image picker:", pickerError);
            Toast.show({ type: 'error', text1: 'Image Picker Error', text2: 'Could not open image library.'});
        }
    };

    const removeImage = (uriToRemove: string) => {
        // Check if it's an existing image URL
        const existingIndex = currentProfilePictures.indexOf(uriToRemove);
        if (existingIndex > -1) {
            // Remove from the list of existing URLs (will be removed on save)
            setCurrentProfilePictures(prev => prev.filter(url => url !== uriToRemove));
            console.log(`[EditProfile] Marked existing image for removal (will be removed on save): ${uriToRemove}`);
        } else {
            // Remove from the list of newly selected assets
            setNewImageAssets(prev => prev.filter(asset => asset.uri !== uriToRemove));
            console.log(`[EditProfile] Removed new image asset: ${uriToRemove}`);
        }
    };

    // Combined list for rendering purposes
    const allImageUris = [
        ...currentProfilePictures,
        ...newImageAssets.map(asset => asset.uri)
    ];

    // --- Interest Handling --- (Keep as is - Assuming they work)
    const addInterest = useCallback(() => {
        const trimmedInterest = interestInput.trim();
        if (trimmedInterest && interests.length < 10 && !interests.includes(trimmedInterest)) {
            setInterests(prev => [...prev, trimmedInterest]);
            setInterestInput(''); // Clear input after adding
        } else if (interests.includes(trimmedInterest)) {
            Toast.show({ type: 'info', text1: 'Interest already added.' });
        } else if (interests.length >= 10) {
            Toast.show({ type: 'info', text1: 'Maximum 10 interests allowed.' });
        }
    }, [interestInput, interests]);

    const removeInterest = useCallback((interestToRemove: string) => {
        setInterests(prev => prev.filter(interest => interest !== interestToRemove));
    }, []);


    // --- Date Picker --- (Keep as is - Assuming they work)
    const showDatePicker = () => setDatePickerVisibility(true);
    const hideDatePicker = () => setDatePickerVisibility(false);
    const handleDateConfirm = useCallback((date: Date, onChange: (date: Date) => void) => {
        // Double check if it's really today or later (accounting for timezones)
        if (date >= startOfToday()) {
             // Set to 18 years ago if today or future is selected
             date = subYears(startOfToday(), 18);
             Toast.show({type: 'info', text1: 'Invalid Date', text2: 'Setting to earliest valid date (18 years ago).'})
        }
        onChange(date);
        hideDatePicker();
    }, []);


    // --- Form Submission Logic (UPDATE) ---
    const onSubmit = async (values: ProfileFormData) => {
        if (!user) {
            Toast.show({ type: 'error', text1: 'User session not found.' }); return;
        }
        // Use constant for check
        if (allImageUris.length === 0) {
            Toast.show({ type: 'error', text1: 'Missing Photos', text2: 'Please add at least one photo.'}); return;
        }

        setIsSubmitting(true);
        const uploadedNewImageUrls: string[] = [];
        console.log("[EditProfile] Starting onSubmit...");

        try {
            // --- 1. Upload NEW Images (Logic matches CreateBusinessProfile) ---
            if (newImageAssets.length > 0) {
                Toast.show({ type: 'info', text1: "Uploading new images..." });
                console.log(`[EditProfile] Attempting to upload ${newImageAssets.length} new images.`);

                for (const asset of newImageAssets) {
                    const uri = asset.uri;
                    console.log(`[EditProfile] Processing asset URI: ${uri}`);

                    // Fetch the image data
                    console.log("[EditProfile] Attempting to fetch image URI...");
                    const response = await fetch(uri);
                    console.log(`[EditProfile] Fetch status for ${uri}: ${response.status}, OK: ${response.ok}`);

                    if (!response.ok) {
                        let responseText = 'Could not read response body.';
                        try { responseText = await response.text(); } catch {}
                        console.error(`[EditProfile] Failed Fetch Response Body (limited): ${responseText.substring(0, 500)}`);
                        throw new Error(`Failed to fetch image URI (${response.status}): ${response.statusText}`);
                    }

                    // Get ArrayBuffer directly from response
                    console.log("[EditProfile] Getting ArrayBuffer directly from response...");
                    const arrayBuffer = await response.arrayBuffer();
                    console.log(`[EditProfile] ArrayBuffer size: ${arrayBuffer.byteLength}`);

                    if (arrayBuffer.byteLength === 0) {
                        console.error("[EditProfile] Error: Created an empty ArrayBuffer from the image URI!", { uri });
                        throw new Error("Cannot upload empty image file. Please select a different image.");
                    }

                    // Get Content-Type from response HEADERS
                    const contentType = response.headers.get('content-type') ?? 'application/octet-stream'; // Provide a default
                    console.log(`[EditProfile] Content-Type from headers: ${contentType}`);

                    // Determine file extension
                    const fileExt = asset.fileName?.split('.').pop()?.toLowerCase() ?? uri.split('.').pop()?.toLowerCase() ?? 'jpg';
                    const betterFileExt = contentType.split('/')[1]?.split('+')[0] ?? fileExt; // Handle things like image/svg+xml
                    const fileName = `${uuidv4()}.${betterFileExt}`;
                    // Original filePath construction - keeping it as is per instructions
                    const filePath = `${user.id}/${fileName}`;

                    // Upload to Supabase Storage
                    console.log(`[EditProfile] Attempting Supabase upload (using ArrayBuffer) to path: ${filePath} with contentType: ${contentType}`);
                    const { error: uploadError, data: uploadData } = await supabase.storage
                        .from('profile_pictures') // Bucket name confirmed as correct
                        .upload(filePath, arrayBuffer, {
                            contentType: contentType, // Pass content type from headers
                            upsert: false // Don't overwrite existing files with same name
                        });

                    if (uploadError) {
                        console.error("[EditProfile] Supabase upload error:", uploadError);
                        throw new Error(`Upload failed: ${uploadError.message}`);
                    } else {
                        console.log("[EditProfile] Supabase upload successful for:", filePath);
                    }

                    // Get Public URL
                    const { data: urlData } = supabase.storage.from('profile_pictures').getPublicUrl(filePath);
                    if (!urlData?.publicUrl) {
                        console.warn("[EditProfile] Could not get public URL for uploaded file:", filePath);
                        // Don't throw error here, maybe proceed but log it
                        Toast.show({ type: 'warning', text1: 'URL Issue', text2: 'Could not get public URL for an image.'});
                        // uploadedNewImageUrls.push(filePath); // Fallback? Or just skip? Let's skip for now.
                    } else {
                       uploadedNewImageUrls.push(urlData.publicUrl);
                       console.log("[EditProfile] Uploaded and got URL:", urlData.publicUrl);
                    }
                } // End for loop
                if (uploadedNewImageUrls.length === newImageAssets.length) {
                  Toast.show({ type: 'success', text1: "New images uploaded!" });
                } else {
                  Toast.show({ type: 'warning', text1: "Some images uploaded", text2: "Check console for details." });
                }
            } else {
                console.log("[EditProfile] No new images to upload.");
            }

            // --- 2. Prepare Final Data ---
            console.log("[EditProfile] Preparing final update data...");
            // Combine remaining existing pictures with newly uploaded ones
            const finalImageUrls = [...currentProfilePictures, ...uploadedNewImageUrls];
            const profileUpdateData = {
                first_name: values.firstName,
                last_name: values.lastName || null,
                date_of_birth: format(values.dob, 'yyyy-MM-dd'), // Format date correctly
                gender: values.gender,
                bio: values.bio || null,
                interests: interests, // Use the state variable
                location: values.location || null,
                looking_for: values.lookingFor || null,
                profile_pictures: finalImageUrls, // The combined list
                updated_at: new Date().toISOString(), // Update timestamp
                // user_id is used in .eq(), no need to update it here
            };
            console.log("[EditProfile] Final update payload:", profileUpdateData);

            // --- 3. Update Profile Data in Supabase ---
            Toast.show({ type: 'info', text1: "Saving changes..." });
            console.log("[EditProfile] Attempting Supabase profile update...");

            // *** CRITICAL FIX: Update the correct table ***
            const { error: updateError } = await supabase
                .from('individual_profiles') // <<< Use the correct table name
                .update(profileUpdateData)
                .eq('user_id', user.id); // Match the user ID

            if (updateError) {
                console.error("[EditProfile] Supabase profile update error:", updateError);
                throw updateError; // Let the catch block handle it
            } else {
                console.log("[EditProfile] Supabase profile update successful.");
            }

            // --- 4. Success ---
            Toast.show({ type: 'success', text1: 'Profile Updated!', text2: 'Your changes saved.' });
            // Optional: Call refreshProfile in AuthContext if needed
            // await refreshProfile?.();
            setNewImageAssets([]); // Clear newly added assets state after successful save
            navigation.goBack(); // Navigate back after success

        } catch (error: any) {
            console.error('[EditProfile] Update Profile Error:', error);
            Toast.show({ type: 'error', text1: 'Update Failed', text2: error.message || 'An unexpected error occurred.' });
        } finally {
            console.log("[EditProfile] Finishing onSubmit.");
            setIsSubmitting(false); // Ensure loading state is turned off
        }
    };

    // --- Render ---
    if (initialLoading || authLoading) {
        return (<SafeAreaView style={styles.centered}><ActivityIndicator size="large" color="#FF6347" /></SafeAreaView>);
    }

    // Render Form using ScrollView
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.headerTitle}>Edit Your Profile</Text>

                {/* Basic Info Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Basic Information</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>First Name*</Text>
                        <Controller name="firstName" control={control} render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} placeholder="Enter first name" editable={!isSubmitting} />
                        )} />
                        {errors.firstName && <Text style={styles.errorText}>{errors.firstName.message}</Text>}
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Last Name</Text>
                        <Controller name="lastName" control={control} render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value || ''} placeholder="Enter last name" editable={!isSubmitting} />
                        )} />
                        {/* No error shown for optional field */}
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Date of Birth*</Text>
                        <Controller name="dob" control={control} render={({ field: { onChange, value } }) => (
                            <>
                                <Pressable onPress={showDatePicker} style={styles.dateButton} disabled={isSubmitting}>
                                    <Ionicons name="calendar-outline" size={20} color="#555" style={styles.dateIcon} />
                                    <Text style={[styles.dateText, !value && styles.placeholderText]}>
                                        {value ? format(value, 'PPP') : 'Select Date'}
                                    </Text>
                                </Pressable>
                                <DateTimePickerModal
                                    isVisible={isDatePickerVisible}
                                    mode="date"
                                    date={value || subYears(startOfToday(), 18)} // Default selection
                                    maximumDate={subYears(startOfToday(), 18)} // Max date is 18 years ago
                                    onConfirm={(date) => handleDateConfirm(date, onChange)}
                                    onCancel={hideDatePicker}
                                />
                            </>
                        )} />
                        {errors.dob && <Text style={styles.errorText}>{errors.dob.message}</Text>}
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Gender*</Text>
                        <Controller name="gender" control={control} render={({ field: { onChange, value } }) => (
                            // TODO: Replace with an actual Picker component (e.g., @react-native-picker/picker or a custom modal)
                            <View style={styles.pickerPlaceholder}>
                                <Text style={value ? styles.pickerText : styles.placeholderText}>
                                     {value || 'Select Gender (Replace with Picker)'}
                                </Text>
                            </View>
                            // Example using TextInput for now:
                            // <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="Select Gender (Use Picker)" editable={!isSubmitting} />
                        )} />
                        {errors.gender && <Text style={styles.errorText}>{errors.gender.message}</Text>}
                    </View>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About You</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Bio</Text>
                        <Controller name="bio" control={control} render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput style={[styles.input, styles.textArea]} onBlur={onBlur} onChangeText={onChange} value={value || ''} placeholder="Tell us about yourself..." maxLength={500} multiline numberOfLines={4} editable={!isSubmitting} />
                        )} />
                        {errors.bio && <Text style={styles.errorText}>{errors.bio.message}</Text>}
                    </View>
                    <View style={styles.inputGroup}>
                         <Text style={styles.label}>Interests (up to 10)</Text>
                         <View style={styles.interestInputContainer}>
                             <TextInput style={[styles.input, styles.interestInput]} value={interestInput} onChangeText={setInterestInput} placeholder="Type interest and add" onSubmitEditing={addInterest} editable={!isSubmitting} />
                             <Pressable style={[styles.button, styles.addButton]} onPress={addInterest} disabled={!interestInput.trim() || interests.length >= 10 || isSubmitting}>
                                 <Text style={styles.buttonText}>Add</Text>
                             </Pressable>
                         </View>
                         <View style={styles.badgeContainer}>
                             {interests.map(interest => (
                                 <View key={interest} style={styles.badge}>
                                     <Text style={styles.badgeText}>{interest}</Text>
                                     <Pressable onPress={() => removeInterest(interest)} style={styles.removeBadgeButton} disabled={isSubmitting}>
                                         <Ionicons name="close-circle" size={18} color="#fff" />
                                     </Pressable>
                                 </View>
                             ))}
                         </View>
                    </View>
                </View>

                {/* Preferences Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Location</Text>
                        <Controller name="location" control={control} render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value || ''} placeholder="e.g., Miami, FL" editable={!isSubmitting} />
                        )} />
                        {/* No error shown for optional field */}
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Looking For</Text>
                        <Controller name="lookingFor" control={control} render={({ field: { onChange, value } }) => (
                             // TODO: Replace with an actual Picker component
                             <View style={styles.pickerPlaceholder}>
                                 <Text style={value ? styles.pickerText : styles.placeholderText}>{value || 'Select Preference (Use Picker)'}</Text>
                             </View>
                            // Example using TextInput for now:
                            // <TextInput style={styles.input} onChangeText={onChange} value={value || ''} placeholder="Select Preference (Use Picker)" editable={!isSubmitting} />
                        )} />
                         {/* No error shown for optional field */}
                    </View>
                </View>

                {/* Photos Section */}
                <View style={styles.section}>
                     <Text style={styles.sectionTitle}>Profile Pictures*</Text>
                     <View style={styles.inputGroup}>
                         {/* Use constant */}
                         <Text style={styles.label}>Add or remove photos (up to {MAX_PROFILE_PHOTOS} total)</Text>
                         <Pressable
                             style={[styles.button, styles.outlineButton]}
                             onPress={pickImage}
                             // Use constant for disabling
                             disabled={isSubmitting || allImageUris.length >= MAX_PROFILE_PHOTOS}
                         >
                             <Ionicons name="images-outline" size={18} color="#FF6347" style={{ marginRight: 8 }}/>
                             <Text style={styles.outlineButtonText}>Select New Images</Text>
                         </Pressable>
                         {/* Error message if no photos at all */}
                         {allImageUris.length === 0 && <Text style={styles.errorText}>Please add at least one photo.</Text>}
                     </View>
                     <View style={styles.imageGrid}>
                         {/* Render combined list */}
                         {allImageUris.map((uri) => (
                             <View key={uri} style={styles.imageContainer}>
                                 <Image source={{ uri: uri }} style={styles.imagePreview} />
                                 <Pressable
                                    style={styles.removeImageButton}
                                    onPress={() => removeImage(uri)}
                                    disabled={isSubmitting}
                                 >
                                     <Ionicons name="close-circle" size={28} color="#fff" style={styles.removeImageIcon} />
                                 </Pressable>
                             </View>
                         ))}
                     </View>
                </View>

                {/* Submit Button */}
                <View style={styles.buttonContainer}>
                     <Pressable style={[styles.button, styles.outlineButton, styles.cancelButton]} onPress={() => navigation.goBack()} disabled={isSubmitting}>
                         <Text style={[styles.outlineButtonText, { color: '#555'}]}>Cancel</Text>
                     </Pressable>
                     <Pressable
                        style={[styles.button, styles.submitButton, (isSubmitting || allImageUris.length === 0) ? styles.buttonDisabled : {} ]}
                        onPress={handleSubmit(onSubmit)}
                        // Disable if submitting OR if no photos are present
                        disabled={isSubmitting || allImageUris.length === 0}
                     >
                         {isSubmitting ? <ActivityIndicator color="#fff" style={{ marginRight: 8 }}/> : null}
                         <Text style={styles.buttonText}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Text>
                     </Pressable>
                </View>

            </ScrollView>
            {/* Toast messages need to be configured globally, usually in App.tsx */}
            <Toast />
        </SafeAreaView>
    );
};

// --- Styles --- (Keep existing styles - minor tweaks for consistency)
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
    scrollView: { flex: 1 },
    contentContainer: { padding: 20, paddingBottom: 40 }, // Added bottom padding
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: '#333', textAlign: 'center' }, // Centered
    section: { marginBottom: 24, backgroundColor: '#fff', borderRadius: 8, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.18, shadowRadius: 1.00, elevation: 1, },
    sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 16, color: '#444', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8 }, // Added border
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '500', color: '#555', marginBottom: 6 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 10, fontSize: 16, backgroundColor: '#fff' },
    textArea: { height: 100, textAlignVertical: 'top' },
    errorText: { fontSize: 12, color: 'red', marginTop: 4 },
    placeholderText: { color: '#999' },
    // --- Date Picker Styles ---
    dateButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 12, minHeight: 44, backgroundColor: '#fff' },
    dateIcon: { marginRight: 8 },
    dateText: { fontSize: 16, color: '#333'},
    // --- Picker Placeholder ---
    pickerPlaceholder: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 12, backgroundColor: '#fff', minHeight: 44, justifyContent: 'center' },
    pickerText: { fontSize: 16, color: '#333'},
    // --- Interest Styles ---
    interestInputContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    interestInput: { flex: 1 },
    addButton: { paddingHorizontal: 16, height: 44, justifyContent: 'center', backgroundColor: '#FF6347' },
    badgeContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 8 }, // Use gap
    badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF6347', borderRadius: 15, paddingVertical: 5, paddingLeft: 10, paddingRight: 4, /* Removed margin */ },
    badgeText: { color: '#fff', fontSize: 14, marginRight: 4 },
    removeBadgeButton: { padding: 2 },
    // --- Image Styles ---
    imageGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 10 }, // Use gap
    imageContainer: {
        width: '30%', // Adjust if needed with gap
        aspectRatio: 1,
        // margin: '1.66%', // Replaced by gap
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        position: 'relative', // Needed for absolute positioning of remove button
     },
    imagePreview: { width: '100%', height: '100%' },
    removeImageButton: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 14, width: 28, height: 28, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    removeImageIcon: { /* Icon styles if needed */ },
    // --- Button Styles ---
    buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee', gap: 16 }, // Use gap
    button: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minWidth: 100, flex: 1 }, // Added flex: 1
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
    submitButton: { backgroundColor: '#FF6347', /* Removed flex: 1 and marginLeft */ },
    outlineButton: { borderWidth: 1, borderColor: '#FF6347', backgroundColor: '#fff', /* Removed flex: 1 */ },
    outlineButtonText: { color: '#FF6347', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
    cancelButton: { borderColor: '#aaa', /* Removed flex: 1 and marginRight */}, // Adjusted cancel button color
    buttonDisabled: { backgroundColor: '#cccccc', borderColor: '#cccccc', opacity: 0.7 }, // Style for disabled state
    // --- Option Button Example --- (Keep if you implement button-based pickers)
    optionButton: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, marginRight: 8, marginBottom: 8 },
    optionButtonSelected: { backgroundColor: '#FF6347', borderColor: '#FF6347' },
    optionButtonTextSelected: { color: '#fff' },

});

export default EditProfileScreen;