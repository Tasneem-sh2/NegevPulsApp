import { useTranslations } from '@/frontend/constants/locales';
import { useLanguage } from '@/frontend/context/LanguageProvider';
import { AntDesign, FontAwesome, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import MapboxGL, {
  UserLocationRenderMode,
  UserTrackingMode
} from '@rnmapbox/maps';
import axios from "axios";
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  I18nManager,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

const MAPBOX_TOKEN = process.env.MAPBOX_DOWNLOADS_TOKEN || 'sk.eyJ1IjoidGFzbmVlbTIwMDIiLCJhIjoiY21jZ3l4bHJ3MGVyejJqc2h3YjkyY3hhcSJ9.OJCc5jNljboKnrfP1yfpYA';

MapboxGL.setAccessToken(MAPBOX_TOKEN);

const { PointAnnotation, Camera } = MapboxGL;

interface Landmark {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

type Point = {
  lat: number;
  lon: number;
  Name?: string;
};

type Route = {
  id: string;
  name?: string;
  coordinates: [number, number][];
};

const HomePage: React.FC = () => {
  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [startPoint, setStartPoint] = useState<{ lat: number; lon: number; title?: string } | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lon: number; title?: string } | null>(null);
  const [route, setRoute] = useState<{ coordinates: [number, number][] } | null>(null);
  const [routeDetails, setRouteDetails] = useState<{ distance: string; duration: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const router = useRouter();
  const [selectedLandmark, setSelectedLandmark] = useState<{ lat: number, lon: number, title: string } | null>(null);
  const [startAddress, setStartAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [cameraSettings, setCameraSettings] = useState({
    center: [35.513889, 33.892166] as [number, number],
    zoom: 10
  });
  
  const { language, changeLanguage, isRTL } = useLanguage();
  const t = useTranslations().home;
  type LocaleKeys = 'en' | 'ar' | 'he';
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [navigationMode, setNavigationMode] = useState(false);
  const [userHeading, setUserHeading] = useState<number | undefined>(undefined);
  const [navigationSteps, setNavigationSteps] = useState<any[]>([]);
  const [showControls, setShowControls] = useState(true);
  const [searchLandmarkText, setSearchLandmarkText] = useState("");
  const [filteredLandmarks, setFilteredLandmarks] = useState<typeof landmarks>([]);

  const staticLandmarks = [
    { lat: 31.155844, lon: 34.807268, title: "Algergawi Shop" },
    { lat: 31.15478, lon: 34.809776, title: "Electricity Pole" },
    { lat: 31.155101, lon: 34.811155, title: "Electric Company" },
    { lat: 31.163493, lon: 34.820984, title: "Al-Azazma School" },
    { lat: 31.15632, lon: 34.810717, title: "Algergawi Mosque" },
    { lat: 31.166333, lon: 34.812421, title: "Abu Swilim Building Materials" },
    { lat: 31.166306, lon: 34.814712, title: "Abu Swilim Mosque" },
    { lat: 31.163345, lon: 34.815559, title: "Abu Muharib's Butcher Shop" },
    { lat: 31.155848, lon: 34.807387, title: "Mauhidet Clinic" },
    { lat: 31.166374, lon: 34.810585, title: "General Dental Clinic" },
    { lat: 31.156483, lon: 34.805685, title: "The Entry of the Electric Company" },
    { lat: 31.155741, lon: 34.806393, title: "The Green Container" },
  ];

  const getArrowIcon = (modifier: string): any => {
    switch (modifier) {
      case 'left': return 'arrow-left';
      case 'right': return 'arrow-right';
      case 'straight': return 'arrow-up';
      case 'uturn': return 'u-turn-left';
      case 'sharp left': return 'arrow-top-left-bold';
      case 'sharp right': return 'arrow-top-right-bold';
      case 'slight left': return 'arrow-top-left';
      case 'slight right': return 'arrow-top-right';
      default: return 'arrow-up-bold';
    }
  };

  // دالة نطق التعليمات حسب اللغة المختارة
  const speakInstruction = (instruction: string) => {
    Speech.speak(instruction, {
      language: language === 'ar' ? 'ar' : language === 'he' ? 'he' : 'en',
      rate: 0.9
    });
  };

  // دالة لتغيير اللغة
  const toggleLanguage = () => {
    let newLang: LocaleKeys;
    if (language === 'en') newLang = 'ar';
    else if (language === 'ar') newLang = 'he';
    else newLang = 'en';
    
    changeLanguage(newLang);
    I18nManager.forceRTL(newLang === 'ar' || newLang === 'he');
  };

  const getCurrentLanguageName = () => {
    switch(language) {
      case 'en': return 'English';
      case 'ar': return 'العربية';
      case 'he': return 'עברית';
      default: return 'English';
    }
  };

  const calculateETA = (durationStr: string): string => {
    const minutes = parseFloat(durationStr);
    const arrival = new Date(Date.now() + minutes * 60 * 1000);
    return arrival.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const [landmarks, setLandmarks] = useState(staticLandmarks);
  const getCurrentLocation = async (): Promise<{ lat: number; lon: number }> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return { lat: 31.155844, lon: 34.807268 };
      }

      const location = await Location.getCurrentPositionAsync({});
      return {
        lat: location.coords.latitude,
        lon: location.coords.longitude
      };
    } catch (error) {
      console.error("Error getting location:", error);
      return { lat: 31.155844, lon: 34.807268 };
    }
  };

  useEffect(() => {
    const fetchLandmarks = async () => {
      try {
        const API_BASE_URL = Platform.select({
          ios: 'https://negevpulsapp.onrender.com',
          android: 'https://negevpulsapp.onrender.com',
          default: 'https://negevpulsapp.onrender.com'
        });
        
        const response = await axios.get(`${API_BASE_URL}/api/landmarks`);
        const dbLandmarks = response.data;
        const verifiedLandmarks = dbLandmarks.filter((lm: any) => lm.verified === true);
        const combined = [...staticLandmarks, ...verifiedLandmarks];
        setLandmarks(combined);
      } catch (error) {
        console.error("Error fetching landmarks:", error);
      }
    };

    fetchLandmarks();

    const initializeLocation = async () => {
      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);
      setStartPoint(currentLocation);
      setCameraSettings({
        center: [currentLocation.lon, currentLocation.lat],
        zoom: 14
      });
    };

    initializeLocation();

    Location.watchHeadingAsync((heading) => {
      setUserHeading(heading.trueHeading);
    });
   
  }, []);
  useEffect(() => {
  if (navigationMode && navigationSteps[currentStepIndex]) {
    const instruction = navigationSteps[currentStepIndex].maneuver.instruction;
    Speech.speak(instruction, { language: 'ar', rate: 0.9 });
  }
}, [currentStepIndex]);

  useEffect(() => {
    if (searchLandmarkText.trim() === "") {
      setFilteredLandmarks([]);
      return;
    }

    const filtered = landmarks.filter((lm) =>
      lm.title.toLowerCase().includes(searchLandmarkText.toLowerCase())
    );

    setFilteredLandmarks(filtered);
  }, [searchLandmarkText, landmarks]);



  const fetchRoutes = async () => {
    try {
      const API_BASE_URL = Platform.select({
        ios: 'https://negevpulsapp.onrender.com',
        android: 'https://negevpulsapp.onrender.com',
        default: 'https://negevpulsapp.onrender.com'
      });

      
      const response = await axios.get(`${API_BASE_URL}/api/routes`);
      const verifiedOnly = response.data.filter((r: any) => r.verified===true);
      
      const formatted = verifiedOnly.map((r: any) => ({
        id: r._id,
        name: r.title,
        coordinates: r.points.map((p: any) => [p.lon, p.lat]),
      }));
      
      setRoutes(formatted);
      setShowControls(false); // إخفاء النافذة بعد الحصول على المسار

    } catch (err) {
      console.error("Error fetching routes:", err);
    }
  };

  const handleLandmarkClick = (landmark: Landmark) => {
    setSelectedLandmark({
      lat: landmark.latitude,
      lon: landmark.longitude,
      title: landmark.name,
    });
    
    setCameraSettings({
      center: [landmark.longitude, landmark.latitude],
      zoom: 14
    });
  };

  const fetchRoute = async () => {
    if (!startPoint || !destination) {
      alert("Please set both the start point and the destination.");
      return;
    }

    setLoading(true);
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startPoint.lon},${startPoint.lat};${destination.lon},${destination.lat}?alternatives=false&geometries=geojson&language=en&overview=full&steps=true&access_token=pk.eyJ1Ijoic3JhZWwxMiIsImEiOiJjbTVpZmk1angwd2puMmlzNzliendwcDZhIn0.K1gCuh7b0tNdi58FGEhBcA`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const routeCoordinates = data.routes[0].geometry.coordinates;
      const steps = data.routes[0].legs[0].steps;
      setNavigationSteps(steps);

      setRoute({
        coordinates: routeCoordinates,
      });

      setRouteDetails({
        distance: (data.routes[0].legs[0].distance / 1000).toFixed(1) + ' km',
        duration: (data.routes[0].legs[0].duration / 60).toFixed(1) + ' min',
      });

      if (mapRef.current && routeCoordinates.length > 0) {
        cameraRef.current?.fitBounds(
          [startPoint.lon, startPoint.lat],
          [destination.lon, destination.lat],
          100,
          100,
        );
      }
          setShowControls(false); // إخفاء النافذة بعد الحصول على المسار

    } catch (error) {
      console.error("Failed to fetch route:", error);
      alert("Failed to fetch route. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  
  const geocodeAddress = async (address: string) => {
    if (!address.trim()) return null;
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=pk.eyJ1Ijoic3JhZWwxMiIsImEiOiJjbTVpZmk1angwd2puMmlzNzliendwcDZhIn0.K1gCuh7b0tNdi58FGEhBcA`
      );
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lon, lat] = data.features[0].center;
        return { lon, lat, title: data.features[0].place_name };
      }
      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  };

  const updateStartPoint = async () => {
    if (!startAddress.trim()) {
      alert("Please enter a starting address");
      return;
    }
  
    const landmark = staticLandmarks.find(
      (lm) => lm.title.toLowerCase() === startAddress.trim().toLowerCase()
    );
  
    if (landmark) {
      setStartPoint({ lat: landmark.lat, lon: landmark.lon, title: landmark.title });
      setCameraSettings({
        center: [landmark.lon, landmark.lat],
        zoom: 14
      });
      return;
    }
  
    const result = await geocodeAddress(startAddress);
    if (result) {
      setStartPoint({ ...result, title: result.title || startAddress });
      setCameraSettings({
        center: [result.lon, result.lat],
        zoom: 14
      });
    } else {
      alert("Could not find this location. Please try a different address.");
    }
  };

const updateDestination = async () => {
  if (!destinationAddress.trim()) {
    alert("Please enter a destination address");
    return;
  }

  // 🔍 أولا: جرب نلاقيها في الـ landmarks (بما فيهم verified)
  const landmark = landmarks.find(
    (lm) => lm.title.toLowerCase() === destinationAddress.trim().toLowerCase()
  );

  if (landmark) {
    setDestination({ lat: landmark.lat, lon: landmark.lon, title: landmark.title });
    setCameraSettings({
      center: [landmark.lon, landmark.lat],
      zoom: 14
    });
    return;
  }

  // 📍 إذا ما لقيناها ضمن المعالم، جرب نعمل Geocoding على الإنترنت
  const result = await geocodeAddress(destinationAddress);
  if (result) {
    setDestination({ ...result, title: result.title || destinationAddress });
    setCameraSettings({
      center: [result.lon, result.lat],
      zoom: 14
    });
  } else {
    alert("Could not find this location. Please try a different address.");
  }
};

  
 const startNavigation = () => {
  if (!route || !startPoint || !destination) {
    alert("Please set a route first.");
    return;
  }

  setNavigationMode(true);
  setShowControls(false); // إخفاء النافذة السفلية
  cameraRef.current?.fitBounds(
    [startPoint.lon, startPoint.lat],
    [destination.lon, destination.lat],
    100, 100
  );

  setCurrentStepIndex(0);

  // تحدث أول تعليمات
  const firstInstruction = navigationSteps[0]?.maneuver?.instruction;
  if (firstInstruction) {
    Speech.speak(firstInstruction, { language: 'ar', rate: 0.9 });
  }
};

  const toggleControls = () => {
    setShowControls(!showControls);
  };

 const handleGoToCurrentLocation = async () => {
  const currentLocation = await getCurrentLocation();
  const targetZoom = navigationMode ? 17 : 14;
  
  setCameraSettings({
    center: [currentLocation.lon, currentLocation.lat],
    zoom: targetZoom
  });
  
  if (mapRef.current) {
    cameraRef.current?.setCamera({
      centerCoordinate: [currentLocation.lon, currentLocation.lat],
      zoomLevel: targetZoom,
      animationDuration: 1000
    });
  }
};
// دالة لحساب المسافة بين نقطتين (بالأمتار)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // نصف قطر الأرض بالأمتار
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2 - lat1) * Math.PI/180;
  const Δλ = (lon2 - lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

    return (
    <View style={styles.container}>
      {/* زر تغيير اللغة */}
      <TouchableOpacity 
        style={[
          styles.languageButton,
          isRTL ? { left: 20 } : { right: 20 }
        ]}
        onPress={toggleLanguage}
      >
        <Text style={styles.languageText}>
          {getCurrentLanguageName()}
        </Text>
      </TouchableOpacity>

      {/* واجهة الملاحة */}
      {navigationMode && navigationSteps.length > 0 && (
        <View style={styles.navigationOverlay}>
          <View style={styles.arrowContainer}>
            <MaterialCommunityIcons
              name={getArrowIcon(navigationSteps[currentStepIndex]?.maneuver.modifier)}
              size={36}
              color="#fff"
            />
          </View>
          <View style={styles.directionInfo}>
            <Text style={styles.distanceText}>
              {Math.round(navigationSteps[currentStepIndex]?.distance)} {t.distance}
            </Text>
            <Text style={styles.instructionText}>
              {navigationSteps[currentStepIndex]?.maneuver.instruction}
            </Text>
            {routeDetails && (
              <Text style={styles.etaText}>
                {t.eta}: {calculateETA(routeDetails.duration)}
              </Text>
            )}
          </View>
        </View>
      )}
      <MapboxGL.MapView
        ref={mapRef}
          style={styles.map}
          styleURL="mapbox://styles/mapbox/streets-v11"
          onPress={() => setShowControls(false)}
        >
        <Camera
          ref={cameraRef}
          followUserLocation={navigationMode}
          followUserMode={navigationMode ? 'compass' as UserTrackingMode : undefined}
          followZoomLevel={17}
          centerCoordinate={location ? [location.lon ?? 0, location.lat ?? 0] : cameraSettings.center}
        />

        <MapboxGL.UserLocation
          onUpdate={(location) => {
            // تحديث الموقع الحالي
            setLocation({
              lat: location.coords.latitude,
              lon: location.coords.longitude,
          });
    
    // تحديث اتجاه المستخدم
    setUserHeading(location.coords.heading);
    
    // في وضع الملاحة فقط
    if (navigationMode) {
      // تحريك الكاميرا لمتابعة المستخدم
      cameraRef.current?.moveTo([location.coords.longitude, location.coords.latitude], 1000);
      
      // التحديث التلقائي للخطوات أثناء الملاحة
      if (navigationSteps.length > 0 && currentStepIndex < navigationSteps.length - 1) {
        const nextStep = navigationSteps[currentStepIndex + 1];
        const nextStepLocation = nextStep.maneuver.location;
        
        // حساب المسافة بين المستخدم والخطوة التالية
        const distanceToNextStep = calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          nextStepLocation[1], // خط العرض
          nextStepLocation[0]  // خط الطول
        );
        
        // إذا كان المستخدم على بعد أقل من 50 متر من الخطوة التالية
        if (distanceToNextStep < 50) {
          const newIndex = currentStepIndex + 1;
          setCurrentStepIndex(newIndex);
          
          // تحديث الكاميرا للخطوة الجديدة
          cameraRef.current?.flyTo(nextStepLocation, 1000);
          
          // نطق التعليمات للخطوة التالية
          if (newIndex + 1 < navigationSteps.length) {
            speakInstruction(navigationSteps[newIndex + 1].maneuver.instruction);
          } else {
            speakInstruction("You have reached your destination");
          }
        }
      }
    }
  }}
      renderMode={UserLocationRenderMode.Normal}
      androidRenderMode={UserLocationRenderMode.Normal}
    />
            {startPoint && (
          <PointAnnotation
            id="startPoint"
            coordinate={[startPoint.lon, startPoint.lat]}
            title="Start Point"
          >
            <View style={styles.annotationContainer}>
              <View style={[styles.annotation, { backgroundColor: '#FF5252' }]} />
              <Text style={styles.annotationText}>Start</Text>
            </View>
          </PointAnnotation>
        )}
        
        {destination && (
          <PointAnnotation
            id="destination"
            coordinate={[destination.lon, destination.lat]}
            title="Destination"
          >
            <View style={styles.annotationContainer}>
              <View style={[styles.annotation, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.annotationText}>Destination</Text>
            </View>
          </PointAnnotation>
        )}
        
        {route && (
          <MapboxGL.ShapeSource
            id="routeSource"
            shape={{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: route.coordinates,
              },
              properties: {},
            }}
          >
            <MapboxGL.LineLayer
              id="routeLine"
              style={{
                lineColor: '#3A86FF',
                lineWidth: 6,
                lineOpacity: 0.8,
              }}
            />
          </MapboxGL.ShapeSource>
        )}
        
        {routes.map((r, index) => (
          <MapboxGL.ShapeSource
            key={`route-${index}`}
            id={`route-${index}`}
            shape={{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: r.coordinates,
              },
              properties: {},
            }}
          >
            <MapboxGL.LineLayer
              id={`routeLine-${index}`}
              style={{
                lineColor: '#FF6B35',
                lineWidth: 3,
              }}
            />
          </MapboxGL.ShapeSource>
        ))}
        
        {landmarks.map((landmark, index) => (
          <PointAnnotation
            key={`landmark-${index}`}
            id={`landmark-${index}`}
            coordinate={[landmark.lon, landmark.lat]}
            title={landmark.title}
            onSelected={() => handleLandmarkClick({
              id: index,
              name: landmark.title,
              latitude: landmark.lat,
              longitude: landmark.lon
            })}
          >
            <View style={styles.annotationContainer}>
              <View style={[styles.annotation, { backgroundColor: '#5D5FEF' }]} />
              <Text style={styles.annotationText}>{landmark.title}</Text>
            </View>
          </PointAnnotation>
        ))}
        
        {navigationMode && location && (
          <>
            <MapboxGL.Images images={{ arrow: require('@/assets/images/arrow_icon.png') }} />
            <MapboxGL.ShapeSource
              id="arrow-source"
              shape={{
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [location.lon, location.lat],
                },
                properties: {},
              }}
            >
              <MapboxGL.SymbolLayer
                id="direction-arrow"
                style={{
                  iconImage: 'arrow',
                  iconSize: 0.02,
                  iconRotate: userHeading || 0,
                  iconAllowOverlap: true,
                }}
              />
            </MapboxGL.ShapeSource>
          </>
        )}
      </MapboxGL.MapView>

      
      {selectedLandmark && (
        <View style={styles.landmarkInfo}>
          <Text style={styles.landmarkTitle}>{selectedLandmark.title}</Text>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => setSelectedLandmark(null)}
          >
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}
      
<View style={[styles.topControls, navigationMode && styles.topControlsNavigation]}>
  <TouchableOpacity 
    style={styles.topButton} 
    onPress={toggleControls}
  >
    <MaterialIcons 
      name={showControls ? "keyboard-arrow-down" : "keyboard-arrow-up"} 
      size={28} 
      color="#5d4037" 
    />
  </TouchableOpacity>
  
  <TouchableOpacity 
    style={styles.topButton} 
    onPress={handleGoToCurrentLocation}
  >
    <MaterialIcons name="my-location" size={24} color="#5d4037" />
  </TouchableOpacity>
  
  {navigationMode && (
    <TouchableOpacity 
      style={[styles.topButton, styles.stopButton]} 
      onPress={() => {
        setNavigationMode(false);
        setShowControls(true);
        setDestination(null);
        setStartAddress("");
        setDestinationAddress("");
        setRoute(null);
        setNavigationSteps([]);
        setRouteDetails(null);
      }}
    >
      <AntDesign name="closecircle" size={24} color="white" />
    </TouchableOpacity>
  )}
</View>
      
      {/* عناصر التحكم */}
      {showControls && (
        <ScrollView 
          style={styles.controlsContainer}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t.startPoint}</Text>
            <TextInput
              style={[styles.input, isRTL && { textAlign: 'right' }]}
              value={startAddress}
              onChangeText={setStartAddress}
              placeholder={t.startPlaceholder || "Current Location or specific address"}
              placeholderTextColor="#a1887f"
            />
            <View style={[styles.buttonRow, isRTL && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity 
                style={styles.button} 
                onPress={updateStartPoint}
              >
                <Text style={styles.buttonText}>{t.setStart}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={() => startPoint && setCameraSettings({
                  center: [startPoint.lon, startPoint.lat],
                  zoom: 14
                })} 
                disabled={!startPoint}
              >
                <FontAwesome name="map-marker" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t.destination}</Text>
              <TextInput
                style={styles.input}
                value={destinationAddress}
                onChangeText={setDestinationAddress}
                placeholder={t.destinationPlaceholder}
                placeholderTextColor="#a1887f"
              />
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.button} 
                onPress={updateDestination}
              >
                <Text style={styles.buttonText}>{t.setDestination}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={() => destination && setCameraSettings({
                  center: [destination.lon, destination.lat],
                  zoom: 14
                })} 
                disabled={!destination}
              >
                <FontAwesome name="map-marker" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.routeActions}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.routeButton} 
                onPress={fetchRoutes}
              >
                <Text style={styles.buttonText}>{t.showRoutes}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.routeButton} 
                onPress={fetchRoute}
                disabled={!startPoint || !destination || loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Loading..." : t.showRoute}
                </Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.navigationButton} 
              onPress={startNavigation} 
              disabled={!route}
            >
              <Text style={styles.buttonText}>{t.startNavigation}</Text>
              <Ionicons name="navigate" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {routeDetails && (
            <View style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>{t.routeInfo}</Text>
                <View style={styles.routeInfo}>
                  <Text><MaterialCommunityIcons name="map-marker-distance" size={18} color="#5d4037" /> {t.distance}: {routeDetails.distance}</Text>
                  <Text><MaterialCommunityIcons name="clock-outline" size={18} color="#5d4037" /> {t.duration}: {routeDetails.duration}</Text>
                </View>
            </View>
          )}

          {navigationSteps.length > 0 && (
            <View style={styles.instructionsContainer}>
              <Text style={styles.sectionTitle}>{t.navigationSteps}</Text>
              <View style={styles.instructionsList}>
                {navigationSteps.slice(currentStepIndex, currentStepIndex + 3).map((step, index) => (
                  <View key={index} style={styles.instructionItem}>
                    <Text style={styles.instructionText}>{step.maneuver.instruction}</Text>
                    <Text style={styles.instructionDistance}>
                      {(step.distance / 1000).toFixed(1)} km
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                    style={styles.secondaryRouteButton}
                    onPress={() => {
                      if (currentStepIndex > 0) {
                        setCurrentStepIndex(currentStepIndex - 1);
                      }
                    }}
                    disabled={currentStepIndex === 0}
                  >
                    <Text style={styles.buttonText}>{t.previous}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.secondaryRouteButton}
                    onPress={() => {
                      if (currentStepIndex < navigationSteps.length - 1) {
                        setCurrentStepIndex(currentStepIndex + 1);
                        const { location } = navigationSteps[currentStepIndex + 1].maneuver;
                        cameraRef.current?.flyTo(location, 1000);
                      } else {
                        alert("You have reached your destination!");
                      }
                    }}
                    disabled={currentStepIndex >= navigationSteps.length - 1}
                  >
                    <Text style={styles.buttonText}>{t.next}</Text>
                  </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {!showControls && (
        <View style={styles.minimizedControls}>
          <TouchableOpacity 
            style={styles.minimizedButton} 
            onPress={toggleControls}
          >
            <MaterialIcons name="keyboard-arrow-up" size={28} color="#5d4037" />
          </TouchableOpacity>
          <Text style={styles.minimizedText}>
            {startPoint?.title ? `${t.startPoint}: ${startPoint.title}` : t.startPlaceholder}
          </Text>
          <Text style={styles.minimizedText}>
            {destination?.title ? `${t.destination}: ${destination.title}` : t.destinationPlaceholder}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    maxHeight: Dimensions.get('window').height * 0.6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#5d4037',
    fontSize: 16,
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d7ccc8',
    marginBottom: 12,
    fontSize: 16,
    color: '#4E342E',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 15,
  },
  button: {
    flex: 1,
    backgroundColor: '#6d4c41',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#8d6e63',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    marginTop: 10,
    marginBottom: 15,
  },
  routeButton: {
    flex: 1,
    backgroundColor: '#6d4c41',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigationButton: {
    backgroundColor: '#3A86FF',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  secondaryRouteButton: {
    flex: 1,
    backgroundColor: '#8d6e63',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  detailsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#5d4037',
    fontSize: 16,
  },
  routeInfo: {
    marginBottom: 5,
    gap: 5,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#5d4037',
    fontSize: 18,
  },
  instructionsContainer: {
    backgroundColor: '#fffbe6',
    padding: 15,
    borderRadius: 12,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#ffd700',
  },
  instructionsList: {
    marginTop: 10,
    marginBottom: 15,
  },
  instructionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instructionText: {
    flex: 3,
    fontSize: 15,
    color: '#5d4037',
  },
  instructionDistance: {
    flex: 1,
    textAlign: 'right',
    color: '#6d4c41',
    fontWeight: 'bold',
  },
  landmarkInfo: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(109, 76, 65, 0.95)',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  landmarkTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  annotationContainer: {
    alignItems: 'center',
  },
  annotation: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  annotationText: {
    fontSize: 12,
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 4,
    borderRadius: 4,
    marginTop: 4,
    fontWeight: 'bold',
  },
  topControls: {
    position: 'absolute',
    top: 50, // القيمة الافتراضية
    right: 20,
    flexDirection: 'column',
    gap: 12,
    alignItems: 'flex-end',
    zIndex: 1000, // زيادة قيمة zIndex لتكون فوق العناصر الأخرى

  },
  topControlsNavigation: { // نمط إضافي عند تفعيل الملاحة
    top: 70,
  },

  topButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  minimizedControls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  minimizedButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minimizedText: {
    flex: 1,
    marginLeft: 10,
    color: '#5d4037',
    fontSize: 14,
  },
  navigationOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  padding: 12,
  backgroundColor: 'rgba(0,0,0,0.85)',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start',
  zIndex: 999,
  borderBottomLeftRadius: 12,
  borderBottomRightRadius: 12,
},
arrowContainer: {
  marginRight: 16,
  backgroundColor: '#444',
  padding: 10,
  borderRadius: 10,
},
directionInfo: {
  flex: 1,
},
distanceText: {
  color: '#fff',
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 4,
},
instructionText2: {
  color: '#ddd',
  fontSize: 14,
},
etaText: {
  color: '#aaa',
  fontSize: 12,
  marginTop: 6,
},
stopButton: {
  backgroundColor: '#ff4444',
},
  languageButton: {
    position: 'absolute',
    top: 50,
    zIndex: 1001,
    backgroundColor: 'rgba(109, 76, 65, 0.9)',
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD54F',
  },
  languageText: {
    color: '#FFD54F',
    fontWeight: 'bold',
    fontSize: 14,
  },

});

export default HomePage;