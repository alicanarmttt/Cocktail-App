import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// Redux Selector'leri
import {
  selectSearchResults,
  getSearchStatus,
  getSearchError,
} from "../features/barmenSlice";

/**
 * @desc    Barmen Asistanı Sonuç Ekranı (AssistantResultScreen)
 * Gelen sonuçları "Yapılabilir", "Az Eksik" ve "Diğer" olarak gruplar.
 * Çok eksiği olanlarda negatif bir dil yerine "İlham" odaklı dil kullanır.
 */
const AssistantResultScreen = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  // --- HELPER: Dinamik İsim ---
  // Veritabanı şemanda name_tr ve name_en var.
  const getName = (item) =>
    i18n.language === "tr" ? item.name_tr : item.name_en;

  // --- REDUX DATA ---
  const rawResults = useSelector(selectSearchResults);
  const status = useSelector(getSearchStatus);
  const error = useSelector(getSearchError);

  // --- 1. GRUPLAMA MANTIĞI (Kritik Bölüm) ---
  const sections = useMemo(() => {
    if (!rawResults || rawResults.length === 0) return [];

    // 3 ayrı kova (bucket) oluşturuyoruz
    const readyToDrink = []; // Eksik: 0
    const almostThere = []; // Eksik: 1 veya 2
    const inspiration = []; // Eksik: 3+

    rawResults.forEach((cocktail) => {
      // Backend 'missing_count' göndermezse varsayılan olarak 0 kabul et (Crash olmasın)
      // Ama normalde backend bunu hesaplayıp yollar.
      const missing =
        cocktail.missing_count !== undefined ? cocktail.missing_count : 0;

      if (missing === 0) {
        readyToDrink.push(cocktail);
      } else if (missing <= 2) {
        almostThere.push(cocktail);
      } else {
        inspiration.push(cocktail);
      }
    });

    // SectionList formatına çevir
    const resultSections = [];

    if (readyToDrink.length > 0)
      resultSections.push({ title: "ready", data: readyToDrink });

    if (almostThere.length > 0)
      resultSections.push({ title: "almost", data: almostThere });

    if (inspiration.length > 0)
      resultSections.push({ title: "explore", data: inspiration });

    return resultSections;
  }, [rawResults]);

  // --- 2. NAVİGASYON ---
  const handlePressCocktail = (cocktailId) => {
    // Kokteyl Detayına Git
    navigation.navigate("CocktailDetail", { cocktailId: cocktailId });
  };

  // --- 3. KART RENDER (Her satırın tasarımı) ---
  const renderCocktailItem = ({ item, section }) => {
    const missingCount = item.missing_count || 0;
    const sectionType = section.title; // 'ready', 'almost', 'explore'

    return (
      <Pressable
        style={styles.card}
        onPress={() => handlePressCocktail(item.cocktail_id)}
      >
        {/* Sol: Resim */}
        <Image
          source={{
            uri:
              item.image_url || "https://placehold.co/100x100/eee/999?text=Bar",
          }}
          style={styles.cardImage}
        />

        {/* Orta: İçerik */}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{getName(item)}</Text>

          {/* Alt Metin: Hangi gruptaysa ona göre mesaj ver */}

          {/* 1. GRUP: HAZIR */}
          {sectionType === "ready" && (
            <Text style={styles.subtitleReady}>
              <Ionicons name="checkmark-circle" size={14} />{" "}
              {t("results.ready_msg", "Malzemeler Tam!")}
            </Text>
          )}

          {/* 2. GRUP: AZ EKSİK */}
          {sectionType === "almost" && (
            <Text style={styles.subtitleMissing}>
              {missingCount} {t("results.missing_msg", "malzeme daha gerekli")}
            </Text>
          )}

          {/* 3. GRUP: İLHAM (Negatiflik Yok!) */}
          {sectionType === "explore" && (
            <Text style={styles.subtitleGeneric}>
              {t("results.explore_msg", "Tarife göz at")}
            </Text>
          )}
        </View>

        {/* Sağ: İkon */}
        <View style={styles.cardAction}>
          {sectionType === "ready" ? (
            // Hazırsa Yeşil Play Tuşu (Harekete Geçirici)
            <Ionicons name="play-circle" size={32} color="#4CAF50" />
          ) : (
            // Değilse Gri Ok
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          )}
        </View>
      </Pressable>
    );
  };

  // --- 4. BÖLÜM BAŞLIKLARI ---
  const renderSectionHeader = ({ section: { title } }) => {
    let titleText = "";
    let titleColor = "#333";

    switch (title) {
      case "ready":
        titleText = "🥂 " + t("results.header_ready", "Hemen Yapabilirsin!");
        titleColor = "#2E7D32"; // Yeşil
        break;
      case "almost":
        titleText = "🛒 " + t("results.header_almost", "Çok Yaklaşmışsın");
        titleColor = "#F57C00"; // Turuncu
        break;
      case "explore":
        titleText = "💡 " + t("results.header_explore", "İlham Al");
        titleColor = "#757575"; // Gri
        break;
      default:
        titleText = t("results.header_generic", "Sonuçlar");
    }

    return (
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionHeaderText, { color: titleColor }]}>
          {titleText}
        </Text>
      </View>
    );
  };

  // --- YÜKLENİYOR / HATA DURUMLARI ---

  if (status === "loading") {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#f4511e" />
        <Text style={styles.loadingText}>
          {t("results.loading", "En uygun tarifler aranıyor...")}
        </Text>
      </SafeAreaView>
    );
  }

  if (status === "failed") {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="red" />
        <Text style={styles.errorText}>{error || t("general.error")}</Text>
      </SafeAreaView>
    );
  }

  if (status === "succeeded" && rawResults.length === 0) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Ionicons name="wine-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>
          {t("results.no_result_title", "Sonuç Bulunamadı")}
        </Text>
        <Text style={styles.emptySubtitle}>
          {t(
            "results.no_result_msg",
            "Seçtiğin malzemelerle eşleşen bir tarif bulamadık."
          )}
        </Text>
      </SafeAreaView>
    );
  }

  // --- ANA RENDER ---
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>
          {t("results.title", "Bulunan Tarifler")} ({rawResults.length})
        </Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.cocktail_id.toString()}
        renderItem={renderCocktailItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={{ paddingBottom: 40 }}
        stickySectionHeadersEnabled={false} // Başlıklar kayarken yapışmasın (daha sade durur)
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

// --- STİLLER ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", // Temiz beyaz
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  // Section Header
  sectionHeader: {
    backgroundColor: "#fff", // Arka planın şeffaf değil beyaz olması önemli
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  // Kart Stili
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    // Soft Gölge
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f9f9f9",
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  // Alt Metin Stilleri
  subtitleReady: {
    fontSize: 14,
    color: "#2E7D32", // Koyu Yeşil
    fontWeight: "600",
  },
  subtitleMissing: {
    fontSize: 14,
    color: "#EF6C00", // Turuncu
    fontWeight: "500",
  },
  subtitleGeneric: {
    fontSize: 13,
    color: "#999", // Gri
    fontStyle: "italic",
  },
  cardAction: {
    paddingLeft: 10,
  },
  // Loading & Error
  loadingText: {
    marginTop: 10,
    color: "gray",
    fontSize: 16,
  },
  errorText: {
    marginTop: 10,
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "gray",
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 20,
  },
});

export default AssistantResultScreen;
