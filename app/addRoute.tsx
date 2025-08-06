import { useTranslations } from '@/frontend/constants/locales';
import { useLanguage } from '@/frontend/context/LanguageProvider';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    I18nManager,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import {
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import { useAuth } from './AuthContext';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY ?? '';
type ObjectId = string;
const API_BASE_URL = 'http://negevpulsapp.onrender.com/api';

interface Location {
  lat: number;
  lon: number;
}

interface RoutePoint {
  lat: number;
  lon: number;
}

interface Route {
  _id: string;
  title: string;
  points: { lat: number; lon: number }[];
  color: string;
  verified: boolean;
  status: 'pending' | 'verified' | 'rejected' | 'disputed';
  votes: RouteVote[];
  verificationData?: VerificationData;
  createdBy: ObjectId | string;
  _calculatedWeights?: {
    totalWeight: number;
    yesWeight: number;
    noWeight: number;
  };
}

interface VerificationData {
  totalWeight: number;
  yesWeight: number;
  noWeight: number;
  confidenceScore: number;
}

interface RouteVote {
  userId: string;
  vote: 'yes' | 'no';
  weight: number;
  timestamp?: Date;
}

interface RouteVoteResponse {
  success: boolean;
  data: Route;
  message?: string;
  userWeight?: number;
}

const VerificationBot: React.FC<{
  visible: boolean;
  route: Route | null;
  onVote: (vote: 'yes' | 'no') => void;
  onClose: () => void;
  onRoutePress: () => void;
}> = ({ visible, route, onVote, onClose, onRoutePress }) => {
  const { isRTL } = useLanguage();
  const t = useTranslations().addRoute;
  
  if (!visible || !route) return null;

  return (
    <View style={[styles.botContainer, isRTL && styles.rtlContainer]}>
      <View style={[styles.botHeader, isRTL && styles.rtlFlex]}>
        <TouchableOpacity onPress={onClose} style={styles.botCloseIcon}>
          <Ionicons name="close" size={24} color="#6d4c41" />
        </TouchableOpacity>
        <MaterialIcons name="support-agent" size={28} color="#6d4c41" style={styles.botIcon} />
        <Text style={styles.botTitle}>{t.helpVerify}</Text>
      </View>
      
      <TouchableOpacity onPress={onRoutePress} style={styles.botContent}>
        <Text style={[styles.botQuestion, isRTL && styles.rtlText]}>{t.isAccurate}</Text>
        
        <View style={styles.routePreview}>
          <Text style={[styles.botRouteName, isRTL && styles.rtlText]}>{route.title}</Text>
          <Text style={[styles.botRoutePoints, isRTL && styles.rtlText]}>
            {route.points.length} {t.pointsCount}
          </Text>
        </View>
      </TouchableOpacity>
      
      <View style={[styles.botButtons, isRTL && styles.rtlFlex]}>
        <TouchableOpacity 
          style={[styles.botButton, styles.botYesButton]}
          onPress={() => onVote('yes')}
        >
          <MaterialIcons name="thumb-up" size={20} color="white" />
          <Text style={styles.botButtonText}>{t.confirm}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.botButton, styles.botNoButton]}
          onPress={() => onVote('no')}
        >
          <MaterialIcons name="thumb-down" size={20} color="white" />
          <Text style={styles.botButtonText}>{t.reject}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const RoutePage: React.FC = () => {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [mapRegion, setMapRegion] = useState({
    latitude: 24.7136,
    longitude: 46.6753,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [tempRoutePoints, setTempRoutePoints] = useState<RoutePoint[]>([]);
  const [newRoute, setNewRoute] = useState<Omit<Route, '_id' | 'verified' | 'votes'>>({
    title: '',
    points: [],
    color: '#4CAF50',
    status: 'pending',
    createdBy: ''
  });
  const { user } = useAuth();
  const router = useRouter();
  const [voteError, setVoteError] = useState("");
  const [voteSuccess, setVoteSuccess] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'terrain' | 'hybrid'>('standard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHeaderText, setShowHeaderText] = useState(true);
  const [isRoutesListVisible, setIsRoutesListVisible] = useState(true);
  const [showBot, setShowBot] = useState(false);
  const [currentBotRoute, setCurrentBotRoute] = useState<Route | null>(null);
  const [verificationRadius, setVerificationRadius] = useState(500);
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [isDrawingWindowExpanded, setIsDrawingWindowExpanded] = useState(true);
  const [isFormMinimized, setIsFormMinimized] = useState(false);
  const t = useTranslations().addRoute;
  const { language, isRTL } = useLanguage();
  const [isRoutesPanelVisible, setIsRoutesPanelVisible] = useState(true);


  useEffect(() => {
    I18nManager.forceRTL(isRTL);
  }, [isRTL]);
  // تطبيق اتجاه النص في الأنماط:
  const dynamicStyles = StyleSheet.create({
    textInput: {
      textAlign: isRTL ? 'right' : 'left',
    },
    flexDirection: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
    }
  });
  const getUserWeight = (user: any): number => {
    if (!user) return 1;
    if (user.isSuperlocal) return 4;
    if (user.reputationScore && user.reputationScore >= 70) return 2;
    return 1;
  };
    useEffect(() => {
    I18nManager.forceRTL(isRTL);
  }, [isRTL]);
  
const getDisplayedRoutes = () => {
  if (!location) return routes;

  return routes.filter(route => {
    // عرض جميع الطرق المعرفة
    if (route.verified) return true;
    
    // للطرق المعلقة، نتحقق من المسافة
    const userPoint = { lat: location.lat, lon: location.lon };
    const closestDistance = Math.min(...route.points.map(point => 
      calculateDistance(userPoint, point)
    ));
    return closestDistance <= verificationRadius;
  });
};
  const calculateDistance = (point1: RoutePoint, point2: RoutePoint) => {
    const R = 6371e3;
    const φ1 = point1.lat * Math.PI/180;
    const φ2 = point2.lat * Math.PI/180;
    const Δφ = (point2.lat-point1.lat) * Math.PI/180;
    const Δλ = (point2.lon-point1.lon) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const calculateTotalDistance = (points: RoutePoint[]) => {
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      total += calculateDistance(points[i], points[i+1]);
    }
    return total;
  };

  const focusOnRoute = (route: Route) => {
    if (!route.points.length) return;

    const coordinates = route.points.map(p => ({
      latitude: p.lat,
      longitude: p.lon
    }));

    const lats = coordinates.map(c => c.latitude);
    const lons = coordinates.map(c => c.longitude);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    mapRef.current?.animateToRegion({
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      latitudeDelta: (maxLat - minLat) * 1.5 + 0.01,
      longitudeDelta: (maxLon - minLon) * 1.5 + 0.01
    }, 500);
  };

// تعديل دالة getFilteredRoutes
const getFilteredRoutes = () => {
  const displayed = getDisplayedRoutes(); // هذه الدالة تعرض فقط الطرق المعرفة والطرق المعلقة ضمن الراديوس
  
  switch(filter) {
    case 'verified':
      return displayed.filter(r => r.verified);
    case 'unverified':
      return displayed.filter(r => !r.verified);
    default:
      return displayed;
  }
};

  const showRoutesWithinRadius = () => {
    if (!location) return [];
    return routes.filter(route => {
      const userPoint = { lat: location.lat, lon: location.lon };
      const closestDistance = Math.min(...route.points.map(point => 
        calculateDistance(userPoint, point)
      ));
      return closestDistance <= verificationRadius;
    });
  };

const showRandomRouteForVerification = () => {
  if (!location || isDrawingRoute) return;
  
  const nearbyUnverified = getDisplayedRoutes().filter(r => !r.verified);
  
  if (nearbyUnverified.length > 0) {
    const randomIndex = Math.floor(Math.random() * nearbyUnverified.length);
    setCurrentBotRoute(nearbyUnverified[randomIndex]);
    setShowBot(true);
  }
};

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/routes`);
        setRoutes(response.data);
      } catch (error) {
        console.error("Backend connection failed:", error);
        Alert.alert("Error", "Could not connect to server. Please check if backend is running.");
        setRoutes([]);
      } finally {
        setIsMapLoading(false);
      }
    };

    loadRoutes();
  }, []);

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
      } catch (error) {
        console.error("Auth check failed:", error);
        await AsyncStorage.removeItem('token');
      }
    };

    fetchUser();
  }, []);
  useEffect(() => {
  if (showHeaderText) {
    const timer = setTimeout(() => {
      setShowHeaderText(false);
    }, 3000);
    return () => clearTimeout(timer);
  }
}, [showHeaderText]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!showBot && !isDrawingRoute) {
        showRandomRouteForVerification();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [routes, showBot, isDrawingRoute, location]);

const fetchVerificationRadius = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/settings/verification-radius`);
    setVerificationRadius(response.data.radius);
  } catch (error) {
    console.error('Error fetching verification radius:', error);
    setVerificationRadius(500); // Default value
  }
};

// استدعها في useEffect
useEffect(() => {
  fetchVerificationRadius();
}, []);

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

  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        setLocation({ lat: 24.7136, lon: 46.6753 });
        setMapRegion({
          latitude: 24.7136,
          longitude: 46.6753,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const newLocation = {
        lat: location.coords.latitude,
        lon: location.coords.longitude
      };
      setLocation(newLocation);
      setMapRegion({
        latitude: newLocation.lat,
        longitude: newLocation.lon,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    };

    getLocation();
  }, []);

  const handleMapPress = (e: any) => {
    if (!isDrawingRoute) return;
    setIsFormVisible(false);

    const newPoint = {
      lat: e.nativeEvent.coordinate.latitude,
      lon: e.nativeEvent.coordinate.longitude
    };
    
    setTempRoutePoints(prev => [...prev, newPoint]);
    if (e.nativeEvent?.markerId) {
      return;
    }

    setSelectedRoute(null);
  };

  const handleMapLongPress = (e: any) => {
    if (!isDrawingRoute) return;
    
    setIsDrawing(true);
    const newPoint = {
      lat: e.nativeEvent.coordinate.latitude,
      lon: e.nativeEvent.coordinate.longitude
    };
    
    setTempRoutePoints(prev => [...prev, newPoint]);
  };

  const handleMapPanDrag = (e: any) => {
    if (!isDrawingRoute || !isDrawing) return;
    
    const newPoint = {
      lat: e.nativeEvent.coordinate.latitude,
      lon: e.nativeEvent.coordinate.longitude
    };
    
    setTempRoutePoints(prev => [...prev, newPoint]);
  };

  const handleMapRelease = () => {
    setIsDrawing(false);
  };

  const handleRouteVote = async (routeId: string, voteType: 'yes' | 'no') => {
    const routeToVote = routes.find(r => r._id === routeId);
    if (routeToVote?.createdBy === currentUserId) {
      Alert.alert("Not Allowed", "You cannot vote on your own route");
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      setIsVoting(true);
      setVoteError("");
      setVoteSuccess("");

      const response = await axios.put<RouteVoteResponse>(
        `${API_BASE_URL}/routes/${routeId}/vote`,
        { vote: voteType },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setRoutes(prevRoutes => prevRoutes.map(route => {
        if (route._id === routeId) {
          return {
            ...route,
            votes: response.data.data.votes,
            verified: response.data.data.verified,
            verificationData: response.data.data.verificationData,
            _calculatedWeights: response.data.data._calculatedWeights
          };
        }
        return route;
      }));

      const weight = response.data.userWeight ?? getUserWeight(user);
      setVoteSuccess(`Vote recorded! (Weight: ${weight}x)`);
      
      if (currentBotRoute?._id === routeId) {
        setShowBot(false);
      }
    } catch (error: any) {
      let errorMessage = "Failed to submit vote";

      if (error.response) {
        errorMessage = error.response.data?.error ||
                      error.response.data?.message ||
                      `Server error (${error.response.status})`;
      } else if (error.request) {
        errorMessage = "No response from server";
      } else {
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
const getUnverifiedRoutesWithinRadius = () => {
  if (!location) return getUnverifiedRoutes();
  
  return getUnverifiedRoutes().filter(route => {
    const userPoint = { lat: location.lat, lon: location.lon };
    const closestDistance = Math.min(...route.points.map(point => 
      calculateDistance(userPoint, point)
    ));
    return closestDistance <= verificationRadius;
  });
};

const calculateRouteDistance = (route: Route): number => {
  let total = 0;
  for (let i = 0; i < route.points.length - 1; i++) {
    total += calculateDistance(route.points[i], route.points[i+1]);
  }
  return Math.round(total);
};
  const saveRoute = async () => {
    try {
      if (tempRoutePoints.length < 2) {
        Alert.alert('Error', 'Route must have at least 2 points');
        return;
      }

      if (!newRoute.title.trim()) {
        Alert.alert('Error', 'Please enter a route title');
        return;
      }

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/routes`, {
        title: newRoute.title.trim(),
        points: tempRoutePoints,
        color: newRoute.color || '#4CAF50'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      setRoutes(prev => [...prev, response.data.data]);
      setIsDrawingRoute(false);
      setTempRoutePoints([]);
      setNewRoute({
        title: '',
        points: [],
        color: '#4CAF50',
        status: 'pending',
        createdBy: ''
      });
      
      Alert.alert('Success', 'Route saved successfully!');
    } catch (error) {
      console.error("Save failed:", error);
      Alert.alert('Error', 'Failed to save route. Please try again.');
    }
  };

  const getUnverifiedRoutes = () => {
    return routes.filter(route => !route.verified);
  };

  const handleDeleteRoute = async (routeId: string) => {
    const routeToDelete = routes.find(r => r._id === routeId);
    if (routeToDelete?.verified) {
      Alert.alert("Not Allowed", "You cannot delete a verified route");
      return;
    }
    try {
      setDeleteError("");
      setDeleteSuccess("");
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      await axios.delete(`${API_BASE_URL}/routes/${routeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    
      setRoutes(prev => prev.filter(r => r._id !== routeId));
      if (selectedRoute?._id === routeId) {
        setSelectedRoute(null);
      }
      setDeleteSuccess("Route deleted successfully!");
    } catch (error) {
      console.error("Error deleting route:", error);
      
      let errorMessage = "Failed to delete route";
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

  const renderRouteItem = (route: Route) => (
    <TouchableOpacity 
      key={route._id}
      style={[
        styles.routeItem,
        !route.verified && styles.pendingRouteItem
      ]}
      onPress={() => {
        setSelectedRoute(route);
        focusOnRoute(route);
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={[
          styles.routeColor,
          { 
            backgroundColor: route.verified ? route.color : '#AAAAAA',
            borderWidth: route.verified ? 0 : 1,
            borderColor: '#999'
          }
        ]} />
        <View>
          <Text style={[
            styles.routeTitle,
            !route.verified && styles.pendingRouteTitle
          ]}>
            {route.title}
          </Text>
          <Text style={styles.verificationBadge}>
            {route.verified ? t.verified : t.pendingVerification} ({route.points.length} {t.pointsCount})
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleMarkerPress = (route: Route) => {
    setIsDrawingRoute(false);
    setSelectedRoute(route);
    focusOnRoute(route);
  };

  const renderVerificationStatus = (route: Route) => {
    const yesWeight = route.verificationData?.yesWeight || 
      route.votes
        .filter(v => v.vote === 'yes')
        .reduce((sum, vote) => sum + (vote.weight || 1), 0);

    const noWeight = route.verificationData?.noWeight || 
      route.votes
        .filter(v => v.vote === 'no')
        .reduce((sum, vote) => sum + (vote.weight || 1), 0);

    const totalWeight = route.verificationData?.totalWeight || 
      (yesWeight + noWeight);

    const percentageYes = totalWeight > 0 ? (yesWeight / totalWeight * 100) : 0;
    const requiredWeight = 5 + (0.2 * route.votes.length);
    const confidenceScore = route.verificationData?.confidenceScore || 
      Math.min(100,
        (Math.min(1, totalWeight / (requiredWeight * 1.5)) * 50) +
        ((yesWeight / Math.max(1, totalWeight)) * 50)
      );

    const currentUserVote = route.votes.find(v => v.userId === currentUserId);
    const userWeight = currentUserVote?.weight || 0;

    return (
      <View style={styles.verificationContainer}>
        <View style={styles.meterContainer}>
          <View style={styles.meterHeader}>
            <Text>Confidence Score:</Text>
            <Text style={[
              styles.confidenceText,
              { 
                color: confidenceScore > 75 ? '#4CAF50' :
                      confidenceScore > 50 ? '#FF9800' : '#f44336'
              }
            ]}>
              {Math.round(confidenceScore)}%
            </Text>
          </View>
          <View style={styles.meterBackground}>
            <View style={[
              styles.meterFill,
              { 
                width: `${confidenceScore}%`,
                backgroundColor: confidenceScore > 75 ? '#4CAF50' :
                              confidenceScore > 50 ? '#FF9800' : '#f44336'
              }
            ]} />
          </View>
        </View>

        <View style={styles.voteBreakdown}>
          <Text style={styles.voteYesText}>
            Yes: {yesWeight.toFixed(1)} ({(percentageYes).toFixed(0)}%)
          </Text>
          <Text style={styles.voteNoText}>
            No: {noWeight.toFixed(1)} ({(100 - percentageYes).toFixed(0)}%)
          </Text>
        </View>

        <View style={styles.voteBarBackground}>
          <View style={[styles.voteBarFill, { width: `${percentageYes}%` }]} />
        </View>

        <View style={styles.weightGrid}>
          <View style={styles.weightItem}>
            <Text style={styles.weightLabel}>Total Weight</Text>
            <Text style={styles.weightValue}>{totalWeight.toFixed(1)}</Text>
          </View>
          <View style={styles.weightItem}>
            <Text style={styles.weightLabel}>Required</Text>
            <Text style={styles.weightValue}>{requiredWeight.toFixed(1)}</Text>
          </View>
        </View>

        {currentUserId && (
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
              <Text style={styles.userWeightType}>
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
    );
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${GOOGLE_API_KEY}&language=en&region=sa`
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
      } else {
        Alert.alert("Search Error", data.error_message || "No results found");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to search. Check your connection.");
    }
  };
  return (
    <View style={styles.container}>
      {isMapLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6d4c41" />
        </View>
      ) : (
        <>
        <View style={styles.topBar}>
          <View style={styles.searchContainer}>
            <TextInput
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity 
              onPress={handleSearch}
              style={styles.searchButton}
            >
              <MaterialIcons name="search" size={24} color="#6d4c41" />
            </TouchableOpacity>
            
            <View style={styles.filterContainer}>
              <TouchableOpacity 
                style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
                onPress={() => setFilter('all')}
              >
                <Text style={styles.filterText}>{t.filterAll}</Text>

              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.filterButton, filter === 'verified' && styles.activeFilter]}
                onPress={() => setFilter('verified')}
              >
                <Text style={styles.filterText}>{t.filterVerified}</Text>

              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.filterButton, filter === 'unverified' && styles.activeFilter]}
                onPress={() => setFilter('unverified')}
              >
                <Text style={styles.filterText}>{t.filterPending}</Text>

              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.nearbyButton}
              onPress={() => {
                const nearby = showRoutesWithinRadius();
                Alert.alert(
                  'Nearby Routes',
                  `There are ${nearby.length} routes within ${verificationRadius}m\n${nearby.filter(r => r.verified).length} verified\n${nearby.filter(r => !r.verified).length} pending`,
                  [{ text: 'OK' }]
                );
              }}
            >
              <MaterialIcons name="near-me" size={24} color="#6d4c41" />
            </TouchableOpacity>
          </View>
        </View>
        {/* نافذة الطرق المعلقة المنزلقة */}
        <View style={[
          styles.routesListContainer,
          !isRoutesPanelVisible && styles.collapsedRoutesList
        ]}>
          <TouchableOpacity 
            style={styles.toggleListButton}
            onPress={() => setIsRoutesPanelVisible(!isRoutesPanelVisible)}
          >
            <MaterialIcons 
              name={isRoutesPanelVisible ? "keyboard-arrow-down" : "keyboard-arrow-up"} 
              size={24} 
              color="#6d4c41" 
            />
            <Text style={styles.toggleListText}>
              {isRoutesPanelVisible ? t.hideRoutes : t.showRoutes} ({getDisplayedRoutes().length})
            </Text>
          </TouchableOpacity>

          {isRoutesPanelVisible && (
            <ScrollView 
              style={styles.routesList}
              contentContainerStyle={styles.routesListContent}
            >
              {getFilteredRoutes().length > 0 ? (
                getFilteredRoutes().map(route => (
                  <TouchableOpacity
                    key={route._id}
                    style={[
                      styles.routeListItem,
                      selectedRoute?._id === route._id && styles.selectedRouteItem,
                      !route.verified && styles.pendingRouteItem
                    ]}
                    onPress={() => {
                      setSelectedRoute(route);
                      focusOnRoute(route);
                    }}
                  >
                    <View style={styles.routeInfo}>
                      <Text style={[
                        styles.routeName,
                        !route.verified && styles.pendingRouteTitle
                      ]}>
                        {route.title}
                      </Text>
                      <Text style={styles.routeDetails}>
                        {route.points.length} {t.points} • {calculateRouteDistance(route)} م • 
                        {route.verified ? t.verified : t.pendingVerification}
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-left" size={20} color="#6d4c41" />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noRoutesText}>
                  {filter === 'verified' ? t.noVerifiedRoutes : 
                  filter === 'unverified' ? t.noPendingRoutesNearby : t.noRoutes}
                </Text>
              )}
            </ScrollView>
          )}
        </View>

          <MapView
            ref={mapRef}
            style={styles.map}
            region={mapRegion}
            onPress={handleMapPress}
            onLongPress={handleMapLongPress}
            onPanDrag={handleMapPanDrag}
            onResponderRelease={handleMapRelease}
            onResponderTerminate={handleMapRelease}
            mapType={mapType}
          >

            {location && (
              <Marker
                coordinate={{
                  latitude: location.lat,
                  longitude: location.lon
                }}
                title="Your location"
                pinColor="#FFD700"
              />
            )}
            {getFilteredRoutes().map(route => (
              <Polyline
                key={route._id}
                coordinates={route.points.map(p => ({
                  latitude: p.lat,
                  longitude: p.lon
                }))}
                strokeColor={route.verified ? '#4CAF50' : '#FFD700'}
                strokeWidth={route.verified ? 3 : 2}
                onPress={() => handleMarkerPress(route)}
                tappable={true}
              />
            ))}
            {isDrawingRoute && tempRoutePoints.length > 0 && (
              <Polyline
                coordinates={tempRoutePoints.map(p => ({
                  latitude: p.lat,
                  longitude: p.lon
                }))}
                strokeColor={newRoute.color}
                strokeWidth={4}
              />
            )}
          </MapView>

          {/* Combined map controls and nearby routes button */}
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
                      latitude: location.lat,
                      longitude: location.lon,
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
          {isDrawingRoute ? (
            <View style={styles.drawingContainer}>
              <View style={styles.drawingHeader}>
                <Text style={styles.drawingTitle}>{t.addRouteTitle}</Text>
                <TouchableOpacity onPress={() => setIsFormMinimized(!isFormMinimized)}>
                  <MaterialIcons 
                    name={isFormMinimized ? 'keyboard-arrow-up' : 'remove'} 
                    size={24} 
                    color="#6d4c41" 
                  />
                </TouchableOpacity>
              </View>
              
              {!isFormMinimized && (
                <View style={styles.drawingContent}>
                  <TextInput
                    style={styles.formInput}
                    placeholder={t.routeTitlePlaceholder}
                    placeholderTextColor="#999"
                    value={newRoute.title}
                    onChangeText={(text) => setNewRoute({...newRoute, title: text})}
                  />
                  
                  <View style={styles.routeStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>{t.distance}</Text>
                      <Text style={styles.statValue}>
                        {calculateTotalDistance(tempRoutePoints) > 1000 
                          ? `${(calculateTotalDistance(tempRoutePoints)/1000).toFixed(2)} km` 
                          : `${calculateTotalDistance(tempRoutePoints).toFixed(0)} m`}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>{t.pointsCount}</Text>
                      <Text style={styles.statValue}>{tempRoutePoints.length}</Text>
                    </View>
                  </View>

                  <View style={styles.formButtons}>
                    <TouchableOpacity 
                      onPress={() => {
                        setIsDrawingRoute(false);
                        setTempRoutePoints([]);
                      }}
                      style={styles.cancelButton}
                    >
                      <Text style={styles.cancelButtonText}>{t.cancelButton}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      onPress={saveRoute}
                      disabled={tempRoutePoints.length < 2 || !newRoute.title.trim()}
                      style={[
                        styles.submitButton,
                        (tempRoutePoints.length < 2 || !newRoute.title.trim()) && styles.disabledButton
                      ]}
                    >
                      <Text style={styles.submitButtonText}>{t.saveButton}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setIsDrawingRoute(!isDrawingRoute);
                setShowHeaderText(true);
              }}
              style={styles.drawButton}
            >
              <MaterialIcons
                name={isDrawingRoute ? 'close' : 'edit'}
                size={24}
                color="#6d4c41"
              />
              <Text style={styles.drawButtonText}>
                {isDrawingRoute ? t.cancelDrawing : t.drawRoute}
              </Text>
            </TouchableOpacity>
          )}
        <Modal
          visible={!!selectedRoute}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedRoute(null)}
        >
          <View style={styles.modalOverlay}>
            {selectedRoute && (
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle} numberOfLines={2}>{selectedRoute.title}</Text>
                  <TouchableOpacity onPress={() => setSelectedRoute(null)}>
                    <MaterialIcons name="close" size={24} color="#6d4c41" />
                  </TouchableOpacity>
                </View>

                <View style={styles.statusBadge}>
                  {selectedRoute.verified ? (
                    <>
                      <MaterialIcons name="verified" size={20} color="#4CAF50" />
                      <Text style={styles.verifiedBadgeText}>{t.verifiedRoute}</Text>
                    </>
                  ) : (
                    <>
                      <MaterialIcons name="schedule" size={20} color="#FF9800" />
                      <Text style={styles.pendingBadgeText}>
                        {t.pendingVerification}
                        {selectedRoute.status === 'disputed' && ` (${t.needsTribalReview})`}
                      </Text>
                    </>
                  )}
                </View>

                <View style={styles.routeInfoSection}>
                  <View style={styles.infoRow}>
                    <MaterialIcons name="location-on" size={20} color="#6d4c41" />
                    <Text style={styles.infoText}>
                      {selectedRoute.points.length} {t.points}
                    </Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <MaterialIcons name="straighten" size={20} color="#6d4c41" />
                    <Text style={styles.infoText}>
                      {calculateTotalDistance(selectedRoute.points) > 1000 
                        ? `${(calculateTotalDistance(selectedRoute.points)/1000).toFixed(2)} km` 
                        : `${calculateTotalDistance(selectedRoute.points).toFixed(0)} m`}
                    </Text>
                  </View>
                </View>

                {renderVerificationStatus(selectedRoute)}

                <View style={styles.voteButtons}>
                  <TouchableOpacity
                    onPress={() => handleRouteVote(selectedRoute._id, 'yes')}
                    disabled={isVoting}
                    style={[
                      styles.voteButton,
                      styles.yesButton,
                      isVoting && styles.disabledButton,
                      selectedRoute.votes.some(v => v.userId === currentUserId && v.vote === 'yes') && styles.activeVoteButton
                    ]}
                  >
                    <Text style={styles.buttonText}>
                      {isVoting ? <ActivityIndicator color="white" /> : 
                      selectedRoute.votes.some(v => v.userId === currentUserId && v.vote === 'yes') ? `✔ ${t.votedYes}` : t.voteYes}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => handleRouteVote(selectedRoute._id, 'no')}
                    disabled={isVoting}
                    style={[
                      styles.voteButton,
                      styles.noButton,
                      isVoting && styles.disabledButton,
                      selectedRoute.votes.some(v => v.userId === currentUserId && v.vote === 'no') && styles.activeVoteButton
                    ]}
                  >
                    <Text style={styles.buttonText}>
                      {isVoting ? <ActivityIndicator color="white" /> : 
                      selectedRoute.votes.some(v => v.userId === currentUserId && v.vote === 'no') ? `✔ ${t.votedNo}` : t.voteNo}
                    </Text>
                  </TouchableOpacity>
                </View>

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
                  </View>
                )}

                <View style={styles.actionButtons}>
                  {!selectedRoute.verified && (
                    <TouchableOpacity 
                      onPress={() => selectedRoute && handleDeleteRoute(selectedRoute._id)}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteButtonText}>{t.deleteRoute}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    onPress={() => setSelectedRoute(null)}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeButtonText}>{t.close}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </Modal>

          <VerificationBot
            visible={showBot && !isDrawingRoute}
            route={currentBotRoute}
            onVote={(vote) => {
              if (currentBotRoute) {
                handleRouteVote(currentBotRoute._id, vote);
              }
              setShowBot(false);
              setTimeout(showRandomRouteForVerification, 60000);
            }}
            onClose={() => setShowBot(false)}
            onRoutePress={() => {
              if (currentBotRoute) {
                setSelectedRoute(currentBotRoute);
                focusOnRoute(currentBotRoute);
              }
            }}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({

  headerText: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6d4c41',
  },
  headerSubtitle: {
    marginTop: 5,
    fontSize: 12,
    color: '#5d4037',
  },
  pointsCount: {
    color: '#5d4037',
  },
  hiddenRoutesList: {
    transform: [{ translateY: 300 }],
    opacity: 0,
  },
  routesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0e6e2',
  },
  pendingRouteItem: {
    backgroundColor: '#FFF9E1',
  },
  routeColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  routeTitle: {
    fontSize: 14,
  },
  pendingRouteTitle: {
    fontWeight: '600',
    color: '#FF9800',
  },
  verificationBadge: {
    fontSize: 12,
    color: '#8d6e63',
    fontWeight: 'bold',
  },
  toggleButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    padding: 5,
    zIndex: 2,
  },
  floatingToggleButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f0e6e2',
    zIndex: 1,
  },
  routeStatusContainer: {
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  routeStatus: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    fontWeight: 'bold',
  },
  verifiedStatus: {
    backgroundColor: '#E8F5E9',
    color: '#4CAF50',
  },
  pendingStatus: {
    backgroundColor: '#FFF8E1',
    color: '#FFA000',
  },
  summaryBox: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0e6e2',
  },
  boldText: {
    fontWeight: 'bold',
  },
  meterContainer: {
    marginBottom: 15,
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  confidenceText: {
    fontWeight: 'bold',
  },
  meterBackground: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
  },
  voteBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  voteYesText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  voteNoText: {
    color: '#f44336',
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
  weightGrid: {
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
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 15,
  },
  userWeightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userWeightValue: {
    fontWeight: 'bold',
  },
  userWeightType: {
    fontSize: 12,
    color: '#757575',
    marginTop: 5,
  },
  userVoteInfo: {
    fontSize: 12,
    color: '#757575',
    marginTop: 5,
  },
verificationSection: {
  marginTop: 10,
  marginBottom: 10,
},
  voteYesButton: {
    backgroundColor: '#4CAF50',
  },
  voteNoButton: {
    backgroundColor: '#f44336',
  },
  voteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  selectedVote: {
    borderWidth: 3,
    borderColor: 'gold',
  },
  pointsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pointTitle: {
    fontWeight: 'bold',
  },
  primaryButtonText: {
    color: '#FFD700',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  botContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 280,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
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
    marginBottom: 8,
  },
  botTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6d4c41',
  },
  botQuestion: {
    fontSize: 14,
    color: '#5d4037',
    marginBottom: 8,
    fontWeight: '500',
  },
  routePreview: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  botRouteName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6d4c41',
    marginBottom: 4,
  },
  botRoutePoints: {
    fontSize: 12,
    color: '#757575',
  },
  botButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  botButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  botButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
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
  botYesButton: {
    backgroundColor: '#4CAF50',
  },
  botNoButton: {
    backgroundColor: '#f44336',
  },
  botContent: {
    marginBottom: 16,
  },
// في جزء الـ styles
routeModalContainer: {
  flex: 1,
  backgroundColor: 'white',
  padding: 10, // تقليل الحشوة
},
routeModalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 5, // تقليل المسافة
},
routeModalTitle: {
  fontSize: 16, // تصغير حجم الخط أكثر
  fontWeight: 'bold',
  color: '#6d4c41',
  maxWidth: '75%', // تقليل المساحة المخصصة للعنوان
},
modalRow: {
  flexDirection: 'column',
  gap: 8, // تقليل المسافة بين العناصر
  marginBottom: 8,
},
routeSummary: {
  backgroundColor: '#f8f8f8',
  padding: 8,
  borderRadius: 6,
},
verificationContainer: {
  backgroundColor: '#f8f8f8',
  padding: 8,
  borderRadius: 6,
  marginBottom: 8,
},
pointsSection: {
  marginBottom: 8,
  maxHeight: 120, // تقليل ارتفاع قسم النقاط
},
pointsContainer: {
  maxHeight: 100, // تقليل ارتفاع حاوية النقاط
},
pointCard: {
  padding: 6,
  backgroundColor: 'white',
  borderRadius: 4,
  borderWidth: 1,
  borderColor: '#f0e6e2',
  width: '48%',
  marginBottom: 5,
},
primaryButton: {
  backgroundColor: '#6d4c41',
  padding: 8,
  borderRadius: 6,
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},
container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
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
nearbyButton: {
  marginLeft: 10,
  padding: 8,
},
  mapControlsContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'flex-end',
    gap: 10,
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
  nearbyRoutesButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  nearbyRoutesText: {
    marginLeft: 8,
    color: '#6d4c41',
    fontWeight: 'bold',
  },
  formLabel: {
    fontSize: 14,
    color: '#5d4037',
    fontWeight: '500',
    marginBottom: 5,
  },
  formRow: {
    flexDirection: 'row',
    gap: 15,
  },
  formGroup: {
    flex: 1,
  },
  formValue: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  colorPicker: {
    marginTop: 10,
  },
  colorOptions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 5,
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#6d4c41',
    transform: [{ scale: 1.1 }],
  },
  drawingControls: {
    marginTop: 10,
  },
  drawButton: {
    position: 'absolute',
    top: 100, // تغيير الموضع من bottom إلى top
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
  drawButtonText: {
    color: '#6d4c41',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  drawingContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: '#f0e6e2',
  },
  drawingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  drawingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6d4c41',
  },
    drawingContent: {
    padding: 15,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0e6e2',
  },
  routeForm: {
    gap: 16,
  },
  formInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 15,
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6d4c41',
  },
  instructions: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginVertical: 8,
  },
formContainer: {
  position: 'absolute',
  bottom: hp(2),
  left: wp(5),
  right: wp(5),
  backgroundColor: "white",
  borderRadius: wp(3),
  padding: wp(4),
  elevation: 5,
  zIndex: 10,
  borderWidth: 1,
  borderColor: "#f0e6e2",
  maxHeight: hp(40),
},
toggleFormButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: hp(1),
  backgroundColor: '#f5f5f5',
  borderRadius: wp(2),
  marginBottom: hp(1),
},
toggleFormText: {
  color: '#6d4c41',
  marginLeft: wp(2),
  fontSize: wp(4),
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
minimizedSummary: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: wp(2),
  backgroundColor: '#f5f5f5',
  borderRadius: wp(2),
},
minimizedText: {
  color: '#6d4c41',
  fontSize: wp(3.5),
},
expandButton: {
  padding: wp(1),
},
formHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
},
headerLeft: {
  flex: 1,
},
headerRight: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
},
saveButton: {
  backgroundColor: '#6d4c41',
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 20,
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 80,
},
saveButtonText: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 14,
},
minimizeButton: {
  padding: 6,
},
modalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },

modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6d4c41',
    flex: 1,
    marginRight: 10,
  },  
statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  verifiedBadgeText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  pendingBadgeText: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  miniMapContainer: {
    height: 150, // تصغير حجم الخريطة
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 10,
  },
  miniMap: {
    width: '100%',
    height: '100%',
  },
  section: {
    marginVertical: 10, // تقليل المسافات
  },
  sectionTitle: {
    fontSize: 16, // تصغير حجم الخط
    fontWeight: '600',
    color: '#5d4037',
    marginBottom: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 5, // تقليل المسافة
  },
  infoItem: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10, // تقليل الحشوة
    borderRadius: 8,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6d4c41',
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  voteButton: {
    flex: 1,
    padding: 15,
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
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
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
    padding: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#6d4c41',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
    rtlText: {
    textAlign: 'right',
  },
  ltrText: {
    textAlign: 'left',
  },
  rtlFlex: {
    flexDirection: 'row-reverse',
  },
  ltrFlex: {
    flexDirection: 'row',
  },
  rtlContainer: {
    right: undefined,
    left: 20,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  submitButton: {
    backgroundColor: '#6d4c41',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d7ccc8',
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#5d4037',
    fontSize: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6d4c41',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  slidingPanel: {
  position: 'absolute',
  right: 10,
  bottom: 20,
  width: '45%',
  maxHeight: '60%',
  backgroundColor: 'white',
  borderRadius: 12,
  elevation: 5,
  zIndex: 100,
  borderWidth: 1,
  borderColor: '#e0e0e0',
},
collapsedPanel: {
  height: 40,
},
togglePanelButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 10,
  backgroundColor: '#f5f5f5',
  borderTopLeftRadius: 12,
  borderTopRightRadius: 12,
},
togglePanelText: {
  marginLeft: 5,
  color: '#6d4c41',
  fontWeight: 'bold',
},
  routesListContainer: {
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
  collapsedRoutesList: {
    height: 40,
    paddingBottom: 0,
  },
  toggleListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 5,
  },
  toggleListText: {
    color: '#6d4c41',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  routesList: {
    maxHeight: 250,
    marginTop: 15,
  },
  routesListContent: {
    paddingBottom: 15,
  },
  routeListItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0e6e2",
  },
  selectedRouteItem: {
    backgroundColor: '#f5f5f5',
    borderLeftWidth: 4,
    borderLeftColor: '#6d4c41',
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontWeight: 'bold',
    color: '#5d4037',
    marginBottom: 3,
  },
  routeDetails: {
    fontSize: 12,
    color: '#757575',
  },
  noRoutesText: {
    textAlign: 'center',
    padding: 20,
    color: '#9e9e9e',
    fontStyle: 'italic',
  },
    routeInfoSection: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#5d4037',
  },
});
export default RoutePage;