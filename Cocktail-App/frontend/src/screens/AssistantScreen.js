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
import { useNavigation, useTheme } from "@react-navigation/native";

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
  const { colors } = useTheme();
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

  // --- SEÇİMLERİ SIFIRLA ---
  const handleClearSelection = () => {
    setSelectedIds([]); // Diziyi boşaltır, tikleri kaldırır.
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
      <SafeAreaView
        style={[
          styles.centeredContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.textSecondary }}>
          {t("assistant.loading_market", "Malzemeler yükleniyor...")}
        </Text>
      </SafeAreaView>
    );
  }

  if (ingredientsStatus === "failed") {
    return (
      <SafeAreaView
        style={[
          styles.centeredContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={{ color: colors.notification }}>{ingredientsError}</Text>
      </SafeAreaView>
    );
  }

  // --- RENDER: ANA EKRAN ---
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* HEADER KISMI (Sabit) */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.primary }]}>
            {t("assistant.title", "Barmen'in Asistanı")}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t(
              "assistant.subtitle",
              "Elinde ne varsa seç, gerisini bana bırak."
            )}
          </Text>

          {/* Arama Çubuğu */}
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: colors.inputBg },
            ]}
          >
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t(
                "assistant.search_placeholder",
                "Malzeme ara (örn: Cin, Limon)"
              )}
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor={colors.textSecondary}
            />
            {searchText.length > 0 && (
              <Pressable onPress={() => setSearchText("")}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textSecondary}
                />
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
                    style={[
                      styles.catTab,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                      isActive && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => setActiveCategory(item)}
                  >
                    <Text
                      style={[
                        styles.catText,
                        { color: colors.textSecondary },
                        isActive && { color: colors.buttonText },
                      ]}
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
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t("assistant.not_found", "Malzeme bulunamadı.")}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isSelected = selectedIds.includes(item.ingredient_id);
            return (
              <Pressable
                style={[
                  styles.row,
                  { borderBottomColor: colors.border },
                  isSelected && { backgroundColor: colors.subCard },
                ]}
                onPress={() => toggleSelection(item.ingredient_id)}
              >
                <View style={styles.rowContent}>
                  {/* İsim */}
                  <Text
                    style={[
                      styles.rowText,
                      { color: colors.text },
                      isSelected && {
                        color: colors.primary,
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {getName(item)}
                  </Text>

                  {/* Kategori (Küçük gri yazı) */}
                  <Text
                    style={[styles.rowSubText, { color: colors.textSecondary }]}
                  >
                    {getCategoryName(item)}
                  </Text>
                </View>

                {/* Seçim İkonu */}
                <Ionicons
                  name={isSelected ? "checkbox" : "square-outline"}
                  size={24}
                  color={isSelected ? colors.primary : colors.border}
                />
              </Pressable>
            );
          }}
        />

        {/* FOOTER (Yüzen Buton) - Sadece seçim varsa görünür */}
        {selectedIds.length > 0 && (
          <View style={styles.footerContainer}>
            {/* YENİ: SIFIRLAMA BUTONU (Küçük Kutu) */}
            <Pressable
              style={[
                styles.resetButton,
                {
                  backgroundColor: colors.card,
                  shadowColor: colors.shadow,
                  borderColor: colors.border,
                },
              ]}
              onPress={handleClearSelection}
            >
              <Ionicons
                name="trash-outline"
                size={24}
                color={colors.notification}
              />
            </Pressable>
            {/* MEVCUT: AKSİYON BUTONU (Geniş) */}
            <Pressable
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.buttonBg,
                  shadowColor: colors.shadow,
                },
              ]}
              onPress={handleFindRecipes}
              disabled={searchStatus === "loading"}
            >
              {searchStatus === "loading" ? (
                <ActivityIndicator color={colors.buttonText} />
              ) : (
                <>
                  <View style={styles.badge}>
                    <Text
                      style={[styles.badgeText, { color: colors.buttonText }]}
                    >
                      {selectedIds.length}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.actionButtonText,
                      { color: colors.buttonText },
                    ]}
                  >
                    {t("assistant.show_recipes_btn", "Kokteylleri Bul")}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={colors.buttonText}
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
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // --- HEADER ---
  header: {
    paddingTop: 10,
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 1, // Listenin üstünde kalsın
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 14,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
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
    height: "100%",
  },
  // --- KATEGORİ TABLARI ---
  catTab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
  },
  catText: {
    fontSize: 14,
    fontWeight: "500",
  },
  // --- LİSTE SATIRI ---
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  rowContent: {
    flex: 1,
  },
  rowText: {
    fontSize: 17,
  },
  rowSubText: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
  },
  // --- FOOTER BUTON ---
  footerContainer: {
    position: "absolute",
    bottom: 20, // SafeAreaView içinde olduğu için bottom inset'e gerek kalmayabilir ama garanti olsun
    left: 20,
    right: 20,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  //Sıfırlama Butonu Stili
  resetButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
  },
  actionButton: {
    flex: 1, // Kalan tüm alanı kaplasın
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
  },
  actionButtonText: {
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
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default AssistantScreen;
