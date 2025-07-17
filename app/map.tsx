import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text ,StyleSheet} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import EmergencyPage from "./(tabs)/EmergencyPage";
import WorkerPage from "./local";

const HomePage: React.FC = () => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem("userRole");
        console.log("Stored role:", storedRole);
        setRole(storedRole);
      } catch (error) {
        console.error("Error fetching role:", error);
      } finally {
        setLoading(false);
      }
    };
    getRole();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {role === "emergency" && <EmergencyPage />}
      {role === "local" && <WorkerPage />}
      {!role && (
        <View style={styles.noRoleContainer}>
          <Text style={styles.noRoleText}>No role assigned. Please log in again.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  noRoleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noRoleText: {
    fontSize: 18,
    textAlign: 'center',
    color: 'red',
  },
});

export default HomePage;