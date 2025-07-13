import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslations } from '@/frontend/constants/locales';
import { I18nManager } from 'react-native';

export default function AboutUs() {
  const t = useTranslations();
  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.mainTitle}>{t.about.title}</Text>
        <Text style={styles.subtitle}>{t.about.subtitle}</Text>
      </View>

      {/* Project Overview */}
      <View style={styles.section}>
        <Text style={styles.heading}>{t.about.missionTitle}</Text>
        <Text style={styles.paragraph}>{t.about.missionText}</Text>
      </View>

      {/* Problem Definition */}
      <View style={styles.section}>
        <Text style={styles.heading}>{t.about.problemTitle}</Text>
        <View style={styles.listItem}>
          <MaterialIcons name="fiber-manual-record" size={14} color="#6d4c41" />
          <Text style={styles.listText}>{t.about.problemList.lackData}</Text>
        </View>
        <View style={styles.listItem}>
          <MaterialIcons name="fiber-manual-record" size={14} color="#6d4c41" />
          <Text style={styles.listText}>{t.about.problemList.delays}</Text>
        </View>
        <View style={styles.listItem}>
          <MaterialIcons name="fiber-manual-record" size={14} color="#6d4c41" />
          <Text style={styles.listText}>{t.about.problemList.limitedInfo}</Text>
        </View>
      </View>

      {/* Project Goal */}
      <View style={styles.section}>
        <Text style={styles.heading}>{t.about.goalTitle}</Text>
        <Text style={styles.paragraph}>{t.about.goalText}</Text>
      </View>

      {/* How It Works */}
      <View style={styles.section}>
        <Text style={styles.heading}>{t.about.howItWorksTitle}</Text>
        <View style={styles.listItem}>
          <Text style={styles.number}>1.</Text>
          <Text style={styles.listText}>
            <Text style={styles.bold}>{t.about.step1.split(':')[0]}</Text>: {t.about.step1.split(':')[1]}
          </Text>
        </View>
        <View style={styles.listItem}>
          <Text style={styles.number}>2.</Text>
          <Text style={styles.listText}>
            <Text style={styles.bold}>{t.about.step2.split(':')[0]}</Text>: {t.about.step2.split(':')[1]}
          </Text>
        </View>
        <View style={styles.listItem}>
          <Text style={styles.number}>3.</Text>
          <Text style={styles.listText}>
            <Text style={styles.bold}>{t.about.step3.split(':')[0]}</Text>: {t.about.step3.split(':')[1]}
          </Text>
        </View>
      </View>

      {/* Our Vision */}
      <View style={styles.section}>
        <Text style={styles.heading}>{t.about.visionTitle}</Text>
        <Text style={styles.paragraph}>{t.about.visionText}</Text>
      </View>

      {/* Contact Us */}
      <View style={[styles.section, styles.contact]}>
        <Text style={styles.heading}>{t.about.contactTitle}</Text>
        <Text style={styles.paragraph}>
          {t.about.contactText}{' '}
          <Text
            style={styles.contactLink}
            onPress={() => Linking.openURL('mailto:support@example.com')}
          >
            support@example.com
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#6d4c41',
    paddingVertical: 25,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFD700',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  heading: {
    fontSize: 22,
    color: '#6d4c41',
    fontWeight: '600',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    paddingBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    color: '#5d4037',
    lineHeight: 24,
    marginBottom: 5,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listText: {
    fontSize: 16,
    color: '#5d4037',
    marginLeft: 8,
    flex: 1,
    lineHeight: 22,
  },
  number: {
    fontSize: 16,
    color: '#6d4c41',
    fontWeight: 'bold',
    marginRight: 5,
  },
  bold: {
    fontWeight: 'bold',
  },
  contact: {
    alignItems: 'center',
  },
  contactLink: {
    color: '#8d6e63',
    fontWeight: 'bold',
  },
});