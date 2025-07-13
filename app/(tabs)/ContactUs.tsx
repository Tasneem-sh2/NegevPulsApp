import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslations } from '@/frontend/constants/locales';

export default function ContactUs() {
  const t = useTranslations();

  const contacts = [
    {
      name: t.contactUs.asraa.name,
      email: t.contactUs.asraa.email,
      phone: t.contactUs.asraa.phone,
    },
    {
      name: t.contactUs.tasneem.name,
      email: t.contactUs.tasneem.email,
      phone: t.contactUs.tasneem.phone,
    },
    {
      name: t.contactUs.somaya.name,
      email: t.contactUs.somaya.email,
      phone: t.contactUs.somaya.phone,
    },
  ];

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handlePhonePress = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{t.contactUs.title}</Text>
      </View>

      {contacts.map((contact, index) => (
        <View key={index} style={styles.contactCard}>
          <Text style={styles.contactName}>{contact.name}</Text>

          <View style={styles.contactInfo}>
            <MaterialIcons name="email" size={20} color="#6d4c41" />
            <Text 
              style={styles.contactText}
              onPress={() => handleEmailPress(contact.email)}
            >
              {contact.email}
            </Text>
          </View>

          <View style={styles.contactInfo}>
            <MaterialIcons name="phone" size={20} color="#6d4c41" />
            <Text 
              style={styles.contactText}
              onPress={() => handlePhonePress(contact.phone)}
            >
              {contact.phone}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#6d4c41',
    paddingVertical: 20,
    borderRadius: 12,
    marginBottom: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  contactCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6d4c41',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    paddingBottom: 8,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  contactText: {
    fontSize: 15,
    color: '#5d4037',
    marginLeft: 10,
  },
});