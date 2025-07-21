import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView, Platform,
    ScrollView,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';

type SignupData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
};

const Signup = () => {
  const router = useRouter();
  const [data, setData] = useState<SignupData>({
    name: "",
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
  

  const handleChange = (name: keyof SignupData, value: string) => {
    setData((prevData) => ({ ...prevData, [name]: value }));
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password: string) => {
    // يجب أن تحتوي على حرف كبير، حرف صغير، رقم، رمز، و8 أحرف على الأقل
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(password);
  };

  const handleSubmit = async () => {
    setError("");

    // التحقق من صحة البريد الإلكتروني
    if (!validateEmail(data.email)) {
      setError("Please enter a valid email address");
      return;
    }

    // التحقق من صحة كلمة المرور
    if (!validatePassword(data.password)) {
      setError("Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character");
      return;
    }

    if (data.password !== data.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      // التحقق من عدم استخدام البريد الإلكتروني مسبقاً
      const checkEmailUrl = `https://negevpulsapp.onrender.com/api/check-email`;
      const emailCheck = await axios.post(checkEmailUrl, { email: data.email });
      
      if (emailCheck.data.exists) {
        setError("This email is already registered");
        return;
      }

      // إنشاء الحساب
      const signupUrl = `https://negevpulsapp.onrender.com/api/signup`;
      const { data: res } = await axios.post(signupUrl, data);

      setSuccessMessage("Account created successfully!");

      // Clear form
      setData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "local",
      });

      // الانتقال إلى صفحة الدخول بعد 2 ثانية
      setTimeout(() => {
        router.push('./login');
      }, 2000);

    } catch (error: any) {
      console.error('API call failed:', error);
      if (error.response) {
        setError(error.response.data.message || "Registration failed");
      } else {
        setError('An unexpected error occurred');
      }
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
          <View style={styles.header}>
            <MaterialIcons name="person-add" size={40} color="#FFD700" />
            <Text style={styles.title}>Create Account</Text>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={data.name}
              onChangeText={(text) => handleChange('name', text)}
              placeholderTextColor="#8d6e63"
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={data.email}
              onChangeText={(text) => handleChange('email', text)}
              keyboardType="email-address"
              placeholderTextColor="#8d6e63"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Password"
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
                placeholder="Confirm Password"
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

            <Text style={styles.passwordHint}>
              Password must contain: 8+ characters, uppercase, lowercase, number, and special character
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? "Creating Account..." : "Sign Up"}
              </Text>
            </TouchableOpacity>

            {successMessage ? (
              <View style={styles.successContainer}>
                <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.push('./login')}>
                <Text style={styles.loginLink}>Log In</Text>
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
  passwordContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  passwordInput: {
    paddingRight: 50,
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
});

export default Signup;