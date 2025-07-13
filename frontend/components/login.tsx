import { useTranslations } from '@/frontend/constants/locales';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Define LocaleKeys type if not exported from locales
type LocaleKeys = 'en' | 'ar' | 'he';

interface ErrorResponse {
  message?: string;
  error?: string;
  [key: string]: any;
}

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState<LocaleKeys>('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Initialize translations without language parameter if not supported
  const t = useTranslations();

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Attempting login with:', { email, password });

      const response = await axios.post('http://10.0.0.8:8082/api/auth/login', {
        email: email.trim(),
        password: password.trim()
      });

      console.log('Login response:', response.data);

      if (!response.data.token) {
        throw new Error('No token received');
      }

      // Store auth data
      await AsyncStorage.multiSet([
        ['user', JSON.stringify(response.data.user)],
        ['token', response.data.token],
        ['userRole', response.data.user.role]
      ]);

      const storedToken = await AsyncStorage.getItem('token');
      console.log('Stored token:', storedToken);

      // Handle role safely
      const userRole = response.data.user?.role?.toLowerCase();
      if (!userRole) {
        throw new Error('No user role received');
      }

      switch(userRole) {
        case 'local':
          router.replace('./(tabs)/local');
          break;
        case 'emergency':
          router.replace('./(tabs)/homepage');
          break;
        case 'admin':
          router.replace('./admin');
          break;
        default:
          router.replace('./');
      }

    } catch (error) {
      const err = error as AxiosError;
      console.error('Login error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });

      const errorData = err.response?.data as ErrorResponse;
      setError(errorData?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = (lang: LocaleKeys) => {
    setLanguage(lang);
  };

  return (
    <View style={[
      styles.container,
      { direction: language === 'ar' || language === 'he' ? 'rtl' : 'ltr' }
    ]}>
      {/* Language Selector */}
      <View style={styles.languageSelector}>
        {(['en', 'ar', 'he'] as LocaleKeys[]).map((lang) => (
          <TouchableOpacity
            key={lang}
            onPress={() => changeLanguage(lang)}
            style={[styles.languageButton, language === lang && styles.activeLanguage]}
          >
            <Text style={styles.languageText}>
              {lang === 'en' ? 'EN' : lang === 'ar' ? 'عربي' : 'עברית'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.header}>
        <MaterialIcons name="login" size={40} color="#FFD700" />
        <Text style={styles.title}>{t.auth.login.title}</Text>
      </View>

      <View style={styles.formContainer}>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
        
        <TextInput
          style={styles.input}
          placeholder={t.auth.login.email}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholderTextColor="#8d6e63"
          textAlign={language === 'ar' || language === 'he' ? 'right' : 'left'}
        />
        <TextInput
          style={styles.input}
          placeholder={t.auth.login.password}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#8d6e63"
          textAlign={language === 'ar' || language === 'he' ? 'right' : 'left'}
        />
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFD700" />
          ) : (
            <Text style={styles.buttonText}>{t.auth.login.button}</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.signupLinkContainer}>
          <Text style={styles.signupText}>{t.auth.login.noAccount}</Text>
          <TouchableOpacity onPress={() => router.push('./signup')}>
            <Text style={styles.signupLink}>{t.auth.login.signupLink}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6d4c41',
    marginTop: 10,
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0e6e2',
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#d7ccc8',
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#5d4037',
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
  languageSelector: {
    position: 'absolute',
    top: 40,
    right: 20,
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  errorText: {
    color: '#f44336',
    marginBottom: 15,
    textAlign: 'center',
  },
});