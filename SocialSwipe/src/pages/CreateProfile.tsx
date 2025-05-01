// src/pages/CreateProfile.tsx (MODIFIED to use 'individual_profiles' table and remove refreshProfile)

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    StyleSheet,
    Pressable,
    ActivityIndicator,
    Image,
    Platform,
    Alert,
    SafeAreaView,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@/lib/supabaseClient'; // Adjust path if needed
import { v4 as uuidv4 } from 'uuid';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import Toast from 'react-native-toast-message';
import { format } from 'date-fns';

import { RootStackParamList } from '../../App'; // Adjust path as needed
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// --- REMOVED: Import useAuth ---
// import { useAuth } from '@/contexts/AuthContext'; // No longer needed here

// --- Validation Schema (Unchanged) ---
const profileSchema = z.object({
    firstName: z.string().min(1, { message: "First name is required." }),
    lastName: z.string().optional(),
    dob: z.string()
        .min(1, { message: "Date of birth is required." })
        .regex(/^\d{2}\/\d{2}\/\d{4}$/, { message: "Date must be in MM/DD/YYYY format." })
        .transform((dateStr, ctx) => {
            const [month, day, year] = dateStr.split('/').map(Number);
            if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid date format or components." });
                return z.NEVER;
            }
            const date = new Date(year, month - 1, day);
            if (isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid date (e.g., Feb 30th)." });
                return z.NEVER;
            }
            const eighteenYearsAgo = new Date();
            eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
            if (date.getTime() > eighteenYearsAgo.getTime()) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "You must be at least 18 years old." });
                return z.NEVER;
            }
            return date;
        }),
    gender: z.string().min(1, { message: "Please select a gender identity." }),
    bio: z.string().max(500, { message: "Bio must be 500 characters or less." }).optional(),
    location: z.string().optional(),
    lookingFor: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// --- Navigation Type (Unchanged) ---
type CreateProfileNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateProfile'>;

const CreateProfile: React.FC = () => {
    const navigation = useNavigation<CreateProfileNavigationProp>();
    const [loading, setLoading] = useState(true); // Loading for initial user check
    const [isSubmitting, setIsSubmitting] = useState(false); // Loading for form submission
    const [userId, setUserId] = useState<string | null>(null);
    const [interests, setInterests] = useState<string[]>([]);
    const [interestInput, setInterestInput] = useState('');
    const [profileImages, setProfileImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

    // --- REMOVED: Get refreshProfile from AuthContext ---
    // const { refreshProfile } = useAuth(); // No longer needed

    const form = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            dob: '',
            gender: '',
            bio: '',
            location: '',
            lookingFor: '',
        },
    });
    const { handleSubmit, control, formState: { errors }, reset, setValue } = form;

    // --- Safeguard Check (MODIFIED table name) ---
    const checkExistingProfile = useCallback(async (currentUserId: string) => {
        console.log("[checkExistingProfile] Starting check for user:", currentUserId);
        try {
            console.log("[checkExistingProfile] Before Supabase call to individual_profiles");
            const { data, error } = await supabase
                .from('individual_profiles') // <<<--- CHANGED TABLE NAME
                .select('user_id') // Select a minimal column just to check existence
                .eq('user_id', currentUserId)
                .maybeSingle(); // Returns null if no row found, data if found

            console.log("[checkExistingProfile] After Supabase call. Data:", data, "Error:", error);

            if (error && error.code !== 'PGRST116') { // Ignore "Row not found" error code
                console.error('[checkExistingProfile] Supabase query error:', error);
                throw error; // Rethrow other errors
            }

            console.log("[checkExistingProfile] Before 'if (data)' check. Data:", data);
            if (data) {
                // Profile row exists in individual_profiles
                console.warn('[checkExistingProfile] Individual profile found, redirecting.');
                Toast.show({ type: 'info', text1: 'Profile already exists', text2: 'Redirecting...' });
                // Navigate away if profile exists
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Main', params: { screen: 'ProfileTab' } }],
                });
                return true; // Indicate profile was found
            }

            console.log("[checkExistingProfile] No individual profile data found (data is null).");
            return false; // Indicate profile was not found
        } catch (err: any) {
            console.error('[checkExistingProfile] CATCH block:', err);
            Toast.show({ type: 'error', text1: 'Error checking profile', text2: err.message });
            return false; // Assume not found on error
        }
    }, [navigation]);

    // --- Fetch User ID & Check Profile (Unchanged logic, but checkExistingProfile now checks correct table) ---
    useEffect(() => {
        let isMounted = true;
        const fetchUser = async () => {
            setLoading(true); // Start loading indicator
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (!isMounted) return;
                if (error) throw error;

                if (user) {
                    console.log("[CreateProfile useEffect] User found:", user.id);
                    setUserId(user.id);
                    // Check if profile exists in the CORRECT table now
                    const profileFound = await checkExistingProfile(user.id);
                    if (isMounted && !profileFound) {
                        // Only stop loading if no profile was found (meaning user needs to create one)
                        console.log("[CreateProfile useEffect] Profile not found, setting loading=false");
                        setLoading(false);
                    } else if (isMounted && profileFound) {
                        // If profile found, navigation happens in checkExistingProfile, keep loading indicator
                        console.log("[CreateProfile useEffect] Profile found, redirect initiated by checkExistingProfile.");
                    }
                } else {
                    // No user session
                    if (!isMounted) return;
                    console.warn("[CreateProfile useEffect] No user found.");
                    Toast.show({ type: 'error', text1: 'Error', text2: 'No active session. Please log in.' });
                    setLoading(false);
                    // Optional: Navigate back to login?
                    // navigation.navigate('Login');
                }
            } catch (error: any) {
                if (!isMounted) return;
                console.error('[CreateProfile useEffect] Error fetching user:', error);
                Toast.show({ type: 'error', text1: 'Error', text2: 'Could not fetch user session.' });
                setLoading(false);
            }
            // Note: setLoading(false) is now primarily handled when profile is NOT found or on error/no user
        };
        fetchUser();
        return () => { isMounted = false; };
    }, [checkExistingProfile]); // Dependency remains the same


    // --- Image Picker Logic (Unchanged) ---
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions!');
            return;
        }
        if (profileImages.length >= 6) {
            Toast.show({ type: 'warning', text1: 'Limit Reached (Max 6 photos)' });
            return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsMultipleSelection: true,
            selectionLimit: 6 - profileImages.length,
        });
        if (!result.canceled && result.assets) {
            const newAssets = result.assets.filter(newAsset =>
                !profileImages.some(existingAsset => existingAsset.uri === newAsset.uri)
            );
            setProfileImages(prev => [...prev, ...newAssets].slice(0, 6));
        }
    };
    const removeImage = (uriToRemove: string) => {
        setProfileImages(prev => prev.filter(asset => asset.uri !== uriToRemove));
    };

    // --- Interest Handling (Unchanged) ---
    const addInterest = () => {
        const trimmedInput = interestInput.trim();
        if (trimmedInput && !interests.includes(trimmedInput) && interests.length < 10) {
            setInterests([...interests, trimmedInput]);
            setInterestInput('');
        } else if (interests.length >= 10) {
            Toast.show({ type: 'warning', text1: 'Max 10 interests allowed.' });
        }
    };
    const removeInterest = (interestToRemove: string) => {
        setInterests(interests.filter(interest => interest !== interestToRemove));
    };


    // --- Form Submission (MODIFIED table name and removed refreshProfile call) ---
    const onSubmit = async (values: ProfileFormData) => {
        if (!userId) {
            Toast.show({ type: 'error', text1: 'Cannot Submit', text2: 'User session error.' });
            return;
        }
        if (profileImages.length === 0) {
            Toast.show({ type: 'error', text1: 'Missing Photos', text2: 'Please upload at least one profile picture.' });
            return;
        }

        setIsSubmitting(true);
        let uploadedImagePaths: string[] = []; // Store paths instead of full URLs initially

        try {
            Toast.show({ type: 'info', text1: 'Uploading images...' });
            for (const imageAsset of profileImages) {
                const uri = imageAsset.uri;
                const response = await fetch(uri);
                const blob = await response.blob();
                const fileExt = uri.split('.').pop() ?? 'jpg';
                const fileName = `${uuidv4()}.${fileExt}`;
                // Store images under user-specific folder for organization
                const filePath = `${userId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('profile_pictures') // Bucket name
                    .upload(filePath, blob, { contentType: blob.type, upsert: false });

                if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

                // Store the path, not the public URL, in the database for better security/flexibility
                uploadedImagePaths.push(filePath);
            }
            Toast.show({ type: 'success', text1: 'Images uploaded!' });

            // Prepare data for the correct table
            const profileData = {
                user_id: userId, // Foreign key linking to auth.users.id
                first_name: values.firstName,
                last_name: values.lastName || null,
                date_of_birth: format(values.dob, 'yyyy-MM-dd'), // Format Date to 'YYYY-MM-DD' for DATE type
                gender: values.gender,
                bio: values.bio || null,
                interests: interests.length > 0 ? interests : null, // Store as text array
                location: values.location || null,
                looking_for: values.lookingFor || null, // Ensure column name matches DB
                profile_pictures: uploadedImagePaths.length > 0 ? uploadedImagePaths : null, // Store array of storage paths
                updated_at: new Date().toISOString(), // Set last updated time
                // username: ?? // Username was set during signup, fetch if needed or add here if required by schema
            };

            console.log("Attempting to save profile data to individual_profiles:", profileData);
            Toast.show({ type: 'info', text1: 'Saving profile...' });

            // Upsert into the correct table
            const { error: upsertError } = await supabase
                .from('individual_profiles') // <<<--- CHANGED TABLE NAME
                .upsert(profileData, { onConflict: 'user_id' }); // Assumes user_id is PK/unique constraint

            if (upsertError) {
                console.error("Upsert error details:", upsertError);
                throw upsertError;
            }

            // --- Profile saved successfully ---
            Toast.show({ type: 'success', text1: 'Profile Created!', text2: 'Your profile is ready.' });
            reset(); // Reset form fields
            setInterests([]);
            setProfileImages([]);

            // --- REMOVED: refreshProfile() call ---
            // No longer needed as ProfileScreen fetches its own data

            // --- Navigate AFTER successful save ---
            console.log("[CreateProfile onSubmit] Navigating to ProfileTab...");
            // Replace current screen with Main Tabs, focused on ProfileTab
            navigation.replace('Main', { screen: 'ProfileTab' });

        } catch (error: any) {
            console.error('Create Profile Error:', error);
            const zodError = error instanceof z.ZodError ? error.flatten().fieldErrors.dob?.[0] : null;
            Toast.show({
                type: 'error',
                text1: 'Error Creating Profile',
                text2: zodError || error.message || 'An unexpected error occurred.'
            });
        } finally {
            setIsSubmitting(false);
            console.log("[CreateProfile onSubmit] Submission process finished (finally block).");
        }
    };

    // --- Render Logic ---
    // Show loading indicator while checking for user/existing profile
    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF6347" />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }
    // If loading is done but no userId (error state)
    if (!userId) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <Text style={styles.errorText}>Error: Could not load user information. Please try logging in again.</Text>
                    {/* Optionally add a button to navigate back to login */}
                </View>
            </SafeAreaView>
        );
    }

    // --- Main Form Render (Unchanged JSX structure) ---
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <Text style={styles.header}>Create Your Personal Profile</Text>
                <Text style={styles.subHeader}>Fill in the details below to get started.</Text>

                {/* ----- Basic Info Section ----- */}
                <View style={styles.section}>
                   <Text style={styles.sectionTitle}>Basic Information</Text>
                   {/* First Name Input */}
                   <View style={styles.fieldGroup}>
                       <Text style={styles.label}>First Name*</Text>
                       <Controller control={control} name="firstName" render={({ field: { onChange, onBlur, value } }) => (
                           <TextInput style={[styles.input, errors.firstName && styles.inputError]} placeholder="Enter first name" onBlur={onBlur} onChangeText={onChange} value={value} accessibilityLabel="First Name Input" />
                       )} />
                       {errors.firstName && <Text style={styles.errorText}>{errors.firstName.message}</Text>}
                   </View>
                   {/* Last Name Input */}
                   <View style={styles.fieldGroup}>
                         <Text style={styles.label}>Last Name</Text>
                         <Controller control={control} name="lastName" render={({ field: { onChange, onBlur, value } }) => (
                             <TextInput style={styles.input} placeholder="Optional" onBlur={onBlur} onChangeText={onChange} value={value || ''} accessibilityLabel="Last Name Input" />
                         )} />
                   </View>
                   {/* DOB Input */}
                   <View style={styles.fieldGroup}>
                         <Text style={styles.label}>Date of Birth*</Text>
                         <Controller control={control} name="dob" render={({ field: { onChange, onBlur, value } }) => (
                             <TextInput style={[styles.input, errors.dob && styles.inputError]} placeholder="MM/DD/YYYY" onBlur={onBlur} onChangeText={onChange} value={value as string} maxLength={10} accessibilityLabel="Date of Birth Input MM/DD/YYYY" />
                         )} />
                         {errors.dob && <Text style={styles.errorText}>{errors.dob.message}</Text>}
                   </View>
                   {/* Gender Input */}
                   <View style={styles.fieldGroup}>
                         <Text style={styles.label}>Gender*</Text>
                         <View style={[styles.pickerContainer, errors.gender && styles.inputError]}>
                             <Controller control={control} name="gender" render={({ field: { onChange, value } }) => (
                                 <Picker selectedValue={value} onValueChange={onChange} style={styles.picker} mode="dropdown">
                                     <Picker.Item label="Select your gender identity" value="" enabled={false} style={styles.pickerPlaceholder} />
                                     <Picker.Item label="Woman" value="Woman" />
                                     <Picker.Item label="Man" value="Man" />
                                     <Picker.Item label="Non-binary" value="Non-binary" />
                                     <Picker.Item label="Other" value="Other" />
                                     <Picker.Item label="Prefer not to say" value="Prefer not to say" />
                                 </Picker>
                             )} />
                         </View>
                         {errors.gender && <Text style={styles.errorText}>{errors.gender.message}</Text>}
                   </View>
                </View>

                {/* ----- About Section ----- */}
                 <View style={styles.section}>
                   <Text style={styles.sectionTitle}>About You</Text>
                   {/* Bio Input */}
                    <View style={styles.fieldGroup}>
                       <Text style={styles.label}>Bio</Text>
                       <Controller control={control} name="bio" render={({ field: { onChange, onBlur, value } }) => (
                          <TextInput style={[styles.input, styles.textArea, errors.bio && styles.inputError]} placeholder="Tell us something interesting... (max 500 chars)" onBlur={onBlur} onChangeText={onChange} value={value || ''} multiline maxLength={500} accessibilityLabel="Bio Input" />
                       )} />
                      {errors.bio && <Text style={styles.errorText}>{errors.bio.message}</Text>}
                    </View>
                    {/* Interests Input */}
                    <View style={styles.fieldGroup}>
                       <Text style={styles.label}>Interests (up to 10)</Text>
                        <View style={styles.interestInputContainer}>
                            <TextInput style={styles.interestInput} placeholder="Add an interest (e.g., Hiking)" value={interestInput} onChangeText={setInterestInput} onSubmitEditing={addInterest} />
                           <Pressable style={[styles.addButton, (!interestInput.trim() || interests.length >= 10) && styles.disabledButton]} onPress={addInterest} disabled={!interestInput.trim() || interests.length >= 10}>
                                <Text style={styles.addButtonText}>Add</Text>
                            </Pressable>
                        </View>
                       <View style={styles.badgeContainer}>
                           {interests.map(interest => (
                               <View key={interest} style={styles.badge}>
                                   <Text style={styles.badgeText}>{interest}</Text>
                                   <Pressable onPress={() => removeInterest(interest)} style={styles.removeBadgeButton}>
                                       <Text style={styles.removeBadgeText}>✕</Text>
                                   </Pressable>
                               </View>
                           ))}
                        </View>
                    </View>
                 </View>

                 {/* ----- Preferences Section ----- */}
                  <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Preferences</Text>
                        {/* Location Input */}
                        <View style={styles.fieldGroup}>
                              <Text style={styles.label}>Location</Text>
                             <Controller control={control} name="location" render={({ field: { onChange, onBlur, value } }) => (
                                  <TextInput style={styles.input} placeholder="e.g., Miami, FL (Optional)" onBlur={onBlur} onChangeText={onChange} value={value || ''} accessibilityLabel="Location Input" />
                              )} />
                         </View>
                         {/* Looking For Input */}
                         <View style={styles.fieldGroup}>
                               <Text style={styles.label}>Looking For</Text>
                               <View style={styles.pickerContainer}>
                                   <Controller control={control} name="lookingFor" render={({ field: { onChange, value } }) => (
                                       <Picker selectedValue={value} onValueChange={onChange} style={styles.picker} mode="dropdown">
                                           <Picker.Item label="Select what you're looking for (Optional)" value="" enabled={false} style={styles.pickerPlaceholder} />
                                           <Picker.Item label="Relationship" value="Relationship" />
                                           <Picker.Item label="Something Casual" value="Something Casual" />
                                           <Picker.Item label="Friendship" value="Friendship" />
                                           <Picker.Item label="Don't know yet" value="Don't know yet" />
                                       </Picker>
                                   )} />
                               </View>
                         </View>
                  </View>

                  {/* ----- Photos Section ----- */}
                   <View style={styles.section}>
                         <Text style={styles.sectionTitle}>Profile Pictures*</Text>
                         <Text style={styles.label}>Upload 1-6 photos (First is main photo)</Text>
                        <Pressable style={styles.uploadButton} onPress={pickImage} disabled={profileImages.length >= 6}>
                             <Text style={styles.uploadButtonText}>Select Images</Text>
                         </Pressable>
                        <View style={styles.imagePreviewContainer}>
                            {profileImages.map((asset) => (
                                <View key={asset.uri} style={styles.imagePreviewWrapper}>
                                    <Image source={{ uri: asset.uri }} style={styles.imagePreview} />
                                    <Pressable onPress={() => removeImage(asset.uri)} style={styles.removeImageButton}>
                                        <Text style={styles.removeImageText}>✕</Text>
                                    </Pressable>
                                </View>
                            ))}
                         </View>
                   </View>

                {/* ----- Submit Button ----- */}
                <Pressable
                    style={[styles.submitButton, (isSubmitting || profileImages.length === 0) && styles.disabledButton]}
                    onPress={handleSubmit(onSubmit)}
                    disabled={isSubmitting || profileImages.length === 0}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color="#fff" style={styles.activityIndicator} />
                    ) : null}
                    <Text style={styles.submitButtonText}>
                        {isSubmitting ? 'Saving Profile...' : 'Create Profile'}
                    </Text>
                </Pressable>

            </ScrollView>
        </SafeAreaView>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    // ... (Paste all styles from previous version here) ...
    safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
    scrollView: { flex: 1 },
    container: { padding: 20, paddingBottom: 60 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' },
    loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
    header: { fontSize: 26, fontWeight: 'bold', marginBottom: 8, textAlign: 'center', color: '#333' },
    subHeader: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 30 },
    section: { backgroundColor: '#ffffff', borderRadius: 12, padding: 20, marginBottom: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 5, elevation: 3 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 20, color: '#FF6347' },
    fieldGroup: { marginBottom: 18 },
    label: { fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#495057' },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ced4da', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, color: '#333', minHeight: 48 },
    inputError: { borderColor: '#dc3545' },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    pickerContainer: { borderWidth: 1, borderColor: '#ced4da', borderRadius: 8, backgroundColor: '#fff', justifyContent: 'center', minHeight: 48 },
    picker: { width: '100%', color: '#333', backgroundColor: 'transparent' },
    pickerPlaceholder: { color: '#999' },
    errorText: { color: '#dc3545', fontSize: 13, marginTop: 6 },
    interestInputContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    interestInput: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ced4da', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, minHeight: 48 },
    addButton: { backgroundColor: '#FF6347', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center', minHeight: 48 },
    addButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    disabledButton: { opacity: 0.5 },
    badgeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e9ecef', borderRadius: 15, paddingVertical: 6, paddingHorizontal: 12 },
    badgeText: { fontSize: 14, color: '#495057', marginRight: 6 },
    removeBadgeButton: { padding: 3, marginLeft: 'auto' },
    removeBadgeText: { fontSize: 14, color: '#6c757d', fontWeight: 'bold', lineHeight: 14 },
    uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#007AFF', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 8, marginTop: 10, marginBottom: 15, minHeight: 48 },
    uploadButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    imagePreviewContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 15 },
    imagePreviewWrapper: { position: 'relative', width: 100, height: 100 },
    imagePreview: { width: '100%', height: '100%', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0' },
    removeImageButton: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 4, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
    removeImageText: { fontSize: 14, color: '#fff', fontWeight: 'bold', lineHeight: 14 },
    submitButton: { flexDirection: 'row', backgroundColor: '#FF6347', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 30, minHeight: 50 },
    submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
    activityIndicator: { marginRight: 10 },
});

export default CreateProfile;
