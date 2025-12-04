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
              // Çizgiyi kaldırdım, sadece gölge kalsın
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
              { backgroundColor: colors.card }, // Daha belirgin bir input alanı için card rengi
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
            {/* MİNİK DOKUNUŞ: Sağa kaydırma ipucu (Overlay İkon) */}
            <View
              pointerEvents="none" // Tıklamayı engelleme, arkadaki listeye geçsin
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
                style={{ opacity: 0.5 }} // Hafif silik, rahatsız etmesin
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
            paddingHorizontal: 20, // Kenarlardan boşluk bırakarak kart görünümü sağla
          }}
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
                  styles.itemCard,
                  {
                    backgroundColor: isSelected
                      ? colors.primary + "15" // Seçiliyse çok hafif bir renk tonu
                      : colors.card,
                    borderColor: isSelected ? colors.primary : "transparent",
                    borderWidth: 1, // Seçiliyse çerçeve ekle
                  },
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
                        fontWeight: "700",
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
                  name={isSelected ? "checkmark-circle" : "add-circle-outline"} // Checkbox yerine daha modern ikonlar
                  size={28}
                  color={isSelected ? colors.primary : colors.textSecondary}
                />
              </Pressable>
            );
          }}
        />

        {/* FOOTER (Yüzen Buton) - Sadece seçim varsa görünür */}
        {selectedIds.length > 0 && (
          <View style={styles.footerContainer}>
            {/* YENİ SİLVER SIFIRLAMA BUTTON */}
            <PremiumButton
              onPress={handleClearSelection}
              variant="silver"
              style={styles.resetButton}
              gradientStyle={{
                paddingHorizontal: 0,
                paddingVertical: 0,
                width: "100%", // Gradyan kutuyu tam doldursun
                height: "100%", // Gradyan kutuyu tam doldursun
                justifyContent: "center", // İkonu tam ortala
                alignItems: "center",
              }}
            >
              <Ionicons
                name="trash-outline"
                size={24}
                color={colors.notification}
              />
            </PremiumButton>

            {/* YENİ GÜÇLÜ GOLD BUTTON */}
            <PremiumButton
              variant="gold"
              onPress={handleFindRecipes}
              disabled={searchStatus === "loading"}
              isLoading={searchStatus === "loading"}
              style={styles.actionButton}
            >
              {/* 1. Badge (Sayı) */}
              <View style={styles.badge}>
                <Text style={[styles.badgeText, { color: colors.buttonText }]}>
                  {selectedIds.length}
                </Text>
              </View>
              {/* 2. Ana Metin */}
              <Text
                style={[styles.actionButtonText, { color: colors.buttonText }]}
              >
                {t("assistant.show_recipes_btn", "Kokteylleri Bul")}
              </Text>
              {/* 3. İkon */}
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
  // --- HEADER ---
  header: {
    paddingTop: 10,
    paddingBottom: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5, // Android gölgesi
    zIndex: 1,
    borderBottomLeftRadius: 24, // Header'ın altını hafif yuvarlat
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
    borderRadius: 25, // Tam yuvarlak (pill shape)
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    height: "100%",
  },
  // --- KATEGORİ TABLARI ---
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
  // --- LİSTE ELEMANI (CARD TASARIM) ---
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10, // Kartlar arası boşluk
    borderRadius: 16, // Kart köşe yumuşaklığı
    // Hafif gölge ekleyerek derinlik katalım
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
  // --- FOOTER BUTON ---
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
  // Sıfırlama Butonu Stili
  resetButton: {
    width: 60, // Biraz büyüttüm
    height: 60,
    borderRadius: 30, // Tam daire
    paddingVertical: 0,
    paddingHorizontal: 0,
    // Butona gölge ekleyelim ki listeden ayrılsın
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  actionButton: {
    flex: 1,
    height: 60, // Biraz büyüttüm
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
