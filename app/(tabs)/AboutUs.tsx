import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons, Feather } from '@expo/vector-icons';
import { useTranslations } from '@/frontend/constants/locales';
import { useLanguage } from '@/frontend/context/LanguageProvider';

export default function AboutUs() {
  const { t } = useTranslations();
  const { language, changeLanguage, isRTL } = useLanguage();
  // الحصول على بيانات الترجمة ككائنات
    // تحديد الأنواع بشكل صريح
  const problemList = t('about.problemList', { returnObjects: true }) as Record<string, string>;
  const solutionLevels = t('about.solutionLevels', { returnObjects: true }) as Array<{
    level: string;
    detail: string;
    icon: string;
  }>;
  const verificationCriteria = t('about.verificationCriteria', { returnObjects: true }) as string[];


  // دالة لتبديل اللغة
  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : language === 'ar' ? 'he' : 'en';
    changeLanguage(newLang);
  };

  // نص زر اللغة
  const getLanguageButtonText = () => {
    switch(language) {
      case 'en': return 'العربية';
      case 'ar': return 'עברית';
      case 'he': return 'English';
      default: return 'EN';
    }
  };

  return (
     <ScrollView 
      contentContainerStyle={[styles.container, isRTL && { direction: 'rtl' }]}
      showsVerticalScrollIndicator={false}
    >
      {/* زر تغيير اللغة */}
      <TouchableOpacity 
        style={[
          styles.languageButton,
          isRTL ? { left: 20 } : { right: 20 }
        ]}
        onPress={toggleLanguage}
      >
        <Text style={styles.languageButtonText}>
          {getLanguageButtonText()}
        </Text>
      </TouchableOpacity>

      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>{t('about.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('about.subtitle')}</Text>
        </View>
        <View style={styles.heroDecoration} />
      </View>

      {/* Content Sections */}
      <View style={styles.content}>

        {/* Story Section */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, isRTL && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="book" size={24} color="#6D4C41" />
            <Text style={[styles.sectionTitle, isRTL ? { marginRight: 10 } : { marginLeft: 10 }]}>
              {t('about.missionTitle')}
            </Text>
          </View>
          <Text style={[styles.sectionText, { 
            textAlign: isRTL ? 'right' : 'left',
            writingDirection: isRTL ? 'rtl' : 'ltr'
          }]}>
            {t('about.missionText')}
          </Text>
          <View style={[styles.sectionIcon, isRTL ? { left: 20 } : { right: 20 }]}>
            <FontAwesome5 name="university" size={20} color="#8D6E63" />
          </View>
        </View>

        {/* Problem Section */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, isRTL && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="alert-circle" size={24} color="#6D4C41" />
            <Text style={[styles.sectionTitle, isRTL ? { marginRight: 10 } : { marginLeft: 10 }]}>
              {t('about.problemTitle')}
            </Text>
          </View>
          {Object.entries(problemList).map(([key, item], i) => (
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

        {/* Solution Section */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, isRTL && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="bulb" size={24} color="#6D4C41" />
            <Text style={[styles.sectionTitle, isRTL ? { marginRight: 10 } : { marginLeft: 10 }]}>
              {t('about.goalTitle')}
            </Text>
          </View>
          <Text style={[styles.sectionText, { 
            textAlign: isRTL ? 'right' : 'left',
            writingDirection: isRTL ? 'rtl' : 'ltr'
          }]}>
            {t('about.goalText')}
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

        {/* Verification Section */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, isRTL && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="shield-checkmark" size={24} color="#6D4C41" />
            <Text style={[styles.sectionTitle, isRTL ? { marginRight: 10 } : { marginLeft: 10 }]}>
              {t('about.howItWorksTitle')}
            </Text>
          </View>
          <Text style={[styles.sectionText, { 
            textAlign: isRTL ? 'right' : 'left',
            writingDirection: isRTL ? 'rtl' : 'ltr'
          }]}>
            {t('about.verificationText')}
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

        {/* Tech Section */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, isRTL && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="code" size={24} color="#6D4C41" />
            <Text style={[styles.sectionTitle, isRTL ? { marginRight: 10 } : { marginLeft: 10 }]}>
              {t('about.techTitle')}
            </Text>
          </View>
          <Text style={[styles.sectionText, { 
            textAlign: isRTL ? 'right' : 'left',
            writingDirection: isRTL ? 'rtl' : 'ltr'
          }]}>
            {t('about.techText')}
          </Text>
          <View style={styles.techIcons}>
            <FontAwesome5 name="android" size={24} color="#8D6E63" />
            <FontAwesome5 name="apple" size={24} color="#8D6E63" style={{ marginHorizontal: 20 }} />
            <FontAwesome5 name="waze" size={24} color="#8D6E63" />
            <FontAwesome5 name="google" size={24} color="#8D6E63" style={{ marginLeft: 20 }} />
          </View>
        </View>

        {/* CTA Section */}
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
            {t('about.visionTitle')}
          </Text>
          <Text style={[styles.ctaText, { 
            textAlign: isRTL ? 'right' : 'left',
            writingDirection: isRTL ? 'rtl' : 'ltr'
          }]}>
            {t('about.contactText')}
          </Text>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => Linking.openURL(`mailto:${t('about.contactEmail')}`)}
          >
            <MaterialIcons name="email" size={20} color="white" />
            <Text style={[styles.contactButtonText, { 
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr'
            }]}>
              {t('about.contactEmail')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffffff',
    position: 'relative',
  },
  languageButton: {
    position: 'absolute',
    top: 50,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FFD54F',
  },
  languageButtonText: {
    color: '#FFD54F',
    fontWeight: 'bold',
    fontSize: 14,
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
    textAlign: 'center',
    fontFamily: 'sans-serif-medium',
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#FFD54F',
    textAlign: 'center',
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
  highlight: {
    color: '#8D6E63',
    fontWeight: 'bold',
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
    marginLeft: 10,
    fontFamily: 'sans-serif-medium',
  },
});