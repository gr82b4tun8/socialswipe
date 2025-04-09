// src/pages/AuthPage.tsx (React Native Version)
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable, // More customizable than Button
  ActivityIndicator,
  Alert, // For simple feedback
  KeyboardAvoidingView, // Helps prevent keyboard hiding inputs
  Platform, // For platform-specific behavior
  ScrollView // Allows scrolling if content overflows
} from 'react-native';
import { useForm, Controller } from 'react-hook-form'; // RHF works in RN
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigation } from '@react-navigation/native'; // RN Navigation hook
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; // Type for navigation prop
import { supabase } from '../lib/supabaseClient'; // Adjusted path for example
// Ensure lucide-react-native is installed if using icons
// import { Loader2 } from 'lucide-react-native'; // RN version of icons

// Import Param List type from App.tsx (or a dedicated types file)
// This provides type safety for navigation.navigate calls
import { AuthStackParamList } from '../../App'; // Adjust path relative to App.tsx

// Re-use the same Zod schema
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password cannot be empty." }),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Define navigation prop type for this screen
type AuthScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Login' // The name of this screen in the AuthStack
>;

const AuthPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<AuthScreenNavigationProp>(); // Typed navigation hook

  // --- React Hook Form Setup ---
  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // --- Form Submission Handler ---
  const onSubmit = async (values: LoginFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        throw error; // Let the catch block handle it
      }

      // Login successful!
      // In RN, navigation state isn't passed like web's location.state easily after context switch.
      // The main AppContent component now handles showing MainTabs on successful login via context.
      // So, we don't strictly NEED to navigate here, as AppContent will switch views.
      // Alert.alert("Login Successful!"); // Simple success feedback

    } catch (error: any) {
      console.error('Login error:', error.message);
      let title = "Login Failed";
      let description = "An unexpected error occurred.";
      if (error.message.includes("Invalid login credentials")) {
          description = "Invalid email or password. Please try again.";
      } else if (error.message.includes("Email not confirmed")) {
          title = "Email Not Confirmed";
          description = "Please check your email and click the confirmation link.";
      }
      Alert.alert(title, description); // Use RN Alert for feedback
    } finally {
      setLoading(false);
    }
  };

  return (
    // Use KeyboardAvoidingView to push content up when keyboard appears
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingView}
    >
      {/* Use ScrollView to ensure content doesn't get cut off on smaller screens */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Main container View */}
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.description}>Log in to your account to continue.</Text>
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
                    style={[styles.input, errors.email ? styles.inputError : null]} // Add error style
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email" // Use platform autocomplete hints
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
                    placeholder="••••••••"
                    secureTextEntry // Hides password input
                    autoCapitalize="none"
                    autoComplete="password"
                  />
                )}
              />
              {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
              {/* Optional: Add Forgot Password link later */}
            </View>
          </View>

          {/* Footer / Actions */}
          <View style={styles.footer}>
            {/* Submit Button */}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.buttonPrimary,
                loading && styles.buttonDisabled, // Style when disabled
                pressed && !loading && styles.buttonPrimaryPressed, // Style when pressed
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.buttonTextPrimary}>Log In</Text>
              )}
            </Pressable>

            {/* Sign Up Link */}
            <Pressable
              style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}
              onPress={() => navigation.navigate('SignUp')} // Use RN navigation
              disabled={loading}
            >
              <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// --- Styles ---
// Using StyleSheet API for styling
const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1, // Ensures content can grow to fill space
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
    padding: 20,
    backgroundColor: '#f8f9fa', // Light background similar to web
  },
  card: {
    width: '100%',
    maxWidth: 400, // Limit card width
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000", // Basic shadow for card effect
    shadowOffset: {
        width: 0,
        height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333', // Darker text color
  },
  description: {
    fontSize: 14,
    color: '#6c757d', // Muted text color
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
    borderColor: '#dc3545', // Red border for errors
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545', // Red color for error messages
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
    marginBottom: 16, // Space between buttons
  },
  buttonPrimary: {
    backgroundColor: '#FF6347', // Use your theme color (Tomato example)
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
    padding: 8, // Add padding for easier pressing
  },
  linkButtonPressed: {
    opacity: 0.7,
  },
  linkText: {
    fontSize: 14,
    color: '#FF6347', // Use your theme color
    textDecorationLine: 'underline',
  }
});

export default AuthPage;