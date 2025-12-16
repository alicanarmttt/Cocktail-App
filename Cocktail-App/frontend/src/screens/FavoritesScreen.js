import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next"; // i18n hook

// --- COMPONENTS ---
import CocktailCard from "../components/common/CocktailCard";
import ErrorView from "../components/common/ErrorView";

// --- REDUX FEATURES ---
import { selectCurrentUser } from "../features/userSlice";
import {
  fetchFavorites,
  selectAllFavorites,
  getFavoritesStatus,
} from "../features/favoritesSlice";

const FavoritesScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { colors } = useTheme();

  // 1. Dil Kancasını (Hook) Başlat
  const { t, i18n } = useTranslation();

  // --- HELPER: Dinamik İsim Seçici ---
  // Backend'den name: {"tr": "Mojito", "en": "Mojito"} gibi gelirse patlamamak için.
  const getName = (item) => {
    if (!item || !item.name) return "";

    // Eğer name zaten düz bir string geliyorsa (veritabanı sorgusunda halledildiyse) direkt döndür
    if (typeof item.name === "string") return item.name;

    // Obje geliyorsa dile göre seç
    // 1. Öncelik: Seçili dil (örn: item.name['tr'])
    // 2. Öncelik: İngilizce (Fallback)
    return item.name[i18n.language] || item.name["en"] || "";
  };

  // Redux Selectors
  const currentUser = useSelector(selectCurrentUser);
  const favorites = useSelector(selectAllFavorites);
  const status = useSelector(getFavoritesStatus);

  const userId = currentUser?.user_id || currentUser?.id;

  const loadFavorites = useCallback(() => {
    if (userId) {
      dispatch(fetchFavorites(userId));
    }
  }, [dispatch, userId]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // --- UI DURUMLARI ---

  if (!currentUser) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <Text style={{ color: colors.text, fontSize: 16, textAlign: "center" }}>
          {t("favorites.loginRequired")}
        </Text>
      </View>
    );
  }

  if (status === "loading") {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (status === "failed") {
    return (
      <ErrorView
        title={t("favorites.errorTitle")}
        message={t("favorites.loadError")}
        onRetry={loadFavorites}
        iconName="error-outline"
      />
    );
  }

  if (favorites.length === 0) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <Text style={{ color: colors.text, fontSize: 16, textAlign: "center" }}>
          {t("favorites.noFavorites")}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.cocktail_id.toString()}
        contentContainerStyle={{ padding: 10 }}
        renderItem={({ item }) => {
          // İSMİ BURADA ÇÖZÜMLÜYORUZ
          // item.name'i o anki dile çevirip, yeni bir obje gibi karta gönderiyoruz.
          // Böylece CocktailCard içinde ekstra mantık kurmaya gerek kalmıyor.
          const localizedItem = {
            ...item,
            name: getName(item),
          };

          return (
            <CocktailCard
              item={localizedItem} // Çevrilmiş ismi gönderiyoruz
              onPress={() =>
                navigation.navigate("CocktailDetail", { id: item.cocktail_id })
              }
            />
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});

export default FavoritesScreen;
