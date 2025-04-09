// src/pages/CreateAccount.tsx (React Native Version)
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

// Import Param List type from App.tsx or a types file
// Make sure this list includes CreateBusinessProfile
import { AuthStackParamList } from '../../App'; // Adjust path relative to App.tsx

// Define validation schema with Zod (add accountType)
const formSchema = z.object({
  accountType: z.enum(['personal', 'business'], {
    required_error: "Please select an account type.",
    invalid_type_error: "Please select an account type.", // Error if value isn't 'personal' or 'business'
  }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

// Infer type from schema
type FormData = z.infer<typeof formSchema>;

// Define navigation prop type
// Ensure AuthStackParamList used here includes CreateBusinessProfile
type CreateAccountNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'SignUp' // Screen name in AuthStack
>;

const CreateAccount: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<CreateAccountNavigationProp>();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountType: undefined, // Initialize as undefined or null
      email: '',
      password: '',
    },
    mode: 'onTouched', // Validate on blur/touch
  });
  const { control, handleSubmit, formState: { errors }, setValue, watch } = form;

  // Watch the accountType value to apply conditional styling to buttons
  const selectedAccountType = watch('accountType');

  const onSubmit = async (values: FormData) => {
    setLoading(true);
    try {
      // Call Supabase signUp with account_type in metadata
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            account_type: values.accountType // Pass accountType here
          }
          // Optionally add options like redirectTo for email confirmation link
          // options: {
          //   emailRedirectTo: 'yourapp://path/for/confirmation' // Requires deep linking setup
          // }
        }
      });

      if (error) {
        throw error;
      }

       // Handle response based on email confirmation settings
       if (data.user && !data.session) {
           // Email confirmation required case: SAME AS BEFORE
           Alert.alert(
               "Account Created!",
               "Please check your email and click the confirmation link to activate your account."
           );
           navigation.navigate('Login'); // Go to login after showing message

       } else if (data.user && data.session) {
            // User signed up AND logged in (e.g., email confirmation disabled)
            // ---> MODIFIED CODE START: Redirect logic based on account type <---
            if (values.accountType === 'business') {
                // Business Account: Redirect to CreateBusinessProfile
                Alert.alert("Account Created!", "Let's set up your business profile.");
                navigation.replace('CreateBusinessProfile'); // Use replace to prevent going back
            } else {
                // Personal Account: Keep original behavior or redirect to personal setup
                Alert.alert("Account Created!", "You are now logged in.");
                // If you have a CreatePersonalProfile screen, navigate here:
                // navigation.replace('CreatePersonalProfile');
                // Otherwise, do nothing and let AuthProvider handle the navigation
                // to the main app area (based on session change).
            }
            // ---> MODIFIED CODE END <---
       } else {
           // Fallback / Unexpected case: SAME AS BEFORE
           Alert.alert(
               "Account Created (Pending Verification)", // Or "Account Status"
               "Please check your email for a verification link or try logging in."
           );
           navigation.navigate('Login');
       }

    } catch (error: any) {
      // Error Handling: SAME AS BEFORE
      console.error('Sign up error:', error.message);
      if (error.message.includes('User already registered')) {
          Alert.alert("Sign Up Error", "An account with this email already exists. Please log in or use a different email.");
      } else {
          Alert.alert("Sign Up Error", error.message || "An unexpected error occurred.");
      }
    } finally {
      // Finally block: SAME AS BEFORE
      setLoading(false);
    }
  };

 // --- RETURN JSX: IDENTICAL TO YOUR PREVIOUS VERSION ---
 return (
     <KeyboardAvoidingView
     behavior={Platform.OS === "ios" ? "padding" : "height"}
     style={styles.keyboardAvoidingView}
   >
     <ScrollView contentContainerStyle={styles.scrollContainer}>
       {/* Card View */}
       <View style={styles.card}>
         {/* Header */}
         <View style={styles.header}>
           <Text style={styles.title}>Create Account</Text>
           <Text style={styles.description}>Choose account type and enter details to sign up.</Text>
         </View>

         {/* Content / Form */}
         <View style={styles.content}>

            {/* --- Account Type Selection --- */}
           <View style={styles.inputGroup}>
               <Text style={styles.label}>I am creating a...</Text>
               <View style={styles.accountTypeContainer}>
                   <Pressable
                       style={[
                           styles.accountTypeButton,
                           selectedAccountType === 'personal' ? styles.accountTypeButtonSelected : {}
                       ]}
                       onPress={() => setValue('accountType', 'personal', { shouldValidate: true })} // Set form value & validate
                       disabled={loading}
                   >
                       <Text style={[
                           styles.accountTypeButtonText,
                           selectedAccountType === 'personal' ? styles.accountTypeButtonTextSelected : {}
                       ]}>Personal Account</Text>
                   </Pressable>
                   <Pressable
                        style={[
                           styles.accountTypeButton,
                           selectedAccountType === 'business' ? styles.accountTypeButtonSelected : {}
                       ]}
                       onPress={() => setValue('accountType', 'business', { shouldValidate: true })} // Set form value & validate
                       disabled={loading}
                   >
                      <Text style={[
                           styles.accountTypeButtonText,
                           selectedAccountType === 'business' ? styles.accountTypeButtonTextSelected : {}
                       ]}>Business Account</Text>
                   </Pressable>
               </View>
               {errors.accountType && <Text style={styles.errorText}>{errors.accountType.message}</Text>}
           </View>
            {/* --- End Account Type Selection --- */}


           {/* Email Input */}
           <View style={styles.inputGroup}>
             <Text style={styles.label}>Email</Text>
             <Controller
               control={control}
               name="email"
               render={({ field: { onChange, onBlur, value } }) => (
                 <TextInput
                   style={[styles.input, errors.email ? styles.inputError : null]}
                   onBlur={onBlur}
                   onChangeText={onChange}
                   value={value}
                   placeholder="you@example.com"
                   keyboardType="email-address"
                   autoCapitalize="none"
                   autoComplete="email"
                   editable={!loading} // Disable input when loading
                 />
               )}
             />
             {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
           </View>

           {/* Password Input */}
           <View style={styles.inputGroup}>
             <Text style={styles.label}>Password</Text>
             <Controller
               control={control}
               name="password"
               render={({ field: { onChange, onBlur, value } }) => (
                 <TextInput
                   style={[styles.input, errors.password ? styles.inputError : null]}
                   onBlur={onBlur}
                   onChangeText={onChange}
                   value={value}
                   placeholder="•••••••• (min. 6 characters)"
                   secureTextEntry
                   autoCapitalize="none"
                   autoComplete="new-password" // Hint for new password
                   editable={!loading} // Disable input when loading
                 />
               )}
             />
             {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
           </View>

         </View>

         {/* Footer / Actions */}
         <View style={styles.footer}>
           {/* Submit Button */}
           <Pressable
             style={({ pressed }) => [
               styles.button, styles.buttonPrimary,
               loading && styles.buttonDisabled,
               pressed && !loading && styles.buttonPrimaryPressed,
             ]}
             onPress={handleSubmit(onSubmit)}
             disabled={loading}
           >
             {loading ? (
               <ActivityIndicator size="small" color="#ffffff" />
             ) : (
               <Text style={styles.buttonTextPrimary}>Sign Up</Text>
             )}
           </Pressable>

           {/* Login Link */}
           <Pressable
             style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}
             onPress={() => navigation.navigate('Login')} // Navigate to Login screen
             disabled={loading}
           >
             <Text style={styles.linkText}>Already have an account? Log In</Text>
           </Pressable>
         </View>
       </View>
     </ScrollView>
   </KeyboardAvoidingView>
 );
};

// --- Styles: IDENTICAL TO YOUR PREVIOUS VERSION ---
const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa', // Light grey background
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2, },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333', // Darker grey text
  },
  description: {
    fontSize: 14,
    color: '#6c757d', // Medium grey text
    textAlign: 'center',
  },
  content: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16, // Consistent spacing
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057', // Slightly darker grey label
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da', // Standard border color
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff', // White background for input
  },
  inputError: {
    borderColor: '#dc3545', // Red border for errors
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545', // Red text for errors
    marginTop: 4,
  },
  // --- Styles for Account Type Selection ---
  accountTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Space out buttons
    marginTop: 4,
  },
  accountTypeButton: {
    flex: 1, // Make buttons take equal space
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ced4da', // Default border color
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4, // Add some space between buttons
    backgroundColor: '#f8f9fa', // Light background for unselected
  },
  accountTypeButtonSelected: {
    borderColor: '#FF6347', // Theme color border
    backgroundColor: '#FFF0ED', // Very light theme color background
  },
  accountTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057', // Default text color
  },
  accountTypeButtonTextSelected: {
    color: '#FF6347', // Theme color text
    fontWeight: 'bold',
  },
  // --- End Account Type Styles ---
  footer: {
    alignItems: 'center',
  },
  button: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonPrimary: {
    backgroundColor: '#FF6347', // Theme color
  },
  buttonDisabled: {
    backgroundColor: '#FF6347',
    opacity: 0.7, // Indicate disabled state
  },
  buttonPrimaryPressed: {
    opacity: 0.85, // Feedback on press
  },
  buttonTextPrimary: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    padding: 8, // Easier to press
  },
  linkButtonPressed: {
    opacity: 0.7,
  },
  linkText: {
    fontSize: 14,
    color: '#FF6347', // Theme color
    textDecorationLine: 'underline',
  }
});

export default CreateAccount;