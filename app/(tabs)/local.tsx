import { useTranslations } from '@/frontend/constants/locales';
import { useLanguage } from '@/frontend/context/LanguageProvider';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../AuthContext';
type LocaleKeys = 'en' | 'ar' | 'he'; // أو أي لغات أخرى تدعمها التطبيق
interface UserData {
  [x: string]: any;
  _id: string;
  name: string;
  email: string;
  isSuperlocal: boolean;
  verifiedLandmarksAdded: number;
  verifiedRoutesAdded: number;
  votingStats: {
    correctVotes: number;
    totalVotes: number;
  };
}

interface JwtPayload {
  userId: string;
  role: string;
  isSuperlocal: boolean;
  iat: number;
  exp: number;
  [key: string]: any;
}

export default function LocalPage() {
  const { language, changeLanguage, isRTL } = useLanguage();
  const { t } = useTranslations();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    _id: '',
    name: '',
    email: '',
    isSuperlocal: false,
    verifiedLandmarksAdded: 0,
    verifiedRoutesAdded: 0,
    votingStats: {
      correctVotes: 0,
      totalVotes: 0
    }
  });
  const [requestSent, setRequestSent] = useState(false);
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://negevpulsapp.onrender.com";
  const { logout } = useAuth();

const getLanguageButtonText = (): string => {
  const languageNames = {
    en: 'EN',
    ar: 'العربية', 
    he: 'עברית'
  };
  
  return languageNames[language] || `🌐 ${language.toUpperCase()}`;
};

const toggleLanguage = () => {
  const languages: LocaleKeys[] = ['en', 'ar', 'he']; // يجب أن تكون من نفس نوع LocaleKeys
  const currentIndex = languages.indexOf(language);
  const nextIndex = (currentIndex + 1) % languages.length;
  changeLanguage(languages[nextIndex]);
};

const fetchUserData = async () => {
  try {
    setLoading(true);
    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    const response = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.data?.success) {
      const user = response.data.user;
      const decoded = jwtDecode<JwtPayload>(token);
      
      const newUserData = {
        _id: user._id,
        name: user.name || user.email.split('@')[0],
        email: user.email,
        isSuperlocal: user.isSuperlocal || decoded.isSuperlocal || false,
        verifiedLandmarksAdded: user.verifiedLandmarksAdded || 0,
        verifiedRoutesAdded: user.verifiedRoutesAdded || 0,
        contributions: user.contributions || { verified: 0, rejected: 0 }, // تأكد من وجود هذا الحقل
        votingStats: user.votingStats || { correctVotes: 0, totalVotes: 0 }
      };
      
      console.log('User data received:', newUserData); // سجل البيانات المستلمة
      
      setUserData(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(newUserData)) {
          return newUserData;
        }
        return prev;
      });
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    setError(t('errors.loadUserData'));
  } finally {
    setLoading(false);
  }
};
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      
      const fetchData = async () => {
        if (isActive) {
          await fetchUserData();
        }
      };
      
      fetchData();
      
      return () => {
        isActive = false;
      };
    }, [])
  );
const handleLogout = async () => {
  try {
    await logout();
    router.replace('/');
  } catch (error) {
    console.error('Logout error:', error);
  }
};
const confirmLogout = () => {
  Alert.alert(
    t('auth.logout.confirmTitle') || 'Confirm Logout',
    t('auth.logout.confirmMessage') || 'Are you sure you want to log out?',
    [
      {
        text: t('auth.logout.cancelButton') || 'Cancel',
        style: 'cancel',
      },
      {
        text: t('auth.logout.confirmButton') || 'Log Out',
        onPress: handleLogout,
        style: 'destructive',
      },
    ],
    { cancelable: true }
  );
};
  const getUserStatus = () => {
    const totalVerified = userData.verifiedLandmarksAdded + userData.verifiedRoutesAdded;
    const totalContributions = userData.contributions?.verified || 0;

    if (userData.isSuperlocal) {
      return {
        status: t('userStatus.superLocal'),
        description: t('userStatus.superLocalDesc', { 
          landmarks: userData.verifiedLandmarksAdded,
          routes: userData.verifiedRoutesAdded,
          contributions: totalContributions
        }),
        color: '#4caf50',
        icon: 'verified' as const
      };
    }

    const votingAccuracy = userData.votingStats?.totalVotes > 0 
      ? userData.votingStats.correctVotes / userData.votingStats.totalVotes 
      : 0;
    
    if (totalVerified >= 2 || (votingAccuracy >= 0.8 && userData.votingStats?.totalVotes >= 5)) {
      return {
        status: t('userStatus.activeResident'),
        description: t('userStatus.activeResidentDesc', { 
          landmarks: userData.verifiedLandmarksAdded,
          routes: userData.verifiedRoutesAdded,
          contributions: totalContributions
        }),
        color: '#FFD700',
        icon: 'star' as const
      };
    }

    return {
      status: t('userStatus.regularResident'),
      description: t('userStatus.regularResidentDesc', {
        landmarks: userData.verifiedLandmarksAdded,
        routes: userData.verifiedRoutesAdded,
        contributions: totalContributions
      }),
      color: '#6d4c41',
      icon: 'person' as const
    };
  };
  type MaterialIconName = 'verified' | 'star' | 'person' | 'place' | 'add-road' | 'how-to-vote' | 'hourglass-empty';

  const userStatus = getUserStatus();
  const totalVerified = userData.verifiedLandmarksAdded + userData.verifiedRoutesAdded;
  const votesNeededForSuper = Math.max(0, 10 - userData.votingStats.correctVotes);
  const verificationsNeededForActive = Math.max(0, 2 - totalVerified);

  const handleAddRoute = () => router.push('/addRoute');
  const handleAddLandmark = () => router.push('/addLandmark');

  const handleRequestSuperLocal = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert(t('alerts.error'), t('alerts.notAuthenticated'));
        return;
      }

      const response = await axios.post(
        `${BASE_URL}/api/auth/request-super`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        Alert.alert(t('alerts.success'), response.data.message);
        setRequestSent(true);
        fetchUserData();
      } else {
        Alert.alert(t('alerts.error'), response.data.message);
      }
    } catch (error) {
      console.error('Request error:', error);
      Alert.alert(t('alerts.error'), t('alerts.requestFailed'));
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* زر تبديل اللغة في اليمين */}
      <TouchableOpacity 
        style={[
          styles.languageButton,
          isRTL ? { left: 20 } : { right: 20 }
        ]}
        onPress={toggleLanguage}
      >
        <Text style={styles.languageButtonText}>
          {getLanguageButtonText()}
        </Text>
      </TouchableOpacity>

      {/* زر الخروج في اليسار */}
      <TouchableOpacity 
        style={[
          styles.logoutButton,
          isRTL ? { right: 20 } : { left: 20 }
        ]}
        onPress={confirmLogout}
      >
        <MaterialIcons name="logout" size={20} color="#FFD54F" />
        <Text style={styles.logoutButtonText}>{t('logout')}</Text>
      </TouchableOpacity>
      <ScrollView style={[styles.container, isRTL && { direction: 'rtl' }]}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { 
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr'
            }]}>
              {userData.name}
            </Text>
            <Text style={[styles.profileEmail, { 
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr'
            }]}>
              {userData.email}
            </Text>
            
            {/* Status Badge */}
            <View style={[
              styles.statusBadge,
              { backgroundColor: userStatus.color }
            ]}>
              <MaterialIcons 
                name={userStatus.icon as MaterialIconName} 
                size={24} 
                color="white" 
              />
              <Text style={styles.statusBadgeText}>{userStatus.status}</Text>
            </View>
          </View>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusHeader, isRTL && { flexDirection: 'row-reverse' }]}>
            <MaterialIcons 
              name={userStatus.icon as MaterialIconName} 
              size={24} 
              color={userStatus.color} 
            />
            <Text style={[
              styles.statusTitle, 
              isRTL ? { marginRight: 10 } : { marginLeft: 10 },
              { 
                textAlign: isRTL ? 'right' : 'left',
                writingDirection: isRTL ? 'rtl' : 'ltr'
              }
            ]}>
              {userStatus.status}
            </Text>
          </View>
          
          <Text style={[
            styles.statusDescription, 
            { 
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr'
            }
          ]}>
            {userStatus.description}
          </Text>

          {/* Verification Stats */}
          <View style={styles.statsContainer}>
            <View style={[styles.statItem, isRTL && { flexDirection: 'row-reverse' }]}>
              <MaterialIcons name="place" size={20} color="#6d4c41" />
              <Text style={[
                styles.statText,
                isRTL ? { marginRight: 8 } : { marginLeft: 8 },
                { 
                  textAlign: isRTL ? 'right' : 'left',
                  writingDirection: isRTL ? 'rtl' : 'ltr'
                }
              ]}>
                {t('stats.landmarks')}: {userData.verifiedLandmarksAdded}
              </Text>
            </View>
            
            <View style={[styles.statItem, isRTL && { flexDirection: 'row-reverse' }]}>
              <MaterialIcons name="add-road" size={20} color="#6d4c41" />
              <Text style={[
                styles.statText,
                isRTL ? { marginRight: 8 } : { marginLeft: 8 },
                { 
                  textAlign: isRTL ? 'right' : 'left',
                  writingDirection: isRTL ? 'rtl' : 'ltr'
                }
              ]}>
                {t('stats.routes')}: {userData.verifiedRoutesAdded}
              </Text>
            </View>
            
            <View style={[styles.statItem, isRTL && { flexDirection: 'row-reverse' }]}>
              <MaterialIcons name="verified" size={20} color="#6d4c41" />
              <Text style={[
                styles.statText,
                isRTL ? { marginRight: 8 } : { marginLeft: 8 },
                { 
                  textAlign: isRTL ? 'right' : 'left',
                  writingDirection: isRTL ? 'rtl' : 'ltr'
                }
              ]}>
                {t('stats.contributions')}: {userData.contributions?.verified || 0}
              </Text>
            </View>
            
            <View style={[styles.statItem, isRTL && { flexDirection: 'row-reverse' }]}>
              <MaterialIcons name="how-to-vote" size={20} color="#6d4c41" />
              <Text style={[
                styles.statText,
                isRTL ? { marginRight: 8 } : { marginLeft: 8 },
                { 
                  textAlign: isRTL ? 'right' : 'left',
                  writingDirection: isRTL ? 'rtl' : 'ltr'
                }
              ]}>
                {t('stats.correctVotes')}: {userData.votingStats?.correctVotes || 0}
              </Text>
            </View>
          </View>

          {/* Progress Section */}
          {!userData.isSuperlocal && (
            <View style={styles.progressSection}>
              <Text style={[
                styles.sectionTitle,
                { 
                  textAlign: isRTL ? 'right' : 'left',
                  writingDirection: isRTL ? 'rtl' : 'ltr'
                }
              ]}>
                {t('progress.title')}
              </Text>
              
              {totalVerified < 2 ? (
                <>
                  <Text style={[
                    styles.progressText,
                    { 
                      textAlign: isRTL ? 'right' : 'left',
                      writingDirection: isRTL ? 'rtl' : 'ltr'
                    }
                  ]}>
                    {t('progress.verificationsNeeded', { count: verificationsNeededForActive })}
                  </Text>
                  <View style={styles.progressBar}>
                    <View style={[
                      styles.progressFill, 
                      { 
                        width: `${Math.min(100, (totalVerified / 2) * 100)}%`,
                        backgroundColor: '#FFD700'
                      }
                    ]} />
                  </View>
                </>
              ) : (
                <>
                  <Text style={[
                    styles.progressText,
                    { 
                      textAlign: isRTL ? 'right' : 'left',
                      writingDirection: isRTL ? 'rtl' : 'ltr'
                    }
                  ]}>
                    {t('progress.votesNeeded', { count: votesNeededForSuper })}
                  </Text>
                  <View style={styles.progressBar}>
                    <View style={[
                      styles.progressFill, 
                      { 
                        width: `${Math.min(100, (userData.votingStats.correctVotes / 10) * 100)}%`,
                        backgroundColor: '#4caf50'
                      }
                    ]} />
                  </View>
                </>
              )}
            </View>
          )}

        </View>

        {/* Action Buttons */}
        <View style={[styles.actionButtonsContainer, isRTL && { flexDirection: 'row-reverse' }]}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.addButton]}
            onPress={handleAddLandmark}
          >
            <MaterialIcons name="place" size={24} color="#6d4c41" />
            <Text style={[
              styles.actionButtonText,
              { 
                textAlign: isRTL ? 'right' : 'left',
                writingDirection: isRTL ? 'rtl' : 'ltr'
              }
            ]}>
              {t('buttons.addLandmark')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.addButton]}
            onPress={handleAddRoute}
          >
            <MaterialIcons name="add-road" size={24} color="#6d4c41" />
            <Text style={[
              styles.actionButtonText,
              { 
                textAlign: isRTL ? 'right' : 'left',
                writingDirection: isRTL ? 'rtl' : 'ltr'
              }
            ]}>
              {t('buttons.addRoute')}
            </Text>
          </TouchableOpacity>
        </View>

        {requestSent && (
          <View style={[styles.requestStatus, isRTL && { flexDirection: 'row-reverse' }]}>
            <MaterialIcons name="hourglass-empty" size={20} color="#6d4c41" />
            <Text style={[
              styles.requestStatusText,
              isRTL ? { marginRight: 8 } : { marginLeft: 8 },
              { 
                textAlign: isRTL ? 'right' : 'left',
                writingDirection: isRTL ? 'rtl' : 'ltr'
              }
            ]}>
              {t('status.requestPending')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f5',
  },
  languageButton: {
    position: 'absolute',
    top: 50,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD54F',
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileHeader: {
    backgroundColor: '#6d4c41',
    padding: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileEmail: {
    color: '#f0e6e2',
    fontSize: 14,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 10,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
    marginRight: 5,
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0e6e2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6d4c41',
  },
  statusDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5d4037',
    marginBottom: 15,
  },
  statsContainer: {
    marginBottom: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statText: {
    fontSize: 14,
    color: '#5d4037',
  },
  progressSection: {
    marginTop: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6d4c41',
    marginBottom: 10,
  },
  progressText: {
    fontSize: 14,
    color: '#5d4037',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f0e6e2',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  requestButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  requestButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButton: {
    backgroundColor: '#FFD700',
  },
  actionButtonText: {
    color: '#6d4c41',
    fontSize: 16,
    fontWeight: 'bold',
  },
  requestStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#f0e6e2',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  requestStatusText: {
    color: '#6d4c41',
    fontSize: 14,
  },
  logoutButton: {
    position: 'absolute',
    top: 50,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD54F',
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageButtonText: {
    color: '#FFD54F',
    fontWeight: 'bold',
    fontSize: 14,
    marginHorizontal: 5,
  },
  
  logoutButtonText: {
    color: '#FFD54F',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
  },
});