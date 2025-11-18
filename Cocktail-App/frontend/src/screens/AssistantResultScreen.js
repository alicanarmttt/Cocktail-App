import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// Dün oluşturduğumuz barmenSlice'taki selector'leri (veri okuyucuları) içe aktar
import {
  selectSearchResults,
  getSearchStatus,
  getSearchError,
} from "../features/barmenSlice";

/**
 * @desc    Barmen Asistanı'nın bulduğu kokteyl sonuçlarını listeler.
 */
const AssistantResultScreen = () => {
  const navigation = useNavigation();

  // 1. Redux store'dan (barmenSlice) verileri çek
  const results = useSelector(selectSearchResults);
  const status = useSelector(getSearchStatus);
  const error = useSelector(getSearchError);

  // 2. Bir kokteyle tıklandığında Detay Ekranı'na yönlendir
  const handlePressCocktail = (cocktailId) => {
    navigation.navigate("CocktailList", {
      screen: "CocktailDetail",
      params: { cocktailId: cocktailId },
    });
  };

  // 3. Listedeki her bir kokteyl "kartı"nı render et
  const renderCocktailItem = ({ item }) => (
    <Pressable
      style={styles.card}
      onPress={() => handlePressCocktail(item.cocktail_id)}
    >
      <Image
        source={{
          uri:
            item.image_url ||
            "https://placehold.co/100x100/f4511e/fff?text=Cocktail",
        }}
        style={styles.cardImage}
      />
      <Text style={styles.cardText}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={24} color="#ccc" />
    </Pressable>
  );

  // === 4. Duruma Göre Arayüzü Göster ===

  // (Bu genellikle AssistantScreen'de gösterilir, ancak güvenlik için ekleyelim)
  if (status === "loading") {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#f4511e" />
        <Text>Sonuçlar yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  // API'den hata dönerse
  if (status === "failed") {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.errorText}>
          {error || "Tarifler alınırken bir hata oluştu."}
        </Text>
      </SafeAreaView>
    );
  }

  // Başarılı ama 0 sonuç varsa
  if (status === "succeeded" && results.length === 0) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Ionicons name="sad-outline" size={64} color="gray" />
        <Text style={styles.emptyTitle}>Sonuç Bulunamadı</Text>
        <Text style={styles.emptySubtitle}>
          Tezgahınızdaki malzemelerle (veya seçtiğiniz filtreyle) eşleşen bir
          kokteyl bulunamadı.
        </Text>
        <Text style={styles.emptySubtitle}>
          Elinizdeki malzemeyi içeren kokteylleri görmek için geri dönüp
          "Bunları içeren kokteyller" seçeneğiyle arayabilirsiniz .
        </Text>
      </SafeAreaView>
    );
  }

  // Başarılı ve sonuçlar varsa
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Bulunan Tarifler ({results.length} adet)</Text>
      <FlatList
        data={results}
        renderItem={renderCocktailItem}
        keyExtractor={(item) => item.cocktail_id.toString()}
        contentContainerStyle={{ paddingHorizontal: 15 }}
      />
    </SafeAreaView>
  );
};

// === Stil Dosyaları ===
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginHorizontal: 15,
    marginVertical: 15,
  },
  // Kart Stilleri
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    // (iOS) Gölge
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // (Android) Gölge
    elevation: 3,
  },
  cardImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 15,
  },
  cardText: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1, // Yazının sola yaslanmasını sağlar
  },
  // Hata ve Boş Ekran Stilleri
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "gray",
    textAlign: "center",
    paddingTop: 15,
  },
});

export default AssistantResultScreen;
