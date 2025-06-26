import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import SuperCluster from 'supercluster';

const API_BASE_URL = 'http://172.19.33.185:8082/api';
const ORS_API_KEY = process.env.EXPO_PUBLIC_ORS_API_KEY!;

interface Point {
  lat: number;
  lon: number;
  title?: string;
}

interface Landmark {
  _id: string;
  title: string;
  lat: number;
  lon: number;
  verified: boolean;
}

interface Route {
  _id: string;
  title: string;
  points: Point[];
  verified: boolean;
  rating?: number;
  ratingsCount?: number;
  createdBy?: string;
  createdAt?: string;
}

interface Instruction {
  type: string;
  distance: number;
  duration: number;
  text: string;
}

const EmergencyPage: React.FC = () => {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<Point | null>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [destination, setDestination] = useState<Point | null>(null);
  const [route, setRoute] = useState<{ coordinates: Point[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<Route[]>([]);
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [region, setRegion] = useState({
    latitude: 31.155844,
    longitude: 34.807268,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [startAddress, setStartAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [routeDetails, setRouteDetails] = useState<{ distance: string; duration: string } | null>(null);
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [hint, setHint] = useState('');

  // Static landmarks data
  const staticLandmarks = [
    { _id: '1', title: "Algergawi Shop", lat: 31.155844, lon: 34.807268, verified: true },
    { _id: '2', title: "Electricity Pole", lat: 31.15478, lon: 34.809776, verified: true },
    { _id: '3', title: "Electric Company", lat: 31.155101, lon: 34.811155, verified: true },
    { _id: '4', title: "Al-Azazma School", lat: 31.163493, lon: 34.820984, verified: true },
    { _id: '5', title: "Algergawi Mosque", lat: 31.15632, lon: 34.810717, verified: true },
  ];

  // Calculate distance between two points
  const calculateDistance = (point1: Point, point2: Point) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = point1.lat * Math.PI/180;
    const φ2 = point2.lat * Math.PI/180;
    const Δφ = (point2.lat - point1.lat) * Math.PI/180;
    const Δλ = (point2.lon - point1.lon) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Find nearest point on custom routes
  const findNearestPointOnCustomRoutes = (point: Point) => {
    let nearestPoint = point;
    let minDistance = Infinity;

    routes.forEach(route => {
      route.points.forEach(routePoint => {
        const distance = calculateDistance(point, routePoint);
        if (distance < minDistance) {
          minDistance = distance;
          nearestPoint = routePoint;
        }
      });
    });

    return nearestPoint;
  };

  // Fetch landmarks from API
  useEffect(() => {
    const fetchLandmarks = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/landmarks`);
        const verifiedLandmarks = response.data.filter((l: Landmark) => l.verified);
        setLandmarks([...staticLandmarks, ...verifiedLandmarks]);
      } catch (error) {
        console.error("Error fetching landmarks:", error);
        setLandmarks(staticLandmarks);
      }
    };

    fetchLandmarks();
  }, []);

  // Fetch routes from API
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/routes`);
        const verifiedRoutes = response.data.filter((r: Route) => r.verified);
        setRoutes(verifiedRoutes);
      } catch (error) {
        console.error("Error fetching routes:", error);
      }
    };

    fetchRoutes();
  }, []);

  // Get user location
  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        setLocation({ lat: 31.155844, lon: 34.807268 });
        setStartPoint({ lat: 31.155844, lon: 34.807268 });
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const newLocation = {
        lat: location.coords.latitude,
        lon: location.coords.longitude,
        title: 'Current Location'
      };
      
      setLocation(newLocation);
      setStartPoint(newLocation);
      setRegion({
        latitude: newLocation.lat,
        longitude: newLocation.lon,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    };

    getLocation();
  }, []);

  // Update clusters when landmarks or region changes
  useEffect(() => {
    const index = new SuperCluster({
      radius: 60,
      maxZoom: 16
    });
    
    index.load(landmarks.map(l => ({
      type: 'Feature',
      properties: { landmark: l },
      geometry: {
        type: 'Point',
        coordinates: [l.lon, l.lat]
      }
    })));
    
    const newClusters = index.getClusters(
      [region.longitude - region.longitudeDelta, region.latitude - region.latitudeDelta, 
       region.longitude + region.longitudeDelta, region.latitude + region.latitudeDelta],
      Math.floor(Math.log2(360 / region.longitudeDelta))
    );
    
    setClusters(newClusters);
  }, [landmarks, region]);

  // Update hints based on state
  useEffect(() => {
    if (!startPoint && !destination) {
      setHint('Set both start and destination points to calculate route');
    } else if (!route) {
      setHint('Press "Calculate Route" to find the best path');
    } else {
      setHint('Long press on map to add custom path points');
    }
  }, [startPoint, destination, route]);

  // Focus map on selected point
  const focusOnPoint = (point: Point) => {
    if (!mapRef.current || !point) return;
    
    setRegion({
      latitude: point.lat,
      longitude: point.lon,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
  };

  // Handle landmark selection
  const handleLandmarkSelect = (landmark: Landmark) => {
    setSelectedLandmark(landmark);
    focusOnPoint({ lat: landmark.lat, lon: landmark.lon, title: landmark.title });
  };

  // Set start point from address
 const handleSetStartPoint = async () => {
  if (!startAddress.trim()) {
    Alert.alert('Error', 'Please enter a starting address');
    return;
  }

  // 1️⃣ Check in local landmarks
  const landmark = landmarks.find((l) =>
    l.title.toLowerCase().includes(startAddress.toLowerCase())
  );
  if (landmark) {
    const optimizedStart = findNearestPointOnCustomRoutes(landmark);
    setStartPoint({ lat: landmark.lat, lon: landmark.lon, title: landmark.title });
    focusOnPoint({ lat: landmark.lat, lon: landmark.lon });
    return;
  }

  // 2️⃣ Try external geocoding
  try {
  const response = await axios.get(
  `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destinationAddress)}`, 
  {
    headers: {
      'User-Agent': 'MyApp/1.0 (youremail@example.com)',
      'Accept-Language': 'en',
    },
  }
);
    if (response.data.length > 0) {
      const { lat, lon, display_name } = response.data[0];
      setStartPoint({ lat: parseFloat(lat), lon: parseFloat(lon), title: display_name });
      focusOnPoint({ lat: parseFloat(lat), lon: parseFloat(lon) });
    } else {
      Alert.alert('Error', 'Location not found. Try a landmark name.');
    }
  } catch (error) {
    console.error(error);
    Alert.alert('Error', 'Could not locate starting point. Try another name.');
  }
};


  // Set destination from address
 const handleSetDestination = async () => {
  if (!destinationAddress.trim()) {
    Alert.alert('Error', 'Please enter a destination address');
    return;
  }

  // 1️⃣ Check in local landmarks
  const landmark = landmarks.find((l) =>
    l.title.toLowerCase().includes(destinationAddress.toLowerCase())
  );
  if (landmark) {
    const optimizedDest = findNearestPointOnCustomRoutes(landmark);
    setDestination({ lat: landmark.lat, lon: landmark.lon, title: landmark.title });
    focusOnPoint({ lat: landmark.lat, lon: landmark.lon });
    return;
  }

  // 2️⃣ Try external geocoding
  try {
  const response = await axios.get(
  `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destinationAddress)}`, 
  {
    headers: {
      'User-Agent': 'MyApp/1.0 (youremail@example.com)',
      'Accept-Language': 'en',
    },
  }
);
    if (response.data.length > 0) {
      const { lat, lon, display_name } = response.data[0];
      setDestination({ lat: parseFloat(lat), lon: parseFloat(lon), title: display_name });
      focusOnPoint({ lat: parseFloat(lat), lon: parseFloat(lon) });
    } else {
      Alert.alert('Error', 'Location not found. Try a landmark name.');
    }
  } catch (error) {
    console.error(error);
    Alert.alert('Error', 'Could not locate destination. Try another name.');
  }
};


  // Calculate route using OpenRouteService API
  const calculateRoute = async () => {
    if (!startPoint || !destination) {
      Alert.alert('Error', 'Please set both start and destination points');
      return;
    }

    setLoading(true);
    
    try {
      // Prepare custom paths from user-added routes
      const customPaths = routes.map(route => ({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: route.points.map(p => [p.lon, p.lat])
        }
      }));

      // Call OpenRouteService API
      const response = await axios.post(
        `https://api.openrouteservice.org/v2/directions/foot-walking/geojson`,
        {
          coordinates: [
            [startPoint.lon, startPoint.lat],
            [destination.lon, destination.lat]
          ],
          extra_info: ['ways'],
          preferences: 'recommended',
          geometry_simplify: false,
          instructions: true,
          custom_paths: customPaths
        },
        {
          headers: {
            'Authorization': ORS_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Process response
      const rawOptimizedCoordinates: [number, number][] = response.data.features[0].geometry.coordinates;
      const optimizedCoordinates = rawOptimizedCoordinates.map(([lon, lat]) => ({ lat, lon }));
      setRoute({ coordinates: optimizedCoordinates }); // مفقودة!


      
      // Route details
      const { distance, duration } = response.data.features[0].properties.summary;
      setRouteDetails({
        distance: `${(distance / 1000).toFixed(1)} km`,
        duration: `${Math.round(duration / 60)} min`
      });

      // Navigation instructions
      const steps = response.data.features[0].properties.segments[0].steps.map((step: any) => ({
        type: step.type,
        distance: step.distance,
        duration: step.duration,
        text: step.instruction
      }));
      setInstructions(steps);
    } catch (error) {
      console.error("Error calculating route:", error);
      Alert.alert('Error', 'Could not calculate route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Optimize route using community paths
  const optimizeRouteWithCustomPaths = async () => {
    if (!route) return;
    
    setLoading(true);
    
    try {
      // Sample points from current route
      const waypoints = route.coordinates
        .filter((_, i) => i % 5 === 0)
        .map(p => [p.lon, p.lat]);
      
      // Prepare custom paths
      const customPaths = routes.map(r => ({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: r.points.map(p => [p.lon, p.lat])
        }
      }));

      // Call API for optimized route
      const response = await axios.post(
        `https://api.openrouteservice.org/v2/directions/foot-walking/geojson`,
        {
          coordinates: waypoints,
          preferences: 'recommended',
          custom_paths: customPaths
        },
        {
          headers: {
            'Authorization': ORS_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update route with optimized path
     const rawCoordinates: [number, number][] = response.data.features[0].geometry.coordinates;
     const coordinates = rawCoordinates.map(([lon, lat]) => ({ lat, lon }));
     setRoute({ coordinates });

      
      // Update route details
      const { distance, duration } = response.data.features[0].properties.summary;
      setRouteDetails({
        distance: `${(distance / 1000).toFixed(1)} km`,
        duration: `${Math.round(duration / 60)} min`
      });

      // Update instructions
      const steps = response.data.features[0].properties.segments[0].steps.map((step: any) => ({
        type: step.type,
        distance: step.distance,
        duration: step.duration,
        text: step.instruction
      }));
      setInstructions(steps);
    } catch (error) {
      console.error("Optimization failed:", error);
      Alert.alert('Error', 'Could not optimize route');
    } finally {
      setLoading(false);
    }
  };

  // Rate a route
  const rateRoute = async (routeId: string, rating: number) => {
    try {
      await axios.post(`${API_BASE_URL}/routes/rate`, {
        routeId,
        rating
      });
      
      // Update local state
      setRoutes(routes.map(r => 
        r._id === routeId ? {
          ...r,
          rating: ((r.rating || 0) * (r.ratingsCount || 0) + rating) / ((r.ratingsCount || 0) + 1),
          ratingsCount: (r.ratingsCount || 0) + 1
        } : r
      ));
    } catch (error) {
      console.error("Rating failed:", error);
    }
  };

  // Save current route to favorites
  const saveCurrentRoute = () => {
    if (!route) return;
    
    const newRoute: Route = {
      _id: Date.now().toString(),
      title: `Saved Route ${savedRoutes.length + 1}`,
      points: route.coordinates,
      verified: false,
      createdAt: new Date().toISOString()
    };
    
    
    setSavedRoutes([...savedRoutes, newRoute]);
    Alert.alert('Success', 'Route saved to your favorites');
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
      >
        {/* User location marker */}
        {location && (
          <Marker
            coordinate={{ latitude: location.lat, longitude: location.lon }}
            title="Your Location"
            pinColor="#FFD700"
          />
        )}

        {/* Start point marker */}
        {startPoint && (
          <Marker
            coordinate={{ latitude: startPoint.lat, longitude: startPoint.lon }}
            title={startPoint.title || "Start Point"}
            pinColor="red"
          />
        )}

        {/* Destination marker */}
        {destination && (
          <Marker
            coordinate={{ latitude: destination.lat, longitude: destination.lon }}
            title={destination.title || "Destination"}
            pinColor="green"
          />
        )}

        {/* Clustered landmarks */}
        {clusters.map(cluster => {
          if (cluster.properties.cluster) {
            return (
              <Marker
                key={`cluster-${cluster.id}`}
                coordinate={{
                  latitude: cluster.geometry.coordinates[1],
                  longitude: cluster.geometry.coordinates[0]
                }}
                onPress={() => {
                  const zoom = Math.min(20, Math.floor(Math.log2(360 / region.longitudeDelta) + 1));
                  mapRef.current?.animateToRegion({
                    latitude: cluster.geometry.coordinates[1],
                    longitude: cluster.geometry.coordinates[0],
                    latitudeDelta: region.latitudeDelta / 2,
                    longitudeDelta: region.longitudeDelta / 2
                  }, 500);
                }}
              >
                <View style={styles.clusterMarker}>
                  <Text style={styles.clusterText}>{cluster.properties.point_count}</Text>
                </View>
              </Marker>
            );
          }
          
          const landmark = cluster.properties.landmark;
          return (
            <Marker
              key={landmark._id}
              coordinate={{ latitude: landmark.lat, longitude: landmark.lon }}
              title={landmark.title}
              pinColor={landmark.verified ? "#3498db" : "#AAAAAA"}
              onPress={() => handleLandmarkSelect(landmark)}
            />
          );
        })}

        {/* User-added routes */}
        {routes.map(route => (
          <Polyline
            key={route._id}
            coordinates={route.points.map(p => ({
              latitude: p.lat,
              longitude: p.lon
            }))}
            strokeColor="#3A86FF"
            strokeWidth={3}
          />
        ))}

        {/* Calculated route */}
        {route && (
          <Polyline
            coordinates={route.coordinates.map(p => ({
              latitude: p.lat,
              longitude: p.lon
            }))}
            strokeColor="brown"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Controls container */}
      <View style={styles.controlsContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Hint text */}
          <Text style={styles.hintText}>{hint}</Text>

          {/* Start Point Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Starting Point:</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter landmark name or 'Current Location'"
              value={startAddress}
              onChangeText={setStartAddress}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.button} 
                onPress={handleSetStartPoint}
              >
                <Text style={styles.buttonText}>Set Start</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => startPoint && focusOnPoint(startPoint)}
                disabled={!startPoint}
              >
                <MaterialIcons name="my-location" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Destination Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Destination:</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter landmark name"
              value={destinationAddress}
              onChangeText={setDestinationAddress}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.button} 
                onPress={handleSetDestination}
              >
                <Text style={styles.buttonText}>Set Destination</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => destination && focusOnPoint(destination)}
                disabled={!destination}
              >
                <MaterialIcons name="my-location" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Route Actions */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.routeButton}
              onPress={calculateRoute}
              disabled={!startPoint || !destination || loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Calculate Route</Text>
              )}
            </TouchableOpacity>

            {route && (
              <>
                <TouchableOpacity 
                  style={styles.optimizedRouteButton}
                  onPress={optimizeRouteWithCustomPaths}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>Optimize Using Community Paths</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={saveCurrentRoute}
                >
                  <Text style={styles.buttonText}>Save This Route</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity 
              style={styles.secondaryRouteButton}
              onPress={() => setRoutes([...routes])} // Refresh routes
            >
              <Text style={styles.buttonText}>Refresh Routes</Text>
            </TouchableOpacity>
          </View>

          {/* Route Details */}
         {route && routes.some(r =>
  route.coordinates.some(c =>
    r.points.some(p =>
      calculateDistance(c, p) < 50
    )
  )
) && (
  <View style={styles.communitySection}>
    <Text style={styles.communityTitle}>Community Paths Used</Text>
    {routes.filter(r =>
      route.coordinates.some(c =>
        r.points.some(p =>
          calculateDistance(c, p) < 50
        )
      )
    ).map(r => (
      <View key={r._id} style={styles.routeInfo}>
        <Text>{r.title}</Text>
        <View style={styles.ratingContainer}>
          <Text>Rating: {r.rating?.toFixed(1) || 'Not rated'}</Text>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity
              key={star}
              onPress={() => rateRoute(r._id, star)}
            >
              <MaterialIcons
                name={star <= (r.rating || 0) ? 'star' : 'star-border'}
                size={20}
                color="#FFD700"
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    ))}
  </View>
)}

          {/* Navigation Instructions */}
          {instructions.length > 0 && (
            <View style={styles.instructionsContainer}>
              <Text style={styles.sectionTitle}>Navigation Instructions</Text>
              <ScrollView style={styles.instructionsList}>
                {instructions.map((step, index) => (
                  <View key={index} style={styles.instructionItem}>
                    <Text style={styles.instructionText}>{step.text}</Text>
                    <Text style={styles.instructionDistance}>{step.distance}m</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Landmarks List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Verified Landmarks</Text>
            <ScrollView style={styles.landmarksList}>
              {landmarks.map(landmark => (
                <TouchableOpacity 
                  key={landmark._id}
                  style={styles.landmarkItem}
                  onPress={() => handleLandmarkSelect(landmark)}
                >
                  <Text>{landmark.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </View>

      {/* Selected Landmark Info */}
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 15,
    maxHeight: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#5d4037',
  },
  input: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d7ccc8',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    backgroundColor: '#6d4c41',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: '#8d6e63',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  section: {
    marginTop: 10,
  },
  routeButton: {
    backgroundColor: '#6d4c41',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  optimizedRouteButton: {
    backgroundColor: '#3A86FF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  secondaryRouteButton: {
    backgroundColor: '#8d6e63',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#f0e6e2',
  },
  detailsTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#5d4037',
  },
  communitySection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  communityTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  routeInfo: {
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#5d4037',
  },
  instructionsContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    maxHeight: 150,
  },
  instructionsList: {
    marginTop: 5,
  },
  instructionItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  instructionText: {
    flex: 3,
  },
  instructionDistance: {
    flex: 1,
    textAlign: 'right',
    color: '#6d4c41',
  },
  landmarksList: {
    maxHeight: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
  },
  landmarkItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  landmarkInfo: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(109, 76, 65, 0.9)',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  landmarkTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    padding: 5,
  },
  clusterMarker: {
    backgroundColor: '#6d4c41',
    borderRadius: 15,
    padding: 10,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  hintText: {
    color: '#6d4c41',
    fontStyle: 'italic',
    marginTop: 5,
    textAlign: 'center',
  },
});

export default EmergencyPage;