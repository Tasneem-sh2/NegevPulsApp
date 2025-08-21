import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
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
import { useTranslations } from '@/frontend/constants/locales';
import { useLanguage } from '@/frontend/context/LanguageProvider';

interface Village {
  id: string;
  name: string;
  description: string;
  images: string[];
}

const VillageDetail = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [village, setVillage] = useState<Village | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const { t } = useTranslations();
  const { language, isRTL } = useLanguage();

  // الحصول على بيانات القرية من ملفات الترجمة
  useEffect(() => {
    if (!id) return;

    const villageData = {
      id: id,
      name: t(`villages.${id}.name`),
      description: t(`villages.${id}.description`),
      images: getVillageImages(id)
    };

    setVillage(villageData);
  }, [id, t, language]);

  // دالة للحصول على صور القرى مع صور افتراضية
  function getVillageImages(villageKey: string): string[] {
    // صور افتراضية يمكن استخدامها عند عدم توفر صور حقيقية
    const defaultImages = [
      'https://placehold.co/600x400/8d6e63/FFFFFF/png?text=Village+Image',
      'https://coffective.com/wp-content/uploads/2018/06/default-featured-image.png.jpg'
    ];
    
    // هنا يمكنك إضافة روابط الصور للقرى
    const images: Record<string, string[]> = {
      birAlHamam: [
        'https://www.dukium.org/wp-content/uploads/2014/03/A-bir-water-well-Michal-Rotem-14.5.14-150x100.jpg',
        'https://www.dukium.org/wp-content/uploads/2014/03/Bir-a-water-well-14.5.14-photo-by-Michal-Rotem-150x100.jpg',
        'https://www.dukium.org/wp-content/uploads/2014/03/An-old-house-with-a-water-well-underneath-it-14.514-Michal-Rotem-150x100.jpg'

      ],
      khasimZannih: [
        'https://www.dukium.org/wp-content/uploads/2013/08/Khaled-Khasham-Zanneh-No-grabage-disposal-facilities-in-the-village-06.01.2017-150x113.jpg',
        'https://www.dukium.org/wp-content/uploads/2013/08/Mekorot-reservior-near-the-villages-ancient-cemetery-14.8.19-Haia-Noach-150x113.jpeg'

      ],
      wadiAlMsas: [
        'https://www.dukium.org/wp-content/uploads/2014/03/Photo-by-Michal-Rotem-3.2.14-150x100.jpg',
        'https://www.dukium.org/wp-content/uploads/2014/03/3.2.14-photo-by-Michal-Rotem.jpg'
      ],
      khirbitAlWatan: [
        'https://th.bing.com/th/id/OIP.Hxqc1NX49zsxSRF0guSWtAHaEW?w=292&h=180&c=7&r=0&o=5&cb=iwc1&dpr=1.3&pid=1.7'
      ],
      alMsaadiyyah: [
        'https://www.dukium.org/wp-content/uploads/2014/03/18.1.14-photo-by-Michal-Rotem1-150x100.jpg'
      ],
      alGharrah: [
        'https://www.dukium.org/wp-content/uploads/2014/01/photo-by-Miki-Kratsman-date-unknown.jpg',
        'https://www.dukium.org/wp-content/uploads/2014/01/View-of-the-village-date-uknown-photo-by-Miki-Kratsman.jpg'
      ],
      alBatil: [
        'https://www.dukium.org/wp-content/uploads/2013/08/al-batl-05082012_8398837937_o-150x100.jpg'
      ],
      awajan: [
        'https://felesteen.news/thumb/w920/uploads/images/2023/01/c8Wq2.jpg'
      ]
    };
    
    return images[villageKey] || defaultImages;
  }

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const viewSize = SCREEN_WIDTH;
    const newIndex = Math.round(contentOffset / viewSize);
    setCurrentIndex(newIndex);
  };

  // معالجة أخطاء تحميل الصور
  const handleImageError = (error: any, imageUrl: string) => {
    console.log('Failed to load image:', imageUrl, error);
    // يمكنك إضافة منطق لاستبدال الصور المعطلة بصورة افتراضية
  };

  // Updated markdown styles to match the theme
  const markdownStyles = {
    body: {
      color: '#5d4037',
      fontSize: 16,
      lineHeight: 24,
      textAlign: isRTL ? 'right' : 'left' as 'right' | 'left',
      writingDirection: isRTL ? 'rtl' : 'ltr' as 'rtl' | 'ltr',
    },
    heading1: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#6d4c41',
      marginTop: 20,
      marginBottom: 10,
      textAlign: isRTL ? 'right' : 'left' as 'right' | 'left',
      writingDirection: isRTL ? 'rtl' : 'ltr' as 'rtl' | 'ltr',
    },
    heading2: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#6d4c41',
      marginTop: 15,
      marginBottom: 8,
      textAlign: isRTL ? 'right' : 'left' as 'right' | 'left',
      writingDirection: isRTL ? 'rtl' : 'ltr' as 'rtl' | 'ltr',
    },
    paragraph: {
      marginBottom: 15,
      textAlign: isRTL ? 'right' : 'left' as 'right' | 'left',
      writingDirection: isRTL ? 'rtl' : 'ltr' as 'rtl' | 'ltr',
    },
    link: {
      color: '#6d4c41',
      textDecorationLine: 'underline' as const,
    },
  };

  if (!village) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('errors.villageNotFound', 'Village not found')}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={20} color="#FFD700" />
          <Text style={styles.buttonText}>{t('common.back', 'Back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={[
          styles.title,
          { 
            textAlign: isRTL ? 'right' : 'left',
            writingDirection: isRTL ? 'rtl' : 'ltr'
          }
        ]}>
          {village.name}
        </Text>
      </View>

      {village.images.length > 0 ? (
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
                  onError={(e) => handleImageError(e, item)}
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
          
          {/* مؤشر الصور */}
          {village.images.length > 1 && (
            <View style={styles.indicatorContainer}>
              {village.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentIndex && styles.activeIndicator
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <MaterialIcons name="image" size={50} color="#8d6e63" />
          <Text style={styles.placeholderText}>{t('common.noImages', 'No images available')}</Text>
        </View>
      )}

      <View style={styles.contentWrapper}>
        <Markdown style={markdownStyles}>
          {village.description}
        </Markdown>

        {village.images.length > 1 && (
          <View style={styles.thumbnailGallery}>
            <Text style={[
              styles.sectionTitle,
              { 
                textAlign: isRTL ? 'right' : 'left',
                writingDirection: isRTL ? 'rtl' : 'ltr'
              }
            ]}>
              {t('common.gallery', 'Gallery')}
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={isRTL ? { flexDirection: 'row-reverse' } : {}}
            >
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
                    onError={(e) => handleImageError(e, img)}
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
        <Text style={styles.buttonText}>{t('common.backToVillages', 'Back to Villages')}</Text>
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
  },
  galleryContainer: {
    height: 300,
    position: 'relative',
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
  indicatorContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeIndicator: {
    backgroundColor: '#FFD700',
    width: 12,
  },
  placeholderContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0e6e2',
    gap: 10,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    gap: 20,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 18,
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