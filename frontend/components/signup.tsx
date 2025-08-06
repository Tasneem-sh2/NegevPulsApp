import { useTranslations } from '@/frontend/constants/locales';
import { useLanguage } from '@/frontend/context/LanguageProvider';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
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

type SignupData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const Signup = () => {
  const router = useRouter();
  const [data, setData] = useState<SignupData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { language, changeLanguage, isRTL } = useLanguage();
  const { t } = useTranslations();

  const handleChange = (name: keyof SignupData, value: string) => {
    setData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!data.firstName || !data.lastName) {
      setError(t('auth.signup.errors.nameRequired'));
      return;
    }

    if (data.password !== data.confirmPassword) {
      setError(t('auth.signup.errors.passwordMismatch'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      setError(t('auth.signup.errors.invalidEmail'));
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(data.password)) {
      setError(t('auth.signup.errors.passwordComplexity'));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await axios.post('http://negevpulsapp.onrender.com/api/signup', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      
      setSuccessMessage(t('auth.signup.accountCreated'));
      setData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => router.push('./login'), 2000);
    } catch (error: any) {
      setError(error.response?.data?.message || t('errors.unexpectedError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          {/* Header with Language Selector */}
          <View style={styles.headerContainer}>
            <View style={styles.languageSelector}>
              {(['en', 'ar', 'he'] as const).map((lang) => (
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
            
            {/* Icon and Title */}
            <View style={styles.headerContent}>
              <MaterialIcons name="person-add" size={40} color="#FFD700" />
              <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>{t('auth.signup.title')}</Text>
            </View>
          </View>
          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Name Inputs */}
            <TextInput
              style={[
                styles.input,
                isRTL ? styles.inputRTL : styles.inputLTR
              ]}
              placeholder={t('auth.signup.firstName')}
              value={data.firstName}
              onChangeText={(text) => handleChange('firstName', text)}
              placeholderTextColor="#8d6e63"
              textAlign={isRTL ? 'right' : 'left'}
              autoCapitalize="words"
            />

            <TextInput
              style={[
                styles.input,
                isRTL ? styles.inputRTL : styles.inputLTR
              ]}
              placeholder={t('auth.signup.lastName')}
              value={data.lastName}
              onChangeText={(text) => handleChange('lastName', text)}
              placeholderTextColor="#8d6e63"
              textAlign={isRTL ? 'right' : 'left'}
              autoCapitalize="words"
            />

            {/* Email Input */}
            <TextInput
              style={[
                styles.input,
                isRTL ? styles.inputRTL : styles.inputLTR
              ]}
              placeholder={t('auth.signup.email')}
              value={data.email}
              onChangeText={(text) => handleChange('email', text)}
              keyboardType="email-address"
              placeholderTextColor="#8d6e63"
              textAlign={isRTL ? 'right' : 'left'}
              autoCapitalize="none"
            />

            {/* Password Input with Eye Icon */}
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  isRTL ? styles.inputRTL : styles.inputLTR
                ]}
                placeholder={t('auth.signup.password')}
                value={data.password}
                onChangeText={(text) => handleChange('password', text)}
                secureTextEntry={!showPassword}
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

            {/* Confirm Password Input with Eye Icon */}
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  isRTL ? styles.inputRTL : styles.inputLTR
                ]}
                placeholder={t('auth.signup.confirmPassword')}
                value={data.confirmPassword}
                onChangeText={(text) => handleChange('confirmPassword', text)}
                secureTextEntry={!showConfirmPassword}
                placeholderTextColor="#8d6e63"
                textAlign={isRTL ? 'right' : 'left'}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                activeOpacity={0.7}
              >
                <MaterialIcons 
                  name={showConfirmPassword ? 'visibility-off' : 'visibility'} 
                  size={24} 
                  color="#8d6e63" 
                />
              </TouchableOpacity>
            </View>

            {/* Password Hint */}
            <Text style={[styles.passwordHint, isRTL && { textAlign: 'right' }]}>
              {t('auth.signup.passwordHint')}
            </Text>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.button,
                isSubmitting && styles.buttonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.7}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFD700" />
              ) : (
                <Text style={styles.buttonText}>
                  {t('auth.signup.signupButton')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Success Message */}
            {successMessage ? (
              <View style={styles.successContainer}>
                <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            {/* Login Link */}
            <View style={[styles.loginLinkContainer, isRTL && { flexDirection: 'row-reverse' }]}>
              <Text style={styles.loginText}>{t('auth.signup.loginText')}</Text>
              <TouchableOpacity 
                onPress={() => router.push('./login')}
                activeOpacity={0.7}
              >
                <Text style={styles.loginLink}>{t('auth.signup.loginLink')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

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
    paddingTop: 60, // زيادة الحشو العلوي لإفساح المجال لزر اللغة
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 10, // تقليل المسافة بين أزرار اللغة والأيقونة
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
    paddingRight: 50, // مساحة كافية لأيقونة العين
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
  passwordHint: {
    fontSize: 12,
    color: '#8d6e63',
    marginBottom: 20,
    textAlign: 'left',
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
  loginLinkContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#8d6e63',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6d4c41',
    marginLeft: 5,
    textDecorationLine: 'underline',
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
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 10,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  successText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  languageSelector: {
    position: 'absolute',
    top: -40, // رفع الأزرار لأعلى أكثر
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10, // التأكد من ظهور الأزرار فوق كل شيء
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
  }
});

export default Signup;