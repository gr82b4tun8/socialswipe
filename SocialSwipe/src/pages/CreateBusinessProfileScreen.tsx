// src/pages/CreateBusinessProfileScreen.tsx
import React, { useState } from 'react';
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
  Image, // <-- Import Image component
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker'; // <-- Import ImagePicker
import { supabase } from '../lib/supabaseClient'; // Adjust path if needed
import { useAuth } from '../contexts/AuthContext'; // To potentially refresh profile data

// Import Param List type
import { AuthStackParamList } from '../../App'; // Adjust path relative to App.tsx

// Define validation schema - REMOVED website and profile_picture
const businessProfileSchema = z.object({
  business_name: z.string().min(2, { message: "Business name is required (min 2 chars)." }),
  category: z.string().min(3, { message: "Category is required (min 3 chars)." }),
  description: z.string().optional(), // Optional
  address_street: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  address_postal_code: z.string().optional(),
  address_country: z.string().optional(),
  phone_number: z.string().optional(),
  // website field removed
  // profile_picture field removed
});

// Infer type from schema
type BusinessProfileFormData = z.infer<typeof businessProfileSchema>;

// Define navigation prop type
type CreateBusinessProfileNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'CreateBusinessProfile'
>;

const CreateBusinessProfileScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false); // Specific loading state for uploads
  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]); // State for selected image assets
  const navigation = useNavigation<CreateBusinessProfileNavigationProp>();
  const { refreshProfile } = useAuth(); // Get refresh function

  const form = useForm<BusinessProfileFormData>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: { // REMOVED website and profile_picture defaults
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
    mode: 'onTouched',
  });
  const { control, handleSubmit, formState: { errors } } = form;

  // --- Function to handle image selection ---
  const pickImages = async () => {
    // Request permissions if needed
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to allow access to your photos to upload business pictures.");
      return;
    }

    try {
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: true, // Allow multiple images
          quality: 0.8, // Reduce quality slightly for faster uploads
        });

        if (!result.canceled && result.assets) {
          // Append newly selected images to the existing selection
          // You might want to add a limit here, e.g., .slice(0, 10)
          setSelectedImages(prev => [...prev, ...result.assets]);
          console.log("Selected images:", result.assets.map(a => a.uri));
        }
    } catch (error) {
        console.error("Image picking error:", error);
        Alert.alert("Image Error", "Could not select images.");
    }
  };

  // --- Function to handle form submission (including image uploads) ---
  const onSubmit = async (formData: BusinessProfileFormData) => {
    setLoading(true);
    setIsUploadingImages(false); // Reset image upload status
    let uploadedImageUrls: string[] = []; // To store public URLs

    try {
      // 1. Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw userError || new Error("User not found.");
      }

      // --- 2. Upload Images (if any selected) ---
      if (selectedImages.length > 0) {
        setIsUploadingImages(true);
        console.log(`Starting upload for ${selectedImages.length} images...`);

        const uploadPromises = selectedImages.map(async (image) => {
          try {
            // Fetch the image data as Blob
            const response = await fetch(image.uri);
            const blob = await response.blob();

            // Create a unique file path in Supabase storage
            const fileExt = image.uri?.split('.').pop()?.toLowerCase() ?? 'jpg';
            const mimeType = image.mimeType ?? `image/${fileExt}`;
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${user.id}/business_photos/${fileName}`; // User-specific folder

            console.log(`Uploading ${fileName} to ${filePath} (Type: ${mimeType})`);

            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('profile_pictures') // <<< YOUR BUCKET NAME HERE
              .upload(filePath, blob, {
                contentType: mimeType,
                cacheControl: '3600', // Cache for 1 hour
                upsert: false, // Don't overwrite existing files (shouldn't happen with unique names)
              });

            if (uploadError) {
              // Throw detailed error for debugging
              console.error(`Upload Error for ${fileName}:`, uploadError);
              throw new Error(`Failed to upload image ${fileName}. ${uploadError.message}`);
            }

            if (uploadData?.path) {
              // Get public URL for the uploaded file
               const { data: urlData } = supabase.storage
                 .from('profile_pictures') // <<< YOUR BUCKET NAME HERE
                 .getPublicUrl(uploadData.path);
                console.log('Successfully uploaded:', urlData.publicUrl);
               return urlData.publicUrl;
            } else {
                 throw new Error(`Upload succeeded for ${fileName} but no path returned.`);
            }

          } catch (imgUploadError: any) {
            console.error('Error processing/uploading image:', image.uri, imgUploadError);
            // Allow Promise.all to continue, but return null for failed uploads
            return null;
          }
        });

        // Wait for all upload attempts
        const results = await Promise.all(uploadPromises);

        // Filter out any null results (failed uploads)
        uploadedImageUrls = results.filter((url): url is string => typeof url === 'string');

        if (uploadedImageUrls.length !== selectedImages.length) {
             console.warn("Some images failed to upload.");
             // Optionally alert the user about partial failure
             // Alert.alert("Upload Incomplete", "Some images could not be uploaded. Please try adding them again later.");
        }
        console.log('Final list of uploaded image URLs:', uploadedImageUrls);
        setIsUploadingImages(false); // Done uploading attempts
       }
      // --- End Image Upload ---


      // 3. Prepare data FOR UPSERT (match column names exactly)        // <<< *** MODIFIED SECTION START ***
      //    MUST include the user_id itself for upsert.
      const profileData = {
        user_id: user.id, // <<< Add user_id for upsert/conflict resolution
        business_name: formData.business_name,
        category: formData.category,
        description: formData.description || null, // Ensure empty strings become null if DB expects null
        address_street: formData.address_street || null,
        address_city: formData.address_city || null,
        address_state: formData.address_state || null,
        address_postal_code: formData.address_postal_code || null,
        address_country: formData.address_country || null,
        phone_number: formData.phone_number || null,
        profile_type: 'business', // <<< Explicitly set the profile type
        // Add the array of uploaded photo URLs (if any)
        // Assumes column 'business_photo_urls' is type text[] or jsonb
        ...(uploadedImageUrls.length > 0 && { profile_picture: uploadedImageUrls }),
        // Supabase handles created_at automatically if default is set.
        // updated_at is good practice for upserts.
        updated_at: new Date().toISOString(),
        // Add any other fields that need default values on creation here
      };

      // 4. UPSERT the profile row in Supabase
      //    This will INSERT if no row with user_id exists, or UPDATE if it does.
      console.log('Upserting profile with data:', profileData); // Log message changed
      const { error: upsertError } = await supabase // Variable name changed
        .from('profiles')
        .upsert(profileData, { // Method changed to upsert
          onConflict: 'user_id', // Specify conflict target
        });

      if (upsertError) { // Variable name changed
        console.error("Profile upsert error:", upsertError); // Log message & var name changed
         // Check for specific common errors like RLS violation
         if (upsertError.message.includes('violates row-level security policy')) {
             Alert.alert("Permission Denied", "You don't have permission to save this profile. Please check your Supabase Row Level Security policies.");
         } else if (upsertError.message.includes('constraint')) {
             Alert.alert("Database Error", "Could not save profile due to a database constraint. Please check your input.");
         }
         throw upsertError; // Re-throw the error
       }
      // <<< *** MODIFIED SECTION END ***

      // 5. Success
      Alert.alert("Profile Created!", "Your business profile has been saved.");
      await refreshProfile?.(); // Attempt to refresh profile data in AuthContext

      // Optional: Clear selected images after successful submission
      setSelectedImages([]);

      // Navigation handled by parent/context ideally

    } catch (error: any) {
      console.error('Create business profile error:', error); // Catch block remains the same
      Alert.alert("Error", error.message || "Failed to save business profile.");
    } finally {
      setLoading(false); // Turn off main loading indicator
      setIsUploadingImages(false); // Ensure upload indicator is off
    }
  };

  // Helper to remove an image before upload
  const removeSelectedImage = (indexToRemove: number) => {
     setSelectedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // --- JSX (Return statement and components below remain unchanged) ---
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingView}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Business Profile</Text>
            <Text style={styles.description}>Tell us about your business.</Text>
          </View>

          <View style={styles.content}>
            {/* Business Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Name *</Text>
              <Controller control={control} name="business_name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput style={[styles.input, errors.business_name ? styles.inputError : null]} onBlur={onBlur} onChangeText={onChange} value={value} editable={!loading} />
                )} />
              {errors.business_name && <Text style={styles.errorText}>{errors.business_name.message}</Text>}
            </View>

            {/* Category Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category *</Text>
              <Controller control={control} name="category"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput style={[styles.input, errors.category ? styles.inputError : null]} onBlur={onBlur} onChangeText={onChange} value={value} placeholder="e.g., Restaurant, Retail, Salon" editable={!loading} />
                )} />
              {errors.category && <Text style={styles.errorText}>{errors.category.message}</Text>}
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <Controller control={control} name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput style={[styles.input, styles.textArea, errors.description ? styles.inputError : null]} onBlur={onBlur} onChangeText={onChange} value={value} multiline numberOfLines={4} placeholder="What does your business offer?" editable={!loading} />
                )} />
              {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}
            </View>

             {/* Address Inputs (Existing) */}
             <Text style={[styles.label, {marginTop: 10, marginBottom: 5, fontWeight: 'bold'}]}>Business Address</Text>
             <View style={styles.inputGroup}>
               <Text style={styles.label}>Street</Text>
               <Controller control={control} name="address_street" render={({ field: { onChange, onBlur, value } }) => ( <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} editable={!loading} /> )} />
             </View>
             <View style={styles.inputGroup}>
               <Text style={styles.label}>City</Text>
               <Controller control={control} name="address_city" render={({ field: { onChange, onBlur, value } }) => ( <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} editable={!loading} /> )} />
             </View>
             <View style={styles.addressRow}>
               <View style={[styles.inputGroup, styles.addressRowItem]}>
                   <Text style={styles.label}>State</Text>
                   <Controller control={control} name="address_state" render={({ field: { onChange, onBlur, value } }) => ( <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} editable={!loading} /> )} />
               </View>
               <View style={[styles.inputGroup, styles.addressRowItem]}>
                   <Text style={styles.label}>Postal Code</Text>
                   <Controller control={control} name="address_postal_code" render={({ field: { onChange, onBlur, value } }) => ( <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} keyboardType="numeric" editable={!loading} /> )} />
               </View>
             </View>
             <View style={styles.inputGroup}>
               <Text style={styles.label}>Country</Text>
               <Controller control={control} name="address_country" render={({ field: { onChange, onBlur, value } }) => ( <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} editable={!loading} /> )} />
             </View>


             {/* Contact Inputs (Existing - minus Website) */}
             <Text style={[styles.label, {marginTop: 10, marginBottom: 5, fontWeight: 'bold'}]}>Contact Info</Text>
             <View style={styles.inputGroup}>
               <Text style={styles.label}>Phone Number</Text>
               <Controller control={control} name="phone_number" render={({ field: { onChange, onBlur, value } }) => ( <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} keyboardType="phone-pad" editable={!loading} /> )} />
               {errors.phone_number && <Text style={styles.errorText}>{errors.phone_number.message}</Text>}
             </View>

            {/* --- Website URL Input REMOVED --- */}
            {/* --- Logo URL Input REMOVED --- */}


             {/* --- Business Photos Uploader --- */}
             <View style={styles.inputGroup}>
                 <Text style={[styles.label, { fontWeight: 'bold' }]}>Business Photos</Text>
                 <Pressable
                     style={({pressed}) => [
                         styles.button,
                         styles.imagePickerButton,
                         (loading || isUploadingImages) && styles.buttonDisabled,
                         pressed && !(loading || isUploadingImages) && styles.imagePickerButtonPressed,
                     ]}
                     onPress={pickImages}
                     disabled={loading || isUploadingImages}>
                     <Text style={styles.imagePickerButtonText}>Select Photos...</Text>
                 </Pressable>

                 {/* Display Selected Image Thumbnails */}
                 {selectedImages.length > 0 && (
                     <View style={styles.thumbnailContainer}>
                         {selectedImages.map((image, index) => (
                             <View key={index} style={styles.thumbnailWrapper}>
                                  <Image source={{ uri: image.uri }} style={styles.thumbnail} />
                                  <Pressable
                                     style={styles.removeImageButton}
                                     onPress={() => removeSelectedImage(index)}
                                     disabled={loading || isUploadingImages}
                                   >
                                       <Text style={styles.removeImageButtonText}>×</Text>
                                   </Pressable>
                             </View>
                         ))}
                     </View>
                 )}
                 {/* Show indicator specifically during image upload */}
                 {isUploadingImages && (
                    <View style={styles.uploadingIndicator}>
                        <ActivityIndicator size="small" color="#FF6347"/>
                        <Text style={styles.uploadingText}>Uploading photos...</Text>
                    </View>
                 )}
             </View>


          </View> {/* End content View */}

          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.buttonPrimary,
                (loading || isUploadingImages) && styles.buttonDisabled, // Disable if general loading OR uploading images
                pressed && !(loading || isUploadingImages) && styles.buttonPrimaryPressed,
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading || isUploadingImages} // Disable if general loading OR uploading images
            >
              {loading ? (
                 // Show generic spinner if form submit is the main blocker
                 <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                 <Text style={styles.buttonTextPrimary}>Save Business Profile</Text>
              )}
            </Pressable>
          </View>
        </View> {/* End card View */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// --- Styles --- (Styles remain unchanged from previous version)
const styles = StyleSheet.create({
    // (Keep all existing styles from your original code)
    keyboardAvoidingView: { flex: 1, },
    scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20, backgroundColor: '#f8f9fa', },
    card: { width: '100%', maxWidth: 500, backgroundColor: '#ffffff', borderRadius: 12, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2, }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, marginBottom: 20, },
    header: { alignItems: 'center', marginBottom: 24, },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#333', },
    description: { fontSize: 14, color: '#6c757d', textAlign: 'center', },
    content: { marginBottom: 24, },
    inputGroup: { marginBottom: 16, },
    label: { fontSize: 14, fontWeight: '500', color: '#495057', marginBottom: 6, },
    input: { borderWidth: 1, borderColor: '#ced4da', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#fff', },
    inputError: { borderColor: '#dc3545', },
    errorText: { fontSize: 12, color: '#dc3545', marginTop: 4, },
    textArea: { height: 100, textAlignVertical: 'top', },
    addressRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, // Use gap for spacing
    addressRowItem: { flex: 1, }, // Removed marginHorizontal, rely on gap
    footer: { alignItems: 'center', marginTop: 10, },
    button: { width: '100%', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', },
    buttonPrimary: { backgroundColor: '#FF6347', }, // Theme color
    buttonDisabled: { opacity: 0.6, }, // More visible disabled state
    buttonPrimaryPressed: { opacity: 0.85, },
    buttonTextPrimary: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', },

    // --- NEW STYLES for Image Picker ---
    imagePickerButton: {
        backgroundColor: '#e9ecef', // Lighter background for secondary action
        borderColor: '#ced4da',
        borderWidth: 1,
        marginBottom: 10, // Space below button
    },
    imagePickerButtonPressed: {
        backgroundColor: '#dee2e6', // Darker shade when pressed
    },
    imagePickerButtonText: {
        color: '#495057', // Text color matching labels
        fontSize: 16,
        fontWeight: '500',
    },
    thumbnailContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
    },
    thumbnailWrapper: {
        position: 'relative', // Needed for absolute positioning of remove button
        margin: 5,
    },
    thumbnail: {
        width: 80,
        height: 80,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    removeImageButton: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeImageButtonText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
        lineHeight: 18, // Adjust for vertical centering
    },
    uploadingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        padding: 8,
        backgroundColor: '#f8f9fa',
        borderRadius: 6,
    },
    uploadingText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#495057',
    }
});

export default CreateBusinessProfileScreen;