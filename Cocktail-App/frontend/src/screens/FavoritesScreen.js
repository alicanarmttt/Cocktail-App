import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
// GÜNCELLEME: SafeAreaView (Home'daki gibi)
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector, useDispatch } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useTheme } from "@react-navigation/native"; // ✅ DOĞRU TEMA KULLANIMI
import { useTranslation } from "react-i18next"; // ✅ DİL DESTEĞİ

// Redux Actions & Selectors
import {
  fetchFavorites,
  selectAllFavorites,
  getFavoritesStatus,
  getFavoritesError,
} from "../features/favoritesSlice";

// Components
import CocktailCard from "../components/common/CocktailCard";
import SkeletonCard from "../components/common/SkeletonCard";
import ErrorView from "../components/common/ErrorView";

const FavoritesScreen = () => {
  // 1. TEMA VE DİL KANCALARI
  const { colors } = useTheme(); // ✅ Navigasyon temasını çekiyoruz
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  const favorites = useSelector(selectAllFavorites);
  const status = useSelector(getFavoritesStatus);
  const error = useSelector(getFavoritesError);

  const [searchText, setSearchText] = useState("");

  // 2. HELPER: DİNAMİK İSİM SEÇİCİ (Home ile aynı mantık)
  const getName = (item) => {
    if (!item || !item.name) return "";
    // Veri yapısı { en: "Mojito", tr: "Mojito" } şeklinde ise:
    if (typeof item.name === "object") {
      return item.name[i18n.language] || item.name["en"] || "";
    }
    // Eğer eski veri yapısı (string) gelirse diye fallback:
    return item.name;
  };

  // Ekran açıldığında favorileri çek
  useEffect(() => {
    dispatch(fetchFavorites());
  }, [dispatch]);

  // 3. ARAMA FİLTRESİ (Dinamik isme göre)
  const filteredFavorites = favorites.filter((item) => {
    const name = getName(item);
    return name.toLowerCase().includes(searchText.toLowerCase());
  });

  // --- HEADER ---
  const renderHeader = () => (
    <View
      style={[styles.headerContainer, { backgroundColor: colors.background }]}
    >
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>
        {t("favorites.title")}
      </Text>
      <View style={{ width: 24 }} />
    </View>
  );

  // --- SEARCH BAR ---
  const renderSearchBar = () => (
    <View
      style={[
        styles.searchContainer,
        { borderColor: colors.border, backgroundColor: colors.card },
      ]}
    >
      <Ionicons
        name="search"
        size={20}
        color={colors.text}
        style={[styles.searchIcon, { opacity: 0.5 }]}
      />
      <TextInput
        style={[styles.searchInput, { color: colors.text }]}
        placeholder={t("favorites.searchPlaceholder")}
        placeholderTextColor={colors.text} // Opacity ile soluklaştırılabilir veya textSecondary kullanılabilir
        value={searchText}
        onChangeText={setSearchText}
      />
      {searchText.length > 0 && (
        <TouchableOpacity onPress={() => setSearchText("")}>
          <Ionicons
            name="close-circle"
            size={20}
            color={colors.text}
            style={{ opacity: 0.5 }}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  // --- LOADING STATE ---
  if (status === "loading" && favorites.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top", "left", "right"]}
      >
        {renderHeader()}
        <View style={styles.gridContainer}>
          <FlatList
            data={[1, 2, 3, 4, 5, 6]}
            keyExtractor={(item) => item.toString()}
            numColumns={2}
            renderItem={() => (
              <View style={{ flex: 1, margin: 8 }}>
                <SkeletonCard />
              </View>
            )}
          />
        </View>
      </SafeAreaView>
    );
  }

  // --- ERROR STATE ---
  if (status === "failed") {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {renderHeader()}
        <ErrorView
          message={error || t("favorites.loadError")}
          onRetry={() => dispatch(fetchFavorites())}
        />
      </SafeAreaView>
    );
  }

  // --- SUCCESS STATE ---
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={
          colors.background === "#000000" ? "light-content" : "dark-content"
        }
        backgroundColor={colors.background}
      />

      {/* HEADER */}
      {renderHeader()}

      {/* SEARCH BAR (Sadece liste doluysa göster) */}
      {favorites.length > 0 && renderSearchBar()}

      {/* CONTENT */}
      {favorites.length === 0 ? (
        // --- BOŞ DURUM (EMPTY STATE) ---
        <View style={styles.emptyContainer}>
          <Ionicons
            name="heart-dislike-outline"
            size={80}
            color={colors.border}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {t("favorites.emptyTitle")}
          </Text>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            {/* textSecondary yerine opacity kullanarak text rengini yumuşatıyoruz */}
            {t("favorites.emptyDescription")}
          </Text>
          <TouchableOpacity
            style={[styles.exploreButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={[styles.exploreButtonText, { color: "#FFF" }]}>
              {t("favorites.startExploring")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        // --- LİSTE GÖRÜNÜMÜ ---
        <FlatList
          data={filteredFavorites}
          keyExtractor={(item) => item.cocktail_id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={{ flex: 0.5 }}>
              <CocktailCard
                item={item}
                // Eğer CocktailCard içinde dil desteği yoksa,
                // ismini burada override edip gönderebilirsin.
                // Ancak ideal olan item'ı olduğu gibi gönderip CocktailCard'ın da getName kullanmasıdır.
                // Şimdilik item'ı olduğu gibi yolluyoruz, card içinde handle edildiğini varsayıyoruz.
                displayName={getName(item)} // Opsiyonel: Card komponentin bu prop'u destekliyorsa kullan
                onPress={() =>
                  navigation.navigate("CocktailDetail", {
                    id: item.cocktail_id,
                  })
                }
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptySearchContainer}>
              <Text style={{ color: colors.text, opacity: 0.6 }}>
                {t("favorites.noSearchResult", { query: searchText })}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 0, // Android input yüksekliği farklı olabilir
    height: 45,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  gridContainer: {
    paddingHorizontal: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    marginTop: -50,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
    opacity: 0.7,
  },
  exploreButton: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  emptySearchContainer: {
    padding: 20,
    alignItems: "center",
  },
});

export default FavoritesScreen;
