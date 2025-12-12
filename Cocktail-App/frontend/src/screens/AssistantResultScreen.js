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
import { useNavigation, useTheme } from "@react-navigation/native";
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
  const { colors, fonts } = useTheme();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  // --- HELPER: Dinamik İsim (YENİ HALİ) ---
  const getName = (item) => {
    if (!item || !item.name) return "";
    // name_tr yerine name[lang] kullanıyoruz
    return item.name[i18n.language] || item.name["en"] || "";
  };

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
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowColor: colors.shadow,
          },
        ]}
        onPress={() => handlePressCocktail(item.cocktail_id)}
      >
        {/* Sol: Resim */}
        <Image
          source={{
            uri:
              item.image_url || "https://placehold.co/100x100/eee/999?text=Bar",
          }}
          style={[styles.cardImage, { backgroundColor: colors.subCard }]}
        />

        {/* Orta: İçerik */}
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {getName(item)}
          </Text>

          {/* Alt Metin: Hangi gruptaysa ona göre mesaj ver */}

          {/* 1. GRUP: HAZIR */}
          {sectionType === "ready" && (
            <Text style={[styles.subtitleReady, { color: colors.success }]}>
              <Ionicons name="checkmark-circle" size={14} />{" "}
              {t("results.ready_msg", "Malzemeler Tam!")}
            </Text>
          )}

          {/* 2. GRUP: AZ EKSİK */}
          {sectionType === "almost" && (
            <Text style={[styles.subtitleMissing, { color: colors.primary }]}>
              {missingCount} {t("results.missing_msg", "malzeme daha gerekli")}
            </Text>
          )}

          {/* 3. GRUP: İLHAM (Negatiflik Yok!) */}
          {sectionType === "explore" && (
            <Text
              style={[styles.subtitleGeneric, { color: colors.textSecondary }]}
            >
              {t("results.explore_msg", "Tarife göz at")}
            </Text>
          )}
        </View>

        {/* Sağ: İkon */}
        <View style={styles.cardAction}>
          {sectionType === "ready" ? (
            // Hazırsa Yeşil Play Tuşu (Harekete Geçirici)
            <Ionicons name="play-circle" size={32} color={colors.success} />
          ) : (
            // Değilse Gri Ok
            <Ionicons name="chevron-forward" size={24} color={colors.border} />
          )}
        </View>
      </Pressable>
    );
  };

  // --- 4. BÖLÜM BAŞLIKLARI ---
  const renderSectionHeader = ({ section: { title } }) => {
    let titleText = "";
    let titleColor = colors.text;

    switch (title) {
      case "ready":
        titleText = "🥂 " + t("results.header_ready", "Hemen Yapabilirsin!");
        titleColor = colors.success; // Yeşil
        break;
      case "almost":
        titleText = "🛒 " + t("results.header_almost", "Çok Yaklaşmışsın");
        titleColor = colors.primary; // Premium Gold (Turuncu yerine)
        break;
      case "explore":
        titleText = "💡 " + t("results.header_explore", "İlham Al");
        titleColor = colors.textSecondary; // Gri
        break;
      default:
        titleText = t("results.header_generic", "Sonuçlar");
    }

    return (
      <View
        style={[styles.sectionHeader, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.sectionHeaderText, { color: titleColor }]}>
          {titleText}
        </Text>
      </View>
    );
  };

  // --- YÜKLENİYOR / HATA DURUMLARI ---

  if (status === "loading") {
    return (
      <SafeAreaView
        style={[
          styles.centeredContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t("results.loading", "En uygun tarifler aranıyor...")}
        </Text>
      </SafeAreaView>
    );
  }

  if (status === "failed") {
    return (
      <SafeAreaView
        style={[
          styles.centeredContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={colors.notification}
        />
        <Text style={[styles.errorText, { color: colors.notification }]}>
          {error || t("general.error")}
        </Text>
      </SafeAreaView>
    );
  }

  if (status === "succeeded" && rawResults.length === 0) {
    return (
      <SafeAreaView
        style={[
          styles.centeredContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Ionicons name="wine-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {t("results.no_result_title", "Sonuç Bulunamadı")}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
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
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  // Section Header
  sectionHeader: {
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
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    // Soft Gölge
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  // Alt Metin Stilleri
  subtitleReady: {
    fontSize: 14,
    fontWeight: "600",
  },
  subtitleMissing: {
    fontSize: 14,
    fontWeight: "500",
  },
  subtitleGeneric: {
    fontSize: 13,
    fontStyle: "italic",
  },
  cardAction: {
    paddingLeft: 10,
  },
  // Loading & Error
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 20,
  },
});

export default AssistantResultScreen;
