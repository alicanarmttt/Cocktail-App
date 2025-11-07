import React from "react";

import { StyleSheet, Text, View } from "react-native";

/**
 * @desc    Tek bir kokteylin detaylarını gösterir.
 * @param   {object} route - React Navigation tarafından sağlanan ve 'params' (parametreler) içeren prop.
 */
const CocktailDetailScreen = ({ route }) => {
  const { cocktailId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tarif Detay Ekranı</Text>
      <Text style={styles.idText}>Seçilen Kokteyl ID: {cocktailId}</Text>
      <Text style={styles.todoText}>
        (İleride, bu ID'yi kullanarak API'den veya Redux'tan bu kokteylin tam
        tarifini çekeceğiz.)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  idText: {
    fontSize: 18,
    color: "#333",
  },
  todoText: {
    fontSize: 14,
    color: "gray",
    textAlign: "center",
    marginTop: 20,
  },
});

export default CocktailDetailScreen;
