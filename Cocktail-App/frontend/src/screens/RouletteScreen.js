import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next"; // Çeviri kancası
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";

import {
  fetchRoulettePool,
  selectRoulettePool,
  getRouletteStatus,
  clearRoulette,
} from "../features/rouletteSlice";

const SCREEN_WIDTH = Dimensions.get("window").width;

// --- SABİT VERİLER (Label Key'leri ile) ---

const MODES = [
  {
    id: "driver",
    icon: "car-sport",
    labelKey: "roulette.mode_driver",
    color: "#4CAF50",
  },
  {
    id: "popular",
    icon: "star",
    labelKey: "roulette.mode_popular",
    color: "#FFD700",
  },
  {
    id: "taste",
    icon: "restaurant",
    labelKey: "roulette.mode_taste",
    color: "#FF9800",
  },
  {
    id: "spirit",
    icon: "wine",
    labelKey: "roulette.mode_spirit",
    color: "#2196F3",
  },
  {
    id: "random",
    icon: "dice",
    labelKey: "roulette.mode_random",
    color: "#9C27B0",
  },
];

const SPIRITS = [
  { id: "Gin", labelKey: "roulette.spirit_gin", icon: "flask" },
  { id: "Vodka", labelKey: "roulette.spirit_vodka", icon: "water" },
  { id: "Rum", labelKey: "roulette.spirit_rum", icon: "boat" },

  // DÜZELTME: ID'yi özel anahtarımız yapıyoruz
  { id: "WhiskeyFamily", labelKey: "roulette.spirit_whiskey", icon: "beer" },

  { id: "Tequila", labelKey: "roulette.spirit_tequila", icon: "bonfire" },
];

// Tat Profilleri (Backend Tag'leri ve Çeviri Key'leri)
const TASTES = [
  { id: "Sweet", labelKey: "roulette.taste_sweet", icon: "ice-cream" },
  { id: "Sour", labelKey: "roulette.taste_sour", icon: "nutrition" },
  { id: "Bitter", labelKey: "roulette.taste_bitter", icon: "cafe" },
  { id: "Fruity", labelKey: "roulette.taste_fruity", icon: "leaf" },
];

const RouletteScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation(); // Çeviri fonksiyonu

  // State
  const [step, setStep] = useState("menu"); // menu, filter, wheel, result
  const [selectedMode, setSelectedMode] = useState(null);
  const [filterType, setFilterType] = useState(null);

  const pool = useSelector(selectRoulettePool);
  const status = useSelector(getRouletteStatus);

  // Animasyon
  const spinValue = useRef(new Animated.Value(0)).current;
  const [winner, setWinner] = useState(null);

  // Temizlik
  useEffect(() => {
    if (step === "menu") {
      dispatch(clearRoulette());
      spinValue.setValue(0);
      setWinner(null);
    }
  }, [step, dispatch]);

  // Mod Seçimi
  const handleModeSelect = (modeId) => {
    setSelectedMode(modeId);
    if (modeId === "spirit") {
      setFilterType("spirit");
      setStep("filter");
    } else if (modeId === "taste") {
      setFilterType("taste");
      setStep("filter");
    } else {
      startFetching(modeId, null);
    }
  };

  // Filtre Seçimi
  const handleFilterSelect = (filterValue) => {
    startFetching(selectedMode, filterValue);
  };

  // Veri Çekme
  const startFetching = async (mode, filter) => {
    setStep("wheel");
    const result = await dispatch(fetchRoulettePool({ mode, filter }));

    if (fetchRoulettePool.rejected.match(result)) {
      Alert.alert(t("general.error"), t("roulette.no_cocktail_found"));
      setStep("menu");
    }
  };

  // Çarkı Döndür
  const spinWheel = () => {
    if (!pool || pool.length === 0) return;

    const randomIndex = Math.floor(Math.random() * pool.length);
    setWinner(pool[randomIndex]);

    spinValue.setValue(0);

    Animated.timing(spinValue, {
      toValue: 5 + Math.random() * 3, // 5-8 tur
      duration: 4000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => setStep("result"), 500);
      }
    });
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Helper: Dinamik İsim (Result için)
  const getCocktailName = (item) =>
    i18n.language === "tr" ? item.name_tr : item.name_en;

  // --- RENDER ---

  // 1. MENÜ
  const renderMenu = () => (
    <View style={styles.menuContainer}>
      <Text style={styles.headerTitle}>{t("roulette.menu_title")}</Text>
      <Text style={styles.headerSubtitle}>{t("roulette.menu_subtitle")}</Text>

      <View style={styles.grid}>
        {MODES.map((item) => (
          <Pressable
            key={item.id}
            style={[styles.modeCard, { borderColor: item.color }]}
            onPress={() => handleModeSelect(item.id)}
          >
            <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon} size={32} color="#fff" />
            </View>
            <Text style={styles.modeText}>{t(item.labelKey)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  // 2. FİLTRE
  const renderFilter = () => {
    const list = filterType === "spirit" ? SPIRITS : TASTES;
    const titleKey =
      filterType === "spirit" ? "roulette.pick_spirit" : "roulette.pick_taste";

    return (
      <View style={styles.filterContainer}>
        <Pressable style={styles.backButton} onPress={() => setStep("menu")}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>

        <Text style={styles.headerTitle}>{t(titleKey)}</Text>

        <View style={styles.listWrapper}>
          {list.map((item) => (
            <Pressable
              key={item.id}
              style={styles.filterItem}
              onPress={() => handleFilterSelect(item.id)}
            >
              <Ionicons
                name={item.icon || "radio-button-on"}
                size={24}
                color="#f4511e"
              />
              <Text style={styles.filterText}>{t(item.labelKey)}</Text>
              <Ionicons name="chevron-forward" size={24} color="#ccc" />
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  // 3. ÇARK
  const renderWheel = () => {
    if (status === "loading") {
      return (
        <View style={styles.centerAll}>
          <ActivityIndicator size="large" color="#f4511e" />
          <Text style={{ marginTop: 20, fontSize: 18 }}>
            {t("roulette.loading_pool")}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.wheelContainer}>
        <Text style={styles.wheelTitle}>
          {pool.length} {t("roulette.options_found")}
        </Text>

        <View style={styles.wheelWrapper}>
          <View style={styles.indicatorContainer}>
            <Ionicons name="caret-down" size={50} color="#333" />
          </View>
          <Animated.Image
            source={require("../../assets/roulette_wheel.png")}
            style={[styles.wheelImage, { transform: [{ rotate: spin }] }]}
            resizeMode="contain"
          />
        </View>

        <Pressable style={styles.spinButton} onPress={spinWheel}>
          <Text style={styles.spinButtonText}>{t("roulette.spin_btn")}</Text>
        </Pressable>
      </View>
    );
  };

  // 4. SONUÇ
  const renderResult = () => {
    if (!winner) return null;

    return (
      <View style={styles.resultContainer}>
        <Text style={styles.winnerHeader}>
          🎉 {t("roulette.winner_title")} 🎉
        </Text>

        <View style={styles.winnerCard}>
          <Image
            source={{ uri: winner.image_url || "https://placehold.co/300x300" }}
            style={styles.winnerImage}
          />
          <Text style={styles.winnerName}>{getCocktailName(winner)}</Text>
        </View>

        <View style={styles.resultButtons}>
          <Pressable
            style={[styles.resultBtn, styles.recipeBtn]}
            onPress={() =>
              navigation.navigate("CocktailDetail", {
                cocktailId: winner.cocktail_id,
              })
            }
          >
            <Text style={styles.btnTextWhite}>{t("roulette.go_recipe")}</Text>
          </Pressable>

          <Pressable
            style={[styles.resultBtn, styles.againBtn]}
            onPress={() => setStep("wheel")}
          >
            <Text style={styles.btnTextOutline}>
              {t("roulette.spin_again")}
            </Text>
          </Pressable>

          <Pressable style={styles.backLink} onPress={() => setStep("menu")}>
            <Text style={{ color: "#999" }}>{t("roulette.back_menu")}</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {step === "menu" && renderMenu()}
      {step === "filter" && renderFilter()}
      {step === "wheel" && renderWheel()}
      {step === "result" && renderResult()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centerAll: { flex: 1, justifyContent: "center", alignItems: "center" },
  menuContainer: { flex: 1, padding: 20, justifyContent: "center" },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#777",
    marginBottom: 30,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modeCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    alignItems: "center",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  modeText: { fontWeight: "bold", color: "#333", textAlign: "center" },
  filterContainer: { flex: 1, padding: 20 },
  backButton: { marginBottom: 20 },
  listWrapper: { marginTop: 20 },
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  filterText: { fontSize: 18, marginLeft: 15, flex: 1, color: "#333" },
  wheelContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 40,
  },
  wheelTitle: { fontSize: 22, fontWeight: "bold", color: "#333" },
  wheelWrapper: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  wheelImage: { width: "100%", height: "100%" },
  indicatorContainer: { position: "absolute", top: -30, zIndex: 10 },
  spinButton: {
    backgroundColor: "#f4511e",
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 30,
    shadowColor: "#f4511e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  spinButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  resultContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fcfcfc",
  },
  winnerHeader: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  winnerCard: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    marginBottom: 40,
  },
  winnerImage: { width: 200, height: 200, borderRadius: 100, marginBottom: 15 },
  winnerName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#f4511e",
    textAlign: "center",
  },
  resultButtons: { width: "100%", alignItems: "center", gap: 15 },
  resultBtn: {
    width: "80%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  recipeBtn: { backgroundColor: "#f4511e" },
  againBtn: { backgroundColor: "#fff", borderWidth: 2, borderColor: "#f4511e" },
  btnTextWhite: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  btnTextOutline: { color: "#f4511e", fontSize: 16, fontWeight: "bold" },
  backLink: { marginTop: 10 },
});

export default RouletteScreen;
