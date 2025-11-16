import React, { useMemo, useRef } from "react";

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

  // YENİ EKLENDİ (Kategori Sekmeleri için)
  const [activeCategory, setActiveCategory] = useState("Tümü");

  const allIngredients = useSelector(selectAllIngredients);
  const ingredientsStatus = useSelector(getIngredientsStatus);
  const ingredientsError = useSelector(getIngredientsError);
  const searchStatus = useSelector(getSearchStatus);

  // === 1. VERİ HAZIRLAMA (Kategoriler ve Pazar) ===

  // 'allIngredients' (Redux) değiştiğinde, 'Kategori Sekmeleri'ni (Tabs) hesapla
  const categories = useMemo(() => {
    if (!allIngredients) return ["Tümü"];
    // Benzersiz (unique) kategori isimlerinden bir Set (küme) oluştur
    const uniqueCategories = new Set(
      allIngredients.map((item) => item.category_name)
    );
    // 'Tümü' sekmesini başa ekleyerek diziyi (array) döndür
    return ["Tümü", ...uniqueCategories];
  }, [allIngredients]);

  // 'pazarList' (Pazar Listesi) artık 3 şeye bağlı:
  // 1. 'tezgahItems' (Tezgahta olanı Pazar'da gösterme)
  // 2. 'activeCategory' (Sekme filtresi)
  // 3. 'searchText' (Arama filtresi)
  const pazarList = useMemo(() => {
    const tezgahIds = tezgahItems.map((item) => item.ingredient_id);

    return (
      allIngredients
        // 1. Tezgahta olmayanları filtrele
        .filter((item) => !tezgahIds.includes(item.ingredient_id))
        // 2. Aktif Kategoriye göre filtrele (Eğer 'Tümü' değilse)
        .filter((item) => {
          if (activeCategory === "Tümü") return true;
          return item.category_name === activeCategory;
        })
        // 3. Arama metnine göre filtrele (Eğer arama metni varsa)
        .filter((item) => {
          if (!searchText) return true;
          return item.name.toLowerCase().includes(searchText.toLowerCase());
        })
    );
  }, [searchText, allIngredients, tezgahItems, activeCategory]);

  // === 2. API ve NAVİGASYON (Değişiklik Yok) ===
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

  // YENİ GÜNCELLEME (Taşıma Hissi):
  // 'LayoutAnimation' kullanarak state değişimlerini (Pazar/Tezgah)
  // "yumuşak" (animate) hale getiriyoruz.
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
        <Text>Pazar kuruluyor...</Text>
      </SafeAreaView>
    );
  }
  if (ingredientsStatus === "failed") {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.errorText}>{ingredientsError}</Text>
      </SafeAreaView>
    );
  }

  // === 5. ARAYÜZ (UI) RENDER ETME (Tamamen Yenilendi) ===
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      // GÜNCELLEME: 'keyboardVerticalOffset' Navigasyon Başlığı (Header)
      // yüksekliğine ayarlandı (AppNavigator.js'ten dolayı)
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 60}
    >
      <SafeAreaView style={styles.container}>
        {/*
          GÜNCELLEME (EKSİK 9.C - Klavye Çözümü):
          Artık tüm ekranı (Tezgah, Pazar, Arama, Toggle, Buton)
          TEK BİR 'ScrollView' içine alıyoruz.
          'keyboardShouldPersistTaps', 'LoginScreen' (sağdaki)
          dosyasındaki "iki tıklama" sorununu burada da çözer.
        */}
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ flexGrow: 1 }} // İçeriğin esnemesini sağlar
          keyboardShouldPersistTaps="handled"
        >
          {/* --- BÖLÜM 1: TEZGAH (Seçilenler) --- */}
          {/* GÜNCELLEME: Artık kendi 'ScrollView'u yok, 'flex-wrap' (sarılan) bir 'View' */}
          <View style={styles.tezgahContainer}>
            <Text style={styles.sectionTitle}>
              Tezgah ({tezgahItems.length} Malzeme)
            </Text>
            <View style={styles.chipScrollContainer}>
              {tezgahItems.length === 0 ? (
                <Text style={styles.emptyText}>
                  {" "}
                  Pazar'dan malzeme seçin...
                </Text>
              ) : (
                tezgahItems.map((item) => (
                  <Pressable
                    key={item.ingredient_id}
                    style={[styles.itemChip, styles.tezgahChip]}
                    onPress={() => handleRemoveFromTezgah(item)}
                  >
                    <Text style={styles.chipText}>{item.name}</Text>
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

          {/* --- BÖLÜM 2: PAZAR (Tüm Malzemeler) --- */}
          {/* GÜNCELLEME: 'flex: 1' kaldırıldı, artık Ana ScrollView'un bir parçası */}
          <View style={styles.pazarContainer}>
            {/* Kategori Sekmeleri (Tabs) (Değişiklik Yok) */}
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
                      {category}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Pazar Izgarası (Grid) */}
            {/* GÜNCELLEME: Artık kendi 'ScrollView'u yok, 'flex-wrap' (sarılan) bir 'View' */}
            <View style={styles.chipScrollContainer}>
              {pazarList.length === 0 && searchText ? (
                <Text style={styles.emptyText}>
                  "{searchText}" bulunamadı...
                </Text>
              ) : (
                pazarList.map((item) => (
                  <Pressable
                    key={item.ingredient_id}
                    style={[styles.itemChip, styles.pazarChip]}
                    onPress={() => handleAddToTezgah(item)}
                  >
                    <Text style={styles.chipTextPazar}>{item.name}</Text>
                    <Ionicons
                      name="add"
                      size={16}
                      color="#f4511e"
                      style={{ marginLeft: 5 }}
                    />
                  </Pressable>
                ))
              )}
            </View>
          </View>

          {/* GÜNCELLEME: 'pazarContainer'dan 'Ana ScrollView'a taşındı */}
          <View style={styles.bottomControlsContainer}>
            {/* Arama Çubuğu */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color="gray"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Pazar'da ara..."
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>

            {/* Filtre Modu (Kayan Toggle) */}
            <CustomToggle mode={mode} onToggle={setMode} />

            {/* Tarif Bul Butonu (Footer) */}
            <View style={styles.footer}>
              <Pressable
                style={[
                  styles.prepareButton,
                  (tezgahItems.length === 0 || searchStatus === "loading") &&
                    styles.prepareButtonDisabled,
                ]}
                disabled={
                  tezgahItems.length === 0 || searchStatus === "loading"
                }
                onPress={handleFindRecipes}
              >
                {searchStatus === "loading" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.prepareButtonText}>
                    {tezgahItems.length} Malzeme ile Kokteylleri Göster
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

// === YENİ EKLENDİ: 'Kayan Switch' (Sliding Toggle) Bileşeni ===
const CustomToggle = ({ mode, onToggle }) => {
  // 'mode' ("strict" veya "flexible") değiştiğinde 'animatedValue'yu (kayan top)
  // 0'dan 1'e (veya 1'den 0'a) hareket ettirir.
  const animatedValue = useRef(
    new Animated.Value(mode === "strict" ? 0 : 1)
  ).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: mode === "strict" ? 0 : 1,
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
          mode === "strict" && styles.toggleTextActive,
        ]}
      >
        Sadece Yapabildiklerim
      </Text>
      <Pressable
        style={styles.toggleTrack}
        onPress={() => onToggle(mode === "strict" ? "flexible" : "strict")}
      >
        {/* Kayan Top (Knob) */}
        <Animated.View
          style={[styles.toggleKnob, { transform: [{ translateX }] }]}
        />
      </Pressable>
      <Text
        style={[
          styles.toggleText,
          mode === "flexible" && styles.toggleTextActive,
        ]}
      >
        Bunları İçerenler
      </Text>
    </View>
  );
};

// === Stil Dosyaları (Tamamen Yenilendi) ===
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
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
  },
  emptyText: {
    fontSize: 14,
    color: "gray",
    marginLeft: 15,
    alignSelf: "center",
    marginTop: 10,
  },
  // --- Tezgah Stilleri (GÜNCELLENDİ) ---
  tezgahContainer: {
    minHeight: 120, // 'minHeight' (minimum) yükseklik
    paddingTop: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  bottomControlsContainer: {
    // 'flex: 1' kaldırıldığı için, bu konteyner 'Ana ScrollView'un
    // en altına (doğal olarak) yerleşir.
    marginTop: "auto", // (Ana ScrollView'da 'flex: 1' yoksa bu gereksizdir, ancak flexGrow: 1 ile çalışır)
    backgroundColor: "#f9f9f9",
  },
  // --- Pazar Stilleri (GÜNCELLENDİ) ---
  pazarContainer: {
    backgroundColor: "#fff",
    maxHeight: 200,
  },
  // --- Arama Stilleri (GÜNCELLENDİ) ---
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingHorizontal: 15,
    borderTopWidth: 1, // (Pazar'dan ayırmak için)
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  // --- Ortak 'Chip' (Etiket) Stilleri ---
  chipScrollContainer: {
    flexDirection: "row", // YENİ: Yatay başla
    flexWrap: "wrap", // YENİ: Sığmazsa alta sar
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  itemChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    margin: 4, // Etiketler arası boşluk
  },
  tezgahChip: {
    backgroundColor: "#007AFF", // Mavi (Seçili)
  },
  chipText: {
    color: "white",
    fontWeight: "600",
  },
  pazarChip: {
    backgroundColor: "#f0f0f0", // Gri (Seçilmemiş)
  },
  chipTextPazar: {
    color: "#333", // Koyu renk
    fontWeight: "600",
  },
  // --- Kategori Sekmesi (Tab) Stilleri (YENİ) ---
  categoryScrollContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
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

  // --- Kayan Toggle Stilleri (YENİ) ---
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "gray",
    flex: 1, // Yazıların alanı itmesini sağlar
    textAlign: "center",
  },
  toggleTextActive: {
    color: "#f4511e", // Turuncu (Aktif)
  },
  toggleTrack: {
    width: 140, // (100 + 4 + 4) * 2
    height: 36,
    backgroundColor: "#f0f0f0",
    borderRadius: 18,
    justifyContent: "center",
    marginHorizontal: 10,
  },
  toggleKnob: {
    width: 30, // Topun genişliği
    height: 30,
    backgroundColor: "#f4511e",
    borderRadius: 15, // Tam daire
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  // --- Footer (Alt Buton) Stilleri (Aynı Kaldı) ---
  footer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    padding: 15,
  },
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
