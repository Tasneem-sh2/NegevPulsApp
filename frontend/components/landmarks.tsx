import axios from "axios";
import React, { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";

const AddLandmark: React.FC = () => {
  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");

  const handleSubmit = async () => {
    try {
      await axios.post("http://negevpulsapp.onrender.com/api/landmarks", {
        name,
        lat: Number(lat),
        lon: Number(lon),
      });
      Alert.alert("Success", "Landmark added successfully!");
      setName("");
      setLat("");
      setLon("");
    } catch (error) {
      console.error("Error adding landmark:", error);
      Alert.alert("Error", "Failed to add landmark.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add New Landmark</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Latitude"
        keyboardType="numeric"
        value={lat}
        onChangeText={setLat}
      />
      <TextInput
        style={styles.input}
        placeholder="Longitude"
        keyboardType="numeric"
        value={lon}
        onChangeText={setLon}
      />
      <Button title="Save Landmark" onPress={handleSubmit} />
    </View>
  );
};

export default AddLandmark;

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
});
