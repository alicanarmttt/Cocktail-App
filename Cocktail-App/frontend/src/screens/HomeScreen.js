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
  TextInput,
  FlatList,
  TouchableOpacity,
} from "react-native";
// GÜNCELLEME: 'SafeAreaView' (çentik/kenar boşlukları için)
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
// GÜNCELLEME: Yeni kurduğumuz 'Picker' (Rulet) kütüphanesini import ediyoruz
import { Picker } from "@react-native-picker/picker";
import { useTheme } from "@react-navigation/native";
import PremiumButton from "../ui/PremiumButton.js";
import {
  fetchCocktails,
  selectAllCocktails,
  getCocktailsListError,
  getCocktailsListStatus,
  // GÜNCELLEME: Redux Store'dan ID'ye göre kokteyl bulmak için
  // 'selectCocktailById' selector'ünü (bulucu) slice'ımızdan import ediyoruz.
  selectCocktailById,
} from "../features/cocktails/cocktailSlice.js";

/**
 * @desc    Uygulamanın ana ekranı. Üstte bir gösterge, altta bir "Rulet" (Picker) gösterir.
 * @param {object} navigation - React Navigation tarafından sağlanır.
 */
const HomeScreen = ({ navigation }) => {
  const { colors } = useTheme();

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
  // Dinamik İsim Seçici (Helper)
  const getName = (item) => {
    if (!item) return "";
    return i18n.language === "tr" ? item.name_tr : item.name_en;
  };

  // 1. ADIM: Tüm kokteylleri Redux'tan çek (4 kokteylimiz)
  const allCocktails = useSelector(selectAllCocktails);
  const status = useSelector(getCocktailsListStatus);
  const error = useSelector(getCocktailsListError);

  // 2. ADIM: Rulette 'o an' hangisinin seçili olduğunu tutmak için lokal 'state'
  // GÜNCELLEME: Başlangıç değeri 'null' (Boş) olarak ayarlandı.
  const [selectedCocktailId, setSelectedCocktailId] = useState(null);

  //Arama modalı için stateler
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");

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
      if (POPULAR_COCKTAILS.includes(cocktail.name_en)) {
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

  // --- ARAMA FİLTRELEME FONKSİYONU ---
  const filteredCocktails = useMemo(() => {
    return sortedCocktails.filter((cocktail) => {
      const name = getName(cocktail);
      return name.toLowerCase().includes(searchText.toLowerCase());
    });
  }, [sortedCocktails, searchText, i18n.language]);

  //Otomatik açılış ekranında cosmopolitanı getir.
  useEffect(() => {
    if (sortedCocktails.length > 0 && selectedCocktailId === null) {
      const targetCocktail = sortedCocktails.find(
        (c) => c.name_en === "Cosmopolitan"
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
    setSearchText(""); // Arama metnini temizle
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
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* GÖSTERGE ALANI (Ekranın Üstü)
          GÜNCELLEME: Bu alanı büyütmek için flex: 3 verdik
      */}
      <View style={styles.displayArea}>
        {/* "Afilli Cümle" Eklendi */}
        <Text style={[styles.headerQuote, { color: colors.textSecondary }]}>
          {t("home.quote")}
        </Text>

        {/* "Altın Çerçeve" Eklendi (İç içe View kullanarak) */}
        <View
          style={[
            styles.frameOuter,
            { backgroundColor: colors.gold, shadowColor: colors.shadow },
          ]}
        >
          <View style={[styles.frameInner, { backgroundColor: colors.card }]}>
            {
              // GÜNCELLEME: Başlangıçta (ID 'null' iken) resim yerine
              // "Bir Kokteyl Seçin" yazısı gösterilir.
              selectedCocktail ? (
                <Image
                  source={{ uri: selectedCocktail.image_url }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.placeholderContainer,
                    { backgroundColor: colors.subCard },
                  ]}
                >
                  <Text
                    style={[
                      styles.placeholderText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("home.pick_cocktail")}
                  </Text>
                </View>
              )
            }
          </View>
        </View>

        {/* YENİ PREMİUM BUTON */}
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

      {/* RULET ALANI (Ekranın Altı)
          GÜNCELLEME: Bu alanı küçültmek için flex: 2 verdik
      */}
      <View
        style={[
          styles.pickerArea,
          { backgroundColor: colors.subCard, shadowColor: colors.shadow },
        ]}
      >
        {/* YENİ: ARAMA BUTONU (Ruletin hemen üstünde) */}
        <Pressable
          style={[
            styles.searchButton,
            { backgroundColor: colors.card, borderColor: colors.primary },
          ]}
          onPress={() => setIsSearchModalVisible(true)}
        >
          <Ionicons name="search" size={20} color={colors.primary} />
          <Text style={[styles.searchButtonText, { color: colors.primary }]}>
            {t("home.search_btn")}
          </Text>
        </Pressable>

        <Picker
          selectedValue={selectedCocktailId}
          onValueChange={(itemValue) => setSelectedCocktailId(itemValue)}
          style={styles.pickerStyle}
          dropdownIconColor={colors.text}
          itemStyle={[styles.pickerItemStyle, { color: colors.text }]} // iOS'taki yazı stili
          mode="dialog"
        >
          {/* GÜNCELLEME: Başlangıç değeri (Placeholder) eklendi */}
          <Picker.Item
            label={t("home.pick_cocktail") + "..."}
            value={null}
            color={colors.text}
          />

          {/* SIRALANMIŞ LİSTEYİ KULLAN */}
          {sortedCocktails.map((cocktail, index) => {
            // Ayraç Mantığı: Popülerler bittiğinde bir çizgi çekmek için
            // (Picker içinde stil vermek zordur, o yüzden renk değişimi veya özel karakter kullanabiliriz)
            const isPopular = POPULAR_COCKTAILS.includes(cocktail.name_en);
            const labelPrefix = isPopular ? "⭐ " : ""; // Popülerlere yıldız ekle

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
      </View>
      {/* --- YENİ: ARAMA MODALI --- */}
      <Modal
        visible={isSearchModalVisible}
        animationType="slide" // Aşağıdan yukarı kayarak gelir
        presentationStyle="pageSheet" // iOS'ta sayfa gibi görünür
        onRequestClose={() => setIsSearchModalVisible(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          {/* Modal Başlığı ve Kapat Butonu */}
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("home.search_modal_title")}
            </Text>
            <Pressable onPress={() => setIsSearchModalVisible(false)}>
              <Ionicons
                name="close-circle"
                size={30}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>

          {/* Arama Input */}
          <View
            style={[
              styles.modalInputContainer,
              { backgroundColor: colors.subCard },
            ]}
          >
            <Ionicons
              name="search"
              size={20}
              color={colors.textSecondary}
              style={{ marginRight: 10 }}
            />
            <TextInput
              style={[styles.modalInput, { color: colors.text }]}
              placeholder={t("home.search_modal_placeholder")}
              placeholderTextColor={colors.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
              autoFocus={true} // Açılınca klavye gelsin
            />
          </View>

          {/* Sonuç Listesi */}
          <FlatList
            data={filteredCocktails}
            keyExtractor={(item) => item.cocktail_id.toString()}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.searchItem,
                  { borderBottomColor: colors.border },
                ]}
                onPress={() => handleSelectFromSearch(item.cocktail_id)}
              >
                <Image
                  source={{ uri: item.image_url }}
                  style={[
                    styles.searchItemImage,
                    { backgroundColor: colors.subCard },
                  ]}
                />
                <Text style={[styles.searchItemText, { color: colors.text }]}>
                  {getName(item)}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.border}
                />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text
                style={[styles.noResultText, { color: colors.textSecondary }]}
              >
                {t("assistant.not_found")}
              </Text>
            }
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// === Stil Dosyaları (Yeniden Yapılandırıldı) ===
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
    flex: 3,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    width: "100%",
    paddingBottom: 60,
  },
  headerQuote: {
    fontSize: 16,
    fontStyle: "italic",
    marginBottom: 15,
    textAlign: "center",
  },
  frameOuter: {
    padding: 8,
    borderRadius: 15,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  frameInner: {
    padding: 2,
    borderRadius: 5,
  },
  image: {
    width: 250, // Biraz küçülttük ki arama butonuna yer kalsın
    height: 250,
    borderRadius: 5,
  },
  placeholderContainer: {
    width: 220,
    height: 220,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "500",
  },
  cocktailName: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
  prepareButton: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
  },
  prepareButtonDisabled: {
    opacity: 0.6,
    shadowColor: "transparent",
  },
  prepareButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },

  // --- ALT KISIM (PICKER & SEARCH) ---
  pickerArea: {
    flex: 2,
    width: "100%",
    justifyContent: "flex-start", // Üstten başlasın
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  // Yeni Arama Butonu
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 40,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 5,
  },
  searchButtonText: {
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
  },
  pickerStyle: {
    width: "100%",
  },
  pickerItemStyle: {
    fontSize: 20,
  },

  // --- MODAL STİLLERİ ---
  modalContainer: {
    flex: 1,
    paddingTop: 20, // iOS Statusbar için
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
  modalInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    height: 50,
  },
  modalInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  // Liste Elemanları
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
