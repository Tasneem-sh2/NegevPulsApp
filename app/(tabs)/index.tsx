import { useTranslations } from '@/frontend/constants/locales';
import type { LocaleKeys } from '@/frontend/constants/locales/types';
import { useLanguage } from '@/frontend/context/LanguageProvider';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Village = {
  _id: string;
  name: string;
  description: string;
  images?: string[];
  names?: Record<LocaleKeys, string>;
  descriptions?: Record<LocaleKeys, string>;
};

export default function MainIndex() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { language, changeLanguage, isRTL } = useLanguage();
  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations();
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || "https://negevpulsapp.onrender.com";
 
  useEffect(() => {
    const fetchVillages = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${baseUrl}/api/villages`);
        setVillages(response.data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        console.error("Error fetching villages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVillages();
  }, [baseUrl]);
  const safePush = (path: string) => {
  const allowedRoutes = ['/authOptions', '/login', '/signup']; // Add all valid routes
    if (allowedRoutes.includes(path)) {
      router.push(path as any);
    } else {
      console.warn(`Attempted to navigate to invalid route: ${path}`);
      router.push('./');
    }
  };
  
  const getImageUrl = (village: Village) => {
    if (!village.images || village.images.length === 0) {
      return '';
    }

    let imageUrl = village.images[0];
    if (!imageUrl.startsWith('http')) {
      imageUrl = imageUrl.replace(/^\//, '');
      return `${baseUrl}/${imageUrl}`;
    }

    return imageUrl;
  };

  const translatedVillages = useMemo(() => {
    return villages.map(village => {
      if (village.names && village.descriptions) {
        return {
          ...village,
          id: village._id,
          name: village.names[language as LocaleKeys] || village.name,
          description: village.descriptions[language as LocaleKeys] || village.description
        };
      }
      return {
        ...village,
        id: village._id,
        name: village.name,
        description: village.description
      };
    });
  }, [villages, language]);

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
          <Text style={styles.retryButtonText}>Retry</Text>
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
            {t.common.welcome} <Text style={styles.brandName}>{t.common.appName}</Text>
          </Text>
        </Animated.View>

        {/* Bottom Row - Start Button */}
        <View style={styles.startButtonContainer}>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => safePush('/authOptions')}
          >
            <Text style={styles.startButtonText}>{t.common.letsStart}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Section */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{t.villages.title}</Text>
        </View>

        {/* Description Paragraph */}
        <View style={styles.paragraphContainer}>
          <Text style={[
            styles.paragraphText,
            { 
              writingDirection: language === 'ar' || language === 'he' ? 'rtl' : 'ltr',
              textAlign: language === 'ar' || language === 'he' ? 'right' : 'left'
            }
          ]}>
            {language === 'en' && "Unrecognized villages in the Negev are home to about 70,000 Bedouins living in 35 villages that cover around 180,000 dunams (1.4% of Israel's land). Due to the lack of official recognition, these communities face severe shortages in basic infrastructure and services such as electricity, water, and sewage, relying instead on generators and water tanks. Government policies reflect systemic neglect, as Bedouins are not recognized as an indigenous population, which denies them rights under international law and deepens inequalities with the Jewish majority."} 
            {language === 'ar' && "القرى غير المعترف بها في النقب هي موطن لحوالي 70,000 بدوي يعيشون في 35 قرية تغطي حوالي 180,000 دونم (1.4٪ من أراضي إسرائيل). بسبب عدم الاعتراف الرسمي، تواجه هذه المجتمعات نقصًا حادًا في البنية التحتية والخدمات الأساسية مثل الكهرباء والمياه والصرف الصحي، وتعتمد بدلاً من ذلك على المولدات وخزانات المياه. تعكس السياسات الحكومية الإهمال المنهجي، حيث لا يتم الاعتراف بالبدو كسكان أصليين، مما يحرمهم من الحقوق بموجب القانون الدولي ويعمق عدم المساواة مع الأغلبية اليهودية."} 
            {language === 'he' && "הכפרים הבלתי מוכרים בנגב הם ביתם של כ-70,000 בדואים החיים ב-35 כפרים המשתרעים על פני כ-180,000 דונם (1.4% משטח ישראל). בשל חוסר ההכרה הרשמי, קהילות אלו סובלות ממחסור חמור בתשתיות ושירותים בסיסיים כמו חשמל, מים וביוב, ונאלצות להסתמך על גנרטורים ומיכלי מים. מדיניות הממשלה משקפת הזנחה מערכתית, כאשר הבדואים אינם מוכרים כאוכלוסייה ילידית, מה שמונע מהם זכויות לפי החוק הבינלאומי ומעמיק את אי השוויון עם הרוב היהודי."}
          </Text>
        </View>
        {/* Application Description Section */}
        <View style={styles.paragraphContainer}>
          <Text style={[
            styles.paragraphText,
            { 
              writingDirection: language === 'ar' || language === 'he' ? 'rtl' : 'ltr',
              textAlign: language === 'ar' || language === 'he' ? 'right' : 'left'
            }
          ]}>
            {language === 'en' && "This app is more than just a platform for displaying villages and their photos. It is a tool for preserving memory and asserting presence through community-powered mapping. Instead of waiting for external authorities to recognize these villages, this platform empowers local residents to document, update, and map their communities on their own terms — a grassroots form of resistance against marginalization."}
            {language === 'ar' && "هذا التطبيق ليس فقط لعرض القرى وصورها، بل هو أداة لحفظ الذاكرة وإثبات الوجود من خلال التوثيق الجماعي. بدلاً من انتظار جهات خارجية لتقرر ما إذا كانت هذه القرى تستحق الظهور على الخريطة، يسمح التطبيق للسكان أنفسهم بإضافة وتحديث قراهم كما يرونها هم، مما يشكل شكلاً من أشكال المقاومة في وجه التهميش."}
            {language === 'he' && "האפליקציה הזו אינה רק פלטפורמה להצגת כפרים ותמונותיהם, אלא כלי לשימור זיכרון ולהצהרת נוכחות דרך מיפוי קהילתי. במקום להמתין לגופים חיצוניים שיחליטו האם הכפרים ראויים להופיע על המפה, הפלטפורמה מאפשרת לתושבים עצמם להוסיף ולעדכן את כפריהם – כלי התנגדות מול ההדרה."}
          </Text>
        </View>


        {/* Villages Grid */}
        <View style={styles.villagesGrid}>
          {translatedVillages.map((village) => (
            <TouchableOpacity
              key={village._id}
              onPress={() => router.push(`./village/${village._id}`)}
              style={styles.villageCard}
            >
              <View style={styles.villageImageContainer}>
                {village.images && village.images.length > 0 ? (
                  <Image 
                    source={{ uri: getImageUrl(village) }}
                    style={styles.villageImage}
                    resizeMode="cover"
                    onError={(e) => console.log('Failed to load image:', e.nativeEvent.error)}
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialIcons name="image" size={40} color="#8d6e63" />
                  </View>
                )}
              </View>
              
              <View style={styles.villageContent}>
                <Text 
                  style={[
                    styles.villageTitle,
                    { 
                      textAlign: language === 'ar' || language === 'he' ? 'right' : 'left',
                      writingDirection: language === 'ar' || language === 'he' ? 'rtl' : 'ltr'
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
                      textAlign: language === 'ar' || language === 'he' ? 'right' : 'left',
                      writingDirection: language === 'ar' || language === 'he' ? 'rtl' : 'ltr'
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
                    alignItems: language === 'ar' || language === 'he' ? 'flex-start' : 'flex-end' 
                  }
                ]}>
                  <Text style={styles.readMoreText}>
                    {language === 'en' ? 'Read more →' : 
                      language === 'ar' ? 'اقرأ المزيد →' : 
                      'קרא עוד →'}
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
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
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
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    backgroundColor: '#efebe9',
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