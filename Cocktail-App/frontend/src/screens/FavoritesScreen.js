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
import { useTranslation } from "react-i18next";

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

  // 1. Dil Kancasını Başlat
  const { t, i18n } = useTranslation();

  // --- HELPER: Dinamik İsim Seçici (GÜVENLİ VERSİYON) ---
  const getName = (item) => {
    if (!item || !item.name) return "";

    // Eğer name zaten düz bir string geliyorsa direkt döndür
    if (typeof item.name === "string") return item.name;

    // GÜVENLİK: 'tr-TR' gelirse 'tr' kısmını alır.
    const langCode = i18n.language ? i18n.language.substring(0, 2) : "en";

    // 1. Öncelik: Seçili dil
    // 2. Öncelik: İngilizce (Fallback)
    return item.name[langCode] || item.name["en"] || "";
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
          const localizedItem = {
            ...item,
            name: getName(item),
          };

          return (
            <CocktailCard
              item={localizedItem}
              onPress={() =>
                // DÜZELTME: 'id' değil 'cocktailId' olmalı.
                // CocktailDetailScreen bu parametreyi bekliyor.
                navigation.navigate("CocktailDetail", {
                  cocktailId: item.cocktail_id,
                })
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
