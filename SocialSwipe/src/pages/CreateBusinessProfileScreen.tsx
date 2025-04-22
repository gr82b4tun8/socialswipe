// src/pages/CreateBusinessProfileScreen.tsx
// MODIFIED TO INSERT INTO 'business_listings' TABLE

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
  Image,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
// Removed refreshProfile import if it specifically refreshed the single 'profiles' record in context
// You might need a different way to refresh the *list* of businesses later.
import Toast from 'react-native-toast-message'; // Using Toast for feedback
import { v4 as uuidv4 } from 'uuid'; // Import uuid for unique filenames
import 'react-native-get-random-values'; // Import polyfill
import { Ionicons } from '@expo/vector-icons'

// Import Param List type (ensure it includes navigation targets)
import { RootStackParamList } from '../../App'; // Use RootStackParamList or appropriate

// Define validation schema - Stays the same for form fields
const businessProfileSchema = z.object({
  business_name: z.string().min(2, { message: "Business name is required (min 2 chars)." }),
  category: z.string().min(3, { message: "Category is required (min 3 chars)." }),
  description: z.string().max(1000, { message: "Description max 1000 chars." }).optional(),
  address_street: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  address_postal_code: z.string().optional(),
  address_country: z.string().optional(),
  phone_number: z.string().optional(),
});

// Infer type from schema
type BusinessProfileFormData = z.infer<typeof businessProfileSchema>;

// Define navigation prop type using RootStackParamList
type CreateBusinessProfileNavigationProp = NativeStackNavigationProp<
  RootStackParamList, // Use the main param list
  'CreateBusinessProfile' // Name of this route
>;

const CreateBusinessProfileScreen: React.FC = () => {
  // State variables remain largely the same
  const [isSubmitting, setIsSubmitting] = useState(false); // Renamed loading
  // Removed isUploadingImages state, use isSubmitting
  const [selectedImageAssets, setSelectedImageAssets] = useState<ImagePicker.ImagePickerAsset[]>([]); // Use Asset type
  const navigation = useNavigation<CreateBusinessProfileNavigationProp>();
  const { user } = useAuth(); // Get user directly

  const form = useForm<BusinessProfileFormData>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
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

  // --- Function to handle image selection (Using refined version) ---
   const MAX_BUSINESS_PHOTOS = 6; // Define limit here or import from constants
   const pickImages = async () => {
     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
     if (status !== 'granted') {
       Alert.alert('Permission required', 'Sorry, we need camera roll permissions!');
       return;
     }

     const currentTotal = selectedImageAssets.length;
     if (currentTotal >= MAX_BUSINESS_PHOTOS) {
       Toast.show({ type: 'info', text1: 'Limit Reached', text2: `Max ${MAX_BUSINESS_PHOTOS} photos allowed.` });
       return;
     }

     try {
       let result = await ImagePicker.launchImageLibraryAsync({
         mediaTypes: ImagePicker.MediaTypeOptions.Images,
         allowsMultipleSelection: true,
         quality: 0.8,
         selectionLimit: MAX_BUSINESS_PHOTOS - currentTotal,
       });

       if (!result.canceled && result.assets) {
         const combined = [...selectedImageAssets, ...result.assets];
         const limitedAssets = combined.slice(0, MAX_BUSINESS_PHOTOS);
         if (combined.length > limitedAssets.length) {
           Toast.show({ type: 'info', text1: 'Limit Exceeded', text2: `Selected images exceed the limit of ${MAX_BUSINESS_PHOTOS}.` });
         }
         setSelectedImageAssets(limitedAssets);
         console.log(`[CreateBusinessListing] Added ${result.assets.length} new image assets. Total: ${limitedAssets.length}`);
       } else {
         console.log("[CreateBusinessListing] Image picking cancelled or no assets selected.");
       }
     } catch (pickerError) {
       console.error("[CreateBusinessListing] Error launching image picker:", pickerError);
       Toast.show({ type: 'error', text1: 'Image Picker Error', text2: 'Could not open image library.' });
     }
   };


   // --- Function to remove an image ---
   const removeSelectedImage = (uriToRemove: string) => {
       setSelectedImageAssets(prev => prev.filter(asset => asset.uri !== uriToRemove));
       console.log(`[CreateBusinessListing] Removed new image asset: ${uriToRemove}`);
   };

  // --- Function to handle form submission (MODIFIED FOR business_listings TABLE) ---
  const onSubmit = async (formData: BusinessProfileFormData) => {
    // 1. Get the current user (ensure user is available)
    if (!user) {
      Toast.show({ type: 'error', text1: 'Authentication Error', text2: "User not found. Please log in again." });
      return; // Early return if no user
    }

    setIsSubmitting(true); // Use isSubmitting state
    let uploadedImageUrls: string[] = [];

    try {
      // --- 2. Upload Images (Using ArrayBuffer Method) ---
      if (selectedImageAssets.length > 0) {
        Toast.show({ type: 'info', text1: "Uploading images..." });
        console.log(`[CreateBusinessListing] Attempting to upload ${selectedImageAssets.length} images.`);

        for (const asset of selectedImageAssets) {
            const uri = asset.uri;
            console.log(`[CreateBusinessListing] Processing asset URI: ${uri}`);
            const response = await fetch(uri);
             if (!response.ok) throw new Error(`Failed to fetch image URI (${response.status}): ${uri}`);

             const arrayBuffer = await response.arrayBuffer();
             if (arrayBuffer.byteLength === 0) throw new Error("Cannot upload empty image file.");

             const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
             const fileExt = asset.fileName?.split('.').pop()?.toLowerCase() ?? uri.split('.').pop()?.toLowerCase() ?? 'jpg';
             const betterFileExt = contentType.split('/')[1]?.split('+')[0] ?? fileExt;
             const fileName = `${uuidv4()}.${betterFileExt}`;
             // Consider a path structure including listing ID later, for now user ID is fine for upload step
             const filePath = `${user.id}/business_listings/${fileName}`; // Changed subfolder name

             console.log(`[CreateBusinessListing] Uploading to: ${filePath}, Type: ${contentType}`);
             // *** Ensure BUCKET NAME is correct ***
             const { error: uploadError } = await supabase.storage
                 .from('profile_pictures') // <<< YOUR BUCKET NAME HERE
                 .upload(filePath, arrayBuffer, { contentType: contentType, upsert: false });

             if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

             // *** Ensure BUCKET NAME is correct ***
             const { data: urlData } = supabase.storage.from('profile_pictures').getPublicUrl(filePath);
             if (!urlData?.publicUrl) throw new Error("Failed to get public URL after upload.");

             uploadedImageUrls.push(urlData.publicUrl);
             console.log("[CreateBusinessListing] Uploaded and got URL:", urlData.publicUrl);
        } // End for loop

        Toast.show({ type: 'success', text1: "Images uploaded!" });

      } else {
        console.log("[CreateBusinessListing] No images selected to upload.");
      }
      // --- End Image Upload ---

      // --- 3. Prepare data for INSERT into 'business_listings' ---
      // *** THIS IS THE KEY CHANGE ***
      const listingData = {
        manager_user_id: user.id, // Link to the logged-in user
        business_name: formData.business_name,
        category: formData.category,
        description: formData.description || null,
        address_street: formData.address_street || null,
        address_city: formData.address_city || null,
        address_state: formData.address_state || null,
        address_postal_code: formData.address_postal_code || null,
        address_country: formData.address_country || null,
        phone_number: formData.phone_number || null,
        listing_photos: uploadedImageUrls, // Save photos to the new column
        // 'created_at', 'updated_at', 'status' will use DB defaults
      };

      // --- 4. INSERT the new listing row into Supabase ---
      // *** THIS IS THE KEY CHANGE ***
      Toast.show({ type: 'info', text1: "Saving listing..." });
      console.log('[CreateBusinessListing] Inserting listing with data:', listingData);
      const { data: newListing, error: insertError } = await supabase
        .from('business_listings') // <<< TARGET NEW TABLE
        .insert(listingData)       // <<< USE INSERT
        .select()                  // <<< Optionally get the new row back
        .single();                 // <<< Expect only one row inserted

      if (insertError) {
        console.error("[CreateBusinessListing] Listing insert error:", insertError);
        if (insertError.message.includes('violates row-level security policy')) {
             throw new Error("Permission Denied: Could not create listing.");
        } else if (insertError.message.includes('constraint')) {
             throw new Error("Database Error: Could not save listing due to data conflict.");
        }
        throw insertError; // Re-throw generic error
      }

      console.log("[CreateBusinessListing] Listing created successfully:", newListing);

      // --- 5. Success ---
      Toast.show({ type: 'success', text1: 'Business Listing Created!', text2: 'Your new business listing has been saved.' });
      setSelectedImageAssets([]); // Clear selected images on success

      // Navigate back to the previous screen (likely the Profile screen)
      // Or navigate to a new "My Listings" screen if you have one
      navigation.goBack();
      // Example: navigation.navigate('MyListingsScreen'); // If you create this screen

      // Consider if/how you need to refresh data on the previous screen
      // `refreshProfile` might not be relevant if it only fetches the `profiles` table.
      // You might need a new context function or refetch on the listings screen.

    } catch (error: any) {
      console.error('[CreateBusinessListing] Submit Error:', error);
      Toast.show({ type: 'error', text1: 'Save Failed', text2: error.message || 'Failed to save business listing.' });
    } finally {
      setIsSubmitting(false); // Turn off submitting indicator
    }
  };

  // --- JSX (Return statement and components below remain mostly unchanged) ---
  // Minor changes: Title/Description text, button text
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingView}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.header}>
            {/* Updated Title */}
            <Text style={styles.title}>Create New Business Listing</Text>
            <Text style={styles.description}>Enter the details for this specific business.</Text>
          </View>

          <View style={styles.content}>
            {/* Business Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Name *</Text>
              <Controller control={control} name="business_name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput style={[styles.input, errors.business_name ? styles.inputError : null]} onBlur={onBlur} onChangeText={onChange} value={value} editable={!isSubmitting} />
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
                  <TextInput style={[styles.input, styles.textArea, errors.description ? styles.inputError : null]} onBlur={onBlur} onChangeText={onChange} value={value || ''} multiline numberOfLines={4} placeholder="What does this business offer?" editable={!isSubmitting} maxLength={1000}/>
                )} />
              {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}
            </View>

            {/* Address Inputs */}
            <Text style={[styles.label, {marginTop: 10, marginBottom: 5, fontWeight: 'bold'}]}>Business Address</Text>
            <View style={styles.inputGroup}>
             <Text style={styles.label}>Street</Text>
             <Controller control={control} name="address_street" render={({ field: { onChange, onBlur, value } }) => ( <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value || ''} editable={!isSubmitting}/> )} />
            </View>
             <View style={styles.inputGroup}>
               <Text style={styles.label}>City</Text>
               <Controller control={control} name="address_city" render={({ field: { onChange, onBlur, value } }) => ( <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value || ''} editable={!isSubmitting}/> )} />
            </View>
            <View style={styles.addressRow}>
               <View style={[styles.inputGroup, styles.addressRowItem]}>
                   <Text style={styles.label}>State</Text>
                   <Controller control={control} name="address_state" render={({ field: { onChange, onBlur, value } }) => ( <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value || ''} editable={!isSubmitting}/> )} />
               </View>
               <View style={[styles.inputGroup, styles.addressRowItem]}>
                   <Text style={styles.label}>Postal Code</Text>
                   <Controller control={control} name="address_postal_code" render={({ field: { onChange, onBlur, value } }) => ( <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value || ''} keyboardType="numeric" editable={!isSubmitting}/> )} />
               </View>
            </View>
            <View style={styles.inputGroup}>
               <Text style={styles.label}>Country</Text>
               <Controller control={control} name="address_country" render={({ field: { onChange, onBlur, value } }) => ( <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value || ''} editable={!isSubmitting}/> )} />
            </View>

             {/* Contact Inputs */}
             <Text style={[styles.label, {marginTop: 10, marginBottom: 5, fontWeight: 'bold'}]}>Contact Info</Text>
             <View style={styles.inputGroup}>
               <Text style={styles.label}>Phone Number</Text>
               <Controller control={control} name="phone_number" render={({ field: { onChange, onBlur, value } }) => ( <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value || ''} keyboardType="phone-pad" editable={!isSubmitting}/> )} />
               {errors.phone_number && <Text style={styles.errorText}>{errors.phone_number.message}</Text>}
            </View>

            {/* --- Business Photos Uploader --- */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { fontWeight: 'bold' }]}>Listing Photos (Max {MAX_BUSINESS_PHOTOS})</Text>
                <Pressable
                    style={[styles.button, styles.outlineButton, { marginBottom: 10 }, isSubmitting || selectedImageAssets.length >= MAX_BUSINESS_PHOTOS ? styles.buttonDisabled : {}]}
                    onPress={pickImages}
                    disabled={isSubmitting || selectedImageAssets.length >= MAX_BUSINESS_PHOTOS} >
                     {/* Reusing styles from EditBusinessProfile for consistency */}
                     <Ionicons name="images-outline" size={18} color="#FF6347" style={{ marginRight: 8 }} />
                     <Text style={styles.outlineButtonText}>Select Photos</Text>
                </Pressable>

                {/* Display Selected Image Thumbnails */}
                {selectedImageAssets.length > 0 && (
                     <View style={styles.imageGrid}>
                         {selectedImageAssets.map((asset) => (
                             <View key={asset.uri} style={styles.imageContainer}>
                                 <Image source={{ uri: asset.uri }} style={styles.imagePreview} />
                                 <Pressable
                                     style={styles.removeImageButton}
                                     onPress={() => removeSelectedImage(asset.uri)} // Use URI to remove
                                     disabled={isSubmitting} >
                                     <Ionicons name="close-circle" size={28} color="#fff" />
                                 </Pressable>
                             </View>
                         ))}
                     </View>
                 )}
            </View>


          </View> {/* End content View */}

          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.buttonPrimary,
                isSubmitting && styles.buttonDisabled, // Use isSubmitting
                pressed && !isSubmitting && styles.buttonPrimaryPressed,
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting} // Use isSubmitting
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8}} />
                  <Text style={styles.buttonTextPrimary}>Saving...</Text>
                </>
              ) : (
                // Updated Button Text
                <Text style={styles.buttonTextPrimary}>Create Business Listing</Text>
              )}
            </Pressable>
          </View>
        </View> {/* End card View */}
      </ScrollView>
       {/* Add Toast component globally in App.tsx */}
       <Toast />
    </KeyboardAvoidingView>
  );
};

// --- Styles --- (Combined styles from previous examples for consistency)
const styles = StyleSheet.create({
  keyboardAvoidingView: { flex: 1, },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20, backgroundColor: '#f8f9fa', },
  card: { width: '100%', maxWidth: 500, backgroundColor: '#ffffff', borderRadius: 12, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2, }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, marginBottom: 20, },
  header: { alignItems: 'center', marginBottom: 24, },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#333', textAlign: 'center' }, // Centered title
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
  footer: { alignItems: 'center', marginTop: 10, },
  button: { width: '100%', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  buttonPrimary: { backgroundColor: '#FF6347', },
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
   // --- Styles for Image Picker & Grid ---
   imageGrid: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     marginTop: 10,
     gap: 8,
   },
   imageContainer: {
     width: '31%', // Adjust for gap
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
   // Removed old thumbnail styles
});

export default CreateBusinessProfileScreen;