import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslations } from '@/frontend/constants/locales';
import { MaterialIcons } from '@expo/vector-icons';

// More flexible type definition
type AuthTranslations = {
  signIn: string;
  signUp: string;
  logout?: {
    title: string;
    message: string;
    button: string;
  };
  login?: {
    title: string;
    email: string;
    password: string;
    button: string;
    noAccount: string;
    signupLink: string;
  };
  signup?: {
    title?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    button?: string;
    hasAccount?: string;
    loginLink?: string;
    // Add other possible signup properties here
  };
  chooseOption?: string;
  emergencyOption?: string;
  continueWithoutLogin?: string;
};

export default function AuthOptions() {
  const router = useRouter();
  const t = useTranslations();
  
  // Safer type conversion
  const authTranslations: AuthTranslations = {
    signIn: t.auth.signIn,
    signUp: t.auth.signUp,
    chooseOption: (t.auth as any).chooseOption,
    emergencyOption: (t.auth as any).emergencyOption,
    continueWithoutLogin: (t.auth as any).continueWithoutLogin,
  };

  // Safe navigation function
  const navigateTo = (path: string) => {
    const allowedRoutes = ['/login', '/signup', '/EmergencyPage'];
    if (allowedRoutes.includes(path)) {
      router.push(path as any);
    }
  };

  // Get translation with fallback
  const getTranslation = (key: keyof AuthTranslations, fallback: string) => {
    const value = authTranslations[key];
    return typeof value === 'string' ? value : fallback;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="account-circle" size={48} color="#6d4c41" />
        <Text style={styles.title}>
          {getTranslation('chooseOption', 'Choose an option')}
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={[styles.optionButton, styles.loginButton]}
          onPress={() => navigateTo('/login')}
        >
          <Text style={styles.optionButtonText}>{authTranslations.signIn}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.optionButton, styles.signupButton]}
          onPress={() => navigateTo('/signup')}
        >
          <Text style={styles.optionButtonText}>{authTranslations.signUp}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.optionButton, styles.continueButton]}
          onPress={() => navigateTo('/EmergencyPage')}
        >
          <Text style={[styles.optionButtonText, styles.continueButtonText]}>
            {getTranslation('continueWithoutLogin', 'Continue without login')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Styles remain the same as previous solution
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6d4c41',
    marginTop: 16,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    maxWidth: 400,
  },
  optionButton: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loginButton: {
    backgroundColor: '#6d4c41',
  },
  signupButton: {
    backgroundColor: '#FFD700',
  },
  emergencyButton: {
    backgroundColor: '#ff4444',
  },
  continueButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6d4c41',
  },
  optionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  continueButtonText: {
    color: '#6d4c41',
  },
  icon: {
    marginRight: 10,
  },
});