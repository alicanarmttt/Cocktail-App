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
import PremiumButton from "../ui/PremiumButton.js";

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
  const { colors, fonts } = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  // --- STATE ---
  const [searchText, setSearchText] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeCategory, setActiveCategory] = useState("ALL");

  // --- REDUX DATA ---
  const allIngredients = useSelector(selectAllIngredients);
  const ingredientsStatus = useSelector(getIngredientsStatus);
  const ingredientsError = useSelector(getIngredientsError);
  const searchStatus = useSelector(getSearchStatus);

  // --- HELPER: Çeviri (YENİ HALİ) ---
  const getName = (item) => {
    // Backend artık { en: "Lime", tr: "Misket Limonu" } gönderiyor
    if (!item || !item.name) return "";
    return item.name[i18n.language] || item.name["en"] || "";
  };

  const getCategoryName = (item) => {
    // Backend artık { en: "Spirits", tr: "Ana İçkiler" } gönderiyor
    if (!item || !item.category_name) return "";
    return item.category_name[i18n.language] || item.category_name["en"] || "";
  };

  // --- 1. VERİ YÜKLEME ---
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

  // --- 2. KATEGORİLERİ HESAPLA ---
  const categories = useMemo(() => {
    if (!allIngredients) return ["ALL"];
    const uniqueCats = new Set(allIngredients.map(getCategoryName));
    return ["ALL", ...Array.from(uniqueCats)];
  }, [allIngredients, i18n.language]);

  // --- 3. LİSTEYİ FİLTRELE VE SIRALA ---
  const filteredList = useMemo(() => {
    if (!allIngredients) return [];

    // 1. Önce Filtrele
    const filtered = allIngredients.filter((item) => {
      const itemCat = getCategoryName(item);
      const catMatch = activeCategory === "ALL" || itemCat === activeCategory;
      const itemName = getName(item).toLowerCase();
      const searchMatch =
        !searchText || itemName.includes(searchText.toLowerCase());

      return catMatch && searchMatch;
    });

    // 2. Sonra SIRALA (Türkçe karakter duyarlı)
    return filtered.sort((a, b) => {
      // Önce Kategoriye Göre Sırala
      const catA = getCategoryName(a);
      const catB = getCategoryName(b);
      const catCompare = catA.localeCompare(catB, i18n.language);

      if (catCompare !== 0) return catCompare;

      // Kategoriler aynıysa, Malzeme İsmine Göre Sırala
      const nameA = getName(a);
      const nameB = getName(b);
      return nameA.localeCompare(nameB, i18n.language);
    });
  }, [allIngredients, activeCategory, searchText, i18n.language]);

  // --- 4. SEÇİM MANTIĞI (Toggle) ---
  const toggleSelection = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((itemId) => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleFindRecipes = async () => {
    if (searchStatus === "loading" || selectedIds.length === 0) return;
    Keyboard.dismiss();
    try {
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
        {/* HEADER KISMI */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
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
            style={[styles.searchContainer, { backgroundColor: colors.card }]}
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
          <View style={{ height: 45 }}>
            <FlatList
              data={categories}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item}
              contentContainerStyle={{
                paddingHorizontal: 20,
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
                        backgroundColor: isActive
                          ? colors.primary
                          : colors.card,
                      },
                    ]}
                    onPress={() => setActiveCategory(item)}
                  >
                    <Text
                      style={[
                        styles.catText,
                        { color: colors.textSecondary },
                        isActive && {
                          color: colors.buttonText,
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                justifyContent: "center",
                backgroundColor: "transparent",
              }}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
                style={{ opacity: 0.5 }}
              />
            </View>
          </View>
        </View>

        {/* LİSTE KISMI (Body) */}
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.ingredient_id.toString()}
          contentContainerStyle={{
            paddingBottom: 100,
            paddingTop: 15,
            paddingHorizontal: 20,
          }}
          initialNumToRender={15}
          removeClippedSubviews={true}
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
                // Ripple'ı daha belirgin yapıyoruz
                android_ripple={{ color: colors.primary + "30" }}
                style={({ pressed }) => [
                  styles.itemCard,
                  {
                    // DÜZELTME: Seçili olduğunda elevation'ı (gölgeyi) sıfırlıyoruz.
                    // Böylece renk çakışması olmuyor ve "düz" ama renkli bir görünüm elde ediyoruz.
                    elevation: isSelected ? 0 : 2,
                    shadowOpacity: isSelected ? 0 : 0.05,

                    // Seçiliyken %15 opaklıkta primary renk, değilse normal kart rengi
                    backgroundColor: isSelected
                      ? colors.primary + "20" // Biraz daha belirgin (%20)
                      : colors.card,

                    // Çerçeve: Seçiliyken primary, değilse şeffaf (layout zıplamasın diye)
                    borderColor: isSelected ? colors.primary : "transparent",
                    borderWidth: 1.5, // Biraz daha kalın çerçeve

                    // Android'de rengin taşmasını önlemek için kritik:
                    overflow: "hidden",

                    opacity: Platform.OS === "ios" && pressed ? 0.7 : 1,
                  },
                ]}
                onPress={() => toggleSelection(item.ingredient_id)}
              >
                <View style={styles.rowContent}>
                  <Text
                    style={[
                      styles.rowText,
                      { color: colors.text },
                      isSelected && {
                        color: colors.primary,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    {getName(item)}
                  </Text>

                  <Text
                    style={[styles.rowSubText, { color: colors.textSecondary }]}
                  >
                    {getCategoryName(item)}
                  </Text>
                </View>

                <Ionicons
                  name={isSelected ? "checkmark-circle" : "add-circle-outline"}
                  size={28}
                  color={isSelected ? colors.primary : colors.textSecondary}
                />
              </Pressable>
            );
          }}
        />

        {/* FOOTER (Yüzen Buton) */}
        {selectedIds.length > 0 && (
          <View style={styles.footerContainer}>
            <PremiumButton
              onPress={handleClearSelection}
              variant="silver"
              style={styles.resetButton}
              gradientStyle={{
                paddingHorizontal: 0,
                paddingVertical: 0,
                width: "100%",
                height: "100%",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons
                name="trash-outline"
                size={24}
                color={colors.notification}
              />
            </PremiumButton>

            <PremiumButton
              variant="gold"
              onPress={handleFindRecipes}
              disabled={searchStatus === "loading"}
              isLoading={searchStatus === "loading"}
              style={styles.actionButton}
            >
              <View style={styles.badge}>
                <Text style={[styles.badgeText, { color: colors.buttonText }]}>
                  {selectedIds.length}
                </Text>
              </View>
              <Text
                style={[styles.actionButtonText, { color: colors.buttonText }]}
              >
                {t("assistant.show_recipes_btn", "Kokteylleri Bul")}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={colors.buttonText}
                style={{ marginLeft: 5 }}
              />
            </PremiumButton>
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
  header: {
    paddingTop: 10,
    paddingBottom: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 1,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 25,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    height: "100%",
  },
  catTab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginRight: 10,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  catText: {
    fontSize: 14,
    fontWeight: "500",
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    // Varsayılan gölge
    elevation: 2,
    borderWidth: 1,
  },
  rowContent: {
    flex: 1,
  },
  rowText: {
    fontSize: 17,
    fontWeight: "500",
    marginBottom: 4,
  },
  rowSubText: {
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
  },
  footerContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  resetButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    paddingVertical: 0,
    paddingHorizontal: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  actionButton: {
    flex: 1,
    height: 60,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  badge: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AssistantScreen;
