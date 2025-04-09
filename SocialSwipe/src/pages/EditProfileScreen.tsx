// src/screens/EditProfileScreen.tsx (Example Path)
// CONVERTED for React Native / Expo Go

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
import { v4 as uuidv4 } from 'uuid';
import * as ImagePicker from 'expo-image-picker';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons'; // Expo icons
import { format, parseISO, startOfToday, subYears } from 'date-fns';

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
}

// Define your Navigation Stack Param List if not done globally
type RootStackParamList = {
    Profile: undefined; // Assuming Profile is the screen name in your main stack
    Login: undefined;
    EditProfile: undefined; // Current screen
    // ... other screens
};
type EditProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditProfile'>;


const EditProfileScreen: React.FC = () => {
    const navigation = useNavigation<EditProfileScreenNavigationProp>();
    const { user, loading: authLoading } = useAuth();
    const [initialLoading, setInitialLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- State ---
    const [currentProfilePictures, setCurrentProfilePictures] = useState<string[]>([]); // URLs from DB
    // Store URIs from image picker results
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
    const watchedDob = watch('dob'); // Watch DOB to display in button

    // --- Fetch Existing Profile Data ---
    useEffect(() => {
        if (!authLoading && user) {
            const fetchProfileData = async () => {
                setInitialLoading(true);
                try {
                    const { data, error } = await supabase
                        .from('profiles').select('*').eq('id', user.id).single();
                    if (error) throw error;
                    if (data) {
                        reset({ // Pre-populate form
                            firstName: data.first_name || '', lastName: data.last_name || '',
                            dob: data.date_of_birth ? parseISO(data.date_of_birth) : undefined, // Keep as Date obj
                            gender: data.gender || '', bio: data.bio || '',
                            location: data.location || '', lookingFor: data.looking_for || '',
                        });
                        setInterests(data.interests || []);
                        setCurrentProfilePictures(data.profile_pictures || []); // These are URLs
                    } else {
                        Toast.show({ type: 'error', text1: 'Profile not found' });
                        navigation.goBack(); // Go back if profile missing
                    }
                } catch (error: any) {
                    console.error("Failed to fetch profile data:", error);
                    Toast.show({ type: 'error', text1: 'Failed to load data', text2: error.message });
                    navigation.goBack();
                } finally {
                    setInitialLoading(false);
                }
            };
            fetchProfileData();
        } else if (!authLoading && !user) {
            navigation.replace('Login'); // Use replace if user logs out while on screen
        }
    }, [user, authLoading, reset, navigation]);

    // --- Image Handling ---
    const pickImage = async () => {
        // Request permissions first
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        const currentTotal = currentProfilePictures.length + newImageAssets.length;
        if (currentTotal >= 6) {
            Toast.show({ type: 'info', text1: 'Limit Reached', text2: 'Max 6 photos allowed.' });
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true, // Allow selecting multiple
            quality: 0.8, // Reduce quality slightly for faster uploads
             selectionLimit: 6 - currentTotal, // Limit selection based on remaining slots
        });

        if (!result.canceled && result.assets) {
            // Ensure we don't exceed the limit after selection
            const combined = [...newImageAssets, ...result.assets];
            const limitedAssets = combined.slice(0, 6 - currentProfilePictures.length);
             if (combined.length > limitedAssets.length) {
                  Toast.show({ type: 'info', text1: 'Limit Exceeded', text2: 'Selected images exceed the limit of 6.' });
             }
            setNewImageAssets(limitedAssets);
        }
    };

    // Remove based on URI - handles both existing (URL) and new (asset URI)
    const removeImage = (uriToRemove: string) => {
         // Check if it's an existing URL
         const existingIndex = currentProfilePictures.indexOf(uriToRemove);
         if (existingIndex > -1) {
             // Remove from currentProfilePictures (URLs from DB)
             setCurrentProfilePictures(prev => prev.filter(url => url !== uriToRemove));
             // Note: Still not deleting from Supabase storage here.
         } else {
             // Remove from newImageAssets (URIs from picker)
             setNewImageAssets(prev => prev.filter(asset => asset.uri !== uriToRemove));
         }
    };

    // Combined list for display (URLs and Asset URIs)
     const allImageUris = [
         ...currentProfilePictures,
         ...newImageAssets.map(asset => asset.uri) // Get URIs from assets
     ];


    // --- Interest Handling ---
    const addInterest = () => {
        const trimmedInput = interestInput.trim();
        if (trimmedInput && !interests.includes(trimmedInput) && interests.length < 10) {
            setInterests([...interests, trimmedInput]);
            setInterestInput('');
        } else if (interests.length >= 10) {
            Toast.show({ type: 'warning', text1: 'Limit Reached', text2: 'Max 10 interests.' });
        }
    };
    const removeInterest = (interestToRemove: string) => {
        setInterests(interests.filter(interest => interest !== interestToRemove));
    };

    // --- Date Picker ---
    const showDatePicker = () => setDatePickerVisibility(true);
    const hideDatePicker = () => setDatePickerVisibility(false);
    const handleDateConfirm = (date: Date, onChange: (date: Date) => void) => {
        onChange(date); // Update RHF state
        hideDatePicker();
    };

    // --- Form Submission Logic (UPDATE) ---
    const onSubmit = async (values: ProfileFormData) => {
        if (!user) {
            Toast.show({ type: 'error', text1: 'User session not found.' }); return;
        }
        if (allImageUris.length === 0) {
            Toast.show({ type: 'error', text1: 'Missing Photos', text2: 'Please add at least one photo.'}); return;
        }

        setIsSubmitting(true);
        const uploadedNewImageUrls: string[] = [];

        try {
            // --- 1. Upload NEW Images ---
            if (newImageAssets.length > 0) {
                Toast.show({ type: 'info', text1: "Uploading new images..." });
                for (const asset of newImageAssets) {
                    const uri = asset.uri;
                    // Convert local file URI to blob/arraybuffer for upload
                    // Using fetch and blob() is a common approach in React Native
                    const response = await fetch(uri);
                    const blob = await response.blob();
                    const fileExt = asset.fileName?.split('.').pop()?.toLowerCase() ?? uri.split('.').pop()?.toLowerCase() ?? 'jpg';
                    const fileName = `${uuidv4()}.${fileExt}`;
                    const filePath = `${user.id}/${fileName}`;
                    const contentType = blob.type ?? `image/${fileExt}`; // Get MIME type from blob

                    // Check blob size if needed
                    // if (blob.size > MAX_FILE_SIZE) { throw new Error(...); }

                    const { error: uploadError, data: uploadData } = await supabase.storage
                        .from('profile_pictures')
                        .upload(filePath, blob, { contentType, upsert: false }); // Pass blob directly

                    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

                    // Get public URL *after* successful upload
                    const { data: urlData } = supabase.storage.from('profile_pictures').getPublicUrl(filePath);
                    if (!urlData?.publicUrl) {
                        console.warn("Could not get public URL for uploaded file:", filePath);
                        // Decide if this is a critical error or just log it
                         throw new Error("Failed to get public URL after upload.");
                    }
                     uploadedNewImageUrls.push(urlData.publicUrl);
                     console.log("Uploaded and got URL:", urlData.publicUrl);
                }
                Toast.show({ type: 'success', text1: "New images uploaded!" });
            }

            // --- 2. Prepare Final Data ---
            const finalImageUrls = [...currentProfilePictures, ...uploadedNewImageUrls];
            const profileUpdateData = {
                first_name: values.firstName, last_name: values.lastName || null,
                date_of_birth: format(values.dob, 'yyyy-MM-dd'), // Format Date obj back to string
                gender: values.gender, bio: values.bio || null,
                interests: interests, location: values.location || null,
                looking_for: values.lookingFor || null,
                profile_pictures: finalImageUrls, // Final combined URL list
                updated_at: new Date().toISOString(),
            };

            // --- 3. Update Profile Data ---
            Toast.show({ type: 'info', text1: "Saving changes..." });
            const { error: updateError } = await supabase
                .from('profiles').update(profileUpdateData).eq('id', user.id);
            if (updateError) throw updateError;

            // --- 4. Success ---
            Toast.show({ type: 'success', text1: 'Profile Updated!', text2: 'Your changes saved.' });
            // Reset local state for new images if needed, but navigating away handles cleanup
            // setNewImageAssets([]);
            navigation.goBack(); // Go back to the profile view screen

        } catch (error: any) {
            console.error('Update Profile Error:', error);
            Toast.show({ type: 'error', text1: 'Update Failed', text2: error.message || 'An unexpected error occurred.' });
        } finally {
            setIsSubmitting(false);
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
                keyboardShouldPersistTaps="handled" // Dismiss keyboard on tap outside inputs
            >
                <Text style={styles.headerTitle}>Edit Your Profile</Text>

                {/* Basic Info Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Basic Information</Text>
                    <View style={styles.inputGroup}>
                         <Text style={styles.label}>First Name*</Text>
                         <Controller name="firstName" control={control} render={({ field: { onChange, onBlur, value } }) => (
                             <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} placeholder="Enter first name" />
                         )} />
                         {errors.firstName && <Text style={styles.errorText}>{errors.firstName.message}</Text>}
                    </View>
                    <View style={styles.inputGroup}>
                         <Text style={styles.label}>Last Name</Text>
                         <Controller name="lastName" control={control} render={({ field: { onChange, onBlur, value } }) => (
                             <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value || ''} placeholder="Enter last name" />
                         )} />
                         {/* No error shown for optional field */}
                    </View>
                     <View style={styles.inputGroup}>
                          <Text style={styles.label}>Date of Birth*</Text>
                          <Controller name="dob" control={control} render={({ field: { onChange, value } }) => (
                              <>
                                  <Pressable onPress={showDatePicker} style={styles.dateButton}>
                                      <Ionicons name="calendar-outline" size={20} color="#555" style={styles.dateIcon} />
                                      <Text style={[styles.dateText, !value && styles.placeholderText]}>
                                          {value ? format(value, 'PPP') : 'Select Date'}
                                      </Text>
                                  </Pressable>
                                  <DateTimePickerModal
                                      isVisible={isDatePickerVisible}
                                      mode="date"
                                      date={value || new Date()} // Default to today or current value
                                      maximumDate={subYears(startOfToday(), 18)} // Ensure 18+
                                      onConfirm={(date) => handleDateConfirm(date, onChange)}
                                      onCancel={hideDatePicker}
                                  />
                              </>
                          )} />
                          {errors.dob && <Text style={styles.errorText}>{errors.dob.message}</Text>}
                     </View>
                     {/* --- Gender (Simplified Example - Use Buttons or a Picker Library) --- */}
                     <View style={styles.inputGroup}>
                          <Text style={styles.label}>Gender*</Text>
                          <Controller name="gender" control={control} render={({ field: { onChange, value } }) => (
                              <View style={styles.pickerPlaceholder}>
                                   {/* Replace with actual picker */}
                                   <Text style={value ? styles.pickerText : styles.placeholderText}>
                                       {value || 'Select Gender (Use Picker)'}
                                   </Text>
                                   {/* Basic Button Example (Not a dropdown) */}
                                   {/* <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                        {['Man', 'Woman', 'Non-binary'].map(g => (
                                            <Pressable key={g} onPress={() => onChange(g)} style={[styles.optionButton, value === g && styles.optionButtonSelected]}>
                                                 <Text style={value === g && styles.optionButtonTextSelected}>{g}</Text>
                                            </Pressable>
                                        ))}
                                   </View> */}
                              </View>
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
                              <TextInput style={[styles.input, styles.textArea]} onBlur={onBlur} onChangeText={onChange} value={value || ''} placeholder="Tell us about yourself..." maxLength={500} multiline numberOfLines={4} />
                          )} />
                          {errors.bio && <Text style={styles.errorText}>{errors.bio.message}</Text>}
                     </View>
                     <View style={styles.inputGroup}>
                           <Text style={styles.label}>Interests (up to 10)</Text>
                           <View style={styles.interestInputContainer}>
                                <TextInput style={[styles.input, styles.interestInput]} value={interestInput} onChangeText={setInterestInput} placeholder="Type interest and add" onSubmitEditing={addInterest} // Add on submit
                                />
                                <Pressable style={[styles.button, styles.addButton]} onPress={addInterest} disabled={!interestInput.trim() || interests.length >= 10}>
                                     <Text style={styles.buttonText}>Add</Text>
                                </Pressable>
                           </View>
                           <View style={styles.badgeContainer}>
                                {interests.map(interest => (
                                    <View key={interest} style={styles.badge}>
                                         <Text style={styles.badgeText}>{interest}</Text>
                                         <Pressable onPress={() => removeInterest(interest)} style={styles.removeBadgeButton}>
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
                               <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value || ''} placeholder="e.g., Miami, FL" />
                           )} />
                      </View>
                      {/* --- Looking For (Simplified Example) --- */}
                      <View style={styles.inputGroup}>
                           <Text style={styles.label}>Looking For</Text>
                           <Controller name="lookingFor" control={control} render={({ field: { onChange, value } }) => (
                               <View style={styles.pickerPlaceholder}>
                                    <Text style={value ? styles.pickerText : styles.placeholderText}>{value || 'Select Preference (Use Picker)'}</Text>
                               </View>
                           )} />
                       </View>
                  </View>

                {/* Photos Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Profile Pictures*</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Add or remove photos (up to 6 total)</Text>
                        <Pressable style={[styles.button, styles.outlineButton]} onPress={pickImage} disabled={allImageUris.length >= 6}>
                             <Ionicons name="images-outline" size={18} color="#FF6347" style={{ marginRight: 8 }}/>
                            <Text style={styles.outlineButtonText}>Select New Images</Text>
                        </Pressable>
                        {allImageUris.length === 0 && <Text style={styles.errorText}>Please add at least one photo.</Text>}
                    </View>
                    <View style={styles.imageGrid}>
                         {allImageUris.map((uri, index) => (
                            <View key={uri} style={styles.imageContainer}>
                                <Image source={{ uri: uri }} style={styles.imagePreview} />
                                <Pressable style={styles.removeImageButton} onPress={() => removeImage(uri)}>
                                     <Ionicons name="close-circle" size={28} color="#fff" style={styles.removeImageIcon} />
                                </Pressable>
                            </View>
                         ))}
                    </View>
                </View>


                {/* Submit Button */}
                <View style={styles.buttonContainer}>
                    <Pressable style={[styles.button, styles.outlineButton, styles.cancelButton]} onPress={() => navigation.goBack()}>
                         <Text style={styles.outlineButtonText}>Cancel</Text>
                    </Pressable>
                    <Pressable style={[styles.button, styles.submitButton]} onPress={handleSubmit(onSubmit)} disabled={isSubmitting || allImageUris.length === 0}>
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

// --- Styles --- (Basic styles, refine as needed)
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
    scrollView: { flex: 1 },
    contentContainer: { padding: 20 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: '#333' },
    section: { marginBottom: 24, backgroundColor: '#fff', borderRadius: 8, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.18, shadowRadius: 1.00, elevation: 1, },
    sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 16, color: '#444' },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '500', color: '#555', marginBottom: 6 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#fff' },
    textArea: { height: 100, textAlignVertical: 'top' }, // For multiline
    errorText: { fontSize: 12, color: 'red', marginTop: 4 },
    placeholderText: { color: '#999' },
    // --- Date Picker Styles ---
    dateButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
    dateIcon: { marginRight: 8 },
    dateText: { fontSize: 16, color: '#333'},
    // --- Picker Placeholder ---
    pickerPlaceholder: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', minHeight: 44, justifyContent: 'center' },
    pickerText: { fontSize: 16, color: '#333'},
    // --- Interest Styles ---
    interestInputContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    interestInput: { flex: 1 }, // Take remaining space
    addButton: { paddingHorizontal: 16 }, // Specific button style if needed
    badgeContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
    badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF6347', borderRadius: 15, paddingVertical: 5, paddingHorizontal: 10, marginRight: 8, marginBottom: 8 },
    badgeText: { color: '#fff', fontSize: 14, marginRight: 4 },
    removeBadgeButton: { marginLeft: 'auto', padding: 2 }, // Push icon to right
    // --- Image Styles ---
    imageGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
    imageContainer: { width: '30%', aspectRatio: 1, margin: '1.66%', borderWidth: 1, borderColor: '#eee', borderRadius: 6, overflow: 'hidden' }, // Approx 3 per row
    imagePreview: { width: '100%', height: '100%' },
    removeImageButton: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 14, padding: 2 },
    removeImageIcon: { opacity: 0.9 },
    // --- Button Styles ---
    buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee' },
    button: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    submitButton: { backgroundColor: '#FF6347' },
    outlineButton: { borderWidth: 1, borderColor: '#FF6347' },
    outlineButtonText: { color: '#FF6347', fontSize: 16, fontWeight: 'bold' },
    cancelButton: { borderColor: '#aaa' },
    // --- Option Button Example ---
     optionButton: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, marginRight: 8, marginBottom: 8 },
     optionButtonSelected: { backgroundColor: '#FF6347', borderColor: '#FF6347' },
     optionButtonTextSelected: { color: '#fff' },

});

export default EditProfileScreen;