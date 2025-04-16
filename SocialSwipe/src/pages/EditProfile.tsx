// src/screens/EditProfileScreen.tsx (Example Path)
// CONVERTED for React Native / Expo Go
// Includes ArrayBuffer fix for image upload

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
                        .from('profiles').select('*').eq('user_id', user.id).single();

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
             navigation.navigate('Login' as any);
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
        if (currentTotal >= 6) {
            Toast.show({ type: 'info', text1: 'Limit Reached', text2: 'Max 6 photos allowed.' });
            return;
        }

        try {
             let result = await ImagePicker.launchImageLibraryAsync({
                 mediaTypes: ImagePicker.MediaTypeOptions.Images,
                 allowsMultipleSelection: true,
                 quality: 0.8,
                 selectionLimit: 6 - currentTotal,
             });

             console.log('[EditProfile] ImagePicker result:', JSON.stringify(result, null, 2));

             if (!result.canceled && result.assets) {
                 const combined = [...newImageAssets, ...result.assets];
                 const limitedAssets = combined.slice(0, 6 - currentProfilePictures.length);
                 if (combined.length > limitedAssets.length) {
                      Toast.show({ type: 'info', text1: 'Limit Exceeded', text2: 'Selected images exceed the limit of 6.' });
                 }
                 setNewImageAssets(limitedAssets);
                 console.log(`[EditProfile] Added ${result.assets.length} new image assets.`);
             } else {
                  console.log("[EditProfile] Image picking cancelled or no assets selected.");
             }
        } catch (pickerError) {
             console.error("[EditProfile] Error launching image picker:", pickerError);
             Toast.show({ type: 'error', text1: 'Image Picker Error', text2: 'Could not open image library.'});
        }
    };

    const removeImage = (uriToRemove: string) => {
          const existingIndex = currentProfilePictures.indexOf(uriToRemove);
          if (existingIndex > -1) {
              setCurrentProfilePictures(prev => prev.filter(url => url !== uriToRemove));
              console.log(`[EditProfile] Marked existing image for removal (will be removed on save): ${uriToRemove}`);
          } else {
              setNewImageAssets(prev => prev.filter(asset => asset.uri !== uriToRemove));
              console.log(`[EditProfile] Removed new image asset: ${uriToRemove}`);
          }
    };

    const allImageUris = [
          ...currentProfilePictures,
          ...newImageAssets.map(asset => asset.uri)
    ];

    // --- Interest Handling --- (Keep as is)
    const addInterest = () => { /* ... */ };
    const removeInterest = (interestToRemove: string) => { /* ... */ };

    // --- Date Picker --- (Keep as is)
    const showDatePicker = () => setDatePickerVisibility(true);
    const hideDatePicker = () => setDatePickerVisibility(false);
    const handleDateConfirm = (date: Date, onChange: (date: Date) => void) => { /* ... */ };

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
        console.log("[EditProfile] Starting onSubmit...");

        try {
            // --- 1. Upload NEW Images ---
            if (newImageAssets.length > 0) {
                Toast.show({ type: 'info', text1: "Uploading new images..." });
                console.log(`[EditProfile] Attempting to upload ${newImageAssets.length} new images.`);

                for (const asset of newImageAssets) {
                    const uri = asset.uri;
                    console.log(`[EditProfile] Processing asset URI: ${uri}`);

                    console.log("[EditProfile] Attempting to fetch image URI...");
                    const response = await fetch(uri);
                    console.log(`[EditProfile] Fetch status for ${uri}: ${response.status}, OK: ${response.ok}`);

                    if (!response.ok) {
                         let responseText = 'Could not read response body.';
                         try { responseText = await response.text(); } catch {}
                         console.error(`[EditProfile] Failed Fetch Response Body (limited): ${responseText.substring(0, 500)}`);
                        throw new Error(`Failed to fetch image URI (${response.status}): ${response.statusText}`);
                    }

                    // *** MODIFICATION START ***
                    // Get ArrayBuffer DIRECTLY from response, skip Blob
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
                    // *** MODIFICATION END ***

                    const fileExt = asset.fileName?.split('.').pop()?.toLowerCase() ?? uri.split('.').pop()?.toLowerCase() ?? 'jpg';
                    // Attempt to get a better extension based on the actual fetched content type if possible
                    const betterFileExt = contentType.split('/')[1]?.split('+')[0] ?? fileExt; // Handle things like image/svg+xml
                    const fileName = `${uuidv4()}.${betterFileExt}`;
                    const filePath = `${user.id}/${fileName}`;


                    console.log(`[EditProfile] Attempting Supabase upload (using ArrayBuffer) to path: ${filePath} with contentType: ${contentType}`);
                    const { error: uploadError, data: uploadData } = await supabase.storage
                        .from('profile_pictures')
                        // *** Upload ArrayBuffer ***
                        .upload(filePath, arrayBuffer, {
                             contentType: contentType, // Pass content type from headers
                             upsert: false
                         });

                    if (uploadError) {
                        console.error("[EditProfile] Supabase upload error:", uploadError);
                        throw new Error(`Upload failed: ${uploadError.message}`);
                    } else {
                         console.log("[EditProfile] Supabase upload successful for:", filePath);
                    }

                    const { data: urlData } = supabase.storage.from('profile_pictures').getPublicUrl(filePath);
                    if (!urlData?.publicUrl) {
                        console.warn("[EditProfile] Could not get public URL for uploaded file:", filePath);
                        throw new Error("Failed to get public URL after upload.");
                    }
                    uploadedNewImageUrls.push(urlData.publicUrl);
                    console.log("[EditProfile] Uploaded and got URL:", urlData.publicUrl);
                }
                Toast.show({ type: 'success', text1: "New images uploaded!" });
            } else {
                 console.log("[EditProfile] No new images to upload.");
            }

            // --- 2. Prepare Final Data ---
             console.log("[EditProfile] Preparing final update data...");
            const finalImageUrls = [...currentProfilePictures, ...uploadedNewImageUrls];
            const profileUpdateData = {
                first_name: values.firstName,
                last_name: values.lastName || null,
                date_of_birth: format(values.dob, 'yyyy-MM-dd'),
                gender: values.gender,
                bio: values.bio || null,
                interests: interests,
                location: values.location || null,
                looking_for: values.lookingFor || null,
                profile_pictures: finalImageUrls,
                updated_at: new Date().toISOString(),
            };
             console.log("[EditProfile] Final update payload:", profileUpdateData);

            // --- 3. Update Profile Data ---
            Toast.show({ type: 'info', text1: "Saving changes..." });
             console.log("[EditProfile] Attempting Supabase profile update...");
            const { error: updateError } = await supabase
                .from('profiles').update(profileUpdateData).eq('user_id', user.id);

            if (updateError) {
                console.error("[EditProfile] Supabase profile update error:", updateError);
                throw updateError;
            } else {
                 console.log("[EditProfile] Supabase profile update successful.");
            }

            // --- 4. Success ---
            Toast.show({ type: 'success', text1: 'Profile Updated!', text2: 'Your changes saved.' });
            // Optional: Call refreshProfile in AuthContext if you want instant update there
            // await refreshProfile?.();
            navigation.goBack();

        } catch (error: any) {
            console.error('[EditProfile] Update Profile Error:', error);
            Toast.show({ type: 'error', text1: 'Update Failed', text2: error.message || 'An unexpected error occurred.' });
        } finally {
            console.log("[EditProfile] Finishing onSubmit.");
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
                keyboardShouldPersistTaps="handled"
            >
                {/* Keep all the form rendering JSX as it was */}
                <Text style={styles.headerTitle}>Edit Your Profile</Text>

                 {/* Basic Info Section */}
                 <View style={styles.section}>
                     {/* ... First Name, Last Name, DOB, Gender inputs ... */}
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
                                       date={value || subYears(startOfToday(), 18)} // Sensible default
                                       maximumDate={subYears(startOfToday(), 18)}
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
                               <View style={styles.pickerPlaceholder}>
                                   {/* TODO: Replace with actual picker component */}
                                   <Text style={value ? styles.pickerText : styles.placeholderText}>
                                       {value || 'Select Gender (Use Picker)'}
                                   </Text>
                               </View>
                           )} />
                           {errors.gender && <Text style={styles.errorText}>{errors.gender.message}</Text>}
                       </View>
                 </View>

                 {/* About Section */}
                  <View style={styles.section}>
                      {/* ... Bio, Interests inputs ... */}
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
                                <TextInput style={[styles.input, styles.interestInput]} value={interestInput} onChangeText={setInterestInput} placeholder="Type interest and add" onSubmitEditing={addInterest} />
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
                       {/* ... Location, Looking For inputs ... */}
                        <Text style={styles.sectionTitle}>Preferences</Text>
                        <View style={styles.inputGroup}>
                             <Text style={styles.label}>Location</Text>
                             <Controller name="location" control={control} render={({ field: { onChange, onBlur, value } }) => (
                                 <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value || ''} placeholder="e.g., Miami, FL" />
                             )} />
                         </View>
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
                     {/* ... Image Picker button and grid ... */}
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
                          {allImageUris.map((uri) => (
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
                     {/* ... Cancel and Save buttons ... */}
                     <Pressable style={[styles.button, styles.outlineButton, styles.cancelButton]} onPress={() => navigation.goBack()} disabled={isSubmitting}>
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

// --- Styles --- (Keep existing styles)
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
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 10, fontSize: 16, backgroundColor: '#fff' }, // Adjust padding for platforms
    textArea: { height: 100, textAlignVertical: 'top' }, // For multiline
    errorText: { fontSize: 12, color: 'red', marginTop: 4 },
    placeholderText: { color: '#999' },
    // --- Date Picker Styles ---
    dateButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 12, minHeight: 44, backgroundColor: '#fff' }, // Use minHeight
    dateIcon: { marginRight: 8 },
    dateText: { fontSize: 16, color: '#333'},
    // --- Picker Placeholder ---
    pickerPlaceholder: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 12, backgroundColor: '#fff', minHeight: 44, justifyContent: 'center' }, // Use minHeight
    pickerText: { fontSize: 16, color: '#333'},
    // --- Interest Styles ---
    interestInputContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    interestInput: { flex: 1 }, // Take remaining space
    addButton: { paddingHorizontal: 16, height: 44, justifyContent: 'center', backgroundColor: '#FF6347' }, // Fixed height and background
    badgeContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
    badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF6347', borderRadius: 15, paddingVertical: 5, paddingLeft: 10, paddingRight: 4, marginRight: 8, marginBottom: 8 }, // Adjust padding
    badgeText: { color: '#fff', fontSize: 14, marginRight: 4 },
    removeBadgeButton: { padding: 2 }, // Removed margin, alignment handled by flex
    // --- Image Styles ---
    imageGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, marginHorizontal: '-1.66%' }, // Negative margin to counter item margin
    imageContainer: { width: '30%', aspectRatio: 1, margin: '1.66%', borderWidth: 1, borderColor: '#eee', borderRadius: 6, overflow: 'hidden', backgroundColor: '#f0f0f0' }, // Add background color
    imagePreview: { width: '100%', height: '100%' },
    removeImageButton: { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 14, width: 28, height: 28, justifyContent: 'center', alignItems: 'center' }, // Centered icon
    removeImageIcon: { /* Icon styles if needed */ },
    // --- Button Styles ---
    buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee' },
    button: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minWidth: 100 }, // minWidth
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }, // Ensure text centered
    submitButton: { backgroundColor: '#FF6347', flex: 1, marginLeft: 8 }, // Allow button to grow
    outlineButton: { borderWidth: 1, borderColor: '#FF6347' },
    outlineButtonText: { color: '#FF6347', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }, // Ensure text centered
    cancelButton: { borderColor: '#aaa', flex: 1, marginRight: 8 }, // Allow button to grow
    // --- Option Button Example --- (Keep if you implement button-based pickers)
    optionButton: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, marginRight: 8, marginBottom: 8 },
    optionButtonSelected: { backgroundColor: '#FF6347', borderColor: '#FF6347' },
    optionButtonTextSelected: { color: '#fff' },

});


export default EditProfileScreen;