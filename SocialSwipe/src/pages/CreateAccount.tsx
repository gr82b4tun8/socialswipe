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
// import { Loader2 } from 'lucide-react-native'; // Not directly usable in RN Button text

// Import Param List type from App.tsx or a types file
import { AuthStackParamList } from '../../App'; // Adjust path relative to App.tsx

// Define validation schema with Zod (add password confirmation)
const formSchema = z.object({
    email: z.string().email({ message: "Invalid email address." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
    // Optional: Add password confirmation for better UX
    // confirmPassword: z.string().min(6, { message: "Please confirm your password." }),
  })
  // Optional: Refine schema to check if passwords match
  // .refine((data) => data.password === data.confirmPassword, {
  //   message: "Passwords don't match",
  //   path: ["confirmPassword"], // Point error to confirm password field
  // });

// Infer type from schema
type FormData = z.infer<typeof formSchema>;

// Define navigation prop type
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
      email: '',
      password: '',
      // confirmPassword: '', // Initialize if using confirmation
    },
  });
  const { control, handleSubmit, formState: { errors } } = form;

  const onSubmit = async (values: FormData) => {
    setLoading(true);
    try {
      // Call Supabase signUp
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        // Optionally add options like redirectTo for email confirmation link
        // options: {
        //   emailRedirectTo: 'yourapp://path/for/confirmation' // Requires deep linking setup
        // }
      });

      if (error) {
        throw error;
      }

      // IMPORTANT: Check Supabase Auth settings (Site URL, Email templates, Secure email confirmation)
      // If "Confirm email" is enabled in Supabase Auth settings, data.session will likely be null here.
      if (data.user && !data.session) {
         Alert.alert(
           "Account Created!",
           "Please check your email and click the confirmation link to activate your account."
         );
         // Navigate to Login screen after showing message
         navigation.navigate('Login');
      } else if (data.user && data.session) {
         // This happens if "Confirm email" is OFF in Supabase settings
         // The user is logged in immediately. AppContent should handle the switch to MainTabs.
         Alert.alert("Account Created!", "You are now logged in.");
         // No navigation needed here usually, context change handles it.
         // If you needed to force navigation to profile setup:
         // navigation.replace('MainApp', { screen: 'ProfilePrompt' }); // Example targeting nested nav
      } else {
        // Fallback / Unexpected case
        Alert.alert(
           "Account Created (Pending Verification)",
           "Please check your email for a verification link."
         );
         navigation.navigate('Login');
      }

    } catch (error: any) {
      console.error('Sign up error:', error.message);
      Alert.alert("Sign Up Error", error.message || "An unexpected error occurred.");
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
         {/* Card View */}
        <View style={styles.card}>
           {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.description}>Enter your email and password to sign up.</Text>
          </View>

           {/* Content / Form */}
          <View style={styles.content}>
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
                  />
                )}
              />
              {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
            </View>

             {/* Optional: Confirm Password Input */}
             {/*
             <View style={styles.inputGroup}>
               <Text style={styles.label}>Confirm Password</Text>
               <Controller
                 control={control}
                 name="confirmPassword"
                 render={({ field: { onChange, onBlur, value } }) => (
                   <TextInput
                     style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
                     onBlur={onBlur}
                     onChangeText={onChange}
                     value={value}
                     placeholder="••••••••"
                     secureTextEntry
                     autoCapitalize="none"
                     autoComplete="new-password"
                   />
                 )}
               />
               {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}
             </View>
             */}
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

// --- Styles ---
// (Using similar styles as AuthPage for consistency)
const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
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
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  content: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    marginTop: 4,
  },
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
    opacity: 0.7,
  },
  buttonPrimaryPressed: {
    opacity: 0.85,
  },
  buttonTextPrimary: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    padding: 8,
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