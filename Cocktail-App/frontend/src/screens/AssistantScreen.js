import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// Redux Slice'ları
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

/**
 * @desc    Barmen'in Asistanı (YENİ SADE TASARIM)
 * Karmaşık kutular yerine temiz bir liste ve seçim mantığı.
 */
const AssistantScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  // --- STATE ---
  const [searchText, setSearchText] = useState("");
  const [selectedIds, setSelectedIds] = useState([]); // Sadece ID'leri tutmak yeterli ve performanslıdır
  const [activeCategory, setActiveCategory] = useState("ALL");

  // --- REDUX DATA ---
  const allIngredients = useSelector(selectAllIngredients);
  const ingredientsStatus = useSelector(getIngredientsStatus);
  const ingredientsError = useSelector(getIngredientsError);
  const searchStatus = useSelector(getSearchStatus);

  // --- HELPER: Çeviri ---
  const getName = (item) =>
    i18n.language === "tr" ? item.name_tr : item.name_en;
  const getCategoryName = (item) =>
    i18n.language === "tr" ? item.category_name_tr : item.category_name_en;

  // --- 1. VERİ YÜKLEME ---
  useEffect(() => {
    if (ingredientsStatus === "idle") {
      dispatch(fetchIngredients());
    }
  }, [ingredientsStatus, dispatch]);

  // Sayfaya her gelindiğinde önceki sonuçları temizle ama SEÇİMLERİ KORU (Kullanıcı geri dönerse seçtikleri kalsın)
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      dispatch(clearSearchResults());
    });
    return unsubscribe;
  }, [navigation, dispatch]);

  // --- 2. KATEGORİLERİ HESAPLA ---
  const categories = useMemo(() => {
    if (!allIngredients) return ["ALL"];
    // Benzersiz kategorileri bul
    const uniqueCats = new Set(allIngredients.map(getCategoryName));
    return ["ALL", ...Array.from(uniqueCats)];
  }, [allIngredients, i18n.language]);

  // --- 3. LİSTEYİ FİLTRELE ---
  const filteredList = useMemo(() => {
    if (!allIngredients) return [];

    return allIngredients.filter((item) => {
      // 1. Kategori Filtresi
      const itemCat = getCategoryName(item);
      const catMatch = activeCategory === "ALL" || itemCat === activeCategory;

      // 2. Arama Filtresi
      const itemName = getName(item).toLowerCase();
      const searchMatch =
        !searchText || itemName.includes(searchText.toLowerCase());

      return catMatch && searchMatch;
    });
  }, [allIngredients, activeCategory, searchText, i18n.language]);

  // --- 4. SEÇİM MANTIĞI (Toggle) ---
  const toggleSelection = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((itemId) => itemId !== id); // Varsa çıkar
      } else {
        return [...prev, id]; // Yoksa ekle
      }
    });
  };

  // --- 5. TARİF BULMA (Action) ---
  const handleFindRecipes = async () => {
    if (searchStatus === "loading" || selectedIds.length === 0) return;

    // Klavye açıksa kapat
    Keyboard.dismiss();

    try {
      // Mod: Artık kullanıcıya sormuyoruz, her zaman 'flexible' gönderiyoruz.
      // Sonuç ekranında biz gruplayacağız.
      await dispatch(
        findRecipes({ inventoryIds: selectedIds, mode: "flexible" })
      ).unwrap();

      navigation.navigate("AssistantResult");
    } catch (error) {
      console.error("Tarif arama hatası:", error);
    }
  };

  // --- RENDER: Yükleniyor / Hata ---
  if (ingredientsStatus === "loading") {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#f4511e" />
        <Text style={{ marginTop: 10, color: "gray" }}>
          {t("assistant.loading_market", "Malzemeler yükleniyor...")}
        </Text>
      </SafeAreaView>
    );
  }

  if (ingredientsStatus === "failed") {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={{ color: "red" }}>{ingredientsError}</Text>
      </SafeAreaView>
    );
  }

  // --- RENDER: ANA EKRAN ---
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* HEADER KISMI (Sabit) */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {t("assistant.title", "Barmen'in Asistanı")}
          </Text>
          <Text style={styles.subtitle}>
            {t(
              "assistant.subtitle",
              "Elinde ne varsa seç, gerisini bana bırak."
            )}
          </Text>

          {/* Arama Çubuğu */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder={t(
                "assistant.search_placeholder",
                "Malzeme ara (örn: Cin, Limon)"
              )}
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#aaa"
            />
            {searchText.length > 0 && (
              <Pressable onPress={() => setSearchText("")}>
                <Ionicons name="close-circle" size={18} color="#999" />
              </Pressable>
            )}
          </View>

          {/* Kategoriler */}
          <View style={{ height: 50 }}>
            <FlatList
              data={categories}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item}
              contentContainerStyle={{
                paddingHorizontal: 16,
                alignItems: "center",
              }}
              renderItem={({ item }) => {
                const isActive = activeCategory === item;
                const label =
                  item === "ALL" ? t("assistant.tab_all", "Tümü") : item;
                return (
                  <Pressable
                    style={[styles.catTab, isActive && styles.catTabActive]}
                    onPress={() => setActiveCategory(item)}
                  >
                    <Text
                      style={[styles.catText, isActive && styles.catTextActive]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </View>

        {/* LİSTE KISMI (Body) */}
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.ingredient_id.toString()}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }} // Footer için boşluk
          initialNumToRender={15} // Performans için
          removeClippedSubviews={true} // Performans için
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {t("assistant.not_found", "Malzeme bulunamadı.")}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isSelected = selectedIds.includes(item.ingredient_id);
            return (
              <Pressable
                style={[styles.row, isSelected && styles.rowSelected]}
                onPress={() => toggleSelection(item.ingredient_id)}
              >
                <View style={styles.rowContent}>
                  {/* İsim */}
                  <Text
                    style={[
                      styles.rowText,
                      isSelected && styles.rowTextSelected,
                    ]}
                  >
                    {getName(item)}
                  </Text>

                  {/* Kategori (Küçük gri yazı) */}
                  <Text style={styles.rowSubText}>{getCategoryName(item)}</Text>
                </View>

                {/* Seçim İkonu */}
                <Ionicons
                  name={isSelected ? "checkbox" : "square-outline"}
                  size={24}
                  color={isSelected ? "#f4511e" : "#ccc"}
                />
              </Pressable>
            );
          }}
        />

        {/* FOOTER (Yüzen Buton) - Sadece seçim varsa görünür */}
        {selectedIds.length > 0 && (
          <View style={styles.footerContainer}>
            <Pressable
              style={styles.actionButton}
              onPress={handleFindRecipes}
              disabled={searchStatus === "loading"}
            >
              {searchStatus === "loading" ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{selectedIds.length}</Text>
                  </View>
                  <Text style={styles.actionButtonText}>
                    {t("assistant.show_recipes_btn", "Kokteylleri Bul")}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="#fff"
                    style={{ marginLeft: 5 }}
                  />
                </>
              )}
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // --- HEADER ---
  header: {
    backgroundColor: "#fff",
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 1, // Listenin üstünde kalsın
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 14,
    color: "gray",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    marginHorizontal: 20,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 46,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
    height: "100%",
  },
  // --- KATEGORİ TABLARI ---
  catTab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    justifyContent: "center",
  },
  catTabActive: {
    backgroundColor: "#333", // Aktifken siyah (veya turuncu)
    borderColor: "#333",
  },
  catText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  catTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  // --- LİSTE SATIRI ---
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f9f9f9",
  },
  rowSelected: {
    backgroundColor: "#fffaf5", // Seçilince çok hafif turuncu
  },
  rowContent: {
    flex: 1,
  },
  rowText: {
    fontSize: 17,
    color: "#333",
  },
  rowTextSelected: {
    fontWeight: "600",
    color: "#f4511e",
  },
  rowSubText: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    color: "gray",
    fontSize: 16,
  },
  // --- FOOTER BUTON ---
  footerContainer: {
    position: "absolute",
    bottom: 20, // SafeAreaView içinde olduğu için bottom inset'e gerek kalmayabilir ama garanti olsun
    left: 20,
    right: 20,
  },
  actionButton: {
    backgroundColor: "#f4511e",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#f4511e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default AssistantScreen;
