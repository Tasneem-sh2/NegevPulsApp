import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons, Feather } from '@expo/vector-icons';
import { useTranslations } from '@/frontend/constants/locales';
import { useLanguage } from '@/frontend/context/LanguageProvider';
import { I18nManager } from 'react-native';

type AppLanguage = 'en' | 'ar' | 'he';

export default function AboutUs() {
  const translations = useTranslations();
  const { language, changeLanguage, isRTL } = useLanguage();
  
  const t = translations.about;
  const problemList = t.problemList as Record<string, string>;
  const solutionLevels = t.solutionLevels as Array<{
    level: string;
    detail: string;
    icon: string;
  }>;
  const verificationCriteria = t.verificationCriteria as string[];

  useEffect(() => {
    I18nManager.forceRTL(isRTL);
  }, [isRTL]);

  const toggleLanguage = () => {
    const languages: AppLanguage[] = ['en', 'ar', 'he'];
    const currentIndex = languages.indexOf(language as AppLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    changeLanguage(languages[nextIndex]);
  };

  const getLanguageButtonText = () => {
    switch(language) {
      case 'en': return 'EN';
      case 'ar': return 'عربي';
      case 'he': return 'עבר';
      default: return 'EN';
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        style={styles.languageButton}
        onPress={toggleLanguage}
      >
        <MaterialIcons name="language" size={20} color="#FFD700" />
        <Text style={styles.languageButtonText}>
          {language.toUpperCase()}
        </Text>
      </TouchableOpacity>

      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroContent}>
            <Text style={[styles.heroTitle, { 
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr'
            }]}>{t.title}</Text>
            <Text style={[styles.heroSubtitle, { 
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr'
            }]}>{t.subtitle}</Text>
          </View>
          <View style={styles.heroDecoration} />
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <View style={[styles.sectionHeader, isRTL && { flexDirection: 'row-reverse' }]}>
              <Ionicons name="book" size={24} color="#6D4C41" />
              <Text style={[styles.sectionTitle, isRTL ? { marginRight: 10 } : { marginLeft: 10 }]}>
                {t.missionTitle}
              </Text>
            </View>
            <Text style={[styles.sectionText, { 
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr'
            }]}>
              {t.missionText}
            </Text>
            <View style={[styles.sectionIcon, isRTL ? { left: 20 } : { right: 20 }]}>
              <FontAwesome5 name="university" size={20} color="#8D6E63" />
            </View>
          </View>

          <View style={styles.section}>
            <View style={[styles.sectionHeader, isRTL && { flexDirection: 'row-reverse' }]}>
              <Ionicons name="alert-circle" size={24} color="#6D4C41" />
              <Text style={[styles.sectionTitle, isRTL ? { marginRight: 10 } : { marginLeft: 10 }]}>
                {t.problemTitle}
              </Text>
            </View>
            {Object.entries(problemList).map(([key, item]) => (
              <View key={key} style={[styles.listItem, isRTL && { flexDirection: 'row-reverse' }]}>
                <MaterialIcons name="fiber-manual-record" size={12} color="#D4A59A" />
                <Text style={[styles.listText, { 
                  textAlign: isRTL ? 'right' : 'left',
                  writingDirection: isRTL ? 'rtl' : 'ltr'
                }]}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <View style={[styles.sectionHeader, isRTL && { flexDirection: 'row-reverse' }]}>
              <Ionicons name="bulb" size={24} color="#6D4C41" />
              <Text style={[styles.sectionTitle, isRTL ? { marginRight: 10 } : { marginLeft: 10 }]}>
                {t.goalTitle}
              </Text>
            </View>
            <Text style={[styles.sectionText, { 
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr'
            }]}>
              {t.goalText}
            </Text>
            
            {solutionLevels.map((item, i) => (
              <View key={`solution-${i}`} style={[styles.solutionItem, isRTL && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.solutionIcon, isRTL ? { marginLeft: 12, marginRight: 0 } : { marginRight: 12 }]}>
                  <FontAwesome5 name={item.icon} size={16} color="#6D4C41" />
                </View>
                <View style={styles.solutionText}>
                  <Text style={[styles.solutionLevel, { 
                    textAlign: isRTL ? 'right' : 'left',
                    writingDirection: isRTL ? 'rtl' : 'ltr'
                  }]}>
                    {item.level}
                  </Text>
                  <Text style={[styles.solutionDetail, { 
                    textAlign: isRTL ? 'right' : 'left',
                    writingDirection: isRTL ? 'rtl' : 'ltr'
                  }]}>
                    {item.detail}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <View style={[styles.sectionHeader, isRTL && { flexDirection: 'row-reverse' }]}>
              <Ionicons name="shield-checkmark" size={24} color="#6D4C41" />
              <Text style={[styles.sectionTitle, isRTL ? { marginRight: 10 } : { marginLeft: 10 }]}>
                {t.howItWorksTitle}
              </Text>
            </View>
            <Text style={[styles.sectionText, { 
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr'
            }]}>
              {t.verificationText}
            </Text>
            {verificationCriteria.map((item, i) => (
              <View key={`criteria-${i}`} style={[styles.listItem, isRTL && { flexDirection: 'row-reverse' }]}>
                <Feather name="check-circle" size={16} color="#8D6E63" />
                <Text style={[styles.listText, { 
                  textAlign: isRTL ? 'right' : 'left',
                  writingDirection: isRTL ? 'rtl' : 'ltr'
                }]}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <View style={[styles.sectionHeader, isRTL && { flexDirection: 'row-reverse' }]}>
              <Ionicons name="code" size={24} color="#6D4C41" />
              <Text style={[styles.sectionTitle, isRTL ? { marginRight: 10 } : { marginLeft: 10 }]}>
                {t.techTitle}
              </Text>
            </View>
            <Text style={[styles.sectionText, { 
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr'
            }]}>
              {t.techText}
            </Text>
            <View style={styles.techIcons}>
              <FontAwesome5 name="android" size={24} color="#8D6E63" />
              <FontAwesome5 name="apple" size={24} color="#8D6E63" style={{ marginHorizontal: 20 }} />
              <FontAwesome5 name="waze" size={24} color="#8D6E63" />
              <FontAwesome5 name="google" size={24} color="#8D6E63" style={{ marginLeft: 20 }} />
            </View>
          </View>

          <View style={[styles.section, styles.ctaSection]}>
            <Ionicons 
              name={isRTL ? "hand-right" : "hand-left"} 
              size={32} 
              color="#6D4C41" 
              style={styles.ctaIcon} 
            />
            <Text style={[styles.ctaTitle, { 
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr'
            }]}>
              {t.visionTitle}
            </Text>
            <Text style={[styles.ctaText, { 
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr'
            }]}>
              {t.contactText}
            </Text>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => Linking.openURL(`mailto:${t.contactEmail}`)}
            >
              <MaterialIcons name="email" size={20} color="white" />
              <Text style={[styles.contactButtonText, { 
                marginLeft: 10,
                textAlign: isRTL ? 'right' : 'left',
                writingDirection: isRTL ? 'rtl' : 'ltr'
              }]}>
                {t.contactEmail}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffffff',
    paddingBottom: 40,
  },
  languageButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(141, 110, 99, 0.9)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  languageButtonText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
    marginTop: 2
  },
  hero: {
    position: 'relative',
    height: 220,
    backgroundColor: '#5D4037',
    marginBottom: 30,
  },
  heroContent: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 25,
    zIndex: 2,
    alignItems: 'center',
  },
  heroDecoration: {
    position: 'absolute',
    bottom: -30,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#5D4037',
    transform: [{ skewY: '-5deg' }],
    zIndex: 1,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    fontFamily: 'sans-serif-medium',
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#FFD54F',
    fontFamily: 'sans-serif',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#5D4037',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEBE9',
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 22,
    color: '#5D4037',
    fontWeight: '600',
    fontFamily: 'sans-serif-medium',
  },
  sectionText: {
    fontSize: 16,
    color: '#5D4037',
    lineHeight: 24,
    marginBottom: 15,
    fontFamily: 'sans-serif',
  },
  sectionIcon: {
    position: 'absolute',
    top: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFEBE9',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  listText: {
    fontSize: 15,
    color: '#5D4037',
    marginLeft: 10,
    flex: 1,
    lineHeight: 22,
    fontFamily: 'sans-serif',
  },
  solutionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 12,
  },
  solutionIcon: {
    backgroundColor: '#EFEBE9',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  solutionText: {
    flex: 1,
  },
  solutionLevel: {
    fontSize: 16,
    color: '#5D4037',
    fontWeight: '600',
    fontFamily: 'sans-serif-medium',
  },
  solutionDetail: {
    fontSize: 14,
    color: '#8D6E63',
    fontFamily: 'sans-serif',
  },
  techIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  ctaSection: {
    backgroundColor: '#5D4037',
    alignItems: 'center',
  },
  ctaIcon: {
    marginBottom: 10,
  },
  ctaTitle: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
    fontFamily: 'sans-serif-medium',
  },
  ctaText: {
    fontSize: 16,
    color: '#FFD54F',
    marginBottom: 15,
    fontFamily: 'sans-serif',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8D6E63',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 10,
  },
  contactButtonText: {
    fontSize: 16,
    color: 'white',
    fontFamily: 'sans-serif-medium',
  },
});