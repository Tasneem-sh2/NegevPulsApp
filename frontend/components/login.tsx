import { useTranslations } from '@/frontend/constants/locales';
import type { LocaleKeys } from '@/frontend/constants/locales/types';
import { useLanguage } from '@/frontend/context/LanguageProvider';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface ErrorResponse {
  message?: string;
  error?: string;
  [key: string]: any;
}

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { language, changeLanguage, isRTL } = useLanguage();
  const { t } = useTranslations();

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('https://negevpulsapp.onrender.com/api/auth/login', {
        email: email.trim(),
        password: password.trim()
      });

      if (!response.data.token) {
        throw new Error(t('errors.noTokenReceived'));
      }

      await AsyncStorage.multiSet([
        ['user', JSON.stringify(response.data.user)],
        ['token', response.data.token],
        ['userRole', response.data.user.role]
      ]);
      // 🧩 اطباع التوكن في الكونسول بعد تسجيل الدخول
      console.log('🔑 User Token:', response.data.token);


      const userRole = response.data.user?.role?.toLowerCase();
      if (!userRole) {
        throw new Error(t('errors.noUserRole'));
      }

      switch(userRole) {
        case 'local':
          router.replace('./local');
          break;
        case 'emergency':
          router.replace('./(tabs)/map');
          break;
        case 'admin':
          router.replace('./admin');
          break;
        default:
          router.replace('./');
      }

    } catch (error) {
      const err = error as AxiosError;
      const errorData = err.response?.data as ErrorResponse;
      setError(errorData?.message || t('errors.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          {/* Language Selector - Updated to match signup page */}
          <View style={styles.languageSelector}>
            {(['en', 'ar', 'he'] as LocaleKeys[]).map((lang) => (
              <TouchableOpacity
                key={lang}
                onPress={() => changeLanguage(lang)}
                style={[
                  styles.languageButton,
                  language === lang && styles.activeLanguage
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.languageText,
                  language === lang && styles.activeLanguageText,
                  lang === 'ar' && { fontSize: 14 }
                ]}>
                  {lang === 'en' ? 'EN' : lang === 'ar' ? 'عربي' : 'עברית'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Header with Icon and Title */}
          <View style={styles.headerContainer}>
            <View style={styles.headerContent}>
              <MaterialIcons name="login" size={40} color="#FFD700" />
              <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>{t('auth.login.title')}</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            
            <TextInput
              style={[
                styles.input,
                isRTL ? styles.inputRTL : styles.inputLTR
              ]}
              placeholder={t('auth.login.email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholderTextColor="#8d6e63"
              textAlign={isRTL ? 'right' : 'left'}
              autoCapitalize="none"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  isRTL ? styles.inputRTL : styles.inputLTR
                ]}
                placeholder={t('auth.login.password')}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#8d6e63"
                textAlign={isRTL ? 'right' : 'left'}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <MaterialIcons 
                  name={showPassword ? 'visibility-off' : 'visibility'} 
                  size={24} 
                  color="#8d6e63" 
                />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.button,
                loading && styles.buttonDisabled
              ]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color="#FFD700" />
              ) : (
                <Text style={styles.buttonText}>{t('auth.login.button')}</Text>
              )}
            </TouchableOpacity>
            
            <View style={[styles.signupLinkContainer, isRTL && { flexDirection: 'row-reverse' }]}>
              <Text style={styles.signupText}>{t('auth.login.noAccount')}</Text>
              <TouchableOpacity 
                onPress={() => router.push('./signup')}
                activeOpacity={0.7}
              >
                <Text style={styles.signupLink}>{t('auth.login.signupLink')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60, // Increased top padding to accommodate language selector
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6d4c41',
    marginTop: 10,
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0e6e2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    width: '100%',
    maxWidth: 400,
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#5d4037',
  },
  passwordInput: {
    paddingRight: 50,
  },
  inputRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  inputLTR: {
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  button: {
    backgroundColor: '#6d4c41',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupLinkContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#8d6e63',
  },
  signupLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6d4c41',
    marginLeft: 5,
    textDecorationLine: 'underline',
  },
  // Updated language selector styles to match signup page
  languageSelector: {
    position: 'absolute',
    top: 20, // Positioned at the top of the container
    right: 20, // Positioned at the right of the container
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginHorizontal: 3,
  },
  activeLanguage: {
    backgroundColor: '#6d4c41',
  },
  languageText: {
    color: '#6d4c41',
    fontWeight: 'bold',
  },
  activeLanguageText: {
    color: '#FFD700',
  },
  errorContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d32f2f',
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
  },
});