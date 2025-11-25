import React, { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  LayoutAnimation,
  UIManager,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import {
  fetchIngredients,
  selectAllIngredients,
  getIngredientsStatus,
  getIngredientsError,
} from "../features/ingredientSlice.js";

import {
  findRecipes,
  getSearchStatus,
  clearSearchResults,
} from "../features/barmenSlice.js";

// (Android'de LayoutAnimation'ı etkinleştir)
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * @desc    Barmen'in Asistanı Ekranı. (Pazar/Tezgah Mantığı)
 * Kullanıcının malzemeleri arayıp "Tezgah"a eklemesini sağlar.
 */
const AssistantScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [searchText, setSearchText] = useState("");
  const [tezgahItems, setTezgahItems] = useState([]);
  const [mode, setMode] = useState("strict");

  // Kategori Sekmeleri için (Başlangıçta "Tümü"nün çevirisi değil, anahtarını kullanıyoruz)
  const TAB_ALL_KEY = "ALL";
  const [activeCategory, setActiveCategory] = useState(TAB_ALL_KEY);

  const allIngredients = useSelector(selectAllIngredients);
  const ingredientsStatus = useSelector(getIngredientsStatus);
  const ingredientsError = useSelector(getIngredientsError);
  const searchStatus = useSelector(getSearchStatus);

  // 1. Çeviri Hook'u
  const { t, i18n } = useTranslation();
  // 2. Helper: Dile Göre Metin Seçici
  // Veritabanından gelen nesnelerdeki _tr veya _en alanını seçer.
  const getLocaleText = (item, fieldPrefix) => {
    if (!item) return "";
    const lang = i18n.language === "tr" ? "tr" : "en";
    return item[`${fieldPrefix}_${lang}`] || item[`${fieldPrefix}_en`]; // Fallback to en
  };

  // === 1. VERİ HAZIRLAMA (Kategoriler ve Pazar) ===

  // 'allIngredients' (Redux) değiştiğinde, 'Kategori Sekmeleri'ni (Tabs) hesapla
  const categories = useMemo(() => {
    if (!allIngredients) return [TAB_ALL_KEY];
    // Hangi dilin kategori ismini kullanacağız?
    const catNameField =
      i18n.language === "tr" ? "category_name_tr" : "category_name_en";

    // Benzersiz (unique) kategori isimlerinden bir Set (küme) oluştur
    const uniqueCategories = new Set(
      allIngredients.map((item) => item[catNameField])
    );
    // 'Tümü' sekmesini başa ekleyerek diziyi (array) döndür
    return [TAB_ALL_KEY, ...uniqueCategories];
  }, [allIngredients, i18n.language]); // Dil değişince yeniden hesapla

  // 'pazarList' (Pazar Listesi) artık 3 şeye bağlı:
  // 1. 'tezgahItems' (Tezgahta olanı Pazar'da gösterme)
  // 2. 'activeCategory' (Sekme filtresi)
  // 3. 'searchText' (Arama filtresi)
  const pazarList = useMemo(() => {
    const tezgahIds = tezgahItems.map((item) => item.ingredient_id);
    const catNameField =
      i18n.language === "tr" ? "category_name_tr" : "category_name_en";
    const nameField = i18n.language === "tr" ? "name_tr" : "name_en";

    return (
      allIngredients
        // 1. Tezgahta olmayanları filtrele
        .filter((item) => !tezgahIds.includes(item.ingredient_id))
        // 2. Aktif Kategoriye göre filtrele (Eğer 'Tümü' değilse)
        .filter((item) => {
          if (activeCategory === TAB_ALL_KEY) return true;
          return item[catNameField] === activeCategory;
        })
        // 3. Arama metnine göre filtrele (Eğer arama metni varsa)
        .filter((item) => {
          if (!searchText) return true;
          const itemName = item[nameField] || "";
          return itemName.toLowerCase().includes(searchText.toLowerCase());
        })
    );
  }, [searchText, allIngredients, tezgahItems, activeCategory, i18n.language]);

  // === 2. API ve NAVİGASYON  ===

  useEffect(() => {
    if (ingredientsStatus === "idle") {
      dispatch(fetchIngredients());
    }
  }, [ingredientsStatus, dispatch]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      dispatch(clearSearchResults());
    });
    return unsubscribe;
  }, [navigation, dispatch]);

  const handleFindRecipes = async () => {
    if (searchStatus === "loading" || tezgahItems.length === 0) return;
    const inventoryIds = tezgahItems.map((item) => item.ingredient_id);
    try {
      await dispatch(findRecipes({ inventoryIds, mode })).unwrap();
      navigation.navigate("AssistantResult");
    } catch (error) {
      console.error("Tarifler bulunamadı:", error);
    }
  };

  // === 3. ETKİLEŞİM (Interaction) FONKSİYONLARI ===

  // 'LayoutAnimation' kullanarak state değişimlerini (Pazar/Tezgah)

  const handleAddToTezgah = (ingredient) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTezgahItems([...tezgahItems, ingredient]);
    setSearchText("");
  };

  const handleRemoveFromTezgah = (ingredient) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTezgahItems(
      tezgahItems.filter(
        (item) => item.ingredient_id !== ingredient.ingredient_id
      )
    );
  };

  // === 4. YÜKLENME (Loading) ve HATA (Error) EKRANLARI (Değişiklik Yok) ===
  if (ingredientsStatus === "loading") {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#f4511e" />
        <Text>{t("assistant.loading_market")}</Text>
      </SafeAreaView>
    );
  }
  if (ingredientsStatus === "failed") {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.errorText}>
          {ingredientsError || t("general.error")}
        </Text>
      </SafeAreaView>
    );
  }

  // === 5. ARAYÜZ (UI) RENDER ETME ===

  return (
    // 'SafeAreaView' (Çentik alanı) en dışta olmalı
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer} // 'flex: 1'
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        // (Başlık (Header) yüksekliğini 'AppNavigator.js'ten (sağdaki) biliyoruz)
        keyboardVerticalOffset={Platform.OS === "ios" ? 120 : 90}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContainer} // (paddingHorizontal içerir)
          keyboardShouldPersistTaps="handled" // "İki tıklama" sorununu çözer
        >
          {/* BÖLÜM 1: TEZGAH (Klavye'den ETKİLENMEZ) */}
          <View style={styles.tezgahContainer}>
            <Text style={styles.sectionTitle}>
              {t("assistant.bench_title")} ({tezgahItems.length})
            </Text>
            <View // (Tezgah'ın 'ScrollView'u kaldırıldı, 'flex-wrap' (sarılan) 'View' oldu)
              style={styles.chipScrollContainer}
            >
              {tezgahItems.length === 0 ? (
                <Text style={styles.emptyText}>
                  {t("assistant.bench_empty")}
                </Text>
              ) : (
                tezgahItems.map((item) => (
                  <Pressable
                    key={item.ingredient_id}
                    style={[styles.itemChip, styles.tezgahChip]}
                    onPress={() => handleRemoveFromTezgah(item)}
                  >
                    {/* Dinamik İsim (TR/EN) */}
                    <Text style={styles.chipText}>
                      {getLocaleText(item, "name")}
                    </Text>
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color="#fff"
                      style={{ marginLeft: 5 }}
                    />
                  </Pressable>
                ))
              )}
            </View>
          </View>

          {/* BÖLÜM 2: PAZAR (Artık KAV içinde) */}
          <View style={styles.pazarContainer}>
            <Text style={styles.sectionTitle}>
              {t("assistant.market_title")}
            </Text>
            {/* Kategori Sekmeleri (Tabs) */}
            <View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScrollContainer}
              >
                {categories.map((category) => (
                  <Pressable
                    key={category}
                    style={[
                      styles.categoryChip,
                      activeCategory === category && styles.categoryChipActive,
                    ]}
                    onPress={() => setActiveCategory(category)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        activeCategory === category &&
                          styles.categoryChipTextActive,
                      ]}
                    >
                      {/* Eğer kategori 'ALL' ise çevirisini göster, değilse kendisini */}
                      {category === TAB_ALL_KEY
                        ? t("assistant.tab_all")
                        : category}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Pazar Izgarası (Grid) */}
            <ScrollView
              contentContainerStyle={styles.chipScrollContainer}
              keyboardShouldPersistTaps="handled" // "İki tıklama" sorununu çözer
            >
              {pazarList.length === 0 && searchText ? (
                <Text style={styles.emptyText}>
                  "{searchText}" {t("assistant.not_found")}
                </Text>
              ) : (
                pazarList.map((item) => (
                  <Pressable
                    key={item.ingredient_id}
                    style={[styles.itemChip, styles.pazarChip]}
                    onPress={() => handleAddToTezgah(item)}
                  >
                    {/* Dinamik İsim */}
                    <Text style={styles.chipTextPazar}>
                      {getLocaleText(item, "name")}
                    </Text>
                    <Ionicons
                      name="add"
                      size={16}
                      color="#f4511e"
                      style={{ marginLeft: 5 }}
                    />
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>

          {/* BÖLÜM 3: ARAMA ÇUBUĞU (Artık KAV içinde) */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="gray"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={t("assistant.search_placeholder")}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {/*BÖLÜM 4 ve 5 (Toggle ve Butonn) */}
          {/* BÖLÜM 4: FİLTRE MODU (Toggle) (Artık KAV içinde) */}
          <CustomToggle
            mode={mode}
            onToggle={setMode}
            textLeft={t("assistant.toggle_flexible")}
            textRight={t("assistant.toggle_strict")}
          />

          {/* BÖLÜM 5: BUTON (Footer) (Artık KAV içinde) */}
          <View style={styles.footer}>
            <Pressable
              style={[
                styles.prepareButton,
                (tezgahItems.length === 0 || searchStatus === "loading") &&
                  styles.prepareButtonDisabled,
              ]}
              disabled={tezgahItems.length === 0 || searchStatus === "loading"}
              onPress={handleFindRecipes}
            >
              {searchStatus === "loading" ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.prepareButtonText}>
                  {tezgahItems.length} {t("assistant.show_recipes_btn")}
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// === YENİ EKLENDİ: 'Kayan Switch' (Sliding Toggle) Bileşeni ===
const CustomToggle = ({ mode, onToggle, textLeft, textRight }) => {
  // 'mode' ("strict" veya "flexible") değiştiğinde 'animatedValue'yu (kayan top)
  // 0'dan 1'e (veya 1'den 0'a) hareket ettirir.
  const animatedValue = useRef(
    new Animated.Value(mode === "flexible" ? 0 : 1)
  ).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: mode === "flexible" ? 0 : 1,
      useNativeDriver: true, // Performans için
    }).start();
  }, [mode, animatedValue]);

  // 'animatedValue' (0-1 arası) değiştikçe, 'translateX' (yatay konum)
  // 0'dan 100'e (veya tam tersi) değişir. (104 = Genişlik - margin)
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 104], // 4 (sol boşluk) -> 104 (sağ boşluk)
  });

  return (
    <View style={styles.toggleContainer}>
      <Text
        style={[
          styles.toggleText,
          mode === "flexible" && styles.toggleTextActive,
        ]}
      >
        {textLeft}
      </Text>
      <Pressable
        style={styles.toggleTrack}
        onPress={() => onToggle(mode === "flexible" ? "strict" : "flexible")}
      >
        {/* Kayan Top (Knob) */}
        <Animated.View
          style={[styles.toggleKnob, { transform: [{ translateX }] }]}
        />
      </Pressable>
      <Text
        style={[
          styles.toggleText,
          mode === "strict" && styles.toggleTextActive,
        ]}
      >
        {textRight}
      </Text>
    </View>
  );
};

// === Stil Dosyaları (EKSİK 10 - GÜNCELLENDİ) ===
// (Senin vizyonuna (masa/kart) uygun olarak stiller güncellendi)
const styles = StyleSheet.create({
  // Ana konteyner (Gri Arka Plan)
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5", // Daha yumuşak bir gri arka plan
  },
  // Container ile aynı
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 10, // YAN BOŞLUKLAR (Senin istediğin)
    flexGrow: 1, // GÜNCELLEME: İçerik kısaysa ekranı doldur, uzunsa kaydır
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 15,
    marginBottom: 10,
    marginTop: 5, // Kartın üstünden biraz boşluk
    alignSelf: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "gray",
    padding: 15, // Boş metin için dolgu
    alignSelf: "center",
  },
  // --- Tezgah Stilleri (GÜNCELLENDİ) ---
  tezgahContainer: {
    maxHeight: 300,
    minHeight: 150,
    paddingTop: 10,
    backgroundColor: "#fff", // Beyaz "Kart"
    borderRadius: 12, // YUVARLATILMIŞ KÖŞE (Senin istediğin)
    marginBottom: 10, // Kartlar arası boşluk
    marginTop: 10,
    // Gölge (iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // Gölge (Android)
    elevation: 3,
  },

  // --- Pazar Stilleri (GÜNCELLENDİ) ---
  pazarContainer: {
    backgroundColor: "#fff", // Beyaz "Kart"
    borderRadius: 12, // YUVARLATILMIŞ KÖŞE
    overflow: "hidden", // (Sekmelerin ve ScrollView'un köşelerini keser)
    // Gölge (iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // Gölge (Android)
    elevation: 3,
    maxHeight: 250,
    minHeight: 150,
  },
  // --- Arama Stilleri---
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff", // Beyaz "Kart"
    borderRadius: 12, // YUVARLATILMIŞ KÖŞE
    paddingHorizontal: 15,
    marginTop: 10, // (Pazar ile Arama arasına boşluk)
    // Gölge (iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // Gölge (Android)
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  // --- Ortak 'Chip' (Etiket) Stilleri (Değişiklik Yok) ---
  chipScrollContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  itemChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    margin: 4,
  },
  tezgahChip: {
    backgroundColor: "#007AFF",
  },
  chipText: {
    color: "white",
    fontWeight: "600",
  },
  pazarChip: {
    backgroundColor: "#f0f0f0",
  },
  chipTextPazar: {
    color: "#333",
    fontWeight: "600",
  },
  // --- Kategori Sekmesi (Tab) Stilleri (Değişiklik Yok) ---
  categoryScrollContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  // ... (Mevcut 'categoryChip' ve 'categoryChipActive' stilleri) ...
  categoryChip: {
    backgroundColor: "#e0e0e0",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
    marginHorizontal: 4,
  },
  categoryChipActive: {
    backgroundColor: "#f4511e", // Turuncu (Aktif)
  },
  categoryChipText: {
    color: "#333",
    fontWeight: "500",
  },
  categoryChipTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },

  // --- Kayan Toggle Stilleri  ---
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#fff", // Beyaz "Kart"
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12, // YUVARLATILMIŞ KÖŞE
    marginTop: 10, // (Arama ile Toggle arasına boşluk)
    // Gölge (iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // Gölge (Android)
    elevation: 3,
  },
  // ... (Mevcut 'toggleText' ve 'toggleTextActive' stilleri) ...
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "gray",
    flex: 1,
    textAlign: "center",
  },
  toggleTextActive: {
    color: "#f4511e", // Turuncu (Aktif)
  },
  toggleTrack: {
    width: 140,
    height: 36,
    backgroundColor: "#f0f0f0",
    borderRadius: 18,
    justifyContent: "center",
    marginHorizontal: 10,
  },
  toggleKnob: {
    width: 30,
    height: 30,
    backgroundColor: "#f4511e",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  // --- Footer (Alt Buton) Stilleri ---
  footer: {
    backgroundColor: "#fff", // Beyaz "Kart"
    borderRadius: 12, // YUVARLATILMIŞ KÖŞE
    padding: 15,
    marginTop: 10, // (Toggle ile Buton arasına boşluk)
    marginBottom: 5, // (Ekranın en altından boşluk)
    // Gölge (iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // Gölge (Android)
    elevation: 3,
  },
  // ... (Mevcut 'prepareButton', 'prepareButtonDisabled', 'prepareButtonText', 'errorText' stilleri) ...
  prepareButton: {
    backgroundColor: "#f4511e",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  prepareButtonDisabled: {
    backgroundColor: "#ccc",
  },
  prepareButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    padding: 20,
    textAlign: "center",
  },
});

export default AssistantScreen;
