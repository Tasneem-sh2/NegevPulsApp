import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslations } from '@/frontend/constants/locales';
import type { LocaleKeys } from '@/frontend/constants/locales/types';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';

interface LogoutTranslation {
  auth: {
    logout: {
      title: string;
      message: string;
      button: string;
      confirmTitle: string;
      confirmMessage: string;
      confirmButton: string;
      cancelButton: string;
    };
  };
}
export default function Logout() {
  const router = useRouter();
  const [language, setLanguage] = useState<LocaleKeys>('en');
  const t = useTranslations() as LogoutTranslation;

  const { user, logout, loading: authLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, authLoading]);

// In app/(tabs)/logout.tsx
const handleLogout = async () => {
  try {
    await logout();
    // Ensure navigation happens after logout completes
    router.replace('/');
  } catch (error) {
    console.error('Logout error:', error);
  }
};

  const confirmLogout = () => {
    Alert.alert(
      t.auth.logout.confirmTitle,
      t.auth.logout.confirmMessage,
      [
        {
          text: t.auth.logout.cancelButton,
          style: 'cancel',
        },
        {
          text: t.auth.logout.confirmButton,
          onPress: handleLogout,
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  if (authLoading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6d4c41" />
      </View>
    );
  }

  const changeLanguage = (lang: LocaleKeys) => setLanguage(lang);

  return (
    <View style={[
      styles.container,
      { direction: language === 'ar' || language === 'he' ? 'rtl' : 'ltr' }
    ]}>
      <View style={styles.languageSelector}>
        {(['en', 'ar', 'he'] as LocaleKeys[]).map((lang) => (
          <TouchableOpacity
            key={lang}
            onPress={() => changeLanguage(lang)}
            style={[styles.languageButton, language === lang && styles.activeLanguage]}
          >
            <Text style={[styles.languageText, language === lang && styles.activeLanguageText]}>
              {lang === 'en' ? 'EN' : lang === 'ar' ? 'عربي' : 'עברית'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.header}>
        <MaterialIcons name="logout" size={40} color="#FFD700" />
        <Text style={styles.title}>{t.auth.logout.title}</Text>
      </View>

      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>{t.auth.logout.message}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={confirmLogout}
          disabled={authLoading}
        >
          {authLoading ? (
            <ActivityIndicator color="#FFD700" />
          ) : (
            <Text style={styles.buttonText}>{t.auth.logout.button}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  messageContainer: {
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
    alignItems: 'center',
  },
  messageText: {
    fontSize: 16,
    color: '#5d4037',
    marginBottom: 20,
    textAlign: 'center',
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
  activeLanguageText: {
    color: '#FFD700',
  },
});