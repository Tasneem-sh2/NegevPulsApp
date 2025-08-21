import { useTranslations } from '@/frontend/constants/locales';
import type { LocaleKeys } from '@/frontend/constants/locales/types';
import { useLanguage } from '@/frontend/context/LanguageProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Village = {
  id: string;
  name: string;
  description: string;
  image: string;
};

export default function MainIndex() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { language, changeLanguage, isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslations();

  // قائمة القرى مع معرفات ثابتة
  const villageKeys = [
    'birAlHamam',
    'khasimZannih',
    'wadiAlMsas',
    'khirbitAlWatan',
    'alMsaadiyyah',
    'alGharrah',
    'alBatil',
    'awajan'
  ];

  // الحصول على بيانات القرى من ملفات الترجمة
  const villages = useMemo(() => {
    return villageKeys.map(key => ({
      id: key,
      name: t(`villages.${key}.name`),
      description: t(`villages.${key}.description`),
      image: getVillageImage(key)
    }));
  }, [t, language]);

  // دالة للحصول على صور القرى
  function getVillageImage(villageKey: string): string {
    // صور افتراضية لكل قرية
    const images: Record<string, string> = {
      birAlHamam: 'https://static.wixstatic.com/media/01368b_5cc18cf2358c4434840d28c8e3caa6e0~mv2.jpg/v1/fill/w_738,h_415,al_c,q_80,enc_avif,quality_auto/01368b_5cc18cf2358c4434840d28c8e3caa6e0~mv2.jpg',
      khasimZannih: 'https://www.dukium.org/wp-content/uploads/2013/08/Saja-Khasham-Zanneh-17.03.2017-sheep.jpg',
      wadiAlMsas: 'https://www.dukium.org/wp-content/uploads/2014/03/Photo-by-Michal-Rotem-3.2.14.jpg',
      khirbitAlWatan: 'https://data.arab48.com/data/news/2020/05/29/Croped/20200529042540.jpg',
      alMsaadiyyah: 'https://www.dukium.org/wp-content/uploads/2014/03/The-village-from-the-main-road.jpg',
      alGharrah: 'https://www.dukium.org/wp-content/uploads/2014/01/View-of-the-village-date-uknown-photo-by-Miki-Kratsman.jpg',
      alBatil: 'https://www.dukium.org/wp-content/uploads/2013/08/battle21_8399925786_o.jpg',
      awajan: 'https://felesteen.news/thumb/w920/uploads/images/2023/01/c8Wq2.jpg'
    };
    
    return images[villageKey] || 'https://placehold.co/600x400/8d6e63/FFFFFF/png?text=Negev+Village';
  }

  const safePush = (path: string) => {
    const allowedRoutes = ['/authOptions', '/login', '/signup'];
    if (allowedRoutes.includes(path)) {
      router.push(path as any);
    } else {
      console.warn(`Attempted to navigate to invalid route: ${path}`);
      router.push('./');
    }
  };

  // معالجة أخطاء تحميل الصور
  const handleImageError = (error: any, imageUrl: string) => {
    console.log('Failed to load image:', imageUrl, error);
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#6d4c41" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => location.reload()}
        >
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Top Row - Language Selector */}
        <View style={styles.topRow}>
          <View style={styles.languageSelector}>
            {(['en', 'ar', 'he'] as LocaleKeys[]).map((lang) => (
              <TouchableOpacity
                key={lang}
                onPress={() => changeLanguage(lang)}
                style={[styles.languageButton, language === lang && styles.activeLanguage]}
              >
                <Text style={[styles.languageText, language === lang && styles.activeLanguageText]}>
                  {lang === 'en' ? 'EN' : lang === 'ar' ? 'عربي' : 'עברית'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Middle Row - Welcome Message */}
        <Animated.View style={[styles.headerContent, { opacity: fadeAnim }]}>
          <MaterialIcons name="location-city" size={32} color="#FFD700" />
          <Text style={styles.welcomeText}>
            {t('common.welcome')} <Text style={styles.brandName}>{t('common.appName')}</Text>
          </Text>
        </Animated.View>

        {/* Bottom Row - Start Button */}
        <View style={styles.startButtonContainer}>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => safePush('/authOptions')}
          >
            <Text style={styles.startButtonText}>{t('common.letsStart')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Section */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{t('villages.title')}</Text>
        </View>

        {/* Description Paragraph */}
        <View style={styles.paragraphContainer}>
          <Text style={[
            styles.paragraphText,
            { 
              writingDirection: isRTL ? 'rtl' : 'ltr',
              textAlign: isRTL ? 'right' : 'left'
            }
          ]}>
            {t('villages.fullDescription')}
          </Text>
        </View>

        {/* Application Description Section */}
        <View style={styles.paragraphContainer}>
          <Text style={[
            styles.paragraphText,
            { 
              writingDirection: isRTL ? 'rtl' : 'ltr',
              textAlign: isRTL ? 'right' : 'left'
            }
          ]}>
            {t('villages.appDescription')}
          </Text>
        </View>

        {/* Villages Grid */}
        <View style={styles.villagesGrid}>
          {villages.map((village) => (
            <TouchableOpacity
              key={village.id}
              onPress={() => router.push(`./village/${village.id}`)}
              style={styles.villageCard}
            >
              <View style={styles.villageImageContainer}>
                <Image 
                  source={{ uri: village.image }}
                  style={styles.villageImage}
                  resizeMode="cover"
                  onError={(e) => handleImageError(e, village.image)}
                />
              </View>
              
              <View style={styles.villageContent}>
                <Text 
                  style={[
                    styles.villageTitle,
                    { 
                      textAlign: isRTL ? 'right' : 'left',
                      writingDirection: isRTL ? 'rtl' : 'ltr'
                    }
                  ]}
                  numberOfLines={1}
                >
                  {village.name}
                </Text>
                
                <Text 
                  style={[
                    styles.villageDescription,
                    { 
                      textAlign: isRTL ? 'right' : 'left',
                      writingDirection: isRTL ? 'rtl' : 'ltr'
                    }
                  ]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {village.description}
                </Text>
                
                <View style={[
                  styles.readMoreContainer,
                  { 
                    alignItems: isRTL ? 'flex-start' : 'flex-end' 
                  }
                ]}>
                  <Text style={styles.readMoreText}>
                    {t('common.readMore')} →
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
  header: {
    backgroundColor: '#6d4c41',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  brandName: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  languageSelector: {
    flexDirection: 'row',
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#8d6e63',
  },
  activeLanguage: {
    backgroundColor: '#8d6e63',
    borderColor: '#FFD700',
  },
  languageText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  activeLanguageText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  startButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  startButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    backgroundColor: '#FFD700',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#5d4037',
    fontWeight: 'bold',
    fontSize: 18,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  titleContainer: {
    backgroundColor: '#8d6e63',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  paragraphContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  paragraphText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#5d4037',
  },
  villagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  villageCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  villageImageContainer: {
    height: 120,
    width: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  villageImage: {
    height: '100%',
    width: '100%',
  },
  villageContent: {
    padding: 12,
  },
  villageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5d4037',
    marginBottom: 5,
  },
  villageDescription: {
    fontSize: 14,
    color: '#8d6e63',
    marginBottom: 8,
  },
  readMoreContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
  },
  readMoreText: {
    color: '#6d4c41',
    fontWeight: 'bold',
    fontSize: 14,
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
  retryButton: {
    backgroundColor: '#6d4c41',
    padding: 15,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
});