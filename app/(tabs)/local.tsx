import { useTranslations } from '@/frontend/constants/locales';
import { useLanguage } from '@/frontend/context/LanguageProvider';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Use this in both local.tsx and admin.tsx
interface SuperLocalRequest {
  _id: string;       // Changed from 'id' to '_id'
  userId: string;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;  // Changed from 'date' to 'createdAt'
}
interface UserData {
  _id: string;
  name: string;
  email: string;
  points: number;
  isSuperlocal: boolean;
  verifiedLandmarksAdded: number;
  verifiedRoutesAdded: number;
  votingStats: {
    correctVotes: number;
    totalVotes: number;
  };
}
export default function LocalPage() {
  const { language } = useLanguage();
  const  t  = useTranslations();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  // Then in your component:
  const [userData, setUserData] = useState<UserData>({
    _id: '',           // Initialize with empty string
    name: '',
    email: '',
    points: 0,
    isSuperlocal: false,
    verifiedLandmarksAdded: 0,
    verifiedRoutesAdded: 0,
    votingStats: {
      correctVotes: 0,
      totalVotes: 0
    }
  });
  const [requestSent, setRequestSent] = useState(false);
  const [superLocalRequests, setSuperLocalRequests] = useState<SuperLocalRequest[]>([]);
  useFocusEffect(
      React.useCallback(() => {
        const fetchData = async () => {
          const token = await AsyncStorage.getItem('token');
          if (token) {
            try {
              const response = await axios.get('http://172.19.33.185:8082/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (response.data?.success) {
                const user = response.data.user;
                setUserData({
                  _id: user._id,
                  name: user.name || user.email.split('@')[0],
                  email: user.email,
                  points: 0,
                  isSuperlocal: user.isSuperlocal || false,
                  verifiedLandmarksAdded: user.verifiedLandmarksAdded ?? 0,
                  verifiedRoutesAdded: user.verifiedRoutesAdded ?? 0,
                  votingStats: {
                    correctVotes: user.votingStats?.correctVotes ?? 0,
                    totalVotes: user.votingStats?.totalVotes ?? 0
                  }
                });
              }
            } catch (error) {
              console.error('Error refreshing user data:', error);
            }
          }
        };
        fetchData();
      }, [])
    );

  // In local.tsx
useEffect(() => {
  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get('http://172.19.33.185:8082/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Full API response:', response.data); // Debug log
      
      if (response.data?.success) {
        const user = response.data.user;
        console.log('User isSuperlocal:', user.isSuperlocal); // Debug log
        
        setUserData({
          _id: user._id,
          name: user.name || user.email.split('@')[0],
          email: user.email,
          points: 0,
          isSuperlocal: user.isSuperlocal, // Remove the || false here!
          verifiedLandmarksAdded: user.verifiedLandmarksAdded || 0,
          verifiedRoutesAdded: user.verifiedRoutesAdded || 0,
          votingStats: user.votingStats || { correctVotes: 0, totalVotes: 0 }
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };
  fetchUserData();
}, []);
type DecodedToken = {
  isSuperlocal?: boolean;
  [key: string]: any;
};

useEffect(() => {
  const decodeToken = async () => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token); // Use custom type
        console.log('Decoded token:', decoded);
        if (decoded.isSuperlocal) {
          setUserData(prev => ({ ...prev, isSuperlocal: true }));
        }
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }
  };
  decodeToken();
}, []);
 const getUserStatus = () => {
  // This should be the first check
  if (userData.isSuperlocal) {
    return 'SuperLocal Resident';
  }
  
  const totalVerified = userData.verifiedLandmarksAdded + userData.verifiedRoutesAdded;
  const votingAccuracy = userData.votingStats.totalVotes > 0 
    ? userData.votingStats.correctVotes / userData.votingStats.totalVotes 
    : 0;
  
  if (totalVerified >= 2 || (votingAccuracy >= 0.8 && userData.votingStats.totalVotes >= 5)) {
    return 'Active Resident';
  }
  
  return 'Regular Resident';
};
  const userStatus = getUserStatus();

  const handleAddRoute = () => {
    router.push('/addRoute');
  };

  const handleAddLandmark = () => {
    router.push('/addLandmark');
  };

  const fetchSuperLocalRequests = async (): Promise<SuperLocalRequest[]> => {
    try {
      const storedRequests = await AsyncStorage.getItem('superLocalRequests');
      return storedRequests ? JSON.parse(storedRequests) : [];
    } catch (error) {
      console.error('Error fetching requests:', error);
      return [];
    }
  };

  // Replace the real API call with mock data
  const handleRequestSuperLocal = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      Alert.alert('Error', 'Not authenticated');
      return;
    }

    // Make the API request
    const response = await axios.post(
      'http://172.19.33.185:8082/api/auth/request-super',
      {}, // Empty body since we're using the token
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );

    if (response.data.success) {
      Alert.alert('Success', response.data.message);
      setRequestSent(true);
      
      // Update local requests cache with the complete request data
      const newRequest = {
        _id: response.data.request._id,
        userId: response.data.request.userId,
        name: userData.name, // Using the local userData
        email: userData.email, // Using the local userData
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      const existingRequests = await fetchSuperLocalRequests();
      await AsyncStorage.setItem(
        'superLocalRequests',
        JSON.stringify([...existingRequests, newRequest])
      );
    } else {
      Alert.alert('Error', response.data.message);
    }
  } catch (error) {
    console.error('Request error:', error);
    let errorMessage = 'Failed to submit request';
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || 
                     error.message || 
                     'Network error occurred';
    }
    Alert.alert('Error', errorMessage);
  }
};
  useEffect(() => {
      const checkRequests = async () => {
      const requests = await AsyncStorage.getItem('superLocalRequests');
      console.log('Current requests in storage:', requests);
    };
    checkRequests();
  }, [requestSent]); // Runs when request status changes

  if (role === 'emergency') {
    return <Text>You do not have access to this screen.</Text>;
  }


  return (
    <View style={{ flex: 1 }}>
      {/* Keep your existing Tabs configuration */}

      <ScrollView style={styles.container}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userData.name || userData.email.split('@')[0]}</Text>
            <Text style={styles.profileEmail}>{userData.email}</Text>
            
            {/* Status Badge */}
            <View style={[
              styles.statusBadge,
              userStatus === 'SuperLocal Resident' && styles.superLocalBadge,
              userStatus === 'Active Resident' && styles.activeResidentBadge
            ]}>
              <Text style={[
                styles.statusText,
                userStatus === 'SuperLocal Resident' && styles.superLocalText,
                userStatus === 'Active Resident' && styles.activeResidentText
              ]}>
                {userStatus}
              </Text>
            </View>
            {/* Status Card */}
            <View style={styles.statusCard}>
              {userStatus === 'SuperLocal Resident' ? (
                <>
                  <View style={styles.statusHeader}>
                    <MaterialIcons name="verified" size={24} color="#4caf50" />
                    <Text style={styles.statusTitle}>SuperLocal Status</Text>
                  </View>
                  <Text style={styles.statusText}>
                    You've earned SuperLocal status with {userData.votingStats.correctVotes} correct votes!
                  </Text>
                </>
              ) : userStatus === 'Active Resident' ? (
                <>
                  <View style={styles.statusHeader}>
                    <MaterialIcons name="star" size={24} color="#FFD700" />
                    <Text style={styles.statusTitle}>Active Resident</Text>
                  </View>
                  <Text style={styles.statusText}>
                    You're on your way to becoming a SuperLocal! You need {10 - userData.votingStats.correctVotes} more correct votes.
                  </Text>
                  {!requestSent && (
                    <TouchableOpacity 
                      style={styles.requestButton}
                      onPress={handleRequestSuperLocal}
                    >
                      <Text style={styles.requestButtonText}>Apply for SuperLocal</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.statusHeader}>
                    <MaterialIcons name="person" size={24} color="#6d4c41" />
                    <Text style={styles.statusTitle}>Regular Resident</Text>
                  </View>
                  <Text style={styles.statusText}>
                    Get started by:
                    {"\n"}• Adding new landmarks or routes
                    {"\n"}• Voting on pending contributions
                    {"\n"}• Earn Active status at 2+ verifications
                  </Text>
                </>
              )}
            </View>

            {/* Progress to SuperLocal */}
            {userStatus !== 'SuperLocal Resident' && (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  Progress: {userData.votingStats.correctVotes}/10 correct votes
                </Text>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill, 
                    { 
                      width: `${Math.min(100, (userData.votingStats.correctVotes / 10) * 100)}%` 
                    }
                  ]} />
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Status Card - Moved under profile */}
        <View style={styles.statusCard}>
          {userData.isSuperlocal ? (
            <>
              <View style={styles.statusHeader}>
                <MaterialIcons name="verified" size={24} color="#4caf50" />
                <Text style={styles.statusTitle}>Super Local Status</Text>
              </View>
              <Text style={styles.statusText}>
                You have Super Local privileges! Your contributions are prioritized and help shape the village map for everyone.
              </Text>
            </>
          ) : (
            <>
              <View style={styles.statusHeader}>
                <MaterialIcons name="stars" size={24} color="#FFD700" />
                <Text style={styles.statusTitle}>Become a Super Local</Text>
              </View>
              <Text style={styles.statusText}>
                Gain special privileges by becoming a Super Local. Your contributions will 
                be prioritized and you'll help shape the village map for everyone.
              </Text>
              {!requestSent && (
                <TouchableOpacity 
                  style={styles.requestButton}
                  onPress={handleRequestSuperLocal}
                >
                  <Text style={styles.requestButtonText}>Apply Now</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.addButton]}
            onPress={handleAddRoute}
          >
            <MaterialIcons name="add-road" size={24} color="#6d4c41" />
            <Text style={styles.actionButtonText}>Add Route</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.addButton]}
            onPress={handleAddLandmark}
          >
            <MaterialIcons name="place" size={24} color="#6d4c41" />
            <Text style={styles.actionButtonText}>Add Landmark</Text>
          </TouchableOpacity>
        </View>

        {/* Keep the rest of your existing components */}
        {!userData.isSuperlocal && !requestSent && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.superLocalButton]}
            onPress={handleRequestSuperLocal}
          >
            <MaterialIcons name="verified" size={24} color="#FFD700" />
            <Text style={styles.superLocalButtonText}>Request Super Local Status</Text>
          </TouchableOpacity>
        )}

        {requestSent && (
          <View style={styles.requestStatus}>
            <MaterialIcons name="hourglass-empty" size={20} color="#6d4c41" />
            <Text style={styles.requestStatusText}>Super Local request pending admin approval</Text>
          </View>
        )}

        {/* Main Content */}
        <View style={styles.content}>
          {/* Card 2 - Quick Actions */}
        </View>
      </ScrollView>
    </View>
  );  
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f5',
  },
  profileHeader: {
    backgroundColor: '#6d4c41',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileEmail: {
    color: '#f0e6e2',
    fontSize: 14,
    marginTop: 2,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  pointsText: {
    color: '#FFD700',
    fontSize: 14,
    marginLeft: 4,
  },
  badge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  badgeText: {
    color: '#6d4c41',
    fontSize: 12,
    fontWeight: 'bold',
  },
  regularLocalText: {
    color: '#f0e6e2',
    fontSize: 12,
    marginTop: 6,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
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
  superLocalButton: {
    backgroundColor: '#6d4c41',
    marginHorizontal: 16,
    marginBottom: 20,
  },
  actionButtonText: {
    color: '#6d4c41',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  superLocalButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
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
    marginLeft: 8,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0e6e2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0e6e2',
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6d4c41',
    marginLeft: 10,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingLeft: 5,
  },
  alertText: {
    fontSize: 16,
    color: '#5d4037',
    marginLeft: 10,
  },
  goldButton: {
    backgroundColor: '#FFD700',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  goldButtonText: {
    color: '#6d4c41',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
    // Add/update these styles:
  statusCard: {
    backgroundColor: '#fff8f5',
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
    marginLeft: 10,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5d4037',
    marginBottom: 10,
  },
  requestButton: {
    backgroundColor: '#6d4c41',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  requestButtonText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Add these styles to your StyleSheet:
superUserMessage: {
  backgroundColor: '#e8f5e9',
  padding: 16,
  margin: 16,
  borderRadius: 8,
  borderLeftWidth: 4,
  borderLeftColor: '#4caf50',
},
regularUserMessage: {
  backgroundColor: '#e3f2fd',
  padding: 16,
  margin: 16,
  borderRadius: 8,
  borderLeftWidth: 4,
  borderLeftColor: '#2196f3',
},
messageTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 8,
  color: '#2e7d32',
},
messageText: {
  fontSize: 14,
  lineHeight: 20,
  color: '#424242',
},
statusBadge: {
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 15,
  alignSelf: 'flex-start',
  marginTop: 8,
  backgroundColor: '#f0e6e2',
},
superLocalBadge: {
  backgroundColor: '#6d4c41',
},
activeResidentBadge: {
  backgroundColor: '#FFD700',
},
superLocalText: {
  color: '#FFD700',
},
activeResidentText: {
  color: '#6d4c41',
},
progressContainer: {
  marginTop: 12,
  width: '100%',
},
progressText: {
  fontSize: 12,
  color: '#8d6e63',
  marginBottom: 4,
},
progressBar: {
  height: 6,
  backgroundColor: '#f0e6e2',
  borderRadius: 3,
  overflow: 'hidden',
},
progressFill: {
  height: '100%',
  backgroundColor: '#6d4c41',
},
});