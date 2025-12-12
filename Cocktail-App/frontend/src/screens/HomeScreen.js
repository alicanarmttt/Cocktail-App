// ... (Importlar ve mantık aynı kalıyor) ...
// GÜNCELLEME: 'useState' (seçili kokteyli tutmak için) eklendi
import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Image,
  Pressable,
  Modal,
  FlatList,
  TouchableOpacity,
  Platform, // GÜNCELLEME: Platform kontrolü için eklendi
} from "react-native";
// GÜNCELLEME: 'SafeAreaView' (çentik/kenar boşlukları için)
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
// GÜNCELLEME: Yeni kurduğumuz 'Picker' (Rulet) kütüphanesini import ediyoruz
import { Picker } from "@react-native-picker/picker";
import { useTheme } from "@react-navigation/native";
import PremiumButton from "../ui/PremiumButton.js";
import CocktailSelectorModal from "../components/CocktailSelectorModal.js";
import {
  fetchCocktails,
  selectAllCocktails,
  getCocktailsListError,
  getCocktailsListStatus,
  // GÜNCELLEME: Redux Store'dan ID'ye göre kokteyl bulmak için
  // 'selectCocktailById' selector'ünü (bulucu) slice'ımızdan import ediyoruz.
  selectCocktailById,
} from "../features/cocktails/cocktailSlice.js";
import VINTAGE_FRAME_URL from "../../assets/gold_frame.png";

// ... (Component mantığı ve state'ler aynen korunuyor) ...
/**
 * @desc    Uygulamanın ana ekranı. Üstte bir gösterge, altta bir "Rulet" (Picker) gösterir.
 * @param {object} navigation - React Navigation tarafından sağlanır.
 */
const HomeScreen = ({ navigation }) => {
  const { colors, fonts } = useTheme();

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

  // 1. Dil Kancasını (Hook) Başlat
  const { t, i18n } = useTranslation();
  // Helper: Dinamik İsim Seçici
  const getName = (item) => {
    if (!item || !item.name) return "";

    // 1. Öncelik: Seçili dil (örn: item.name['tr'])
    // 2. Öncelik: İngilizce (Fallback) (örn: item.name['en'])
    return item.name[i18n.language] || item.name["en"] || "";
  };

  // 1. ADIM: Tüm kokteylleri Redux'tan çek (4 kokteylimiz)
  const allCocktails = useSelector(selectAllCocktails);
  const status = useSelector(getCocktailsListStatus);
  const error = useSelector(getCocktailsListError);

  // 2. ADIM: Rulette 'o an' hangisinin seçili olduğunu tutmak için lokal 'state'
  // GÜNCELLEME: Başlangıç değeri 'null' (Boş) olarak ayarlandı.
  const [selectedCocktailId, setSelectedCocktailId] = useState(null);

  // Arama modalı için stateler
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);

  // YENİ: Android Özel Picker Modalı için State
  const [isAndroidPickerVisible, setIsAndroidPickerVisible] = useState(false);

  // 3. ADIM: API'den veriyi çek (Bu kod aynı kaldı)
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCocktails());
    }
  }, [status, dispatch]);

  // 4. ADIM: 'Gösterge' alanı için seçili kokteylin tüm verisini bul
  // GÜNCELLEME: 'useSelector'u, 'selectedCocktailId' değiştiğinde
  // Store'dan doğru kokteyli bulmak için kullanıyoruz.
  const selectedCocktail = useSelector((state) =>
    selectCocktailById(state, selectedCocktailId)
  );

  // --- AKILLI SIRALAMA (POPÜLERLER EN BAŞA) ---
  const sortedCocktails = useMemo(() => {
    if (!allCocktails || allCocktails.length === 0) return [];

    const populars = [];
    const others = [];

    allCocktails.forEach((cocktail) => {
      // İngilizce ismine göre popüler mi diye bakıyoruz (Data tutarlılığı için)
      if (POPULAR_COCKTAILS.includes(cocktail.name.en)) {
        populars.push(cocktail);
      } else {
        others.push(cocktail);
      }
    });

    // Popülerleri kendi içinde sırala (Opsiyonel, dizi sırasına göre de kalabilir)
    // populars.sort((a, b) => getName(a).localeCompare(getName(b)));

    // Diğerlerini alfabetik sırala
    others.sort((a, b) => getName(a).localeCompare(getName(b)));

    return [...populars, ...others];
  }, [allCocktails, i18n.language]);

  // Otomatik açılış ekranında cosmopolitanı getir.
  useEffect(() => {
    if (sortedCocktails.length > 0 && selectedCocktailId === null) {
      const targetCocktail = sortedCocktails.find(
        (c) => c.name && c.name.en === "Cosmopolitan"
      );

      if (targetCocktail) {
        setSelectedCocktailId(targetCocktail.cocktail_id);
      }
    }
  }, [sortedCocktails, selectedCocktailId]);

  // --- YENİ: ARAMADAN SEÇİM YAPMA ---
  const handleSelectFromSearch = (id) => {
    setSelectedCocktailId(id); // Ruleti güncelle
    setIsSearchModalVisible(false); // Modalı kapat
  };

  // --- YENİ: ANDROID MODALDAN SEÇİM YAPMA ---
  const handleSelectFromAndroidPicker = (id) => {
    setSelectedCocktailId(id);
    setIsAndroidPickerVisible(false);
  };

  // 5. ADIM: Duruma göre içeriği çiz

  // Yükleniyor durumu (Sadece ilk yüklemede)
  if (status === "loading" && allCocktails.length === 0) {
    return (
      <View
        style={[
          styles.centeredContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.text }}>
          {t("general.loading")}
        </Text>
      </View>
    );
  }

  // Hata durumu
  if (status === "failed") {
    return (
      <View
        style={[
          styles.centeredContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.errorText, { color: colors.notification }]}>
          {error || t("general.error")}
        </Text>
      </View>
    );
  }

  // Başarılı (succeeded) durumu
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* GÖSTERGE ALANI (Ekranın Üstü) */}
      <View style={styles.displayArea}>
        {/* "Afilli Cümle" Eklendi */}
        <Text style={[styles.headerQuote, { color: colors.textSecondary }]}>
          {t("home.quote")}
        </Text>

        {/* --- YENİ ÇERÇEVE ALANI (Image Frame) --- */}
        <View style={[styles.imageWrapper, { shadowColor: "#000" }]}>
          {/* KATMAN 1 (En Alt): KOKTEYL RESMİ */}
          {selectedCocktail ? (
            <Image
              source={{ uri: selectedCocktail.image_url }}
              style={styles.cocktailImage}
              resizeMode="cover"
            />
          ) : (
            // Resim yoksa gösterilecek Placeholder kutusu
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

          {/* KATMAN 2 (En Üst): ÇERÇEVE RESMİ */}
          {/* pointerEvents="none" sayesinde tıklamalar çerçeveye takılmaz, arkaya geçer */}
          <Image
            source={VINTAGE_FRAME_URL}
            style={styles.frameOverlay}
            resizeMode="stretch" // Çerçeveyi kutuya tam yayar
            pointerEvents="none"
          />
        </View>

        {/* BUTON */}
        <PremiumButton
          variant="gold"
          title={t("home.prepare_btn")} // İçindeki yazı
          disabled={!selectedCocktail} // Seçim yoksa pasif olsun
          style={styles.prepareButton} // Konumlandırma stillerin (margin vb.) korunsun
          onPress={() => {
            navigation.navigate("CocktailDetail", {
              cocktailId: selectedCocktail.cocktail_id,
            });
          }}
        />
      </View>

      {/* RULET / SEÇİM ALANI (Ekranın Altı) */}
      <View
        style={[
          styles.pickerArea,
          {
            backgroundColor: colors.subCard,
            shadowColor: colors.shadow,
            // DÜZELTME: "Sıkışmış komponent" hissi veren border (beyaz çizgi) kaldırıldı.
            // Artık sadece shadow ve elevation ile derinlik veriliyor.
          },
        ]}
      >
        {/* Üstteki Arama Butonu (Tüm platformlarda aynı) */}
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
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
            }}
          >
            {t("home.search_btn", "Kokteyl ara...")}
          </Text>
        </PremiumButton>

        <View style={styles.pickerContainer}>
          {/* --- AKILLI AYRIM (PLATFORM CONTROL) --- */}
          {Platform.OS === "ios" ? (
            // === IOS İÇİN: STANDART WHEEL PICKER ===
            <Picker
              selectedValue={selectedCocktailId}
              onValueChange={(itemValue) => setSelectedCocktailId(itemValue)}
              style={styles.pickerStyle}
              dropdownIconColor={colors.text}
              itemStyle={[styles.pickerItemStyle, { color: colors.text }]}
            >
              <Picker.Item
                label={t("home.pick_cocktail") + "..."}
                value={null}
                color={colors.text}
              />
              {sortedCocktails.map((cocktail) => {
                const isPopular = POPULAR_COCKTAILS.includes(cocktail.name.en);
                const labelPrefix = isPopular ? "⭐ " : "";
                return (
                  <Picker.Item
                    key={cocktail.cocktail_id}
                    label={labelPrefix + getName(cocktail)}
                    value={cocktail.cocktail_id}
                    color={colors.text}
                  />
                );
              })}
            </Picker>
          ) : (
            // === ANDROID İÇİN: KOMPAKT VE ORTALI YERLEŞİM ===
            <View style={styles.androidPickerWrapper}>
              {/* Aradaki etiket (Veya Seçim Yapın) */}
              <Text
                style={[styles.androidLabel, { color: colors.textSecondary }]}
              >
                {t("home.pick_cocktail_label", "Veya Listeden Seç:")}
              </Text>

              {/* BUTON GÖRÜNÜMLÜ SEÇİCİ (Modal Açan) */}
              <TouchableOpacity
                style={[
                  styles.androidPickerButton,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border, // Butonun kendi çerçevesi kalabilir, şık durur.
                  },
                ]}
                onPress={() => setIsAndroidPickerVisible(true)}
              >
                <Text
                  style={[styles.androidPickerText, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {selectedCocktail
                    ? getName(selectedCocktail)
                    : t("home.pick_cocktail") + "..."}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* --- YENİ KULLANIM: ORTAK ARAMA MODALI --- */}
      <CocktailSelectorModal
        visible={isSearchModalVisible}
        onClose={() => setIsSearchModalVisible(false)}
        onSelect={handleSelectFromSearch}
        multiSelect={false} // Home ekranı tekli seçim yapar
      />

      {/* --- ANDROID İÇİN SEÇİM MODALI --- */}
      {Platform.OS === "android" && (
        <Modal
          visible={isAndroidPickerVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          transparent={false}
          onRequestClose={() => setIsAndroidPickerVisible(false)}
        >
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: colors.background },
            ]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t("home.select_modal_title", "Bir Kokteyl Seç")}
              </Text>
              <Pressable onPress={() => setIsAndroidPickerVisible(false)}>
                <Ionicons
                  name="close-circle"
                  size={30}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>

            <FlatList
              data={sortedCocktails}
              keyExtractor={(item) => item.cocktail_id.toString()}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => {
                const isSelected = selectedCocktailId === item.cocktail_id;
                const isPopular = POPULAR_COCKTAILS.includes(item.name.en);

                return (
                  <TouchableOpacity
                    style={[
                      styles.searchItem,
                      {
                        borderBottomColor: colors.border,
                        backgroundColor: isSelected
                          ? colors.card
                          : "transparent",
                      },
                    ]}
                    onPress={() =>
                      handleSelectFromAndroidPicker(item.cocktail_id)
                    }
                  >
                    <Image
                      source={{ uri: item.image_url }}
                      style={[
                        styles.searchItemImage,
                        { backgroundColor: colors.subCard },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.searchItemText,
                          {
                            color: isSelected ? colors.primary : colors.text,
                            fontWeight: isSelected ? "bold" : "normal",
                          },
                        ]}
                      >
                        {isPopular ? "⭐ " : ""}
                        {getName(item)}
                      </Text>
                    </View>

                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={24}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

// === Stiller ===
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // --- ÜST KISIM ---
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
  // --- YENİ ÇERÇEVE SİSTEMİ ---
  imageWrapper: {
    width: 300,
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    // 3D Gölge Efekti
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  cocktailImage: {
    width: 265,
    height: 265,
    borderRadius: 5,
  },
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
  placeholderText: {
    textAlign: "center",
  },
  prepareButton: {
    marginTop: 5,
  },
  prepareButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },

  // --- ALT KISIM (PICKER & SEARCH) ---
  pickerArea: {
    width: "100%",
    justifyContent: Platform.OS === "android" ? "center" : "flex-start",
    borderRadius: 30,
    marginTop: 20,
    paddingTop: 20,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
    // GÜNCELLEME: Platforma göre esneklik (flex) yönetimi
    ...Platform.select({
      ios: {
        flex: 1, // iOS'ta tekerlek için tüm alanı kaplasın
      },
      android: {
        flex: 0, // Android'de sadece içerik kadar (Sıkışma önlemi)
        paddingBottom: 40, // Altına yeterli nefes payı
        marginBottom: 10,
      },
    }),
  },
  compactSearchBtn: {
    width: "85%",
    height: 40,
    marginBottom: Platform.OS === "android" ? 0 : 0,
    alignSelf: "center",
    borderRadius: 10,
  },

  pickerContainer: {
    // DÜZELTME: Android'de 'flex: 1' OLMAZ!
    // Parent (pickerArea) flex: 0 (auto height) olduğu için,
    // çocuk flex: 1 olamaz. Çocuk da auto height olmalı.
    flex: Platform.OS === "android" ? 0 : 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerStyle: {
    width: "100%",
    height: "100%",
  },
  pickerItemStyle: {
    fontSize: 21,
    fontWeight: "500",
  },

  // YENİ: Android Picker Wrapper (Hizalama Kutusu)
  androidPickerWrapper: {
    width: "100%",
    alignItems: "center",
    marginTop: 15, // Üstteki arama butonuyla arasına mesafe (GAP)
  },

  // YENİ: Android Picker Etiketi
  androidLabel: {
    fontSize: 12,
    marginBottom: 8, // Buton ile yazı arası boşluk
    alignSelf: "center",
    opacity: 0.8, // Biraz daha silik
  },

  // YENİ: Android Picker Buton Stili (Button Like)
  androidPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Yazı solda, ikon sağda
    paddingHorizontal: 15,
    width: "85%", // Search butonuyla aynı genişlik
    height: 45, // Search butonuna yakın yükseklik
    borderRadius: 10,
    borderWidth: 1,
    // GÜNCELLEME: Buton hissi için gölge eklendi
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  androidPickerText: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },

  // --- MODAL STİLLERİ ---
  modalContainer: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 0 : 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },

  modalInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  searchItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  searchItemImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  searchItemText: {
    fontSize: 16,
    flex: 1,
  },
  noResultText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
  },
});

export default HomeScreen;
