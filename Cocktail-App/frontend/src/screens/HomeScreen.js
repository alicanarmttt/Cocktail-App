import React, { useEffect, useState, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  TouchableOpacity,
  Platform,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useTheme } from "@react-navigation/native";
import PremiumButton from "../ui/PremiumButton.js";
import CocktailSelectorModal from "../components/CocktailSelectorModal.js";
import {
  fetchCocktails,
  selectAllCocktails,
  getCocktailsListError,
  getCocktailsListStatus,
  selectCocktailById,
} from "../features/cocktails/cocktailSlice.js";
import VINTAGE_FRAME_URL from "../../assets/gold_frame.png";
import CocktailImage from "../components/CocktailImage.js";
import SkeletonCard from "../components/common/SkeletonCard";
import ErrorView from "../components/common/ErrorView";
import { fetchFavorites } from "../features/favoritesSlice";
import { selectCurrentUser } from "../features/userSlice.js";

const { width, height } = Dimensions.get("window");

// --- ANDROID AYARLARI ---
const CARD_WIDTH = width * 0.78;
const SPACING = 10;

const HomeScreen = ({ navigation }) => {
  const { colors, fonts } = useTheme();
  const scrollX = useRef(new Animated.Value(0)).current;

  // --- DATA ---
  const POPULAR_COCKTAILS = [
    "Margarita",
    "Mojito",
    "Old Fashioned",
    "Negroni",
    "Gin Tonic",
    "Espresso Martini",
    "Daiquiri",
    "Dry Martini",
    "Whiskey Sour",
    "Aperol Spritz",
    "Long Island Iced Tea",
    "Pina Colada",
    "Cosmopolitan",
    "Moscow Mule",
    "Bloody Mary",
    "Cuba Libre",
    "Tequila Sunrise",
    "Sex on the Beach",
    "White Russian",
    "Manhattan",
  ];

  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const userId = currentUser?.user_id || currentUser?.id;

  useEffect(() => {
    if (userId) dispatch(fetchFavorites(userId));
  }, [dispatch, userId]);

  const { t, i18n } = useTranslation();

  const getName = (item) => {
    if (!item || !item.name) return "";
    const langCode = i18n.language ? i18n.language.substring(0, 2) : "en";
    return item.name[langCode] || item.name["en"] || "";
  };

  const allCocktails = useSelector(selectAllCocktails);
  const status = useSelector(getCocktailsListStatus);
  const error = useSelector(getCocktailsListError);
  const [selectedCocktailId, setSelectedCocktailId] = useState(null);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  ("");

  useEffect(() => {
    if (status === "idle") dispatch(fetchCocktails());
  }, [status, dispatch]);

  const selectedCocktail = useSelector((state) =>
    selectCocktailById(state, selectedCocktailId)
  );

  const sortedCocktails = useMemo(() => {
    if (!allCocktails || allCocktails.length === 0) return [];
    const populars = [];
    const others = [];
    allCocktails.forEach((cocktail) => {
      if (cocktail.name && POPULAR_COCKTAILS.includes(cocktail.name.en)) {
        populars.push(cocktail);
      } else {
        others.push(cocktail);
      }
    });
    others.sort((a, b) => getName(a).localeCompare(getName(b)));
    return [...populars, ...others];
  }, [allCocktails, i18n.language]);

  const flatListRef = useRef(null);

  useEffect(() => {
    if (sortedCocktails.length > 0 && selectedCocktailId === null) {
      const target = sortedCocktails.find((c) => c.name?.en === "Cosmopolitan");
      if (target) setSelectedCocktailId(target.cocktail_id);
    }
  }, [sortedCocktails, selectedCocktailId]);

  const handleSelectFromSearch = (id) => {
    setSelectedCocktailId(id);
    setIsSearchModalVisible(false);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const centerItem = viewableItems[0];
      if (centerItem && centerItem.item.cocktail_id !== selectedCocktailId) {
        setSelectedCocktailId(centerItem.item.cocktail_id);
      }
    }
  }).current;

  // --- RENDER ---
  if (status === "loading" && allCocktails.length === 0) {
    return (
      <View
        style={[
          styles.centeredContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <SkeletonCard />
      </View>
    );
  }

  if (status === "failed") {
    return <ErrorView onRetry={() => dispatch(fetchCocktails())} />;
  }

  // 🔥 ANDROID DESIGN (Center Quote + Visible Search Pill)
  if (Platform.OS === "android") {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* 1. HEADER ALANI */}
        <View style={styles.androidHeaderContainer}>
          {/* SÖZ (Tam Ortada) */}
          <Text style={[styles.headerQuote, { color: colors.textSecondary }]}>
            {t("home.quote")}
          </Text>

          {/* ARAMA BUTONU (Hemen Altında - Çok Belirgin) */}
          <TouchableOpacity
            style={[
              styles.searchPill,
              { backgroundColor: colors.card, borderColor: colors.primary },
            ]}
            onPress={() => setIsSearchModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="search"
              size={18}
              color={colors.primary}
              style={{ marginRight: 8 }}
            />
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14,
                letterSpacing: 0.5,
              }}
            >
              {t("home.search_btn", "KOKTEYL ARA...")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. GALLERY */}
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Animated.FlatList
            ref={flatListRef}
            data={sortedCocktails}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.cocktail_id.toString()}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            snapToInterval={CARD_WIDTH}
            decelerationRate={0.8}
            bounces={false}
            contentContainerStyle={{
              paddingHorizontal: (width - CARD_WIDTH) / 2,
              paddingVertical: 10,
            }}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            renderItem={({ item, index }) => {
              const inputRange = [
                (index - 1) * CARD_WIDTH,
                index * CARD_WIDTH,
                (index + 1) * CARD_WIDTH,
              ];
              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.9, 1, 0.9],
                extrapolate: "clamp",
              });
              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.6, 1, 0.6],
                extrapolate: "clamp",
              });

              return (
                <Animated.View
                  style={{ width: CARD_WIDTH, transform: [{ scale }], opacity }}
                >
                  <TouchableOpacity
                    activeOpacity={0.95}
                    onPress={() => setSelectedCocktailId(item.cocktail_id)}
                    style={[
                      styles.androidPremiumCard,
                      { backgroundColor: colors.card, shadowColor: "#000" },
                    ]}
                  >
                    <View style={styles.premiumImageWrapper}>
                      <CocktailImage
                        uri={item.image_url}
                        style={styles.premiumImage}
                      />
                      <Image
                        source={VINTAGE_FRAME_URL}
                        style={styles.frameOverlay}
                        resizeMode="stretch"
                      />
                    </View>
                    <View style={styles.premiumTextContainer}>
                      <Text
                        style={[styles.premiumTitle, { color: colors.text }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.6}
                      >
                        {getName(item).toUpperCase()}
                      </Text>
                      {POPULAR_COCKTAILS.includes(item.name.en) ? (
                        <View
                          style={[
                            styles.badge,
                            { borderColor: colors.primary },
                          ]}
                        >
                          <Text
                            style={{
                              color: colors.primary,
                              fontSize: 10,
                              fontWeight: "bold",
                            }}
                          >
                            ★ SIGNATURE ★
                          </Text>
                        </View>
                      ) : (
                        <View
                          style={{
                            width: 30,
                            height: 1,
                            backgroundColor: colors.border,
                            marginTop: 8,
                          }}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            }}
          />
        </View>

        {/* 3. FOOTER */}
        <View style={styles.androidFooter}>
          <PremiumButton
            variant="gold"
            title={t("home.prepare_btn")}
            style={{ width: "75%", height: 55 }}
            onPress={() =>
              navigation.navigate("CocktailDetail", {
                cocktailId: selectedCocktailId,
              })
            }
          />
        </View>

        <CocktailSelectorModal
          visible={isSearchModalVisible}
          onClose={() => setIsSearchModalVisible(false)}
          onSelect={handleSelectFromSearch}
          multiSelect={false}
        />
      </SafeAreaView>
    );
  }

  // --- IOS RETURN (AYNI) ---
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.displayArea}>
        <Text style={[styles.headerQuote, { color: colors.textSecondary }]}>
          {t("home.quote")}
        </Text>
        <View style={[styles.imageWrapper, { shadowColor: "#000" }]}>
          {selectedCocktail ? (
            <CocktailImage
              uri={selectedCocktail.image_url}
              style={styles.cocktailImage}
            />
          ) : (
            <View
              style={[
                styles.cocktailImage,
                styles.placeholderContainer,
                { backgroundColor: colors.subCard },
              ]}
            >
              <Text
                style={[
                  styles.placeholderText,
                  fonts.styles.caption,
                  { color: colors.textSecondary },
                ]}
              >
                {t("home.pick_cocktail")}
              </Text>
            </View>
          )}
          <Image
            source={VINTAGE_FRAME_URL}
            style={styles.frameOverlay}
            resizeMode="stretch"
            pointerEvents="none"
          />
        </View>
        <PremiumButton
          variant="gold"
          title={t("home.prepare_btn")}
          disabled={!selectedCocktail}
          style={styles.prepareButton}
          onPress={() =>
            navigation.navigate("CocktailDetail", {
              cocktailId: selectedCocktail.cocktail_id,
            })
          }
        />
      </View>
      <View
        style={[
          styles.pickerArea,
          { backgroundColor: colors.subCard, shadowColor: colors.shadow },
        ]}
      >
        <PremiumButton
          variant="silver"
          onPress={() => setIsSearchModalVisible(true)}
          style={styles.compactSearchBtn}
          gradientStyle={{
            flexDirection: "row",
            justifyContent: "flex-start",
            paddingHorizontal: 15,
            paddingVertical: 0,
            height: "100%",
          }}
        >
          <Ionicons
            name="search"
            size={18}
            style={{ marginRight: 8, opacity: 0.6 }}
          />
          <Text style={{ fontSize: 14, fontWeight: "500" }}>
            {t("home.search_btn", "Kokteyl ara...")}
          </Text>
        </PremiumButton>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCocktailId}
            onValueChange={(itemValue) => setSelectedCocktailId(itemValue)}
            style={styles.pickerStyle}
            itemStyle={[styles.pickerItemStyle, { color: colors.text }]}
          >
            <Picker.Item
              label={t("home.pick_cocktail") + "..."}
              value={null}
              color={colors.text}
            />
            {sortedCocktails.map((c) => (
              <Picker.Item
                key={c.cocktail_id}
                label={
                  (POPULAR_COCKTAILS.includes(c.name.en) ? "⭐ " : "") +
                  getName(c)
                }
                value={c.cocktail_id}
                color={colors.text}
              />
            ))}
          </Picker>
        </View>
      </View>
      <CocktailSelectorModal
        visible={isSearchModalVisible}
        onClose={() => setIsSearchModalVisible(false)}
        onSelect={handleSelectFromSearch}
        multiSelect={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // --- IOS STİLLERİ ---
  displayArea: {
    flex: 1.5,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 20,
    width: "100%",
  },
  headerQuote: {
    fontSize: 16,
    fontStyle: "italic",
    marginBottom: 15,
    textAlign: "center",
  },
  imageWrapper: {
    width: 300,
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  cocktailImage: { width: 265, height: 265, borderRadius: 5 },
  frameOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 10,
  },
  placeholderContainer: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 110,
  },
  placeholderText: { textAlign: "center" },
  prepareButton: { marginTop: 5 },
  pickerArea: {
    width: "100%",
    flex: 1,
    justifyContent: "center",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 20,
    paddingTop: 15,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  compactSearchBtn: {
    width: "90%",
    height: 40,
    alignSelf: "center",
    borderRadius: 12,
  },
  pickerContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerStyle: { width: "100%", height: "90%" },
  pickerItemStyle: { fontSize: 21, fontWeight: "500" },

  // --- ANDROID DÜZENLEMELERİ ---
  androidHeaderContainer: {
    paddingTop: 15,
    paddingHorizontal: 20,
    alignItems: "center", // Her şeyi ortala
    width: "100%",
    marginBottom: 5,
  },

  // YENİ SEARCH PILL (Geniş ve Şık)
  searchPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "60%", // Ekranın %60'ı kadar genişlik (Yeterince belirgin)
    height: 36,
    borderRadius: 20, // Tam oval
    borderWidth: 1,
    marginTop: 10, // Quote ile arası
    elevation: 2, // Hafif gölge
  },

  // KARTLAR
  androidPremiumCard: {
    flex: 1,
    marginVertical: 10,
    borderRadius: 20,
    padding: 10,
    alignItems: "center",
    justifyContent: "flex-start",
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    height: height * 0.58, // Hafif kıstık ki sığsın
  },
  premiumImageWrapper: {
    width: "85%", // GÜNCELLENDİ: %100'den %85'e düştü (Dikey yer açıldı)
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10, // GÜNCELLENDİ: Biraz daha aşağı alındı
  },
  premiumImage: { width: "92%", height: "92%", borderRadius: 5 },
  premiumTextContainer: {
    marginTop: 10,
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 10,
  },
  premiumTitle: {
    fontSize: 22, // GÜNCELLENDİ: 26'dan 22'ye düştü
    fontWeight: "bold",
    fontFamily: "serif",
    textAlign: "center",
    letterSpacing: 0.5, // GÜNCELLENDİ: 1.2'den 0.5'e düştü (Sıkılaştı)
    marginBottom: 5,
  },
  badge: {
    marginTop: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: 8,
  },
  androidFooter: {
    paddingBottom: 25,
    paddingTop: 5,
    alignItems: "center",
    width: "100%",
  },
});

export default HomeScreen;
