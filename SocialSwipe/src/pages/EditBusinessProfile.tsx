// src/pages/EditBusinessProfileScreen.tsx (Example Path)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  SafeAreaView, // Added for better layout
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabaseClient'; // Adjust path if needed
import { useAuth } from '../contexts/AuthContext'; // To get user and refresh profile
import { v4 as uuidv4 } from 'uuid'; // For unique filenames
import 'react-native-get-random-values'; // Polyfill for uuid
import Toast from 'react-native-toast-message'; // For user feedback
import { Ionicons } from '@expo/vector-icons'; // For icons

// --- Define relevant Navigation Stack ---
// Adjust this based on where EditBusinessProfileScreen resides in your navigation structure
// This assumes it might be in a stack accessible after authentication like 'AppStack' or similar
type AppStackParamList = {
  Home: undefined; // Example
  Profile: undefined; // Example
  EditBusinessProfile: undefined; // This screen
  // ... other screens
};
type EditBusinessProfileNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'EditBusinessProfile'
>;

// --- Use the same Validation Schema as Create ---
const businessProfileSchema = z.object({
  business_name: z.string().min(2, { message: "Business name is required (min 2 chars)." }),
  category: z.string().min(3, { message: "Category is required (min 3 chars)." }),
  description: z.string().max(1000, { message: "Description max 1000 chars."}).optional(), // Added max length
  address_street: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  address_postal_code: z.string().optional(),
  address_country: z.string().optional(),
  phone_number: z.string().optional(),
});

// Infer type from schema
type BusinessProfileFormData = z.infer<typeof businessProfileSchema>;

// --- Define Profile Interface (matching DB columns) ---
interface BusinessProfile {
    id: string; // Assuming 'id' is the primary key UUID from Supabase
    user_id: string;
    created_at: string;
    updated_at: string;
    profile_type: 'individual' | 'business'; // Assuming you have this column
    business_name?: string | null;
    category?: string | null;
    description?: string | null;
    address_street?: string | null;
    address_city?: string | null;
    address_state?: string | null;
    address_postal_code?: string | null;
    address_country?: string | null;
    phone_number?: string | null;
    profile_picture?: string[] | null; // Column for business photos (ensure type text[] or jsonb)
    // Add any other relevant columns from your 'profiles' table
}

// --- Constants ---
const MAX_BUSINESS_PHOTOS = 6; // Consistent limit

const EditBusinessProfileScreen: React.FC = () => {
  const navigation = useNavigation<EditBusinessProfileNavigationProp>();
  const { user, loading: authLoading, refreshProfile } = useAuth(); // Get user, loading state, and refresh function

  // --- State ---
  const [initialLoading, setInitialLoading] = useState(true); // For fetching data
  const [isSubmitting, setIsSubmitting] = useState(false); // For save operation
  const [currentBusinessPictures, setCurrentBusinessPictures] = useState<string[]>([]); // URLs from DB
  const [newImageAssets, setNewImageAssets] = useState<ImagePicker.ImagePickerAsset[]>([]); // New images selected by user

  // --- React Hook Form Setup ---
  const form = useForm<BusinessProfileFormData>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: { // Default empty values, will be overwritten by fetched data
      business_name: '',
      category: '',
      description: '',
      address_street: '',
      address_city: '',
      address_state: '',
      address_postal_code: '',
      address_country: '',
      phone_number: '',
    },
    mode: 'onTouched', // Validate on blur/change after first touch
  });
  const { control, handleSubmit, formState: { errors }, reset } = form;

  // --- Fetch Existing Profile Data ---
  useEffect(() => {
    if (!authLoading && user) {
      const fetchProfileData = async () => {
        setInitialLoading(true);
        console.log("[EditBusinessProfile] Fetching profile data...");
        try {
          const { data, error, status } = await supabase
            .from('profiles') // Your table name
            .select('*') // Select all columns or specific ones needed
            .eq('user_id', user.id)
            .single(); // Expecting only one profile per user

          console.log("[EditBusinessProfile] Profile fetch response:", { status, error, hasData: !!data });

          if (error && status !== 406) { // 406 means no row found, which is handled below
            console.error("[EditBusinessProfile] Supabase error fetching profile:", error);
            throw error;
          }

          if (data) {
            const profile = data as BusinessProfile; // Cast to defined interface
            // Reset the form with fetched data
            reset({
              business_name: profile.business_name || '',
              category: profile.category || '',
              description: profile.description || '',
              address_street: profile.address_street || '',
              address_city: profile.address_city || '',
              address_state: profile.address_state || '',
              address_postal_code: profile.address_postal_code || '',
              address_country: profile.address_country || '',
              phone_number: profile.phone_number || '',
            });
            // Set existing pictures (ensure the column name 'profile_picture' is correct)
            setCurrentBusinessPictures(profile.profile_picture || []);
            console.log("[EditBusinessProfile] Profile data loaded into form.");
          } else {
            console.warn("[EditBusinessProfile] No business profile data found for user.");
            Toast.show({ type: 'info', text1: 'Profile not found', text2: 'Create a business profile first.' });
            // Optional: Navigate back or to create screen
            // navigation.navigate('CreateBusinessProfile'); // If you have this screen in the same stack
            navigation.goBack();
          }
        } catch (error: any) {
          console.error("[EditBusinessProfile] Failed to fetch profile data:", error);
          Toast.show({ type: 'error', text1: 'Failed to load data', text2: error.message });
          navigation.goBack(); // Go back if loading fails
        } finally {
          setInitialLoading(false);
          console.log("[EditBusinessProfile] Finished initial loading.");
        }
      };
      fetchProfileData();
    } else if (!authLoading && !user) {
      // Redirect to login if user is somehow lost
       console.log("[EditBusinessProfile] No user session, navigating away.");
       // navigation.navigate('Login'); // Adjust navigation target if needed
       navigation.goBack(); // Or just go back
    }
  }, [user, authLoading, reset, navigation]);


  // --- Image Handling (Adapted from EditProfileScreen) ---
  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions!');
        return;
    }

    const currentTotal = currentBusinessPictures.length + newImageAssets.length;
    if (currentTotal >= MAX_BUSINESS_PHOTOS) {
        Toast.show({ type: 'info', text1: 'Limit Reached', text2: `Max ${MAX_BUSINESS_PHOTOS} photos allowed.` });
        return;
    }

    try {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
            selectionLimit: MAX_BUSINESS_PHOTOS - currentTotal, // Limit picker selection
        });

        console.log('[EditBusinessProfile] ImagePicker result:', JSON.stringify(result, null, 2));

        if (!result.canceled && result.assets) {
            const combined = [...newImageAssets, ...result.assets];
            // Ensure we don't exceed the absolute max limit
            const limitedAssets = combined.slice(0, MAX_BUSINESS_PHOTOS - currentBusinessPictures.length);
             if (combined.length > limitedAssets.length) {
                 Toast.show({ type: 'info', text1: 'Limit Exceeded', text2: `Selected images exceed the limit of ${MAX_BUSINESS_PHOTOS}.` });
             }
            setNewImageAssets(limitedAssets);
            console.log(`[EditBusinessProfile] Added ${result.assets.length} new image assets. Total new: ${limitedAssets.length}`);
        } else {
             console.log("[EditBusinessProfile] Image picking cancelled or no assets selected.");
        }
    } catch (pickerError) {
        console.error("[EditBusinessProfile] Error launching image picker:", pickerError);
        Toast.show({ type: 'error', text1: 'Image Picker Error', text2: 'Could not open image library.'});
    }
  };

  const removeImage = (uriToRemove: string) => {
      const existingIndex = currentBusinessPictures.indexOf(uriToRemove);
      if (existingIndex > -1) {
          // Mark existing image for removal (will be removed on save)
          setCurrentBusinessPictures(prev => prev.filter(url => url !== uriToRemove));
          console.log(`[EditBusinessProfile] Marked existing image for removal: ${uriToRemove}`);
          // Note: Actual deletion from storage is not handled here, only removal from the profile array.
          // You might want to add logic to delete orphaned files from storage later.
      } else {
          // Remove newly added asset
          setNewImageAssets(prev => prev.filter(asset => asset.uri !== uriToRemove));
          console.log(`[EditBusinessProfile] Removed new image asset: ${uriToRemove}`);
      }
  };

  // Combined list of image URIs for display
  const allImageUris = [
      ...currentBusinessPictures,
      ...newImageAssets.map(asset => asset.uri)
  ];

  // --- Form Submission Logic (UPDATE - based on EditProfileScreen) ---
  const onSubmit = async (formData: BusinessProfileFormData) => {
    if (!user) {
        Toast.show({ type: 'error', text1: 'User session not found.' }); return;
    }
    // Optional: Require at least one photo
    // if (allImageUris.length === 0) {
    //     Toast.show({ type: 'error', text1: 'Missing Photos', text2: 'Please add at least one business photo.' }); return;
    // }

    setIsSubmitting(true);
    const uploadedNewImageUrls: string[] = [];
    console.log("[EditBusinessProfile] Starting onSubmit...");

    try {
        // --- 1. Upload NEW Images (Using ArrayBuffer method) ---
        if (newImageAssets.length > 0) {
            Toast.show({ type: 'info', text1: "Uploading new images..." });
            console.log(`[EditBusinessProfile] Attempting to upload ${newImageAssets.length} new images.`);

            for (const asset of newImageAssets) {
                const uri = asset.uri;
                console.log(`[EditBusinessProfile] Processing asset URI: ${uri}`);

                const response = await fetch(uri);
                if (!response.ok) throw new Error(`Failed to fetch image URI (${response.status}): ${uri}`);

                const arrayBuffer = await response.arrayBuffer();
                if (arrayBuffer.byteLength === 0) throw new Error("Cannot upload empty image file.");

                const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
                const fileExt = asset.fileName?.split('.').pop()?.toLowerCase() ?? uri.split('.').pop()?.toLowerCase() ?? 'jpg';
                const betterFileExt = contentType.split('/')[1]?.split('+')[0] ?? fileExt;
                const fileName = `${uuidv4()}.${betterFileExt}`;
                const filePath = `${user.id}/business_photos/${fileName}`; // Consistent path

                console.log(`[EditBusinessProfile] Uploading to: ${filePath}, Type: ${contentType}`);
                const { error: uploadError } = await supabase.storage
                    .from('profile_pictures') // <<< YOUR BUCKET NAME
                    .upload(filePath, arrayBuffer, { contentType: contentType, upsert: false });

                if (uploadError) {
                    console.error("[EditBusinessProfile] Supabase upload error:", uploadError);
                    throw new Error(`Upload failed: ${uploadError.message}`);
                }

                const { data: urlData } = supabase.storage.from('profile_pictures').getPublicUrl(filePath);
                if (!urlData?.publicUrl) throw new Error("Failed to get public URL after upload.");

                uploadedNewImageUrls.push(urlData.publicUrl);
                console.log("[EditBusinessProfile] Uploaded and got URL:", urlData.publicUrl);
            }
             Toast.show({ type: 'success', text1: "New images uploaded!" });
        } else {
            console.log("[EditBusinessProfile] No new images to upload.");
        }

        // --- 2. Prepare Final Data for Update ---
        console.log("[EditBusinessProfile] Preparing final update data...");
        const finalImageUrls = [...currentBusinessPictures, ...uploadedNewImageUrls];
        const profileUpdateData = {
            business_name: formData.business_name,
            category: formData.category,
            description: formData.description || null,
            address_street: formData.address_street || null,
            address_city: formData.address_city || null,
            address_state: formData.address_state || null,
            address_postal_code: formData.address_postal_code || null,
            address_country: formData.address_country || null,
            phone_number: formData.phone_number || null,
            profile_picture: finalImageUrls, // Update the image array (ensure column is text[] or jsonb)
            updated_at: new Date().toISOString(),
            // Ensure profile_type remains 'business' if it exists or needs setting
            profile_type: 'business',
        };
        console.log("[EditBusinessProfile] Final update payload:", profileUpdateData);

        // --- 3. Update Profile Data in Supabase ---
        Toast.show({ type: 'info', text1: "Saving changes..." });
        console.log("[EditBusinessProfile] Attempting Supabase profile update...");
        const { error: updateError } = await supabase
            .from('profiles')
            .update(profileUpdateData)
            .eq('user_id', user.id); // Target the specific user's profile

        if (updateError) {
            console.error("[EditBusinessProfile] Supabase profile update error:", updateError);
            throw updateError;
        } else {
            console.log("[EditBusinessProfile] Supabase profile update successful.");
        }

        // --- 4. Success ---
        Toast.show({ type: 'success', text1: 'Profile Updated!', text2: 'Your changes have been saved.' });
        setNewImageAssets([]); // Clear newly added assets after successful save
        await refreshProfile?.(); // Refresh profile data in context
        navigation.goBack(); // Go back to the previous screen

    } catch (error: any) {
        console.error('[EditBusinessProfile] Update Profile Error:', error);
        Toast.show({ type: 'error', text1: 'Update Failed', text2: error.message || 'An unexpected error occurred.' });
    } finally {
        console.log("[EditBusinessProfile] Finishing onSubmit.");
        setIsSubmitting(false);
    }
  };


  // --- Render Logic ---
  if (initialLoading || authLoading) {
      // Consistent loading indicator style
      return (<SafeAreaView style={styles.centered}><ActivityIndicator size="large" color="#FF6347" /></SafeAreaView>);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0} // Adjust offset if needed
        >
            <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                <View style={styles.card}>
                    <View style={styles.header}>
                        {/* Title adjusted for editing */}
                        <Text style={styles.title}>Edit Business Profile</Text>
                        <Text style={styles.description}>Update your business details.</Text>
                    </View>

                    <View style={styles.content}>
                        {/* --- Form Fields (Using Controllers) --- */}
                        {/* Business Name Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Business Name *</Text>
                            <Controller control={control} name="business_name"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput style={[styles.input, errors.business_name ? styles.inputError : null]} onBlur={onBlur} onChangeText={onChange} value={value} editable={!isSubmitting} placeholder="Your Company LLC" />
                                )} />
                            {errors.business_name && <Text style={styles.errorText}>{errors.business_name.message}</Text>}
                        </View>

                        {/* Category Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Category *</Text>
                            <Controller control={control} name="category"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput style={[styles.input, errors.category ? styles.inputError : null]} onBlur={onBlur} onChangeText={onChange} value={value} placeholder="e.g., Restaurant, Retail, Salon" editable={!isSubmitting} />
                                )} />
                            {errors.category && <Text style={styles.errorText}>{errors.category.message}</Text>}
                        </View>

                        {/* Description Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description</Text>
                            <Controller control={control} name="description"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput style={[styles.input, styles.textArea, errors.description ? styles.inputError : null]} onBlur={onBlur} onChangeText={onChange} value={value || ''} multiline numberOfLines={4} placeholder="What does your business offer?" editable={!isSubmitting} maxLength={1000} />
                                )} />
                            {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}
                        </View>

                        {/* Address Inputs */}
                        <Text style={[styles.label, { marginTop: 10, marginBottom: 5, fontWeight: 'bold' }]}>Business Address</Text>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Street</Text>
                            <Controller control={control} name="address_street" render={({ field: { onChange, onBlur, value } }) => (<TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value || ''} editable={!isSubmitting} placeholder="123 Main St" />)} />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>City</Text>
                            <Controller control={control} name="address_city" render={({ field: { onChange, onBlur, value } }) => (<TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value || ''} editable={!isSubmitting} placeholder="Anytown" />)} />
                        </View>
                        <View style={styles.addressRow}>
                            <View style={[styles.inputGroup, styles.addressRowItem]}>
                                <Text style={styles.label}>State</Text>
                                <Controller control={control} name="address_state" render={({ field: { onChange, onBlur, value } }) => (<TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value || ''} editable={!isSubmitting} placeholder="CA" />)} />
                            </View>
                            <View style={[styles.inputGroup, styles.addressRowItem]}>
                                <Text style={styles.label}>Postal Code</Text>
                                <Controller control={control} name="address_postal_code" render={({ field: { onChange, onBlur, value } }) => (<TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value || ''} keyboardType="numeric" editable={!isSubmitting} placeholder="90210" />)} />
                            </View>
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Country</Text>
                            <Controller control={control} name="address_country" render={({ field: { onChange, onBlur, value } }) => (<TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value || ''} editable={!isSubmitting} placeholder="USA" />)} />
                        </View>

                        {/* Contact Inputs */}
                        <Text style={[styles.label, { marginTop: 10, marginBottom: 5, fontWeight: 'bold' }]}>Contact Info</Text>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number</Text>
                            <Controller control={control} name="phone_number" render={({ field: { onChange, onBlur, value } }) => (<TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value || ''} keyboardType="phone-pad" editable={!isSubmitting} placeholder="(555) 123-4567" />)} />
                            {errors.phone_number && <Text style={styles.errorText}>{errors.phone_number.message}</Text>}
                        </View>

                        {/* --- Business Photos Section (Edit Mode) --- */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { fontWeight: 'bold' }]}>Business Photos (Max {MAX_BUSINESS_PHOTOS})</Text>
                            <Pressable
                                style={[styles.button, styles.outlineButton, { marginBottom: 10 }, isSubmitting || allImageUris.length >= MAX_BUSINESS_PHOTOS ? styles.buttonDisabled : {}]}
                                onPress={pickImages}
                                disabled={isSubmitting || allImageUris.length >= MAX_BUSINESS_PHOTOS}
                            >
                                <Ionicons name="images-outline" size={18} color="#FF6347" style={{ marginRight: 8 }} />
                                <Text style={styles.outlineButtonText}>Select New Photos</Text>
                            </Pressable>

                            {/* Display Existing & New Image Thumbnails */}
                            {allImageUris.length > 0 ? (
                                <View style={styles.imageGrid}>
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
                            ) : (
                                 <Text style={styles.noPhotosText}>No photos added yet.</Text>
                            )}
                             {/* Optional validation message if photos are required */}
                             {/* {allImageUris.length === 0 && <Text style={styles.errorText}>Please add at least one photo.</Text>} */}
                        </View>

                    </View> {/* End content View */}

                     {/* --- Action Buttons --- */}
                    <View style={styles.footer}>
                        <View style={styles.buttonContainer}>
                           <Pressable
                                style={[styles.button, styles.outlineButton, styles.cancelButton, isSubmitting ? styles.buttonDisabled : {}]}
                                onPress={() => navigation.goBack()}
                                disabled={isSubmitting}>
                                <Text style={styles.outlineButtonText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.button, styles.buttonPrimary, styles.submitButton, isSubmitting ? styles.buttonDisabled : {}]}
                                onPress={handleSubmit(onSubmit)}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <ActivityIndicator color="#fff" style={{ marginRight: 8 }} /> : null}
                                <Text style={styles.buttonTextPrimary}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Text>
                            </Pressable>
                         </View>
                    </View>
                </View> {/* End card View */}
            </ScrollView>
            {/* Toast needs to be configured globally */}
            <Toast />
        </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// --- Styles (Combined from CreateBusiness and EditProfile) ---
// Note: Using styles similar to the refined CreateBusinessProfileScreen provided previously
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
    keyboardAvoidingView: { flex: 1 },
    scrollContainer: { flexGrow: 1, paddingBottom: 30, paddingHorizontal: 20, backgroundColor: '#f8f9fa', }, // Added paddingBottom
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
    card: { width: '100%', maxWidth: 500, backgroundColor: '#ffffff', borderRadius: 12, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2, }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, marginTop: 20, marginBottom: 20, alignSelf: 'center'}, // Added marginTop/alignSelf
    header: { alignItems: 'center', marginBottom: 24, },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#333', },
    description: { fontSize: 14, color: '#6c757d', textAlign: 'center', },
    content: { marginBottom: 24, },
    inputGroup: { marginBottom: 16, },
    label: { fontSize: 14, fontWeight: '500', color: '#495057', marginBottom: 6, },
    input: { borderWidth: 1, borderColor: '#ced4da', borderRadius: 8, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 10, fontSize: 16, backgroundColor: '#fff', },
    inputError: { borderColor: '#dc3545', },
    errorText: { fontSize: 12, color: '#dc3545', marginTop: 4, },
    textArea: { height: 100, textAlignVertical: 'top', },
    addressRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    addressRowItem: { flex: 1, },
    footer: { marginTop: 10, }, // Removed border from EditProfile
    buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, // Added gap for spacing
    button: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', flex: 1 }, // Added flex: 1
    buttonPrimary: { backgroundColor: '#FF6347', },
    submitButton: { /* Removed specific flex/margin */ },
    cancelButton: { borderColor: '#aaa', backgroundColor: '#fff'}, // Style for cancel button
    buttonDisabled: { opacity: 0.6, backgroundColor: '#cccccc' },
    buttonPrimaryPressed: { opacity: 0.85, },
    buttonTextPrimary: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', },
    outlineButton: {
        borderWidth: 1,
        borderColor: '#FF6347',
        backgroundColor: '#fff',
    },
    outlineButtonText: {
        color: '#FF6347',
        fontSize: 16,
        fontWeight: 'bold',
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
        gap: 8,
    },
    imageContainer: {
        width: '31%',
        aspectRatio: 1,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    removeImageButton: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 14,
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    removeImageIcon: {
        // Icon styles if needed
    },
     noPhotosText: {
        fontSize: 14,
        color: '#6c757d',
        textAlign: 'center',
        marginTop: 10,
     }
});

export default EditBusinessProfileScreen;