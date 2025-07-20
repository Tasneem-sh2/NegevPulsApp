import { MaterialIcons } from '@expo/vector-icons';
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

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  isSuperlocalLocal?: boolean;
}

interface SuperLocalRequest {
  _id: string;
  userId: string;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  avatar?: string;
}

export default function AdminDashboard() {
  const [superLocalRequests, setSuperLocalRequests] = useState<SuperLocalRequest[]>([]);
  const [showRequests, setShowRequests] = useState(false);
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUsers, setShowUsers] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequests, setProcessingRequests] = useState<Record<string, boolean>>({});
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || "http://10.0.0.14:8082";

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching from: ${baseUrl}/api/users`);

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.get(`${baseUrl}/api/users`, {
        timeout: 5000,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data?.success) {
        setUsers(response.data.data || []);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      let errorMessage = 'Failed to fetch users';
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || 
            error.message || 
                'Network error occurred';
      }
      setError(errorMessage);
      console.error('Fetch error:', error);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  useEffect(() => {
    if (showUsers) {
      fetchUsers();
    }
  }, [showUsers]);

  useEffect(() => {
    fetchSuperLocalRequests();
  }, []);

  const fetchSuperLocalRequests = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(
        `${baseUrl}/api/auth/superlocal/requests`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('API Response:', response.data);

      if (response.data?.success) {
        const requests = response.data.requests.map((request: SuperLocalRequest) => ({
          ...request,
          name: request.name || 'Unknown',
          email: request.email || 'No email'
        }));
        
        setSuperLocalRequests(requests);
        await AsyncStorage.setItem(
          'superLocalRequests',
          JSON.stringify(requests)
        );
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      
      const cachedRequests = await AsyncStorage.getItem('superLocalRequests');
      if (cachedRequests) {
        setSuperLocalRequests(JSON.parse(cachedRequests));
        Alert.alert(
          'Warning',
          'Using cached data. Could not fetch latest requests.'
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to load requests. Please check your connection.'
        );
      }
    } finally {
      setLoading(false);
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
      
      // Optimistic UI update - remove the request immediately
      setSuperLocalRequests(prev => 
        prev.filter(req => req._id !== requestId)
      );

      const response = await axios.patch(
        `${baseUrl}/api/auth/superlocal/requests/${requestId}`,
        { status },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      ).catch(error => {
        // Revert optimistic update on error
        fetchSuperLocalRequests(); // Refresh the list
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

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

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
              <MaterialIcons name="logout" size={24} color="#FFD700" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => router.push('/addVillage')}
            >
              <MaterialIcons name="add" size={20} color="#FFD700" />
              <Text style={styles.addButtonText}>Add Village</Text>
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
            <Text style={styles.statLabel}>Total Users</Text>
            <Text style={styles.statValue}>{users.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active Reports</Text>
            <Text style={styles.statValue}>4</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pending Requests</Text>
            <Text style={styles.statValue}>
              {superLocalRequests.filter(req => req.status === 'pending').length}
            </Text>
          </View>
          <View style={[styles.statCard, { borderBottomColor: '#8d6e63' }]}>
            <Text style={styles.statLabel}>System Health</Text>
            <Text style={[styles.statValue, { color: '#8d6e63' }]}>100%</Text>
          </View>
        </View>
        
        {/* Admin Tools */}
        <View style={styles.toolsContainer}>
          {/* User Management */}
          <View style={styles.toolCard}>
            <Text style={styles.toolTitle}>User Management</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#6d4c41' }]}
                onPress={() => setShowUsers(!showUsers)}
              >
                <Text style={styles.buttonText}>
                  {showUsers ? 'Hide Users' : 'View All Users'}
                </Text>
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
                {loading && !refreshing ? (
                  <ActivityIndicator size="large" color="#8b5e3c" />
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
                        <Text style={styles.userCell}>{item.name}</Text>
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
                          {item.isSuperlocalLocal ? 'Yes' : 'No'}
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
            <Text style={styles.toolTitle}>Super Local Requests</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#6d4c41' }]}
                onPress={() => {
                  setShowRequests(!showRequests);
                  fetchSuperLocalRequests();
                }}
              >
                <Text style={styles.buttonText}>
                  {showRequests ? 'Hide Requests' : 'View Requests'}
                </Text>
              </TouchableOpacity>
            </View>

            {showRequests && (
              <View style={styles.usersTable}>
                {loading ? (
                  <ActivityIndicator size="large" color="#8b5e3c" />
                ) : (
                  <FlatList
                    data={superLocalRequests}
                    keyExtractor={(item) => item._id}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <View style={styles.requestRow}>
                        <View style={styles.requestInfo}>
                          
                          <View style={styles.requestDetails}>
                            <Text style={styles.requestName}>{item.name}</Text>
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
                                {new Date(item.createdAt).toLocaleDateString('en-US', {
                                  month: 'numeric',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
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
    backgroundColor: '#fff',
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
  header: {
    backgroundColor: '#6d4c41',
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
  },
  logoutText: {
    color: '#FFD700',
    marginLeft: 5,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8d6e63',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  addButtonText: {
    color: '#FFD700',
    fontWeight: 'bold',
    marginLeft: 5,
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
    borderBottomWidth: 3,
    borderBottomColor: '#6d4c41',
    borderWidth: 1,
    borderColor: '#f0e6e2',
  },
  statLabel: {
    color: '#8d6e63',
    fontSize: 14,
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
    borderColor: '#f0e6e2',
  },
  toolTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#6d4c41',
  },
  buttonGroup: {
    marginTop: 10,
  },
  button: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    alignItems: 'center',
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
  pending: {
    color: '#f0ad4e',
    fontWeight: 'bold',
  },
  approved: {
    color: '#5cb85c',
    fontWeight: 'bold',
  },
  rejected: {
    color: '#d9534f',
    fontWeight: 'bold',
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
    backgroundColor: '#6d4c41',
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
  requestAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    backgroundColor: '#6d4c41',
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
});