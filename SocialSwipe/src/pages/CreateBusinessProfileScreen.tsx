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
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabaseClient'; // Adjust path if needed
import { useAuth } from '../contexts/AuthContext'; // To potentially refresh profile data

// Import Param List type that includes this screen
// Assuming it's in AuthStack for now based on previous step
import { AuthStackParamList } from '../../App'; // Adjust path relative to App.tsx

// Define validation schema for the business profile form
// Match column names in your 'profiles' table
const businessProfileSchema = z.object({
  business_name: z.string().min(2, { message: "Business name is required (min 2 chars)." }),
  category: z.string().min(3, { message: "Category is required (min 3 chars)." }),
  description: z.string().optional(), // Optional
  address_street: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  address_postal_code: z.string().optional(),
  address_country: z.string().optional(),
  phone_number: z.string().optional(), // Add more specific validation later (e.g., regex)
  website: z.string().url({ message: "Please enter a valid URL (e.g., https://example.com)" }).optional().or(z.literal('')), // Allow empty string or valid URL
  profile_picture: z.string().url({ message: "Please enter a valid URL for the logo" }).optional().or(z.literal('')), // Logo URL (reusing profile_picture field) - Optional for now
  // Omitting opening_hours and gallery_urls from initial creation for simplicity
});

// Infer type from schema
type BusinessProfileFormData = z.infer<typeof businessProfileSchema>;

// Define navigation prop type
type CreateBusinessProfileNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'CreateBusinessProfile' // Screen name in AuthStack
>;

const CreateBusinessProfileScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<CreateBusinessProfileNavigationProp>();
  const { fetchProfile } = useAuth(); // Get function to potentially refresh profile in context

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
      website: '',
      profile_picture: '', // Logo URL
    },
    mode: 'onTouched',
  });
  const { control, handleSubmit, formState: { errors } } = form;

  const onSubmit = async (formData: BusinessProfileFormData) => {
    setLoading(true);
    try {
      // 1. Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw userError || new Error("User not found.");
      }

      // 2. Prepare data for update (match column names exactly)
      const updates = {
        business_name: formData.business_name,
        category: formData.category,
        description: formData.description,
        address_street: formData.address_street,
        address_city: formData.address_city,
        address_state: formData.address_state,
        address_postal_code: formData.address_postal_code,
        address_country: formData.address_country,
        phone_number: formData.phone_number,
        website: formData.website,
        profile_picture: formData.profile_picture, // Logo URL
        updated_at: new Date().toISOString(), // Update timestamp
        // DO NOT update account_type or verification_status here
      };

      // 3. Update the profile row in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id); // Ensure we update the correct user's profile

      if (updateError) {
        throw updateError;
      }

      // 4. Success
      Alert.alert("Profile Created!", "Your business profile has been saved.");
      await fetchProfile?.(); // Attempt to refresh profile data in AuthContext

      // Navigation Note:
      // Simply showing an alert might be enough. The AppContent component
      // (once its logic is refined) should detect the profile is now 'complete'
      // the next time it renders or when the profile data refreshes,
      // and automatically navigate the user to the main app (RootStack).
      // Avoid complex navigation here if AppContent can handle it.
      // If you *must* navigate manually, ensure you're navigating correctly
      // out of the Auth stack and into the RootStack, potentially using reset:
      // navigation.getParent()?.reset({ index: 0, routes: [{ name: 'RootStack', params: { screen: 'Main' } }] }); // Example - complex!

    } catch (error: any) {
      console.error('Create business profile error:', error.message);
      Alert.alert("Error", error.message || "Failed to save business profile.");
    } finally {
      setLoading(false);
    }
  };

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

             {/* Address Inputs */}
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

             {/* Contact Inputs */}
             <Text style={[styles.label, {marginTop: 10, marginBottom: 5, fontWeight: 'bold'}]}>Contact Info</Text>
             <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <Controller control={control} name="phone_number" render={({ field: { onChange, onBlur, value } }) => ( <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} keyboardType="phone-pad" editable={!loading} /> )} />
                {errors.phone_number && <Text style={styles.errorText}>{errors.phone_number.message}</Text>}
             </View>
             <View style={styles.inputGroup}>
                <Text style={styles.label}>Website URL</Text>
                <Controller control={control} name="website" render={({ field: { onChange, onBlur, value } }) => ( <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} keyboardType="url" placeholder="https://example.com" autoCapitalize="none" editable={!loading} /> )} />
                {errors.website && <Text style={styles.errorText}>{errors.website.message}</Text>}
             </View>

             {/* Logo URL Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Logo URL</Text>
                <Controller control={control} name="profile_picture" render={({ field: { onChange, onBlur, value } }) => ( <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} keyboardType="url" placeholder="https://example.com/logo.png" autoCapitalize="none" editable={!loading} /> )} />
                {errors.profile_picture && <Text style={styles.errorText}>{errors.profile_picture.message}</Text>}
             </View>

          </View>

          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [ styles.button, styles.buttonPrimary, loading && styles.buttonDisabled, pressed && !loading && styles.buttonPrimaryPressed, ]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
            >
              {loading ? (<ActivityIndicator size="small" color="#ffffff" />) : (<Text style={styles.buttonTextPrimary}>Save Business Profile</Text>)}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// --- Styles (Using similar styles as CreateAccount) ---
const styles = StyleSheet.create({
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
    textArea: { height: 100, textAlignVertical: 'top', }, // Style for multiline description
    addressRow: { flexDirection: 'row', justifyContent: 'space-between', },
    addressRowItem: { flex: 1, marginHorizontal: 4, }, // Adjust margin as needed
    footer: { alignItems: 'center', marginTop: 10, },
    button: { width: '100%', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', },
    buttonPrimary: { backgroundColor: '#FF6347', }, // Theme color
    buttonDisabled: { backgroundColor: '#FF6347', opacity: 0.7, },
    buttonPrimaryPressed: { opacity: 0.85, },
    buttonTextPrimary: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', },
});

export default CreateBusinessProfileScreen;