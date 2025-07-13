import React, { useEffect, useRef, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  TextInput, 
  Alert,
  Modal,
  ActivityIndicator,
  Platform
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'expo-router/build/hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

const API_BASE_URL = 'http://10.0.0.8:8082/api';

// Types
interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface VerificationData {
  totalWeight: number;
  yesWeight: number;
  noWeight: number;
  confidenceScore: number;
}

interface Vote {
  userId: string;
  vote: 'yes' | 'no';
  weight: number;
  timestamp?: Date;
}

interface Landmark {
  _id: string;
  title: string;
  description: string;
  lat: number;
  lon: number;
  color: string;
  imageUrl: string;
  verified: boolean;
  status: 'pending' | 'verified' | 'rejected' | 'disputed';
  votes: Vote[];
  verificationData?: VerificationData;
  createdBy: string;
  _calculatedWeights?: {
    totalWeight: number;
    yesWeight: number;
    noWeight: number;
  };
}

interface User {
  _id: string;
  isSuperlocallocal?: boolean;
  reputationScore?: number;
  role?: string;
  verifiedLandmarksAdded?: number;
  getVoteWeight?: () => number;
}

interface VoteResponse {
  success: boolean;
  data: Landmark;
  message?: string;
  userWeight?: number;
}

interface ErrorResponse {
  message?: string;
  error?: string;
  stack?: string;
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
}

// Components
const LandmarkListItem: React.FC<{
  landmark: Landmark;
  onClick: () => void;
  isSelected: boolean;
}> = ({ landmark, onClick, isSelected }) => {
  return (
    <TouchableOpacity 
      onPress={onClick}
      style={[
        styles.listItem,
        isSelected && styles.selectedListItem
      ]}
    >
      <View style={styles.listItemContent}>
        <View style={[
          styles.listItemDot,
          { 
            backgroundColor: landmark.verified ? landmark.color : '#AAAAAA',
            borderWidth: landmark.verified ? 0 : 1,
            borderColor: landmark.verified ? 'transparent' : '#999'
          }
        ]} />
        <View style={styles.listItemTextContainer}>
          <Text style={[styles.listItemTitle, isSelected && styles.selectedListItemTitle]}>
            {landmark.title}
          </Text>
          <View style={styles.listItemStatus}>
            {landmark.verified ? (
              <>
                <MaterialIcons name="verified" size={14} color="#4CAF50" />
                <Text style={styles.verifiedText}>Verified</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="schedule" size={14} color="#FF9800" />
                <Text style={styles.pendingText}>Pending</Text>
              </>
            )}
          </View>
        </View>
        {isSelected && (
          <MaterialIcons name="chevron-right" size={20} color="#6d4c41" />
        )}
      </View>
    </TouchableOpacity>
  );
};

const getUserWeight = (user: User | null): number => {
  if (!user) return 1;
  if (user.isSuperlocallocal) return 4;
  if (user.verifiedLandmarksAdded && user.verifiedLandmarksAdded > 0) return 2;
  if (user.reputationScore && user.reputationScore >= 70) return 2;
  return 1;
};

const LandmarkModal: React.FC<{
  landmark: Landmark;
  currentUser: User | null;
  onClose: () => void;
  onVote: (landmarkId: string, voteType: 'yes' | 'no') => void;
  onDelete: (landmarkId: string) => void;
  isVoting: boolean;
  voteSuccess: string;
  voteError: string;
  deleteSuccess: string;
  deleteError: string;
}> = ({
  landmark,
  currentUser,
  onClose,
  onVote,
  onDelete,
  isVoting,
  voteSuccess,
  voteError,
  deleteSuccess,
  deleteError
}) => {
  const yesWeight = landmark.verificationData?.yesWeight || 
    landmark.votes
      .filter(v => v.vote === 'yes')
      .reduce((sum, vote) => sum + (vote.weight || 1), 0);

  const noWeight = landmark.verificationData?.noWeight || 
    landmark.votes
      .filter(v => v.vote === 'no')
      .reduce((sum, vote) => sum + (vote.weight || 1), 0);

  const totalWeight = landmark.verificationData?.totalWeight || 
    (yesWeight + noWeight);
    
  const percentageYes = totalWeight > 0 ? (yesWeight / totalWeight * 100) : 0;
  const requiredWeight = 5 + (0.2 * landmark.votes.length);
  const confidenceScore = landmark.verificationData?.confidenceScore || 
      Math.min(100, 
      (Math.min(1, totalWeight / (requiredWeight * 1.5)) * 50) +
      ((yesWeight / Math.max(1, totalWeight)) * 50)
       );

  const currentUserVote = landmark.votes.find(v => v.userId === currentUser?._id);
  const userWeight = currentUserVote?.weight || 0;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <ScrollView 
          style={styles.modalContainer}
          contentContainerStyle={styles.modalContent}
        >
          <TouchableOpacity 
            style={styles.modalContentInner}
            activeOpacity={1}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{landmark.title}</Text>
              <TouchableOpacity onPress={onClose}>
                <MaterialIcons name="close" size={24} color="#6d4c41" />
              </TouchableOpacity>
            </View>

            {/* Status Badge */}
            <View style={styles.statusBadge}>
              {landmark.verified ? (
                <>
                  <MaterialIcons name="verified" size={20} color="#4CAF50" />
                  <Text style={styles.verifiedBadgeText}>Verified Landmark</Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="schedule" size={20} color="#FF9800" />
                  <Text style={styles.pendingBadgeText}>
                    Pending Verification
                    {landmark.status === 'disputed' && ' (Needs Tribal Review)'}
                  </Text>
                </>
              )}
            </View>
            
            {/* Image Preview */}
            {landmark.imageUrl && (
              <Image 
                source={{ uri: landmark.imageUrl }}
                style={styles.landmarkImage}
                onError={() => console.log('Image load error')}
              />
            )}

            {/* Coordinates Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Coordinates</Text>
              <View style={styles.coordinatesContainer}>
                <View style={styles.coordinateItem}>
                  <MaterialIcons name="place" size={18} color="#8d6e63" />
                  <View>
                    <Text style={styles.coordinateLabel}>Latitude</Text>
                    <Text style={styles.coordinateValue}>{landmark.lat.toFixed(6)}</Text>
                  </View>
                </View>
                <View style={styles.coordinateItem}>
                  <MaterialIcons name="place" size={18} color="#8d6e63" />
                  <View>
                    <Text style={styles.coordinateLabel}>Longitude</Text>
                    <Text style={styles.coordinateValue}>{landmark.lon.toFixed(6)}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Description Section */}
            {landmark.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.descriptionText}>{landmark.description}</Text>
              </View>
            )}

            {/* Verification Status Section */}
            <View style={styles.verificationContainer}>
              <Text style={styles.verificationTitle}>Verification Status</Text>
              
              {/* Confidence Meter */}
              <View style={styles.confidenceMeter}>
                <View style={styles.confidenceHeader}>
                  <Text>Confidence Score:</Text>
                  <Text style={[
                    styles.confidenceValue,
                    { 
                      color: confidenceScore > 75 ? '#4CAF50' : 
                            confidenceScore > 50 ? '#FF9800' : '#f44336'
                    }
                  ]}>
                    {Math.round(confidenceScore)}%
                  </Text>
                </View>
                <View style={styles.confidenceBarBackground}>
                  <View style={[
                    styles.confidenceBarFill,
                    { 
                      width: `${confidenceScore}%`,
                      backgroundColor: confidenceScore > 75 ? '#4CAF50' : 
                                      confidenceScore > 50 ? '#FF9800' : '#f44336'
                    }
                  ]} />
                </View>
              </View>
              
              {/* Vote Breakdown */}
              <View style={styles.voteBreakdown}>
                <Text style={styles.yesText}>
                  Yes: {yesWeight.toFixed(1)} ({(percentageYes).toFixed(0)}%)
                </Text>
                <Text style={styles.noText}>
                  No: {noWeight.toFixed(1)} ({(100 - percentageYes).toFixed(0)}%)
                </Text>
              </View>
              
              <View style={styles.voteBarBackground}>
                <View style={[
                  styles.voteBarFill,
                  { width: `${percentageYes}%` }
                ]} />
              </View>

              {/* Weight Information */}
              <View style={styles.weightInfo}>
                <View style={styles.weightItem}>
                  <Text style={styles.weightLabel}>Total Weight</Text>
                  <Text style={styles.weightValue}>{totalWeight.toFixed(1)}</Text>
                </View>
                <View style={styles.weightItem}>
                  <Text style={styles.weightLabel}>Required</Text>
                  <Text style={styles.weightValue}>{requiredWeight.toFixed(1)}</Text>
                </View>
              </View>

              {/* User Weight */}
              {currentUser && (
                <View style={styles.userWeightContainer}>
                  <View style={styles.userWeightHeader}>
                    <Text>Your Voting Power:</Text>
                    <Text style={[
                      styles.userWeightValue,
                      { 
                        color: userWeight >= 4 ? '#4CAF50' : 
                              userWeight >= 2 ? '#FF9800' : '#757575'
                      }
                    ]}>
                      {userWeight.toFixed(1)}x
                    </Text>
                  </View>
                  {userWeight > 1 && (
                    <Text style={styles.userWeightDescription}>
                      {userWeight >= 4 ? 'Super Local' : 
                      userWeight >= 2 ? 'Verified Contributor' : ''}
                    </Text>
                  )}
                  {currentUserVote && (
                    <Text style={styles.userVoteInfo}>
                      You voted {currentUserVote.vote} (weight: {currentUserVote.weight.toFixed(1)})
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Vote Buttons */}
            {!landmark.verified && landmark.status !== 'disputed' && (
              <View style={styles.voteButtons}>
                <TouchableOpacity
                  onPress={() => onVote(landmark._id, 'yes')}
                  disabled={isVoting}
                  style={[
                    styles.voteButton,
                    styles.yesButton,
                    currentUserVote?.vote === 'yes' && styles.activeVoteButton,
                    isVoting && styles.disabledButton
                  ]}
                >
                  {isVoting ? (
                    <ActivityIndicator color="white" />
                  ) : currentUserVote?.vote === 'yes' ? (
                    <Text style={styles.buttonText}>✔ Voted Yes</Text>
                  ) : (
                    <Text style={styles.buttonText}>Vote Yes</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => onVote(landmark._id, 'no')}
                  disabled={isVoting}
                  style={[
                    styles.voteButton,
                    styles.noButton,
                    currentUserVote?.vote === 'no' && styles.activeVoteButton,
                    isVoting && styles.disabledButton
                  ]}
                >
                  {isVoting ? (
                    <ActivityIndicator color="white" />
                  ) : currentUserVote?.vote === 'no' ? (
                    <Text style={styles.buttonText}>✔ Voted No</Text>
                  ) : (
                    <Text style={styles.buttonText}>Vote No</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Dispute Notice */}
            {landmark.status === 'disputed' && (
              <View style={styles.disputeNotice}>
                <View style={styles.disputeHeader}>
                  <MaterialIcons name="warning" size={20} color="#FF9800" />
                  <Text style={styles.disputeTitle}>Tribal Review Needed</Text>
                </View>
                <Text style={styles.disputeText}>
                  This landmark has conflicting votes and requires review by the tribal council.
                </Text>
              </View>
            )}

            {/* Status Messages */}
            {(voteSuccess || voteError || deleteSuccess || deleteError) && (
              <View style={styles.statusMessages}>
                {voteSuccess && (
                  <View style={styles.successMessage}>
                    <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                    <Text style={styles.successText}>{voteSuccess}</Text>
                  </View>
                )}
                {voteError && (
                  <View style={styles.errorMessage}>
                    <MaterialIcons name="error" size={20} color="#f44336" />
                    <Text style={styles.errorText}>{voteError}</Text>
                  </View>
                )}
                {deleteSuccess && (
                  <View style={styles.successMessage}>
                    <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                    <Text style={styles.successText}>{deleteSuccess}</Text>
                  </View>
                )}
                {deleteError && (
                  <View style={styles.errorMessage}>
                    <MaterialIcons name="error" size={20} color="#f44336" />
                    <Text style={styles.errorText}>{deleteError}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {currentUser && (
                <TouchableOpacity 
                  onPress={() => onDelete(landmark._id)}
                  disabled={
                    (landmark.createdBy?.toString() ?? '') !== currentUser._id && 
                    currentUser.role !== 'admin'
                  }
                  style={[
                    styles.deleteButton,
                    (landmark.createdBy.toString() !== currentUser._id && 
                    currentUser.role !== 'admin') && styles.disabledButton
                  ]}
                >
                  <Text style={styles.deleteButtonText}>Delete Landmark</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                onPress={onClose}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </TouchableOpacity>
    </Modal>
  );
};

// Main Component
const LandmarkPage: React.FC = () => {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [clickedLocation, setClickedLocation] = useState<LocationCoords | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [newLandmark, setNewLandmark] = useState({
    title: '',
    description: '',
    lat: 0,
    lon: 0,
    color: '#8B4513',
    imageUrl: ''
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();
  const [voteError, setVoteError] = useState("");
  const [voteSuccess, setVoteSuccess] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [region, setRegion] = useState({
    latitude: 24.7136,
    longitude: 46.6753,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Load landmarks
  useEffect(() => {
    const loadLandmarks = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_BASE_URL}/landmarks`);
        setLandmarks(response.data);
      } catch (error) {
        console.error("Error loading landmarks:", error);
        setLandmarks([]);
      } finally {
        setIsLoading(false);
        setIsMapLoading(false);
      }
    };
    loadLandmarks();
  }, []);

  // Get user location
  useEffect(() => {
    const getLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Permission to access location was denied');
        }

        let location = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        };
        
        setLocation(coords);
        setRegion({
          ...coords,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      } catch (error) {
        console.error("Error getting location:", error);
        const defaultCoords = {
          latitude: 24.7136,
          longitude: 46.6753
        };
        setLocation(defaultCoords);
        setRegion({
          ...defaultCoords,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    };

    getLocation();
  }, []);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.log("No token found");
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setCurrentUserId(response.data.user._id);
        setCurrentUser({
          _id: response.data.user._id,
          isSuperlocallocal: response.data.user.isSuperlocallocal,
          reputationScore: response.data.user.reputationScore,
          role: response.data.user.role
        });
        setCurrentUserRole(response.data.user.role);
      } catch (error) {
        console.error("Auth check failed:", error);
        await AsyncStorage.removeItem('token');
      }
    };

    fetchUser();
  }, []);

  // Clear success/error messages after timeout
  useEffect(() => {
    if (voteSuccess) {
      const timer = setTimeout(() => setVoteSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [voteSuccess]);

  useEffect(() => {
    if (deleteSuccess || deleteError) {
      const timer = setTimeout(() => {
        setDeleteSuccess("");
        setDeleteError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [deleteSuccess, deleteError]);

  // Handle map press
  const handleMapPress = (e: any) => {
    const { coordinate } = e.nativeEvent;
    setClickedLocation(coordinate);
    setNewLandmark(prev => ({
      ...prev,
      lat: coordinate.latitude,
      lon: coordinate.longitude,
    }));
    setShowForm(true);
  };

  // Pick image
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setNewLandmark(prev => ({
        ...prev,
        imageUrl: result.assets[0].uri
      }));
    }
  };

  // Add new landmark
  const addLandmark = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
         if (Platform.OS === 'web' && newLandmark.imageUrl) {
      // معالجة الصور للويب
      const response = await axios.post(`${API_BASE_URL}/upload`, {
        image: newLandmark.imageUrl
      });
      newLandmark.imageUrl = response.data.url;
    }

      if (!newLandmark.title.trim()) {
        Alert.alert('Error', 'Please enter a landmark title');
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/landmarks`, {
        title: newLandmark.title.trim(),
        description: newLandmark.description.trim(),
        lat: newLandmark.lat,
        lon: newLandmark.lon,
        color: newLandmark.color || '#8B4513',
        imageUrl: newLandmark.imageUrl || ''
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      setLandmarks(prev => [...prev, response.data]);
      setShowForm(false);
      setNewLandmark({
        title: '',
        description: '',
        lat: 0,
        lon: 0,
        color: '#8B4513',
        imageUrl: ''
      });
    } catch (error) {
      console.error("Error adding landmark:", error);
      Alert.alert("Error", "Failed to add landmark. Please try again.");
    }
  };

  // Handle landmark vote
  const handleLandmarkVote = async (landmarkId: string, voteType: 'yes' | 'no') => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      setIsVoting(true);
      setVoteError("");
      setVoteSuccess("");

      const response = await axios.put<VoteResponse>(
        `${API_BASE_URL}/landmarks/${landmarkId}/vote`,
        { vote: voteType },
        {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setLandmarks(prev => prev.map(l => 
        l._id === landmarkId ? response.data.data : l
      ));
      
      const weight = response.data.userWeight ?? getUserWeight(currentUser);
      setVoteSuccess(`Vote recorded! (Weight: ${weight}x)`);
      
    } catch (error: any) {
      let errorMessage = "Failed to submit vote";
      
      if (error.response) {
        console.error("Server response error:", {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        
        errorMessage = error.response.data?.error || 
                      error.response.data?.message || 
                      `Server error (${error.response.status})`;
      } else if (error.request) {
        console.error("No response received:", error.request);
        errorMessage = "No response from server";
      } else {
        console.error("Request setup error:", error.message);
        errorMessage = error.message;
      }
      
      setVoteError(errorMessage);
      
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('token');
        router.push('/login');
      }
    } finally {
      setIsVoting(false);
    }
  };

  // Handle landmark deletion
  const handleDeleteLandmark = async (landmarkId: string) => {
    try {
      setDeleteError("");
      setDeleteSuccess("");
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      await axios.delete(`${API_BASE_URL}/landmarks/${landmarkId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setLandmarks(prev => prev.filter(l => l._id !== landmarkId));
      if (selectedLandmark?._id === landmarkId) {
        setSelectedLandmark(null);
      }
      
      setDeleteSuccess("Landmark deleted successfully!");
    } catch (error) {
      console.error("Error deleting landmark:", error);
      
      let errorMessage = "Failed to delete landmark";
      const axiosError = error as AxiosError<{ message?: string }>;
      
      if (axiosError.response?.status === 401) {
        errorMessage = "Session expired. Please login again.";
        await AsyncStorage.multiRemove(['user', 'token']);
        router.push('/login');
      } else if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      }
      
      setDeleteError(errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      {isMapLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6d4c41" />
          <Text>Loading map...</Text>
        </View>
      ) : (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={region}
            onRegionChangeComplete={setRegion}
            onPress={handleMapPress}
          >
            {location && (
              <Marker
                coordinate={location}
                title="Your Location"
                pinColor="#FFD700"
              />
            )}
            
            {landmarks.map(landmark => (
              <Marker
                key={landmark._id}
                coordinate={{
                  latitude: landmark.lat,
                  longitude: landmark.lon
                }}
                title={landmark.title}
                description={landmark.verified ? '' : ' (Pending)'}
                pinColor={landmark.verified ? landmark.color : '#AAAAAA'}
                onPress={() => setSelectedLandmark(landmark)}
              />
            ))}
          </MapView>

          {clickedLocation && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>Selected Location:</Text>
              <Text>Latitude: {clickedLocation.latitude.toFixed(6)}</Text>
              <Text>Longitude: {clickedLocation.longitude.toFixed(6)}</Text>
            </View>
          )}

          {showForm && (
  <View style={styles.formContainer}>
    <ScrollView 
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.formContent}>
        <Text style={styles.formTitle}>Add New Landmark</Text>
        <TextInput
          placeholder="Landmark title"
          value={newLandmark.title}
          onChangeText={(text) => setNewLandmark({...newLandmark, title: text})}
          style={styles.input}
        />
        <TextInput
          placeholder="Description (optional)"
          value={newLandmark.description}
          onChangeText={(text) => setNewLandmark({...newLandmark, description: text})}
          style={[styles.input, styles.descriptionInput]}
          multiline
          scrollEnabled={false} // سيتم التعامل مع التمرير بواسطة ScrollView الخارجي
        />
        <TouchableOpacity 
          style={styles.imagePickerButton}
          onPress={pickImage}
        >
          <Text style={styles.imagePickerText}>
            {newLandmark.imageUrl ? 'Change Image' : 'Select Image (optional)'}
          </Text>
        </TouchableOpacity>
        {newLandmark.imageUrl && (
          <Image 
            source={{ uri: newLandmark.imageUrl }}
            style={styles.previewImage}
          />
        )}
      </View>
    </ScrollView>
    
    {/* الأزرار خارج ScrollView لتكون دائمًا مرئية */}
    <View style={styles.formButtons}>
      <TouchableOpacity 
        onPress={addLandmark}
        disabled={!newLandmark.title.trim()}
        style={[
          styles.submitButton,
          !newLandmark.title.trim() && styles.disabledButton
        ]}
      >
        <Text style={styles.submitButtonText}>Add Landmark</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={() => setShowForm(false)}
        style={styles.cancelButton}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
)}

          {landmarks.length > 0 && (
            <ScrollView style={styles.landmarksList}>
              <Text style={styles.landmarksTitle}>Landmarks ({landmarks.length})</Text>
              {landmarks.map(landmark => (
                <LandmarkListItem 
                  key={landmark._id}
                  landmark={landmark}
                  onClick={() => setSelectedLandmark(landmark)}
                  isSelected={selectedLandmark?._id === landmark._id}
                />
              ))}
            </ScrollView>
          )}

          <View style={styles.mapInfo}>
            <Text style={styles.mapTitle}>Landmarks Map</Text>
            <Text>Press on the map to add a new landmark</Text>
          </View>
        </>
      )}

      {selectedLandmark && (
        <LandmarkModal 
          landmark={selectedLandmark}
          currentUser={currentUser}
          onClose={() => setSelectedLandmark(null)}
          onVote={handleLandmarkVote}
          onDelete={handleDeleteLandmark}
          isVoting={isVoting}
          voteSuccess={voteSuccess}
          voteError={voteError}
          deleteSuccess={deleteSuccess}
          deleteError={deleteError}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#f5f5f5",
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  locationInfo: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0e6e2",
    zIndex: 1,
  },
  locationTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  formContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -175 }, { translateY: -200 }],
    backgroundColor: "white",
    padding: 25,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0e6e2",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    width: 350,
    maxWidth: "90%",
    zIndex: 2,
    maxHeight: '80%', // أضف هذه السطر

  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: "#5d4037",
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#d7ccc8",
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#5d4037",
  },
  descriptionInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    maxHeight: 200, // حد أقصى للارتفاع

  },
  imagePickerButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d7ccc8',
    marginBottom: 20,
    alignItems: 'center',
  },
  imagePickerText: {
    color: '#5d4037',
    fontSize: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#d7ccc8',
  },
    scrollContainer: {
    flexGrow: 1,
    width: '100%',
  },
    formContent: {
    paddingBottom: 20, // تأكد من وجود مساحة للأزرار
  },
  formButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
    paddingTop: 10, // مساحة إضافية
    borderTopWidth: 1, // خط فاصل اختياري
    borderTopColor: '#f0e6e2'
  },
  submitButton: {
    backgroundColor: "#6d4c41",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d7ccc8",
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: "#5d4037",
    fontSize: 16,
  },
  landmarksList: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0e6e2",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    maxHeight: 300,
    width: 250,
    maxWidth: "90%",
    zIndex: 1,
  },
  landmarksTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 16,
  },
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0e6e2",
  },
  selectedListItem: {
    backgroundColor: '#f5f5f5',
    borderLeftWidth: 4,
    borderLeftColor: '#6d4c41',
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  listItemDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
  },
  listItemTextContainer: {
    flex: 1,
  },
  listItemTitle: {
    fontWeight: 'normal',
  },
  selectedListItemTitle: {
    fontWeight: 'bold',
  },
  listItemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "500",
    marginLeft: 4,
  },
  pendingText: {
    fontSize: 12,
    color: "#FF9800",
    fontWeight: "500",
    marginLeft: 4,
  },
  mapInfo: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0e6e2",
    zIndex: 1,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: "#5d4037",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalContentInner: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0e6e2',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6d4c41',
    margin: 0,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  verifiedBadgeText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  pendingBadgeText: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  landmarkImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#d7ccc8',
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#5d4037",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0e6e2",
    paddingBottom: 5,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 10,
  },
  coordinateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coordinateLabel: {
    fontSize: 12,
    color: '#757575',
  },
  coordinateValue: {
    fontWeight: '500',
  },
  descriptionText: {
    lineHeight: 24,
  },
  verificationContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#f0e6e2',
  },
  verificationTitle: {
    marginBottom: 15,
    fontSize: 16,
  },
  confidenceMeter: {
    marginBottom: 15,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  confidenceValue: {
    fontWeight: 'bold',
  },
  confidenceBarBackground: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
  },
  voteBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  yesText: {
    color: "#4CAF50",
    fontWeight: 'bold',
  },
  noText: {
    color: "#f44336",
    fontWeight: 'bold',
  },
  voteBarBackground: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  voteBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  weightInfo: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  weightItem: {
    flex: 1,
  },
  weightLabel: {
    fontSize: 12,
    color: '#757575',
  },
  weightValue: {
    fontWeight: 'bold',
  },
  userWeightContainer: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  userWeightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userWeightValue: {
    fontWeight: 'bold',
  },
  userWeightDescription: {
    fontSize: 12,
    color: '#757575',
    marginTop: 5,
  },
  userVoteInfo: {
    fontSize: 12,
    color: '#757575',
    marginTop: 5,
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  voteButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yesButton: {
    backgroundColor: '#4CAF50',
  },
  noButton: {
    backgroundColor: '#f44336',
  },
  activeVoteButton: {
    borderWidth: 3,
    borderColor: 'gold',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disputeNotice: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  disputeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  disputeTitle: {
    fontWeight: 'bold',
  },
  disputeText: {
    fontSize: 14,
  },
  statusMessages: {
    marginTop: 15,
  },
  successMessage: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  errorMessage: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderWidth: 1,
    borderColor: '#f44336',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  deleteButton: {
    backgroundColor: '#f44336',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#6d4c41',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default LandmarkPage;