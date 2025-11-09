import React from "react";
import { View, Text, StyleSheet } from "react-native";

/**
 * @desc    Barmen'in Asistanı Ekranı. (Elimdekilerle Ne Yapılır?)
 * Planımızın 3. ana ekranıdır.
 */
const AssistantScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Barmen'in Asistanı</Text>
      <Text style={styles.subtitle}>
        (Yakında: Elindeki malzemeleri seç, sana tarifleri gösterelim.)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "gray",
    textAlign: "center",
  },
});

export default AssistantScreen;
