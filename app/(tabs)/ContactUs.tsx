import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useTranslations } from '@/frontend/constants/locales';

interface ContactPerson {
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface ContactTranslations {
  contactUs: {
    title: string;
    subtitle: string;
    whatsapp: string;
    socialMedia: string;
    asraa: ContactPerson;
    tasneem: ContactPerson;
    somaya: ContactPerson;
  };
}

export default function ContactUs() {
  const t = (useTranslations() as unknown as ContactTranslations).contactUs;

  const contacts = [
    {
      name: t.asraa.name,
      email: t.asraa.email,
      phone: t.asraa.phone,
      role: t.asraa.role,
      icon: 'user-tie' as const,
      color: '#8D6E63'
    },
    {
      name: t.tasneem.name,
      email: t.tasneem.email,
      phone: t.tasneem.phone,
      role: t.tasneem.role,
      icon: 'headset' as const,
      color: '#A1887F'
    },
    {
      name: t.somaya.name,
      email: t.somaya.email,
      phone: t.somaya.phone,
      role: t.somaya.role,
      icon: 'user-cog' as const,
      color: '#BCAAA4'
    },
  ];

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}?subject=استفسار عن التطبيق`);
  };

  const handlePhonePress = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsAppPress = (phone: string) => {
    Linking.openURL(`https://wa.me/${phone}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header with decorative elements */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Ionicons name="people" size={32} color="#FFF8E1" style={styles.headerIcon} />
          <Text style={styles.headerText}>{t.title}</Text>
          <Text style={styles.subHeaderText}>{t.subtitle}</Text>
        </View>
        <View style={styles.headerDecoration} />
      </View>

      {/* Contact Cards */}
      <View style={styles.contactsContainer}>
        {contacts.map((contact, index) => (
          <View key={index} style={[styles.contactCard, { borderLeftColor: contact.color }]}>
            <View style={styles.contactHeader}>
              <View style={[styles.iconContainer, { backgroundColor: contact.color }]}>
                <FontAwesome5 name={contact.icon} size={20} color="white" />
              </View>
              <View style={styles.contactTitle}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactRole}>{contact.role}</Text>
              </View>
            </View>

            <View style={styles.separator} />

            <TouchableOpacity 
              style={styles.contactInfo}
              onPress={() => handleEmailPress(contact.email)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="email" size={24} color="#6D4C41" />
              <Text style={styles.contactText}>{contact.email}</Text>
              <MaterialIcons name="chevron-right" size={24} color="#BCAAA4" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.contactInfo}
              onPress={() => handlePhonePress(contact.phone)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="phone" size={24} color="#6D4C41" />
              <Text style={styles.contactText}>{contact.phone}</Text>
              <MaterialIcons name="chevron-right" size={24} color="#BCAAA4" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.whatsappButton}
              onPress={() => handleWhatsAppPress(contact.phone)}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="whatsapp" size={20} color="white" />
              <Text style={styles.whatsappText}>{t.whatsapp}</Text>
              <View style={styles.whatsappIcon}>
                <MaterialIcons name="chevron-right" size={24} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Social Media Section */}
      <View style={styles.socialSection}>
        <View style={styles.socialHeader}>
          <Ionicons name="share-social" size={24} color="#6D4C41" />
          <Text style={styles.socialTitle}>{t.socialMedia}</Text>
        </View>
        <View style={styles.socialIcons}>
          <TouchableOpacity style={[styles.socialIcon, { backgroundColor: '#1DA1F2' }]}>
            <FontAwesome5 name="twitter" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialIcon, { backgroundColor: '#E1306C' }]}>
            <FontAwesome5 name="instagram" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialIcon, { backgroundColor: '#4267B2' }]}>
            <FontAwesome5 name="facebook" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialIcon, { backgroundColor: '#0077B5' }]}>
            <FontAwesome5 name="linkedin" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFF8E1',
  },
  headerContainer: {
    marginBottom: 25,
    position: 'relative',
  },
  header: {
    backgroundColor: '#5D4037',
    paddingVertical: 30,
    paddingHorizontal: 25,
    alignItems: 'center',
    zIndex: 2,
  },
  headerDecoration: {
    position: 'absolute',
    bottom: -15,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: '#5D4037',
    transform: [{ skewY: '-3deg' }],
    zIndex: 1,
  },
  headerIcon: {
    marginBottom: 10,
  },
  headerText: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
    fontFamily: 'sans-serif-medium',
  },
  subHeaderText: {
    fontSize: 16,
    color: '#FFD54F',
    textAlign: 'center',
    fontFamily: 'sans-serif',
  },
  contactsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  contactCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 5,
    shadowColor: '#5D4037',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactTitle: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5D4037',
    fontFamily: 'sans-serif-medium',
  },
  contactRole: {
    fontSize: 14,
    color: '#8D6E63',
    marginTop: 2,
    fontFamily: 'sans-serif',
  },
  separator: {
    height: 1,
    backgroundColor: '#EFEBE9',
    marginVertical: 10,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginVertical: 5,
    backgroundColor: '#FFF8E1',
  },
  contactText: {
    fontSize: 16,
    color: '#5D4037',
    marginLeft: 15,
    flex: 1,
    fontFamily: 'sans-serif',
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 10,
    shadowColor: '#25D366',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 4,
  },
  whatsappText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
    fontFamily: 'sans-serif-medium',
  },
  whatsappIcon: {
    opacity: 0.8,
  },
  socialSection: {
    backgroundColor: 'white',
    padding: 25,
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#5D4037',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 30,
  },
  socialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  socialTitle: {
    fontSize: 20,
    color: '#5D4037',
    fontWeight: '600',
    marginLeft: 10,
    fontFamily: 'sans-serif-medium',
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  socialIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
});