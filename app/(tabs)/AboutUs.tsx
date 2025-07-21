import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons, Feather } from '@expo/vector-icons';

export default function AboutUs() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>About NegevPulse</Text>
          <Text style={styles.heroSubtitle}>Bridging the gap for unrecognized villages</Text>
        </View>
        <View style={styles.heroDecoration} />
      </View>

      {/* Content Sections */}
      <View style={styles.content}>
        {/* Story Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="book" size={24} color="#6D4C41" />
            <Text style={styles.sectionTitle}>Our Story</Text>
          </View>
          <Text style={styles.sectionText}>
            NegevPulse is a graduation project developed by three fourth-year Software Engineering students 
            at Sami Shamoon College of Engineering. Our mission is to empower marginalized communities 
            in the Negev region through technology.
          </Text>
          <View style={styles.sectionIcon}>
            <FontAwesome5 name="university" size={20} color="#8D6E63" />
          </View>
        </View>

        {/* Problem Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="alert-circle" size={24} color="#6D4C41" />
            <Text style={styles.sectionTitle}>The Challenge</Text>
          </View>
          {[
            "Over 35 unrecognized villages exist physically but don't appear on official maps",
            "No reliable digital mapping exists for emergency services, deliveries, or visitors",
            "These villages are visible on satellite imagery but absent from digital maps"
          ].map((item, i) => (
            <View key={i} style={styles.listItem}>
              <MaterialIcons name="fiber-manual-record" size={12} color="#D4A59A" />
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Solution Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb" size={24} color="#6D4C41" />
            <Text style={styles.sectionTitle}>Our Solution</Text>
          </View>
          <Text style={styles.sectionText}>
            NegevPulse introduces a <Text style={styles.highlight}>three-tier crowdsourcing</Text> system where 
            residents can map their communities.
          </Text>
          
          {[
            { level: "Regular Residents", detail: "Can submit landmarks/roads (Vote weight: 1)", icon: "user" },
            { level: "Active Residents", detail: "Verified contributors (Vote weight: 2)", icon: "user-check" },
            { level: "Super Locals", detail: "Community leaders (Vote weight: 4)", icon: "user-tie" }
          ].map((item, i) => (
            <View key={i} style={styles.solutionItem}>
              <View style={styles.solutionIcon}>
                <FontAwesome5 name={item.icon} size={16} color="#6D4C41" />
              </View>
              <View style={styles.solutionText}>
                <Text style={styles.solutionLevel}>{item.level}</Text>
                <Text style={styles.solutionDetail}>{item.detail}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Verification Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#6D4C41" />
            <Text style={styles.sectionTitle}>Verification Process</Text>
          </View>
          <Text style={styles.sectionText}>
            For a landmark/road to be approved, it must meet two criteria:
          </Text>
          {[
            "Achieve 5.6 weighted votes (equivalent to 2 Super Locals + 1 Active)",
            "Maintain 80% approval rate from all voters"
          ].map((item, i) => (
            <View key={i} style={styles.listItem}>
              <Feather name="check-circle" size={16} color="#8D6E63" />
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Tech Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="code" size={24} color="#6D4C41" />
            <Text style={styles.sectionTitle}>Technical Details</Text>
          </View>
          <Text style={styles.sectionText}>
            Currently available on Android, with future plans for iOS expansion. Inspired by the best of 
            Waze's community features and Google Maps' reliability.
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
          <Ionicons name="hand-left" size={32} color="#6D4C41" style={styles.ctaIcon} />
          <Text style={styles.ctaTitle}>Join Our Movement</Text>
          <Text style={styles.ctaText}>
            Help us map the unmapped. Contact us at:
          </Text>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => Linking.openURL('mailto:negevpulse.support@gmail.com')}
          >
            <MaterialIcons name="email" size={20} color="white" />
            <Text style={styles.contactButtonText}>negevpulse.support@gmail.com</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF8E1',
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
    marginLeft: 10,
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
    right: 20,
    backgroundColor: '#EFEBE9',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginRight: 12,
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
    textAlign: 'center',
    fontFamily: 'sans-serif-medium',
  },
  ctaText: {
    fontSize: 16,
    color: '#FFD54F',
    textAlign: 'center',
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