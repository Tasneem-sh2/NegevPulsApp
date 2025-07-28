import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView, Platform,
    ScrollView,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';
import { useLanguage } from '@/frontend/context/LanguageProvider';
import { useTranslations } from '@/frontend/constants/locales';
import { I18nManager } from 'react-native';

// Update your SignupData type
type SignupData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
};

const Signup = () => {
// Update your initial state
  const [data, setData] = useState<SignupData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "local",
  });
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const { isRTL } = useLanguage();
  const t = useTranslations().signup;

  useEffect(() => {
    I18nManager.forceRTL(isRTL);
  }, [isRTL]);


  const handleChange = (name: keyof SignupData, value: string) => {
    setData((prevData) => ({ ...prevData, [name]: value }));
  };

// Update your handleSubmit function
const handleSubmit = async () => {
  // Basic validation
  if (!data.firstName || !data.lastName) {
    setError(t.errors.nameRequired);
    return;
  }

  if (data.password !== data.confirmPassword) {
    setError(t.errors.passwordMismatch);
    return;
  }
  // Password complexity validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  if (!passwordRegex.test(data.password)) {
    setError(t.errors.passwordComplexity);
    return;
  }

  setIsSubmitting(true);
  setError("");

    try {
    const url = `https://negevpulsapp.onrender.com/api/signup`;

    const payload = {
      firstName: data.firstName,  // string
      lastName: data.lastName,    // string
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      role: data.role
    };

      const response = await axios.post("https://negevpulsapp.onrender.com/api/signup", payload, {
        headers: {
          "Content-Type": "application/json", // تأكد من وجود هذا الهيدر
        },
    });    
    setSuccessMessage(t.accountCreated);
    // Clear form
    setData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "local",
    });

    setTimeout(() => {
      router.push('./login');
    }, 2000);

  }  catch (error: any) {
    console.error('API call failed:', error);
    console.log('Error response:', error.response?.data); // Add this line
    if (error.response) {
      setError(error.response.data.message || 'Signup failed');
    } else if (error.request) {
      setError('No response received from server');
    } else {
      setError('Network error or server unavailable');
    }
  } finally {
    setIsSubmitting(false);
  }
};
  console.log("Payload being sent:", {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: data.password,
    role: data.role,
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <View style={styles.header}>
            <MaterialIcons name="person-add" size={40} color="#FFD700" />
            <Text style={styles.title}>{t.title}</Text>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder={t.firstName}
              value={data.firstName}
              onChangeText={(text) => handleChange('firstName', text)}
              placeholderTextColor="#8d6e63"
            />

            <TextInput
              style={styles.input}
              placeholder={t.lastName}
              value={data.lastName}
              onChangeText={(text) => handleChange('lastName', text)}
              placeholderTextColor="#8d6e63"
            />

            <TextInput
              style={styles.input}
              placeholder={t.email}
              value={data.email}
              onChangeText={(text) => handleChange('email', text)}
              keyboardType="email-address"
              placeholderTextColor="#8d6e63"
            />

                <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder={t.password}
                value={data.password}
                onChangeText={(text) => handleChange('password', text)}
                secureTextEntry={!showPassword}
                placeholderTextColor="#8d6e63"
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <MaterialIcons 
                  name={showPassword ? 'visibility-off' : 'visibility'} 
                  size={24} 
                  color="#8d6e63" 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder={t.confirmPassword}
                value={data.confirmPassword}
                onChangeText={(text) => handleChange('confirmPassword', text)}
                secureTextEntry={!showConfirmPassword}
                placeholderTextColor="#8d6e63"
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <MaterialIcons 
                  name={showConfirmPassword ? 'visibility-off' : 'visibility'} 
                  size={24} 
                  color="#8d6e63" 
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.passwordHint}>{t.passwordHint}</Text>


            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? t.creatingAccount : t.signupButton}
              </Text>
            </TouchableOpacity>

            {successMessage ? (
              <View style={styles.successContainer}>
                <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                <Text style={styles.successText}>{t.accountCreated}</Text>
              </View>
            ) : null}

            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginText}>{t.loginText}</Text>
              <TouchableOpacity onPress={() => router.push('./login')}>
                <Text style={styles.loginLink}>{t.loginLink}</Text>
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
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#5d4037',
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 16,
    color: '#6d4c41',
    marginBottom: 10,
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  activeRole: {
    backgroundColor: '#6d4c41',
    borderColor: '#6d4c41',
  },
  roleText: {
    color: '#6d4c41',
    fontWeight: '500',
  },
  activeRoleText: {
    color: '#FFD700',
  },
  button: {
    backgroundColor: '#6d4c41',
    paddingVertical: 12,
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
  errorText: {
    color: '#d32f2f',
    marginBottom: 15,
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
    passwordContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  passwordInput: {
    paddingRight: 50, // Make space for the eye icon
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 12,
    zIndex: 1,
  },
  passwordHint: {
    fontSize: 12,
    color: '#8d6e63',
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default Signup;