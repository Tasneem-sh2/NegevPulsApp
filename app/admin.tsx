import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Slider from '@react-native-community/slider';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  isSuperlocal?: boolean;
}
interface SuperLocalRequest {
  _id: string;
  userId: string;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function AdminDashboard() {
  const [superLocalRequests, setSuperLocalRequests] = useState<SuperLocalRequest[]>([]);
  const [showRequests, setShowRequests] = useState(false);
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState({
    users: false,
    requests: false,
    general: false
  });
  const [error, setError] = useState<string | null>(null);
  const [showUsers, setShowUsers] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequests, setProcessingRequests] = useState<Record<string, boolean>>({});
  const [verificationRadius, setVerificationRadius] = useState(500);
  const [isUpdatingRadius, setIsUpdatingRadius] = useState(false);
  const BASE_URL = process.env.API_BASE_URL || "https://negevpulsapp.onrender.com";
  
  const fetchUsers = async () => {
    try {
      setLoading(prev => ({ ...prev, users: true }));
      setError(null);
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.get(`${BASE_URL}/api/users`, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Invalid response format');
      }

      setUsers(response.data.data || []);
    } catch (error) {
      let errorMessage = 'Failed to fetch users';
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Request timeout. Please check your connection.';
        } else if (error.response) {
          errorMessage = error.response.data?.message || 
                       `Server error: ${error.response.status}`;
        } else if (error.request) {
          errorMessage = 'No response from server. Check your network.';
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      console.error('Fetch error:', error);
      
      if (!errorMessage.includes('token')) {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
      setRefreshing(false);
    }
  };
const fetchSuperLocalRequests = async () => {
  try {
    setLoading(prev => ({ ...prev, requests: true }));
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get(
      "https://negevpulsapp.onrender.com/api/auth/superlocal/requests", // Changed from /api/auth/superlocal/requests
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        validateStatus: (status) => status < 500
      }
    );

    console.log('API Response:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });

    if (response.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('token');
      router.replace('/');
      return;
    }

    if (response.status === 500) {
      throw new Error('Server encountered an error. Please try again later.');
    }

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Invalid response format');
    }

    const requests = response.data.requests?.map((request: SuperLocalRequest) => ({
      ...request,
      name: request.name || 'Unknown',
      email: request.email || 'No email'
    })) || [];
    
    setSuperLocalRequests(requests);
    await AsyncStorage.setItem('superLocalRequests', JSON.stringify(requests));
  } catch (error) {
    console.error('Error fetching requests:', error);
    
    let errorMessage = 'Failed to load requests';
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.message || 
                      `Server error (${error.response.status})`;
      } else {
        errorMessage = error.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    const cachedRequests = await AsyncStorage.getItem('superLocalRequests');
    if (cachedRequests) {
      setSuperLocalRequests(JSON.parse(cachedRequests));
      Alert.alert(
        'Warning',
        `${errorMessage}. Using cached data.`
      );
    } else {
      Alert.alert('Error', errorMessage);
    }
  } finally {
    setLoading(prev => ({ ...prev, requests: false }));

  }
};

const handleRequestDecision = async (requestId: string, decision: 'approve' | 'reject') => {
  try {
    setProcessingRequests(prev => ({ ...prev, [requestId]: true }));
    
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      Alert.alert('Error', 'Authentication token not found');
      return;
    }

    const status = decision === 'approve' ? 'approved' : 'rejected';
    
    setSuperLocalRequests(prev => 
      prev.filter(req => req._id !== requestId)
    );

    const response = await axios.patch(
      `${BASE_URL}/api/superlocal/requests/${requestId}`, // Changed from /api/auth/superlocal/requests
      { status },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    ).catch(error => {
      fetchSuperLocalRequests();
      throw error;
    });
      
      if (response.data?.success) {
        // If approved, update the users list if it's being shown
        if (decision === 'approve' && response.data.updatedUser) {
          setUsers(prevUsers => 
            prevUsers.map(user => 
              user._id === response.data.updatedUser._id
                ? { ...user, isSuperlocalLocal: true }
                : user
            )
          );
        }
        
        Alert.alert('Success', `Request ${status} successfully`);
      } else {
        throw new Error(response.data?.message || 'Failed to update request');
      }
    } catch (error) {
      console.error('Decision error:', error);
      
      let errorMessage = 'Failed to process request';
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setProcessingRequests(prev => ({ ...prev, [requestId]: false }));
    }
  };
  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
    fetchSuperLocalRequests();
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };
  console.log("🚀 BASE_URL =", BASE_URL);

  useEffect(() => {
    if (showUsers) {
      fetchUsers();
    }
  }, [showUsers]);

  useEffect(() => {
    fetchSuperLocalRequests();
  }, []);

// Define fetchVerificationRadius first
// In your admin.tsx component:
const fetchVerificationRadius = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.get(`${BASE_URL}/api/settings/verification-radius`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setVerificationRadius(response.data.radius);
  } catch (error) {
    console.error('Error fetching radius:', error);
    // Set default if API fails
    setVerificationRadius(500);
  }
};

const updateVerificationRadius = async () => {
  try {
    setIsUpdatingRadius(true);
    const token = await AsyncStorage.getItem('token');
    const response = await axios.post(
      `${BASE_URL}/api/admin/settings/verification-radius`, 
      { radius: verificationRadius },
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      }
    );
    
    if (response.data.success) {
      Alert.alert('Success', response.data.message);
      setVerificationRadius(response.data.radius);
    } else {
      Alert.alert('Error', response.data.message || 'Failed to update radius');
    }
  } catch (error) {
    console.error('Error updating radius:', error);
    
    let errorMessage = 'Failed to update radius';
    if (axios.isAxiosError(error)) {
      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      }
    }
    
    Alert.alert('Error', errorMessage);
  } finally {
    setIsUpdatingRadius(false);
  }
};
// Call fetchVerificationRadius in useEffect
useEffect(() => {
  fetchVerificationRadius();
}, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <MaterialIcons name="logout" size={20} color="#FFD700" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#8b5e3c']}
            tintColor="#8b5e3c"
          />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <FontAwesome name="users" size={24} color="#5d4037" />
            <Text style={styles.statLabel}>Total Users</Text>
            <Text style={styles.statValue}>{users.length}</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="report" size={24} color="#5d4037" />
            <Text style={styles.statLabel}>Active Reports</Text>
            <Text style={styles.statValue}>0</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="pending-actions" size={24} color="#5d4037" />
            <Text style={styles.statLabel}>Pending Requests</Text>
            <Text style={styles.statValue}>
              {superLocalRequests.filter(req => req.status === 'pending').length}
            </Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="health-and-safety" size={24} color="#5d4037" />
            <Text style={styles.statLabel}>System Health</Text>
            <Text style={styles.statValue}>100%</Text>
          </View>
        </View>
        <View style={styles.toolCard}>
          <View style={styles.toolHeader}>
            <MaterialIcons name="settings" size={24} color="#5d4037" />
            <Text style={styles.toolTitle}>Verification Settings</Text>
          </View>

          <View style={styles.radiusControl}>
            <Text style={styles.radiusLabel}>Verification Radius: {verificationRadius}m</Text>
            <Slider
              style={styles.radiusSlider}
              minimumValue={100}
              maximumValue={5000}
              step={100}
              value={verificationRadius}
              onValueChange={setVerificationRadius}
              minimumTrackTintColor="#6d4c41"
              maximumTrackTintColor="#d7ccc8"
              thumbTintColor="#6d4c41"
            />
            <TouchableOpacity 
              style={styles.updateRadiusButton}
              onPress={updateVerificationRadius}
              disabled={isUpdatingRadius}
            >
              {isUpdatingRadius ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.updateRadiusButtonText}>Update Radius</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Admin Tools */}
        <View style={styles.toolsContainer}>
          {/* User Management */}
          <View style={styles.toolCard}>
            <View style={styles.toolHeader}>
              <MaterialIcons name="people" size={24} color="#5d4037" />
              <Text style={styles.toolTitle}>User Management</Text>
            </View>
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#6d4c41' }]}
                onPress={() => setShowUsers(!showUsers)}
                disabled={loading.users}
              >
                {loading.users ? (
                  <ActivityIndicator color="#FFD700" size="small" />
                ) : (
                  <Text style={styles.buttonText}>
                    {showUsers ? 'Hide Users' : 'View All Users'}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#8d6e63' }]}
                onPress={() => router.push('/signup')}
              >
                <Text style={styles.buttonText}>Create New User</Text>
              </TouchableOpacity>
            </View>

            {showUsers && (
              <View style={styles.usersTable}>
                {loading.users ? (
                  <ActivityIndicator size="large" color="#8b5e3c" style={styles.loader} />
                ) : error ? (
                  <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={40} color="#d9534f" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity 
                      style={styles.refreshButton}
                      onPress={fetchUsers}
                    >
                      <MaterialIcons name="refresh" size={20} color="#FFD700" />
                      <Text style={styles.refreshText}>Try Again</Text>
                    </TouchableOpacity>
                  </View>
                ) : users.length === 0 ? (
                  <View style={styles.emptyState}>
                    <MaterialIcons name="people-outline" size={50} color="#8d6e63" />
                    <Text style={styles.emptyText}>No users found</Text>
                    <TouchableOpacity 
                      style={styles.refreshButton}
                      onPress={fetchUsers}
                    >
                      <MaterialIcons name="refresh" size={20} color="#FFD700" />
                      <Text style={styles.refreshText}>Refresh</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <FlatList
                    data={users}
                    keyExtractor={(item) => item._id}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <View style={styles.userRow}>
                        <Text style={styles.userCell}>{item.name || 'N/A'}</Text>
                        <Text style={styles.userCell}>{item.email}</Text>
                        <Text style={[
                          styles.userCell,
                          item.role === 'admin' ? styles.adminRole :
                          item.role === 'emergency' ? styles.emergencyRole :
                          styles.localRole
                        ]}>
                          {item.role}
                        </Text>
                        <Text style={styles.userCell}>
                          {item.isSuperlocal ? 'Yes' : 'No'}
                        </Text>
                      </View>
                    )}
                    ListHeaderComponent={() => (
                      <View style={[styles.userRow, styles.headerRow]}>
                        <Text style={styles.headerCell}>Name</Text>
                        <Text style={styles.headerCell}>Email</Text>
                        <Text style={styles.headerCell}>Role</Text>
                        <Text style={styles.headerCell}>Super Local</Text>
                      </View>
                    )}
                  />
                )}
              </View>
            )}
          </View>

          {/* Super Local Requests */}
          <View style={styles.toolCard}>
            <View style={styles.toolHeader}>
              <MaterialIcons name="supervisor-account" size={24} color="#5d4037" />
              <Text style={styles.toolTitle}>Super Local Requests</Text>
            </View>
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#6d4c41' }]}
                onPress={() => {
                  setShowRequests(!showRequests);
                  fetchSuperLocalRequests();
                }}
                disabled={loading.requests}
              >
                {loading.requests ? (
                  <ActivityIndicator color="#FFD700" size="small" />
                ) : (
                  <Text style={styles.buttonText}>
                    {showRequests ? 'Hide Requests' : 'View Requests'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {showRequests && (
              <View style={styles.usersTable}>
                {loading.requests ? (
                  <ActivityIndicator size="large" color="#8b5e3c" style={styles.loader} />
                ) : (
                  <FlatList
                    data={superLocalRequests}
                    keyExtractor={(item) => item._id}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <View style={styles.requestRow}>
                        <View style={styles.requestInfo}>
                          <View style={styles.requestDetails}>
                            <Text style={styles.requestName}>{item.name || 'N/A'}</Text>
                            <Text style={styles.requestEmail}>{item.email}</Text>
                            <View style={styles.statusContainer}>
                              <Text style={styles.requestLabel}>Status: </Text>
                              <Text style={[styles.statusText, styles[item.status]]}>
                                {item.status}
                              </Text>
                            </View>
                            <View style={styles.statusContainer}>
                              <Text style={styles.requestLabel}>Date: </Text>
                              <Text style={styles.requestDate}>
                                {new Date(item.createdAt).toLocaleDateString()}
                              </Text>
                            </View>
                          </View>
                        </View>
                        {item.status === 'pending' && (
                          <View style={styles.requestActions}>
                            <TouchableOpacity
                              style={[styles.requestButton, styles.approveButton]}
                              onPress={() => handleRequestDecision(item._id, 'approve')}
                              disabled={processingRequests[item._id]}
                            >
                              {processingRequests[item._id] ? (
                                <ActivityIndicator color="white" size="small" />
                              ) : (
                                <Text style={styles.requestButtonText}>Approve</Text>
                              )}
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.requestButton, styles.rejectButton]}
                              onPress={() => handleRequestDecision(item._id, 'reject')}
                              disabled={processingRequests[item._id]}
                            >
                              {processingRequests[item._id] ? (
                                <ActivityIndicator color="white" size="small" />
                              ) : (
                                <Text style={styles.requestButtonText}>Reject</Text>
                              )}
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}
                    ListEmptyComponent={
                      <View style={styles.emptyState}>
                        <MaterialIcons name="list-alt" size={50} color="#8d6e63" />
                        <Text style={styles.emptyText}>No requests found</Text>
                        <TouchableOpacity 
                          style={styles.refreshButton}
                          onPress={fetchSuperLocalRequests}
                        >
                          <MaterialIcons name="refresh" size={20} color="#FFD700" />
                          <Text style={styles.refreshText}>Refresh</Text>
                        </TouchableOpacity>
                      </View>
                    }
                  />
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#5d4037',
    paddingTop: 50,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8d6e63',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  logoutText: {
    color: '#FFD700',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statLabel: {
    color: '#8d6e63',
    fontSize: 14,
    marginTop: 5,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5d4037',
  },
  toolsContainer: {
    marginBottom: 20,
  },
  toolCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  toolTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#5d4037',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  usersTable: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  loader: {
    marginVertical: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requestLabel: {
    fontSize: 14,
    color: '#5d4037',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  pending: {
    color: '#f0ad4e',
  },
  approved: {
    color: '#5cb85c',
  },
  rejected: {
    color: '#d9534f',
  },
  requestDetails: {
    flex: 1,
    marginLeft: 10,
  },
  requestName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#5d4037',
    marginBottom: 4,
  },
  requestEmail: {
    fontSize: 14,
    color: '#8d6e63',
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 12,
    color: '#a1887f',
    fontStyle: 'italic',
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerRow: {
    backgroundColor: '#5d4037',
  },
  headerCell: {
    color: '#FFD700',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  userCell: {
    flex: 1,
    textAlign: 'center',
    color: '#5d4037',
    fontSize: 12,
  },
  requestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0e0e0',
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestActions: {
    flexDirection: 'row',
  },
  requestButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: '#388e3c',
  },
  rejectButton: {
    backgroundColor: '#d32f2f',
  },
  requestButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#d9534f',
    fontSize: 16,
    marginVertical: 10,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5d4037',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  refreshText: {
    color: '#FFD700',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#8d6e63',
    fontSize: 16,
    marginVertical: 10,
  },
  adminRole: {
    color: '#d9534f',
    fontWeight: 'bold',
  },
  emergencyRole: {
    color: '#f0ad4e',
    fontWeight: 'bold',
  },
  localRole: {
    color: '#5cb85c',
    fontWeight: 'bold',
  },
  radiusControl: {
  marginTop: 15,
},
radiusLabel: {
  fontSize: 14,
  color: '#5d4037',
  marginBottom: 10,
},
radiusSlider: {
  width: '100%',
  height: 40,
},
updateRadiusButton: {
  backgroundColor: '#6d4c41',
  padding: 12,
  borderRadius: 6,
  marginTop: 15,
  alignItems: 'center',
},
updateRadiusButtonText: {
  color: '#FFD700',
  fontWeight: 'bold',
},
});