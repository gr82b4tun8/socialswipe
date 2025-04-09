import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    StyleSheet,
    Pressable, // Use Pressable for better customization
    ActivityIndicator,
    Image,
    Platform, // For Platform specific checks if needed
    Alert, // For simple alerts or confirmations
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigation } from '@react-navigation/native'; // <-- Use React Navigation hook
import { supabase } from '@/lib/supabaseClient'; // Assuming this path is correct
import { v4 as uuidv4 } from 'uuid';
import * as ImagePicker from 'expo-image-picker'; // <-- Use Expo Image Picker
import DateTimePickerModal from 'react-native-modal-datetime-picker'; // <-- Date Picker
import { Picker } from '@react-native-picker/picker'; // <-- Basic Picker
import Toast from 'react-native-toast-message'; // <-- Toast Messages
import { Loader2, Calendar as CalendarIcon, X, Camera, Trash2 } from 'lucide-react-native'; // <-- Use RN version
import { format } from 'date-fns';

// --- Validation Schema (Mostly Unchanged) ---
const profileSchema = z.object({
    firstName: z.string().min(1, { message: "First name is required." }),
    lastName: z.string().optional(),
    dob: z.date({ required_error: "Date of birth is required." }).refine(
        (date) => {
            const eighteenYearsAgo = new Date();
            eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
            return date <= eighteenYearsAgo;
        }, { message: "You must be at least 18 years old." }
    ),
    gender: z.string().min(1, { message: "Please select a gender identity." }),
    bio: z.string().max(500, { message: "Bio must be 500 characters or less." }).optional(),
    location: z.string().optional(),
    lookingFor: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Define navigation prop type if needed (replace 'any' with your actual stack param list)
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// type CreateProfileNavigationProp = NativeStackNavigationProp<YourRootStackParamList, 'CreateProfile'>;

const CreateProfile: React.FC = () => {
    // const navigation = useNavigation<CreateProfileNavigationProp>(); // Typed navigation
    const navigation = useNavigation<any>(); // Use 'any' for simplicity here
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // State for non-form managed data
    const [interests, setInterests] = useState<string[]>([]);
    const [interestInput, setInterestInput] = useState('');
    // Store ImagePicker results (contain URI and other info)
    const [profileImages, setProfileImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

    // State for date picker visibility
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

    const form = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            dob: undefined,
            gender: '',
            bio: '',
            location: '',
            lookingFor: '',
        },
    });
    const { handleSubmit, control, formState: { errors }, reset, setValue } = form; // Add setValue

    // --- Safeguard Check --- (Adapted for React Native Navigation)
    const checkExistingProfile = useCallback(async (currentUserId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', currentUserId)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                console.warn('CreateProfile Safeguard: Profile already exists, redirecting.');
                Toast.show({ type: 'info', text1: 'Profile already exists', text2: 'Redirecting...' });
                // Navigate to profile screen, replace ensures user can't go back here
                navigation.replace('Profile'); // <-- ADJUST 'Profile' to your actual profile route name
                return true;
            }
            return false;
        } catch (error: any) {
            console.error('Error checking for existing profile:', error);
            Toast.show({ type: 'error', text1: 'Error checking profile', text2: error.message });
            return false;
        }
    }, [navigation]);

    // --- Fetch User ID & Check Profile --- (Adapted for React Native Navigation)
    useEffect(() => {
        let isMounted = true;
        const fetchUser = async () => {
            setLoading(true);
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (!isMounted) return;
                if (error) throw error;

                if (user) {
                    setUserId(user.id);
                    const profileFound = await checkExistingProfile(user.id);
                     if (!isMounted || profileFound) return;
                } else {
                    Toast.show({ type: 'error', text1: 'Error', text2: 'No user found. Please log in.' });
                    navigation.replace('Login'); // <-- ADJUST 'Login' to your actual login route name
                }
            } catch (error: any) {
                if (!isMounted) return;
                console.error('Error fetching user:', error);
                Toast.show({ type: 'error', text1: 'Error', text2: 'Could not fetch user session.' });
                navigation.replace('Login'); // <-- ADJUST 'Login' to your actual login route name
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        fetchUser();
        return () => { isMounted = false; };
    }, [navigation, checkExistingProfile]);

    // --- Image Picker Logic ---
    const pickImage = async () => {
        // Request permissions first
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        if (profileImages.length >= 6) {
             Toast.show({ type: 'warning', text1: 'Limit Reached', text2: 'You can upload a maximum of 6 photos.' });
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false, // Or true if you want cropping etc.
            // aspect: [4, 3], // Optional aspect ratio for editing
            quality: 0.8, // Lower quality for faster uploads (0 to 1)
            allowsMultipleSelection: true, // Allow selecting multiple
            selectionLimit: 6 - profileImages.length, // Limit based on current count
        });

        if (!result.canceled && result.assets) {
             // Filter out any potential duplicates by URI before adding
            const newAssets = result.assets.filter(newAsset =>
                !profileImages.some(existingAsset => existingAsset.uri === newAsset.uri)
            );
             setProfileImages(prev => [...prev, ...newAssets].slice(0, 6)); // Ensure max 6
        }
    };

    const removeImage = (uriToRemove: string) => {
        setProfileImages(prev => prev.filter(asset => asset.uri !== uriToRemove));
    };

    // --- Interest Handling (Unchanged Logic) ---
    const addInterest = () => {
        const trimmedInput = interestInput.trim();
        if (trimmedInput && !interests.includes(trimmedInput) && interests.length < 10) {
            setInterests([...interests, trimmedInput]);
            setInterestInput('');
        } else if (interests.length >= 10) {
             Toast.show({ type: 'warning', text1: 'Limit Reached', text2: 'You can add max 10 interests.' });
        }
    };

    const removeInterest = (interestToRemove: string) => {
        setInterests(interests.filter(interest => interest !== interestToRemove));
    };

    // --- Date Picker Handling ---
    const showDatePicker = () => setDatePickerVisibility(true);
    const hideDatePicker = () => setDatePickerVisibility(false);
    const handleConfirmDate = (date: Date) => {
        setValue('dob', date, { shouldValidate: true }); // Set value in react-hook-form
        hideDatePicker();
    };

    // --- Form Submission ---
    const onSubmit = async (values: ProfileFormData) => {
        if (!userId) {
             Toast.show({ type: 'error', text1: 'Error', text2: 'User session not found.' });
            return;
        }
        if (profileImages.length === 0) {
             Toast.show({ type: 'error', text1: 'Missing Photos', text2: 'Please upload at least one profile picture.' });
            return;
        }

        setIsSubmitting(true);
        let uploadedImageUrls: string[] = [];

        try {
            Toast.show({ type: 'info', text1: 'Uploading images...' });

            for (const imageAsset of profileImages) {
                const uri = imageAsset.uri;
                 // Fetch the image data as a blob
                const response = await fetch(uri);
                const blob = await response.blob();

                // Create a File-like object needed for Supabase (if necessary, often Blob works)
                // Supabase might infer content type from blob, or you can specify
                // const file = new File([blob], `photo_${uuidv4()}.jpg`, { type: blob.type }); // File API might not exist in RN

                const fileExt = uri.split('.').pop() ?? 'jpg'; // Basic extension extraction
                const fileName = `${uuidv4()}.${fileExt}`;
                const filePath = `${userId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('profile_pictures') // Ensure this bucket exists and has policies set
                    .upload(filePath, blob, { // Upload the blob directly
                        contentType: blob.type, // Pass content type
                        upsert: false,
                    });

                if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

                const { data: urlData } = supabase.storage.from('profile_pictures').getPublicUrl(filePath);
                if (urlData?.publicUrl) {
                    uploadedImageUrls.push(urlData.publicUrl);
                } else {
                    console.warn(`Could not get public URL for ${filePath}.`);
                    // Decide how to handle missing public URLs - maybe throw error?
                }
            }
            Toast.show({ type: 'success', text1: 'Images uploaded successfully!' });

            const profileData = {
                id: userId,
                first_name: values.firstName,
                last_name: values.lastName || null,
                date_of_birth: format(values.dob, 'yyyy-MM-dd'), // Ensure values.dob is Date
                gender: values.gender,
                bio: values.bio || null,
                interests: interests,
                location: values.location || null,
                looking_for: values.lookingFor || null,
                profile_pictures: uploadedImageUrls,
            };

            Toast.show({ type: 'info', text1: 'Saving profile...' });
            const { error: insertError } = await supabase.from('profiles').insert(profileData);
            if (insertError) throw insertError;

            Toast.show({ type: 'success', text1: 'Profile Created!', text2: 'Your profile has been saved.' });
            reset(); // Reset form
            setInterests([]);
            setProfileImages([]);
            navigation.replace('Profile'); // <-- ADJUST 'Profile' route name

        } catch (error: any) {
            console.error('Create Profile Error:', error);
            Toast.show({ type: 'error', text1: 'Error Creating Profile', text2: error.message || 'An unexpected error occurred.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render Logic ---
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6347" /> {/* Example color */}
            </View>
        );
    }

    if (!userId) {
         // Should have been redirected, but render fallback just in case
        return (
             <View style={styles.container}>
                 <Text>Error: User not loaded or redirect failed.</Text>
            </View>
        );
    }

    // --- Main Form Render ---
    return (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
            <Text style={styles.header}>Create Your Profile</Text>

            {/* ----- Basic Info Section ----- */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Basic Information</Text>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>First Name*</Text>
                    <Controller
                        control={control}
                        name="firstName"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                style={styles.input}
                                placeholder="Enter first name"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                accessibilityLabel="First Name Input"
                            />
                        )}
                    />
                    {errors.firstName && <Text style={styles.errorText}>{errors.firstName.message}</Text>}
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Last Name</Text>
                    <Controller
                        control={control}
                        name="lastName"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                style={styles.input}
                                placeholder="Optional"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                accessibilityLabel="Last Name Input"
                            />
                        )}
                    />
                    {/* No error shown for optional field */}
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Date of Birth*</Text>
                    <Controller
                        control={control}
                        name="dob"
                        render={({ field: { value } }) => (
                             <Pressable onPress={showDatePicker} style={styles.datePickerButton}>
                                 <CalendarIcon size={18} color="#555" style={styles.icon} />
                                <Text style={value ? styles.datePickerText : styles.datePickerPlaceholder}>
                                    {value ? format(value, 'PPP') : 'Select Date'}
                                </Text>
                            </Pressable>
                        )}
                     />
                    {errors.dob && <Text style={styles.errorText}>{errors.dob.message}</Text>}
                    <DateTimePickerModal
                        isVisible={isDatePickerVisible}
                        mode="date"
                        onConfirm={handleConfirmDate}
                        onCancel={hideDatePicker}
                        maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18))} // Ensure 18+
                        date={control._getWatch('dob') || new Date(new Date().setFullYear(new Date().getFullYear() - 18))} // Default picker to 18 years ago if no value
                    />
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Gender*</Text>
                    <View style={styles.pickerContainer}>
                         <Controller
                            control={control}
                            name="gender"
                            render={({ field: { onChange, value } }) => (
                                <Picker
                                    selectedValue={value}
                                    onValueChange={onChange}
                                    style={styles.picker}
                                    mode="dropdown" // Or "dialog"
                                >
                                    <Picker.Item label="Select your gender identity" value="" enabled={false} style={styles.pickerPlaceholder} />
                                    <Picker.Item label="Woman" value="Woman" />
                                    <Picker.Item label="Man" value="Man" />
                                    <Picker.Item label="Non-binary" value="Non-binary" />
                                    <Picker.Item label="Other" value="Other" />
                                    <Picker.Item label="Prefer not to say" value="Prefer not to say" />
                                </Picker>
                            )}
                         />
                     </View>
                    {errors.gender && <Text style={styles.errorText}>{errors.gender.message}</Text>}
                </View>
            </View>

            {/* ----- About Section ----- */}
            <View style={styles.section}>
                 <Text style={styles.sectionTitle}>About You</Text>
                 <View style={styles.fieldGroup}>
                     <Text style={styles.label}>Bio</Text>
                      <Controller
                         control={control}
                         name="bio"
                         render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Tell us something interesting... (max 500 chars)"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                multiline
                                maxLength={500}
                                accessibilityLabel="Bio Input"
                             />
                        )}
                    />
                    {errors.bio && <Text style={styles.errorText}>{errors.bio.message}</Text>}
                 </View>

                 <View style={styles.fieldGroup}>
                     <Text style={styles.label}>Interests (up to 10)</Text>
                     <View style={styles.interestInputContainer}>
                         <TextInput
                             style={styles.interestInput}
                            placeholder="Add an interest"
                            value={interestInput}
                            onChangeText={setInterestInput}
                             onSubmitEditing={addInterest} // Add interest on keyboard submit
                         />
                        <Pressable
                            style={[styles.addButton, (!interestInput.trim() || interests.length >= 10) && styles.disabledButton]}
                            onPress={addInterest}
                            disabled={!interestInput.trim() || interests.length >= 10}
                        >
                            <Text style={styles.addButtonText}>Add</Text>
                        </Pressable>
                     </View>
                     <View style={styles.badgeContainer}>
                         {interests.map(interest => (
                             <View key={interest} style={styles.badge}>
                                <Text style={styles.badgeText}>{interest}</Text>
                                <Pressable onPress={() => removeInterest(interest)} style={styles.removeBadgeButton}>
                                     <X size={14} color="#333" />
                                 </Pressable>
                             </View>
                        ))}
                     </View>
                 </View>
            </View>

            {/* ----- Preferences Section ----- */}
             <View style={styles.section}>
                 <Text style={styles.sectionTitle}>Preferences</Text>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Location</Text>
                    <Controller
                        control={control}
                        name="location"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Miami, FL (Optional)"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                accessibilityLabel="Location Input"
                            />
                        )}
                    />
                 </View>
                 <View style={styles.fieldGroup}>
                     <Text style={styles.label}>Looking For</Text>
                     <View style={styles.pickerContainer}>
                         <Controller
                             control={control}
                            name="lookingFor"
                            render={({ field: { onChange, value } }) => (
                                <Picker
                                    selectedValue={value}
                                    onValueChange={onChange}
                                    style={styles.picker}
                                     mode="dropdown"
                                >
                                    <Picker.Item label="Select what you're looking for (Optional)" value="" enabled={false} style={styles.pickerPlaceholder} />
                                    <Picker.Item label="Relationship" value="Relationship" />
                                    <Picker.Item label="Something Casual" value="Something Casual" />
                                    <Picker.Item label="Friendship" value="Friendship" />
                                    <Picker.Item label="Don't know yet" value="Don't know yet" />
                                </Picker>
                            )}
                        />
                     </View>
                 </View>
             </View>

            {/* ----- Photos Section ----- */}
            <View style={styles.section}>
                 <Text style={styles.sectionTitle}>Profile Pictures*</Text>
                 <Text style={styles.label}>Upload up to 6 photos (at least 1 required)</Text>
                  <Pressable style={styles.uploadButton} onPress={pickImage}>
                     <Camera size={18} color="#fff" style={styles.icon} />
                     <Text style={styles.uploadButtonText}>Select Images</Text>
                 </Pressable>
                {profileImages.length === 0 && handleSubmit && errors && <Text style={styles.errorText}>Please upload at least one photo.</Text>}
                {/* Image Previews */}
                <View style={styles.imagePreviewContainer}>
                    {profileImages.map((asset) => (
                        <View key={asset.uri} style={styles.imagePreviewWrapper}>
                            <Image source={{ uri: asset.uri }} style={styles.imagePreview} />
                             <Pressable onPress={() => removeImage(asset.uri)} style={styles.removeImageButton}>
                                <Trash2 size={16} color="#fff" />
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
                     <ActivityIndicator size="small" color="#fff" style={styles.icon} />
                 ) : null}
                <Text style={styles.submitButtonText}>
                    {isSubmitting ? 'Saving...' : 'Create Profile'}
                 </Text>
            </Pressable>

        </ScrollView>
    );
};

// --- Styles --- (Example styles, customize as needed)
const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    container: {
        padding: 20,
        paddingBottom: 50, // Extra space at bottom
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 25,
        textAlign: 'center',
        color: '#333',
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 18,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 15,
        color: '#444',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 8,
    },
    fieldGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
        color: '#555',
    },
    input: {
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#333',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top', // Align text top on Android
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        backgroundColor: '#f0f0f0',
        // Height might be needed for Android picker consistency
    },
    picker: {
        // Some basic styling, might need more adjustment per platform
        height: 50,
        width: '100%',
        color: '#333',
    },
     pickerPlaceholder: {
        color: '#999', // Style placeholder item
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 10,
        height: 44, // Match input height roughly
    },
    datePickerText: {
        fontSize: 16,
        color: '#333',
    },
     datePickerPlaceholder: {
        fontSize: 16,
        color: '#999',
    },
    errorText: {
        color: '#dc3545', // Red error color
        fontSize: 12,
        marginTop: 4,
    },
    interestInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    interestInput: {
        flex: 1, // Take remaining space
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
    },
    addButton: {
        backgroundColor: '#FF6347', // Example color
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        height: 44, // Match input height
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.6,
    },
    badgeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e0e0e0',
        borderRadius: 15,
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    badgeText: {
        fontSize: 14,
        color: '#333',
        marginRight: 5,
    },
    removeBadgeButton: {
         padding: 2, // Make it easier to tap
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#5cb85c', // Green color
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 6,
        marginTop: 10,
        marginBottom: 10,
    },
    uploadButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    imagePreviewContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 15,
    },
    imagePreviewWrapper: {
        position: 'relative',
        width: 100,
        height: 100,
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    removeImageButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 15,
        padding: 4,
    },
    submitButton: {
        flexDirection: 'row',
        backgroundColor: '#FF6347', // Theme color
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    icon: {
        marginRight: 8,
    }
});

export default CreateProfile;