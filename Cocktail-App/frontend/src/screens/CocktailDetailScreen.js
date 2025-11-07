import React from "react";
import { useSelector } from "react-redux";
import { StyleSheet, Text, View, ScrollView, Image } from "react-native";
import { selectCocktailById } from "../features/cocktails/cocktailSlice";

/**
 * @desc    Tek bir kokteylin detaylarını gösterir.
 * @param   {object} route - React Navigation tarafından sağlanan ve 'params' (parametreler) içeren prop.
 */
const CocktailDetailScreen = ({ route }) => {
  const { cocktailId } = route.params;
  console.log("Alınan 'cocktailId':", cocktailId);
  const cocktail = useSelector((state) =>
    selectCocktailById(state, Number(cocktailId))
  );
  // --- HATA AYIKLAMA 3: Redux'tan Gelen Veriyi Log'la ---
  console.log("Redux'tan bulunan 'cocktail' objesi:", cocktail);
  console.log("-----------------------------------------");
  // -----------------------------------------------------
  if (!cocktail) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Cocktail not found!</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.title}>Tarif Detay Ekranı</Text>
        <Image
          source={{ url: cocktail.image_url }}
          style={styles.image}
          resizeMode="cover"
        ></Image>
        <Text style={styles.title}>{cocktail.name}</Text>

        {/* Tarihi Notlar */}
        {cocktail.history_notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tarihi:</Text>
            <Text style={styles.sectionContent}>{cocktail.history_notes}</Text>
          </View>
        )}
        {/* Hazırlanışı */}
        {/* Hazırlanışı */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hazırlanışı:</Text>
          <Text style={styles.sectionContent}>{cocktail.instructions}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

// === Stil Dosyaları ===
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 20, // Üstten ve alttan boşluk
    paddingHorizontal: 15, // Yanlardan boşluk
  },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    width: "100%", // Tüm genişliği kullan
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#f4511e", // Ana renk (header ile uyumlu)
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24, // Okunabilirlik için satır yüksekliği
  },
  errorText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
  },
});

export default CocktailDetailScreen;
