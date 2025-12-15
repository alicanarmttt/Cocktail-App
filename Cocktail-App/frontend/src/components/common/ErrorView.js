import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
// İkon seti (Expo kullanıyorsan vector-icons hazırdır)
import { MaterialIcons } from "@expo/vector-icons";

const ErrorView = ({
  title = "Bir şeyler ters gitti",
  message = "Veriler yüklenirken bir hata oluştu.",
  onRetry, // Tekrar dene fonksiyonu (Çok kritik!)
  iconName = "error-outline",
}) => {
  return (
    <View style={styles.container}>
      <MaterialIcons name={iconName} size={80} color="#FF6B6B" />

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Tekrar Dene</Text>
          <MaterialIcons
            name="refresh"
            size={20}
            color="white"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff", // Veya senin tema rengin
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 30,
    lineHeight: 22,
  },
  button: {
    flexDirection: "row",
    backgroundColor: "#333", // Marka rengin
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    elevation: 3, // Android gölge
    shadowColor: "#000", // iOS gölge
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ErrorView;
