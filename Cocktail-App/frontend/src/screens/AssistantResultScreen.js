import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
  FlatList,
  Platform, // Platform kontrolü için eklendi
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
import CocktailImage from "../components/CocktailImage";

import ResultCardSkeleton from "../components/common/ResultCardSkeleton";
import ErrorView from "../components/common/ErrorView";

/**
 * @desc    Barmen Asistanı Sonuç Ekranı (AssistantResultScreen)
 */
const AssistantResultScreen = () => {
  const { colors, dark } = useTheme();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  // --- RENK PALETİ ---
  const themeColors = {
    ready: dark ? "#81C784" : colors.success,
    almost: dark ? "#FFB74D" : colors.primary,
    explore: colors.textSecondary,
    cardBg: colors.card,
    shadow: dark ? "#000" : colors.shadow,
  };

  // --- HELPER: Dinamik İsim ---
  const getName = (item) => {
    if (!item || !item.name) return "";
    return item.name[i18n.language] || item.name["en"] || "";
  };

  // --- REDUX DATA ---
  const rawResults = useSelector(selectSearchResults);
  const status = useSelector(getSearchStatus);
  const error = useSelector(getSearchError);

  // --- 1. GRUPLAMA MANTIĞI ---
  const sections = useMemo(() => {
    if (!rawResults || rawResults.length === 0) return [];

    const readyToDrink = [];
    const almostThere = [];
    const inspiration = [];

    rawResults.forEach((cocktail) => {
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
    navigation.navigate("CocktailDetail", { cocktailId: cocktailId });
  };

  // --- 3. KART RENDER ---
  const renderCocktailItem = ({ item, section }) => {
    const missingCount = item.missing_count || 0;
    const sectionType = section.title;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: themeColors.cardBg,
            borderColor: dark ? "rgba(255,255,255,0.15)" : colors.border,
            borderWidth: dark ? 1 : 0.5,
            shadowColor: themeColors.shadow,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
        onPress={() => handlePressCocktail(item.cocktail_id)}
      >
        <CocktailImage
          uri={item.image_url}
          style={[styles.cardImage, { backgroundColor: colors.subCard }]}
        />

        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {getName(item)}
          </Text>

          {sectionType === "ready" && (
            <Text style={[styles.subtitle, { color: themeColors.ready }]}>
              <Ionicons name="checkmark-circle" size={14} />{" "}
              {t("results.ready_msg", "Malzemeler Tam!")}
            </Text>
          )}

          {sectionType === "almost" && (
            <Text style={[styles.subtitle, { color: themeColors.almost }]}>
              <Ionicons name="alert-circle-outline" size={14} /> {missingCount}{" "}
              {t("results.missing_msg", "malzeme gerekli")}
            </Text>
          )}

          {sectionType === "explore" && (
            <Text
              style={[styles.subtitleGeneric, { color: themeColors.explore }]}
            >
              {t("results.explore_msg", "Tarife göz at")}
            </Text>
          )}
        </View>

        <View style={styles.cardAction}>
          {sectionType === "ready" ? (
            <Ionicons name="play-circle" size={32} color={themeColors.ready} />
          ) : (
            <Ionicons
              name="chevron-forward"
              size={24}
              color={colors.textSecondary}
            />
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
        titleColor = themeColors.ready;
        break;
      case "almost":
        titleText = "🛒 " + t("results.header_almost", "Çok Yaklaşmışsın");
        titleColor = themeColors.almost;
        break;
      case "explore":
        titleText = "💡 " + t("results.header_explore", "İlham Al");
        titleColor = themeColors.explore;
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

  // --- LOADING / ERROR ---
  if (status === "loading") {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.dummyHeader}>
          <View style={{ height: 40 }} />
        </View>
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          keyExtractor={(item) => item.toString()}
          renderItem={() => <ResultCardSkeleton />}
        />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t("results.loading", "En uygun tarifler aranıyor...")}
        </Text>
      </SafeAreaView>
    );
  }

  if (status === "failed") {
    return (
      <ErrorView
        title={t("general.error_title", "Bir Hata Oluştu")}
        message={error || t("general.error")}
        iconName="alert-circle-outline"
      />
    );
  }

  if (status === "succeeded" && rawResults.length === 0) {
    return (
      <ErrorView
        title={t("results.no_result_title", "Sonuç Bulunamadı")}
        message={t(
          "results.no_result_msg",
          "Seçtiğin malzemelerle eşleşen bir tarif bulamadık."
        )}
        iconName="search-off"
      />
    );
  }

  // --- ANA RENDER ---
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      {/* CUSTOM HEADER / TITLE BAR */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.border,
            // iOS'ta buton olmadığı için sola yaslanmasın diye padding veriyoruz
            paddingLeft: Platform.OS === "ios" ? 20 : 16,
          },
        ]}
      >
        {/* Sadece Android için Geri Butonu (iOS'ta native header var) */}
        {Platform.OS !== "ios" && (
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        )}

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t("results.title", "Bulunan Tarifler")}{" "}
          <Text style={{ fontWeight: "400", fontSize: 18 }}>
            ({rawResults.length})
          </Text>
        </Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.cocktail_id.toString()}
        renderItem={renderCocktailItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={{ paddingBottom: 40 }}
        stickySectionHeadersEnabled={false}
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
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    // iOS'ta native header'a çok yakın olmaması için dikey boşluk ayarı
    paddingVertical: Platform.OS === "ios" ? 10 : 14,
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  dummyHeader: {
    padding: 20,
    marginBottom: 10,
  },
  // Section Header
  sectionHeader: {
    paddingTop: 18,
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  sectionHeaderText: {
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  // Kart Stili
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 14,
    borderRadius: 20,
    // 3D Gölge
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardImage: {
    width: 68,
    height: 68,
    borderRadius: 14,
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  subtitleGeneric: {
    fontSize: 13,
    fontStyle: "italic",
    fontWeight: "500",
  },
  cardAction: {
    paddingLeft: 12,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
  },
});

export default AssistantResultScreen;
