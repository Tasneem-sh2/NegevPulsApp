import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Markdown from 'react-native-markdown-display';

interface Village {
  _id: string;
  name: string;
  description: string;
  content: string;
  images: string[];
  location?: {
    type: string;
    coordinates: number[];
  };
}

const VillageDetail = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [village, setVillage] = useState<Village | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || "http://negevpulsapp.onrender.com";
  const flatListRef = useRef<FlatList>(null);
  const SCREEN_WIDTH = Dimensions.get('window').width;

  const getImageUrl = (imagePath: string): string => {
    if (!imagePath) return '';
    if (/^https?:\/\//i.test(imagePath)) return imagePath;
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${normalizedBaseUrl}/${cleanPath}`;
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const viewSize = SCREEN_WIDTH;
    const newIndex = Math.round(contentOffset / viewSize);
    setCurrentIndex(newIndex);
  };

  // Updated markdown styles to match the theme
  const markdownStyles = {
    body: {
      color: '#5d4037',
      fontSize: 16,
      lineHeight: 24,
    },
    heading1: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#6d4c41',
      marginTop: 20,
      marginBottom: 10,
    },
    heading2: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#6d4c41',
      marginTop: 15,
      marginBottom: 8,
    },
    paragraph: {
      marginBottom: 15,
    },
    link: {
      color: '#6d4c41',
      textDecorationLine: 'underline' as const,
    },
  };

  useEffect(() => {
    if (!id) {
      setError('No village ID provided');
      setLoading(false);
      return;
    }

    const fetchVillageDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get<Village>(`${baseUrl}/api/villages/${id}`);
        
        if (!response.data) {
          throw new Error('Village not found');
        }

        const villageData = {
          ...response.data,
          images: response.data.images?.map((img: string) => getImageUrl(img)) || []
        };

        setVillage(villageData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch village details');
        console.error('Error fetching village details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVillageDetails();
  }, [id, baseUrl]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6d4c41" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!village) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Village not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>{village.name}</Text>
      </View>

      {village.images?.length > 0 ? (
        <View style={styles.galleryContainer}>
          <FlatList
            ref={flatListRef}
            data={village.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: item }}
                  style={styles.mainImage}
                  resizeMode="cover"
                />
              </View>
            )}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
          />
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>No images available</Text>
        </View>
      )}

      <View style={styles.contentWrapper}>
        <Markdown style={markdownStyles}>
          {village.content || village.description}
        </Markdown>

        {village.images?.length > 1 && (
          <View style={styles.thumbnailGallery}>
            <Text style={styles.sectionTitle}>Gallery</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {village.images.map((img, index) => (
                <TouchableOpacity 
                  key={index} 
                  onPress={() => {
                    flatListRef.current?.scrollToIndex({
                      index,
                      animated: true,
                    });
                  }}
                  style={[
                    styles.thumbnailContainer,
                    index === currentIndex && styles.activeThumbnail
                  ]}
                >
                  <Image 
                    source={{ uri: img }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => router.back()}
      >
        <MaterialIcons name="arrow-back" size={20} color="#FFD700" />
        <Text style={styles.buttonText}>Back to Villages</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    backgroundColor: '#6d4c41',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
  },
  galleryContainer: {
    height: 300,
  },
  imageContainer: {
    width: Dimensions.get('window').width,
    height: 300,
    overflow: 'hidden',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0e6e2',
  },
  placeholderText: {
    color: '#8d6e63',
    fontSize: 16,
  },
  contentWrapper: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    borderWidth: 1,
    borderColor: '#f0e6e2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6d4c41',
    marginBottom: 15,
  },
  thumbnailGallery: {
    marginTop: 30,
  },
  thumbnailContainer: {
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 8,
  },
  activeThumbnail: {
    borderColor: '#6d4c41',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#6d4c41',
    padding: 15,
    borderRadius: 10,
    margin: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VillageDetail;