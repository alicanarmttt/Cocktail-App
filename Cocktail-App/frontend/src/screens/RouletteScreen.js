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
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useNavigation, useTheme } from "@react-navigation/native";
import PremiumButton from "../ui/PremiumButton";
import { LinearGradient } from "expo-linear-gradient";
import {
  fetchRoulettePool,
  selectRoulettePool,
  getRouletteStatus,
  clearRoulette,
} from "../features/rouletteSlice";

const SCREEN_WIDTH = Dimensions.get("window").width;

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
  { id: "WhiskeyFamily", labelKey: "roulette.spirit_whiskey", icon: "beer" },
  { id: "Tequila", labelKey: "roulette.spirit_tequila", icon: "bonfire" },
];

const TASTES = [
  { id: "Sweet", labelKey: "roulette.taste_sweet", icon: "ice-cream" },
  { id: "Sour", labelKey: "roulette.taste_sour", icon: "nutrition" },
  { id: "Bitter", labelKey: "roulette.taste_bitter", icon: "cafe" },
  { id: "Fruity", labelKey: "roulette.taste_fruity", icon: "leaf" },
];

const RouletteScreen = () => {
  const { colors, fonts } = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  const [step, setStep] = useState("menu");
  const [selectedMode, setSelectedMode] = useState(null);
  const [filterType, setFilterType] = useState(null);

  const pool = useSelector(selectRoulettePool);
  const status = useSelector(getRouletteStatus);

  const spinValue = useRef(new Animated.Value(0)).current;
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    if (step === "menu") {
      dispatch(clearRoulette());
      spinValue.setValue(0);
      setWinner(null);
    }
  }, [step, dispatch]);

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

  const handleFilterSelect = (filterValue) => {
    startFetching(selectedMode, filterValue);
  };

  const startFetching = async (mode, filter) => {
    setStep("wheel");
    const result = await dispatch(fetchRoulettePool({ mode, filter }));

    if (fetchRoulettePool.rejected.match(result)) {
      Alert.alert(t("general.error"), t("roulette.no_cocktail_found"));
      setStep("menu");
    }
  };

  const spinWheel = () => {
    if (!pool || pool.length === 0) return;

    const randomIndex = Math.floor(Math.random() * pool.length);
    setWinner(pool[randomIndex]);

    spinValue.setValue(0);

    Animated.timing(spinValue, {
      toValue: 5 + Math.random() * 3,
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

  const getCocktailName = (item) =>
    i18n.language === "tr" ? item.name_tr : item.name_en;

  const renderMenu = () => (
    <View style={styles.menuContainer}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>
        {t("roulette.menu_title")}
      </Text>
      <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
        {t("roulette.menu_subtitle")}
      </Text>

      <View style={styles.grid}>
        {MODES.map((item) => (
          <Pressable
            key={item.id}
            style={[
              styles.modeCard,
              {
                borderColor: item.color,
                backgroundColor: colors.card,
                shadowColor: colors.shadow,
              },
            ]}
            onPress={() => handleModeSelect(item.id)}
          >
            <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon} size={32} color="#fff" />
            </View>
            <Text style={[styles.modeText, { color: colors.text }]}>
              {t(item.labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderFilter = () => {
    const list = filterType === "spirit" ? SPIRITS : TASTES;
    const titleKey =
      filterType === "spirit" ? "roulette.pick_spirit" : "roulette.pick_taste";

    return (
      <View style={styles.filterContainer}>
        <Pressable style={styles.backButton} onPress={() => setStep("menu")}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t(titleKey)}
        </Text>

        <View style={styles.listWrapper}>
          {list.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.filterItem, { borderBottomColor: colors.border }]}
              onPress={() => handleFilterSelect(item.id)}
            >
              <Ionicons
                name={item.icon || "radio-button-on"}
                size={24}
                color={colors.primary}
              />
              <Text style={[styles.filterText, { color: colors.text }]}>
                {t(item.labelKey)}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={colors.textSecondary}
              />
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  const renderWheel = () => {
    if (status === "loading") {
      return (
        <View style={styles.centerAll}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 20, fontSize: 18, color: colors.text }}>
            {t("roulette.loading_pool")}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.wheelContainer}>
        {/* YENİ ŞIK GERİ BUTONU */}
        <View style={styles.wheelHeader}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: "#000",
                opacity: pressed ? 0.8 : 1, // Tıklama efekti
              },
            ]}
            onPress={() => setStep("menu")}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </Pressable>

          <Text style={[styles.wheelTitle, { color: colors.text }]}>
            {pool.length} {t("roulette.options_found")}
          </Text>

          {/* Başlığı ortalamak için dengeleyici boş kutu */}
          <View style={{ width: 45 }} />
        </View>

        <View style={styles.wheelWrapper}>
          <View style={styles.indicatorContainer}>
            <Ionicons name="caret-down" size={50} color={colors.text} />
          </View>
          <Animated.Image
            source={require("../../assets/roulette_wheel.png")}
            style={[styles.wheelImage, { transform: [{ rotate: spin }] }]}
            resizeMode="contain"
          />
        </View>

        <PremiumButton
          variant="arcade"
          onPress={spinWheel}
          title={t("roulette.spin_btn")}
          style={styles.spinButton}
        ></PremiumButton>
      </View>
    );
  };

  const renderResult = () => {
    if (!winner) return null;

    return (
      <View
        style={[styles.resultContainer, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.winnerHeader, { color: colors.text }]}>
          🎉 {t("roulette.winner_title")} 🎉
        </Text>

        <View
          style={[
            styles.winnerCard,
            { backgroundColor: colors.card, shadowColor: colors.shadow },
          ]}
        >
          <Image
            source={{
              uri: winner.image_url || "https://placehold.co/300x300",
            }}
            style={styles.winnerImage}
          />
          <Text style={[styles.winnerName, { color: colors.primary }]}>
            {getCocktailName(winner)}
          </Text>
        </View>

        <View style={styles.resultButtons}>
          <PremiumButton
            variant="arcade"
            title={t("roulette.go_recipe")}
            onPress={() =>
              navigation.navigate("CocktailDetail", {
                cocktailId: winner.cocktail_id,
              })
            }
            style={styles.resultBtn}
          />

          <PremiumButton
            variant="cyber"
            onPress={() => setStep("wheel")}
            style={styles.resultBtn}
          >
            <Ionicons
              name="refresh"
              size={20}
              style={{ marginRight: 8, color: "#FFFFFF" }}
            />
            <Text
              style={{ fontSize: 16, fontWeight: "bold", color: "#FFFFFF" }}
            >
              {t("roulette.spin_again")}
            </Text>
          </PremiumButton>

          <Pressable style={styles.backLink} onPress={() => setStep("menu")}>
            <Text style={{ color: colors.textSecondary }}>
              {t("roulette.back_menu")}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {step === "menu" && renderMenu()}
      {step === "filter" && renderFilter()}
      {step === "wheel" && renderWheel()}
      {step === "result" && renderResult()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerAll: { flex: 1, justifyContent: "center", alignItems: "center" },
  menuContainer: { flex: 1, padding: 20, justifyContent: "center" },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: "center",
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
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    alignItems: "center",
    borderWidth: 2,
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
  modeText: { fontWeight: "bold", textAlign: "center" },
  filterContainer: { flex: 1, padding: 20 },
  // Eski backButton stili sadeydi, burayı renderFilter içinde de güncelleyebiliriz istersen
  // ama şu anlık sadece wheelHeader içindeki backButton'u özelleştirdik.
  backButton: {
    // YENİ BUTON STİLİ
    width: 45,
    height: 45,
    borderRadius: 22.5, // Tam daire
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    // Gölge ayarları
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  listWrapper: { marginTop: 20 },
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  filterText: { fontSize: 18, marginLeft: 15, flex: 1 },
  wheelContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 20,
  },
  wheelHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  wheelTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
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
    width: "80%",
    marginTop: 10,
    alignSelf: "center",
    marginBottom: 20,
  },

  resultContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  winnerHeader: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  winnerCard: {
    width: "90%",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
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
    textAlign: "center",
  },
  resultButtons: { width: "100%", alignItems: "center", gap: 15 },
  resultBtn: {
    width: "80%",
  },

  backLink: { marginTop: 10 },
});

export default RouletteScreen;
