import { useTranslations } from '@/frontend/constants/locales';
import { useLanguage } from '@/frontend/context/LanguageProvider';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router/build/hooks';
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
const GOOGLE_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY ?? '';
const API_BASE_URL = 'https://negevpulsapp.onrender.com/api';
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
interface Location {
  lat: number;
  lon: number;
}
interface VerificationBotProps {
  visible: boolean;
  landmark: Landmark | null;
  onVote: (vote: 'yes' | 'no') => void;
  onClose: () => void;
  onLandmarkPress: () => void; // هذه الخاصية مطلوبة
}
interface CollapsibleDrawerProps {
  title: string;
  children: React.ReactNode;
}
export const CollapsibleDrawer: React.FC<CollapsibleDrawerProps> = ({ title, children }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  return (
    <>
      {isExpanded ? (
        <View style={styles.expandedContainer}>
          <TouchableOpacity 
            style={styles.header}
            onPress={() => setIsExpanded(false)}
          >
            <Text style={styles.title}>{title}</Text>
            <MaterialIcons name="keyboard-arrow-down" size={24} color="#6d4c41" />
          </TouchableOpacity>
          
          <View style={styles.content}>
            {children}
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.collapsedButton}
          onPress={() => setIsExpanded(true)}
        >
          <MaterialIcons name="keyboard-arrow-up" size={24} color="#6d4c41" />
        </TouchableOpacity>
      )}
    </>
  );
};
const VerificationBot: React.FC<{
  visible: boolean;
  landmark: Landmark | null;
  onVote: (vote: 'yes' | 'no') => void;
  onClose: () => void;
  onLandmarkPress: () => void;
}> = ({ visible, landmark, onVote, onClose, onLandmarkPress }) => {
  const t = useTranslations();
  
  if (!visible || !landmark) return null;
  return (
    <View style={styles.botContainer}>
      <View style={styles.botHeader}>
        <TouchableOpacity onPress={onClose} style={styles.botCloseIcon}>
          <Ionicons name="close" size={24} color="#6d4c41" />
        </TouchableOpacity>
        <MaterialIcons name="support-agent" size={28} color="#6d4c41" style={styles.botIcon} />
          <Text style={styles.botTitle}>{t.addLandmark.helpVerify}</Text>
      </View>
      
      {/* محتوى البطاقة */}
      <TouchableOpacity onPress={onLandmarkPress} style={styles.botContent}>
        <Text style={styles.botQuestion}>Is this landmark accurate?</Text>
        
        {landmark.imageUrl && (
          <Image 
            source={{ uri: landmark.imageUrl }}
            style={styles.botLandmarkImage}
          />
        )}
        
        <View style={styles.landmarkLocationContainer}>
          <Text style={styles.botLandmarkName}>{landmark.title}</Text>
          <MaterialIcons name="location-on" size={20} color="#6d4c41" />
        </View>
        
        {landmark.description && (
          <Text style={styles.botLandmarkDescription} numberOfLines={2}>
            {landmark.description}
          </Text>
        )}
      </TouchableOpacity>
      
      {/* أزرار التصويت */}
      <View style={styles.botButtons}>
        <TouchableOpacity 
          style={[styles.botButton, styles.botYesButton]}
          onPress={() => onVote('yes')}
        >
          <MaterialIcons name="thumb-up" size={20} color="white" />
          <Text style={styles.botButtonText}>Confirm</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.botButton, styles.botNoButton]}
          onPress={() => onVote('no')}
        >
          <MaterialIcons name="thumb-down" size={20} color="white" />
          <Text style={styles.botButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
// Components
const LandmarkListItem: React.FC<{
  landmark: Landmark;
  onClick: () => void;
  isSelected: boolean;
}> = ({ landmark, onClick, isSelected }) => {
  const t = useTranslations();
  return (
    <TouchableOpacity 
      onPress={onClick}
      style={[
        styles.listItem,
        isSelected && styles.selectedListItem,
        !landmark.verified && styles.pendingListItem
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
          <Text style={[
            styles.listItemTitle, 
            isSelected && styles.selectedListItemTitle,
            !landmark.verified && styles.pendingListItemTitle
          ]}>
            {landmark.title}
          </Text>
          <View style={styles.listItemStatus}>
            {landmark.verified ? (
              <>
                <MaterialIcons name="verified" size={14} color="#4CAF50" />
                <Text style={styles.pendingText}>{t.addLandmark.verified}</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="schedule" size={14} color="#FF9800" />
                  <Text style={styles.pendingText}>{t.addLandmark.pendingVerification}</Text>
              </>
            )}
          </View>
          {isSelected && (
            <MaterialIcons name="chevron-right" size={20} color="#6d4c41" />
          )}
        </View>
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
        activeOpacity={0.7} // هنا نضيفها بشكل صحيح
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
            {!landmark.verified && landmark.status !== 'disputed' && 
              landmark.createdBy.toString() !== currentUser?._id && (
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
                  ((landmark.createdBy?.toString() ?? '') !== currentUser._id && 
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
const [verificationRadius, setVerificationRadius] = useState(500);
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
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'terrain' | 'hybrid'>('standard');
  const [isLandmarksListVisible, setIsLandmarksListVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMapInfo, setShowMapInfo] = useState(true);
  const [showBot, setShowBot] = useState(false);
  const [currentBotLandmark, setCurrentBotLandmark] = useState<Landmark | null>(null);
  const [showNearbyOnly, setShowNearbyOnly] = useState(false);
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [botDisabled, setBotDisabled] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [isDrawingWindowExpanded, setIsDrawingWindowExpanded] = useState(true);
  const [isFormMinimized, setIsFormMinimized] = useState(false);
  const { language, isRTL } = useLanguage();
  const t = useTranslations().addLandmark;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };
  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t.error, t.validation.locationRequired);
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    setLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    });
  };
  const handleSubmit = async () => {
    if (!name) {
      Alert.alert(t.error, t.validation.nameRequired);
      return;
    }
    if (!location) {
      Alert.alert(t.error, t.validation.locationRequired);
      return;
    }
    setIsLoading(true);
    
    try {
      // هنا كود إرسال البيانات للخادم
      Alert.alert(t.success, t.success);
      // إعادة تعيين الحقول بعد الإرسال
      setName('');
      setDescription('');
      setLocation(null);
      setImage(null);
    } catch (error) {
      Alert.alert(t.error, t.error);
    } finally {
      setIsLoading(false);
    }
  };
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
useEffect(() => {
  const timer = setTimeout(() => {
    setShowMapInfo(false);
  }, 3000); // 3 ثواني
  return () => clearTimeout(timer);
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
// Add this useEffect to fetch the radius when component mounts
useEffect(() => {
  const fetchVerificationRadius = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/settings/verification-radius`);
      setVerificationRadius(response.data.radius);
    } catch (error) {
      console.error('Error fetching verification radius:', error);
      setVerificationRadius(500);
    }
  };
  
  fetchVerificationRadius();
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
// 1. تعديل handleMapPress لإخفاء الروبوت عند إضافة معلم
const handleMapPress = (e: any) => {
  if (e.nativeEvent?.markerId) return;
  
  setSelectedLandmark(null);
  setShowBot(false); // إخفاء الروبوت
  
  // تعطيل الروبوت لمدة دقيقتين
  setBotDisabled(true);
  setTimeout(() => setBotDisabled(false), 120000);
  
  const { coordinate } = e.nativeEvent;
  setClickedLocation(coordinate);
  setNewLandmark(prev => ({
    ...prev,
    lat: coordinate.latitude,
    lon: coordinate.longitude,
  }));
  setShowForm(true);
};
// دالة لحساب المسافة بين نقطتين
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // نصف قطر الأرض بالمتر
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // المسافة بالمتر
};
// دالة واحدة معدلة لجميع الاستخدامات
const getNearbyLandmarks = (landmarksList: Landmark[] = landmarks, radius = 300) => {
  if (!location) return landmarksList;

  return landmarksList.filter(landmark => {
    const distance = calculateDistance(
      location.latitude, 
      location.longitude,
      landmark.lat,
      landmark.lon
    );
    return distance <= radius;
  });
};

// تعديل دالة getDisplayedLandmarks لاستخدام الدالة المعدلة
const getDisplayedLandmarks = () => {
  if (!location) return landmarks;

  return landmarks.filter(landmark => {
    // المعالم المعرفة تظهر دائماً
    if (landmark.verified) return true;

    // المعالم المعلقة تظهر فقط إذا كانت قريبة
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      landmark.lat,
      landmark.lon
    );
    return distance <= verificationRadius;
  });
};
// دالة التصفية حسب النوع
const getFilteredLandmarks = () => {
  const displayed = getDisplayedLandmarks();

  switch(filter) {
    case 'verified':
      return displayed.filter(l => l.verified);
    case 'unverified':
      return displayed.filter(l => !l.verified);
    default:
      return displayed;
  }
};
// 6. دالة لتحديث الفلتر
const handleMarkerPress = (marker: Landmark) => {
  // إغلاق نافذة الإضافة إذا كانت مفتوحة
  setShowForm(false);
  
  // عرض تفاصيل المعلم
  setSelectedLandmark(marker);
  mapRef.current?.animateToRegion({
    latitude: marker.lat,
    longitude: marker.lon,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
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
// دالة عرض معلم عشوائي للتحقق - معدلة لعرض المعالم القريبة فقط
const showRandomLandmarkForVerification = () => {
  if (!location) return;

  // تصفية المعالم القريبة غير المؤكدة فقط
  const unverifiedNearby = landmarks.filter(landmark => {
    if (landmark.verified) return false;
        const distance = calculateDistance(
      location.latitude,
      location.longitude,
      landmark.lat,
      landmark.lon
    );


    return distance <= verificationRadius;
  });

  if (unverifiedNearby.length > 0) {
    const randomIndex = Math.floor(Math.random() * unverifiedNearby.length);
    setCurrentBotLandmark(unverifiedNearby[randomIndex]);
    setShowBot(true);
  }
};

// في useEffect الخاص بالروبوت، أضف تحقق من الموقع
useEffect(() => {
  const interval = setInterval(() => {
    if (!showBot && !botDisabled && location) {
      showRandomLandmarkForVerification();
    }
  }, 10000); // كل 10 ثواني

  return () => clearInterval(interval);
}, [landmarks, showBot, botDisabled, location, verificationRadius]); // إضافة verificationRadius للمراقبة
// Add this useEffect to show the bot periodically
useEffect(() => {
  const interval = setInterval(() => {
    if (!showBot && !botDisabled && location) { // التأكد من وجود الموقع أولاً
      showRandomLandmarkForVerification();
    }
  }, 10000); // كل 10 ثواني
  return () => clearInterval(interval);
}, [landmarks, showBot, botDisabled, location]); // إضافة location إلى dependencies
<VerificationBot
    visible={!!(showBot && !botDisabled && currentBotLandmark)}
    landmark={currentBotLandmark}
    onVote={(vote) => {
      if (currentBotLandmark) {
        // تحقق إضافي من المسافة قبل التصويت
        const distance = calculateDistance(
          location?.latitude || 0,
          location?.longitude || 0,
          currentBotLandmark.lat,
          currentBotLandmark.lon
        );

        if (distance <= verificationRadius) {
          handleLandmarkVote(currentBotLandmark._id, vote);
        } else {
          Alert.alert(
            "المعلم بعيد",
            "لا يمكنك التصويت على معلم خارج نطاقك الجغرافي"
          );
        }
      }
      setShowBot(false);
      setTimeout(showRandomLandmarkForVerification, 60000);
    }}
    onClose={() => setShowBot(false)}
    onLandmarkPress={() => {
      if (currentBotLandmark && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: currentBotLandmark.lat,
          longitude: currentBotLandmark.lon,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    }}
  />
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
      console.log("Current user before add:", currentUser, currentUserId);
      const meCheck = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log("Auth check:", meCheck.data);

      const response = await axios.post(`${API_BASE_URL}/landmarks`, {
        title: newLandmark.title.trim(),
        description: newLandmark.description.trim(),
        lat: newLandmark.lat,
        lon: newLandmark.lon,
        color: newLandmark.color || '#8B4513',
        imageUrl: newLandmark.imageUrl || '',
        createdBy: currentUser?._id || currentUserId  // ✅ أضف هذا السطر

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
const getUnverifiedLandmarks = () => {
  // إذا كان هناك معلم محدد، نستخدم موقعه كمركز للتصفية
  const center = selectedLandmark ? {
    lat: selectedLandmark.lat,
    lon: selectedLandmark.lon
  } : location ? {
    lat: location.latitude,
    lon: location.longitude
  } : null;
  if (!center) {
    return landmarks.filter(l => !l.verified);
  }
  // تصفية المعالم ضمن نصف درجة (حوالي 55 كم) من المركز
  return landmarks.filter(l => {
    if (l.verified) return false;
    
    const latDiff = Math.abs(l.lat - center.lat);
    const lonDiff = Math.abs(l.lon - center.lon);
    
    return latDiff < 0.5 && lonDiff < 0.5;
  });
};
  // Handle landmark vote
  const handleLandmarkVote = async (landmarkId: string, voteType: 'yes' | 'no') => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const landmark = landmarks.find(l => l._id === landmarkId);
      if (!landmark || !location) {
        setVoteError(t.errors.landmarkNotFound);
        return;
      }

      // تحقق من المسافة
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        landmark.lat,
        landmark.lon
      );

      if (distance > verificationRadius) {
        setVoteError(t.errors.outOfRange);
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
      // تحقق أن المعلم غير موثق وأن المستخدم هو المنشئ أو مدير
      const landmarkToDelete = landmarks.find(l => l._id === landmarkId);
      if (landmarkToDelete?.verified && currentUser?.role !== 'admin') {
        setDeleteError("Cannot delete verified landmarks");
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
  const focusOnUserLocation = () => {
  if (location && mapRef.current) {
    mapRef.current.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
  }
}
 const handleSearch = async () => {
  if (!searchQuery.trim()) return;
  // 1. First check local landmarks (case insensitive)
  const landmark = landmarks.find(l =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (landmark) {
    mapRef.current?.animateToRegion({
      latitude: landmark.lat,
      longitude: landmark.lon,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    return;
  }
  // 2. Try Google Geocoding API with better error handling
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${GOOGLE_API_KEY}&language=en&region=sa` // Added region parameter for Saudi Arabia
    );
    const data = await response.json();
    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      mapRef.current?.animateToRegion({
        latitude: location.lat,
        longitude: location.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      
      // Show the first result's formatted address
      Alert.alert(
        "Location Found", 
        data.results[0].formatted_address,
        [{ text: "OK" }]
      );
    } else if (data.status === "ZERO_RESULTS") {
      // Try with fuzzy search or show suggestions
      handleFuzzySearch(searchQuery);
    } else {
      Alert.alert(
        "Search Error", 
        data.error_message || "No results found. Try a different query.",
        [{ text: "OK" }]
      );
    }
  } catch (err) {
    console.error("Geocoding error:", err);
    Alert.alert(
      "Connection Error", 
      "Failed to connect to search service. Please check your internet connection.",
      [{ text: "OK" }]
    );
  }
};
const handleFuzzySearch = (query: string) => {
  // Simple fuzzy search implementation
  const queryLower = query.toLowerCase();
  const similarLandmarks = landmarks.filter(l => {
    const titleLower = l.title.toLowerCase();
    return (
      titleLower.includes(queryLower) ||
      queryLower.includes(titleLower) ||
      getSimilarity(queryLower, titleLower) > 0.7
    );
  });
  if (similarLandmarks.length > 0) {
    Alert.alert(
      "Did you mean?",
      similarLandmarks.map(l => l.title).join("\n"),
      [
        { text: "Cancel" },
        ...similarLandmarks.map(l => ({
          text: l.title,
          onPress: () => {
            mapRef.current?.animateToRegion({
              latitude: l.lat,
              longitude: l.lon,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        }))
      ]
    );
  } else {
    Alert.alert(
      "Not Found", 
      "No matching locations found. Try a more specific search.",
      [{ text: "OK" }]
    );
  }
};
// Helper function to calculate string similarity
const getSimilarity = (s1: string, s2: string) => {
  let longer = s1;
  let shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;
  return (longerLength - editDistance(longer, shorter)) / longerLength;
};
// Levenshtein distance calculation
const editDistance = (s1: string, s2: string) => {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
};
  return (
    <View style={styles.container}>
      {isMapLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6d4c41" />
        </View>
      ) : (
        <>
          {/* Top Bar with Search and Filters */}
          <View style={styles.topBar}>
            <View style={styles.searchContainer}>
              <TextInput
                placeholder={t.searchPlaceholder}
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                style={[styles.searchInput, isRTL && { textAlign: 'right' }]}
              />
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                <MaterialIcons name="search" size={24} color="#6d4c41" />
              </TouchableOpacity>
              <View style={styles.filterContainer}>
                <TouchableOpacity 
                  onPress={() => setFilter('all')} 
                  style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
                >
                  <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
                    {t.filterAll}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => setFilter('verified')} 
                  style={[styles.filterButton, filter === 'verified' && styles.activeFilter]}
                >
                  <Text style={[styles.filterText, filter === 'verified' && styles.activeFilterText]}>
                    {t.filterVerified}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => setFilter('unverified')} 
                  style={[styles.filterButton, filter === 'unverified' && styles.activeFilter]}
                >
                  <Text style={[styles.filterText, filter === 'unverified' && styles.activeFilterText]}>
                    {t.filterPending}
                  </Text>
                </TouchableOpacity>
              </View>
                 </View>
          </View>

          {/* Landmarks List */}
          <View style={[
            styles.landmarksListContainer,
            !isLandmarksListVisible && styles.collapsedLandmarksList
          ]}>
            <TouchableOpacity 
              style={styles.toggleListButton}
              onPress={() => setIsLandmarksListVisible(!isLandmarksListVisible)}
            >
              <MaterialIcons 
                name={isLandmarksListVisible ? "keyboard-arrow-down" : "keyboard-arrow-up"} 
                size={24} 
                color="#6d4c41" 
              />
            </TouchableOpacity>
          
           {isLandmarksListVisible && (
  <>
    <Text style={styles.landmarksTitle}>
      {t.pendingLandmarksTitle} ({getUnverifiedLandmarks().length})
    </Text>
    <ScrollView 
      style={styles.landmarksList}
      contentContainerStyle={styles.landmarksListContent}
    >
      {getFilteredLandmarks().length > 0 ? (
        getFilteredLandmarks().map(landmark => (
          <LandmarkListItem 
            key={landmark._id}
            landmark={landmark}
            onClick={() => {
              setSelectedLandmark(landmark);
              mapRef.current?.animateToRegion({
                latitude: landmark.lat,
                longitude: landmark.lon,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              });
            }}
            isSelected={selectedLandmark?._id === landmark._id}
          />
        ))
      ) : (
        <Text style={styles.noLandmarksText}>
          {filter === 'verified' 
            ? t.noVerifiedLandmarks
            : filter === 'unverified'
            ? t.noPendingLandmarks
            : t.noLandmarks
          }
        </Text>
      )}
    </ScrollView>
  </>
)}
          </View>
          {/* Main Map View */}
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={region}
            onRegionChangeComplete={setRegion}
            onPress={handleMapPress}
            mapType={mapType}
          >
            {location && (
              <Marker
                coordinate={location}
                title={t.yourLocation}
                pinColor="#6d4c41"
              />
            )}
            
            {getFilteredLandmarks().map(landmark => (
  <Marker
    key={landmark._id}
    coordinate={{
      latitude: landmark.lat,
      longitude: landmark.lon
    }}
    title={landmark.title}
    description={landmark.verified ? t.verified : t.pendingVerification}
    pinColor={landmark.verified ? '#4CAF50' : '#FFD700'}
    onPress={() => handleMarkerPress(landmark)}
  />
))}
          </MapView>
          {/* Combined map controls and nearby routes button */}
          {/* Map Controls */}
          <View style={styles.mapControlsContainer}>
            <View style={styles.mapControls}>
              <TouchableOpacity 
                onPress={() => setMapType('standard')}
                style={[styles.mapControlButton, mapType === 'standard' && styles.activeMapType]}
              >
                <MaterialIcons name="map" size={24} color={mapType === 'standard' ? '#FFD700' : '#6d4c41'} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setMapType('satellite')}
                style={[styles.mapControlButton, mapType === 'satellite' && styles.activeMapType]}
              >
                <MaterialIcons name="satellite" size={24} color={mapType === 'satellite' ? '#FFD700' : '#6d4c41'} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setMapType('hybrid')}
                style={[styles.mapControlButton, mapType === 'hybrid' && styles.activeMapType]}
              >
                <MaterialIcons name="layers" size={24} color={mapType === 'hybrid' ? '#FFD700' : '#6d4c41'} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  if (location) {
                    mapRef.current?.animateToRegion({
                      latitude: location.latitude,
                      longitude: location.longitude,
                      latitudeDelta: 0.0922,
                      longitudeDelta: 0.0421,
                    });
                  }
                }}
                style={styles.mapControlButton}
              >
                <MaterialIcons name="my-location" size={24} color="#6d4c41" />
              </TouchableOpacity>
            </View>
          </View>
          {/* Add Landmark Form */}
          {showForm && (
            <View style={styles.formContainer}>
              <TouchableOpacity 
                style={styles.toggleFormButton}
                onPress={() => setIsFormMinimized(!isFormMinimized)}
              >
                  <MaterialIcons 
                    name={isFormMinimized ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
                    size={24} 
                    color="#6d4c41" 
                  />
                <Text style={styles.toggleFormText}>
                  {isFormMinimized ? t.showForm : t.minimizeForm}
                  {isFormMinimized ? t.showForm : ''}
                </Text>
              </TouchableOpacity>

              {!isFormMinimized && (
                <>
                  <Text style={styles.formTitle}>{t.addLandmarkTitle}</Text>
                  <TextInput
                    placeholder={t.landmarkTitlePlaceholder}
                    value={newLandmark.title}
                    onChangeText={(text) => setNewLandmark({...newLandmark, title: text})}
                    style={[styles.input, isRTL && { textAlign: 'right' }]}
                  />
                  <TextInput
                    placeholder={t.descriptionPlaceholder}
                    value={newLandmark.description}
                    onChangeText={(text) => setNewLandmark({...newLandmark, description: text})}
                    style={[styles.input, styles.descriptionInput, isRTL && { textAlign: 'right' }]}
                    multiline
                  />
                  <TouchableOpacity 
                    style={styles.imagePickerButton}
                    onPress={pickImage}
                  >
                    <Text style={styles.imagePickerText}>
                      {newLandmark.imageUrl ? t.changeImage : t.selectImage}
                    </Text>
                  </TouchableOpacity>
                  {newLandmark.imageUrl && (
                    <Image 
                      source={{ uri: newLandmark.imageUrl }}
                      style={styles.previewImage}
                    />
                  )}
                       <View style={[styles.formButtons, isRTL && { flexDirection: 'row-reverse' }]}>
                  <TouchableOpacity 
                    onPress={addLandmark}
                    disabled={!newLandmark.title.trim()}
                    style={[
                      styles.submitButton,
                      !newLandmark.title.trim() && styles.disabledButton
                    ]}
                  >
                    <Text style={styles.submitButtonText}>{t.addLandmarkButton}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setShowForm(false)}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.cancelButtonText}>{t.cancelButton}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
          <View>
        </View>

        {showMapInfo && !showForm && !selectedLandmark && (
            <View style={styles.mapInfoPopup}>
              <Text style={styles.mapInfoText}>{t.tapToAdd}</Text>
            </View> 
          )}
        </>
      )}
       {selectedLandmark && (
      <LandmarkModal 
        landmark={selectedLandmark}
        currentUser={currentUser}
        onClose={() => {
          setSelectedLandmark(null);
          setShowForm(false); // تأكيد إغلاق نموذج الإضافة
        }}        
        onVote={handleLandmarkVote}
        onDelete={handleDeleteLandmark}
        isVoting={isVoting}
        voteSuccess={voteSuccess}
        voteError={voteError}
        deleteSuccess={deleteSuccess}
        deleteError={deleteError}
      />
    )}
       {/* تأكد من وجود هذا السطر في المكان الصحيح */}
       <VerificationBot
  visible={!!(showBot && !botDisabled && currentBotLandmark)}
  landmark={currentBotLandmark}
  onVote={(vote) => {
    if (!currentBotLandmark || !location) {
      Alert.alert(
        t.errors.general,
        t.errors.landmarkNotFound,
        [{ text: t.common.ok }]
      );
      return;
    }

    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      currentBotLandmark.lat,
      currentBotLandmark.lon
    );

 if (distance > verificationRadius) {
    Alert.alert(
      t.errors.outOfRange,
      t.errors.nearbyOnly,
      [{ text: t.common.ok }]
    );
    return;
  }

    handleLandmarkVote(currentBotLandmark._id, vote);
    setShowBot(false);
  }}
  onClose={() => setShowBot(false)}
  onLandmarkPress={() => {
    if (currentBotLandmark && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentBotLandmark.lat,
        longitude: currentBotLandmark.lon,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }}
/>


    </View>
  );
};
const styles = StyleSheet.create({
  nearbyToggle: {
  position: 'absolute',
  top: 80,
  right: 20,
  backgroundColor: 'white',
  padding: 10,
  borderRadius: 20,
  flexDirection: 'row',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 3,
  zIndex: 2,
},
nearbyToggleText: {
  marginLeft: 5,
  color: '#6d4c41',
},
separator: {
  width: 1,
  height: 20,
  backgroundColor: '#d7ccc8',
  marginHorizontal: 8,
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
    scrollContainer: {
    flexGrow: 1,
    width: '100%',
  },
    formContent: {
    paddingBottom: 20, // تأكد من وجود مساحة للأزرار
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
  pendingListItem: {
  backgroundColor: '#FFF9E1',
  },
  pendingListItemTitle: {
    fontWeight: '600',
    color: '#FF9800',
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
  pickerContainer: {
  backgroundColor: '#fff',
  paddingHorizontal: 16,
  paddingVertical: 8,
},
label: {
  fontSize: 16,
  fontWeight: 'bold',
  marginBottom: 4,
},
picker: {
  height: 40,
  width: '100%',
},
  mapTypeContainer: {
    flexDirection: 'row',
    marginLeft: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    padding: 5,
  },
  
  mapTypeButton: {
    padding: 5,
    borderRadius: 15,
    marginHorizontal: 2,
  },
landmarksListContainer: {
  position: 'absolute',
  bottom: 20,
  left: 20,
  backgroundColor: "white",
  borderRadius: 12,
  padding: 15,
  borderWidth: 1,
  borderColor: "#f0e6e2",
  maxHeight: 300,
  width: 250,
  zIndex: 2,
},
collapsedLandmarksList: {
  height: 40,
  paddingBottom: 0,
},
toggleListButton: {
  position: 'absolute',
  top: 5,
  right: 5,
  padding: 5,
  zIndex: 2,
},
landmarksList: {
  maxHeight: 250,
  marginTop: 15,
},
landmarksTitle: {
  fontSize: 16,
  fontWeight: 'bold',
  marginBottom: 10,
},
noLandmarksText: {
  textAlign: 'center',
  marginTop: 20,
  color: '#757575',
  fontStyle: 'italic',
},
  
  landmarksListContent: {
    paddingBottom: 15,
  },
  currentLocationButton: {
      position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
mapInfoPopup: {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: [{ translateX: -150 }],
  width: 300,
  backgroundColor: 'rgba(255,255,255,0.95)',
  padding: 15,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: '#ccc',
  alignItems: 'center',
  zIndex: 10,
},
mapInfoText: {
  fontSize: 14,
  color: '#5d4037',
  textAlign: 'center',
},
botContainer: {
  position: 'absolute',
  bottom: 20,
  right: 20,
  width: 280, // عرض أصغر قليلاً
  backgroundColor: 'white',
  borderRadius: 12, // زوايا أكثر استدارة
  padding: 12, // تقليل الحشو
  zIndex: 100,
  elevation: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 6,
  borderWidth: 1,
  borderColor: '#f0e6e2',
},
botHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 8, // تقليل المسافة
},
botTitle: {
  fontSize: 16, // تصغير حجم الخط
  fontWeight: '600',
  color: '#6d4c41',
},
botQuestion: {
  fontSize: 14, // تصغير حجم الخط
  color: '#5d4037',
  marginBottom: 8, // تقليل المسافة
  fontWeight: '500',
},
botLandmarkImage: {
  width: '100%',
  height: 100, // تصغير ارتفاع الصورة
  borderRadius: 8,
  marginBottom: 8,
  borderWidth: 1,
  borderColor: '#f0e6e2',
},
botLandmarkName: {
  fontSize: 14, // تصغير حجم الخط
  fontWeight: '600',
  color: '#6d4c41',
  marginBottom: 4,
},
botLandmarkDescription: {
  fontSize: 12, // تصغير حجم الخط
  color: '#757575',
  lineHeight: 18,
},
botButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: 8, // تقليل المسافة بين الأزرار
},
botButton: {
  flex: 1,
  paddingVertical: 8, // تقليل الحشو
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  gap: 4, // تقليل المسافة بين الأيقونة والنص
},
botButtonText: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 14, // تصغير حجم الخط
},
    botCloseIcon: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 8,
    zIndex: 2,
  },
  botIcon: {
    marginRight: 8,
  },
botImage: {
  width: 40,
  height: 40,
  marginRight: 10,
},
  botYesButton: {
    backgroundColor: '#4CAF50',
  },
  botNoButton: {
    backgroundColor: '#f44336',
  },
botCloseButton: {
  alignItems: 'center',
  padding: 8,
},
botCloseText: {
  color: '#6d4c41',
  textDecorationLine: 'underline',
},
landmarkLocationContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 4,
},
botContent: {
  marginBottom: 16,
},
pendingIndicatorContainer: {
  position: 'absolute',
  bottom: 20,
  right: 20,
  alignItems: 'flex-end',
},
pendingIndicator: {
  backgroundColor: 'white',
  borderRadius: 25,
  width: 50,
  height: 50,
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'row',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 3,
  zIndex: 2,
},
pendingBadge: {
  position: 'absolute',
  top: -5,
  right: -5,
  backgroundColor: '#FF9800',
  borderRadius: 10,
  width: 20,
  height: 20,
  justifyContent: 'center',
  alignItems: 'center',
},
pendingBadgeText: {
  color: 'white',
  fontSize: 12,
  fontWeight: 'bold',
},
pendingLandmarksPopup: {
  backgroundColor: 'white',
  borderRadius: 12,
  maxHeight: 300,
  width: 250,
  marginTop: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 3,
},
nearbyButton: {
  marginLeft: 10,
  padding: 8,
},
standardButton: {
  backgroundColor: "#6d4c41",
  padding: hp(1.5),
  borderRadius: wp(2),
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  elevation: 2,
  minWidth: wp(30),
},
standardButtonText: {
  color: "#FFD700",
  fontSize: wp(4),
  fontWeight: 'bold',
},
secondaryButton: {
  backgroundColor: "#f5f5f5",
  padding: hp(1.5),
  borderRadius: wp(2),
  borderWidth: 1,
  borderColor: "#d7ccc8",
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  minWidth: wp(30),
},
secondaryButtonText: {
  color: "#5d4037",
  fontSize: wp(4),
},
dangerButton: {
  backgroundColor: "#f44336",
  padding: hp(1.5),
  borderRadius: wp(2),
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  minWidth: wp(30),
},
dangerButtonText: {
  color: "white",
  fontSize: wp(4),
  fontWeight: 'bold',
},
  expandedContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
    header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6d4c41',
  },
  content: {
    maxHeight: 300,
  },
  drawingContainer: {
    position: 'absolute',
    bottom: hp(2),
    left: wp(5),
    right: wp(5),
    zIndex: 10,
  },
  drawingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderTopLeftRadius: wp(3),
    borderTopRightRadius: wp(3),
    padding: wp(4),
    borderWidth: 1,
    borderColor: '#f0e6e2',
  },
 drawingTitle: {
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: '#6d4c41',
  },
  drawingContent: {
    backgroundColor: 'white',
    borderBottomLeftRadius: wp(3),
    borderBottomRightRadius: wp(3),
    padding: wp(4),
    borderWidth: 1,
    borderColor: '#f0e6e2',
    borderTopWidth: 0,
    maxHeight: hp(40),
  },
   collapsedButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6d4c41',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  collapsedText: {
    marginLeft: 8,
    color: '#6d4c41',
    fontWeight: '500',
  },
 container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#5d4037',
  },
  searchButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    marginLeft: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 5,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    marginHorizontal: 2,
  },
  activeFilter: {
    backgroundColor: '#8d6e63',
  },
  filterText: {
    color: '#5d4037',
    fontWeight: '500',
    fontSize: 12,
  },
  activeFilterText: {
    color: 'white',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mapControlsContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'flex-end',
  },
  mapControls: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  mapControlButton: {
    padding: 8,
    marginVertical: 5,
  },
  activeMapType: {
    backgroundColor: '#6d4c41',
    borderRadius: 20,
  },
  formContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  toggleFormButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    marginBottom: 10,
  },
  toggleFormText: {
    color: '#6d4c41',
    marginLeft: 5,
  },
  imagePickerButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d7ccc8',
    marginBottom: 15,
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
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#d7ccc8',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: '#6d4c41',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d7ccc8',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#5d4037',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 1,
    borderWidth: 1,
    borderColor: '#f0e6e2',
  },
  addButtonText: {
    color: '#6d4c41',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
});
export default LandmarkPage;


