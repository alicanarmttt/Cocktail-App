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
import VINTAGE_FRAME_URL from "../../assets/gold_frame.png";
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
      edges={["top", "left", "right"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* GÖSTERGE ALANI (Ekranın Üstü)
          
      */}
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

        {/*BUTON */}
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

      {/* RULET ALANI (Ekranın Altı)*/}
      <View
        style={[
          styles.pickerArea,
          { backgroundColor: colors.subCard, shadowColor: colors.shadow },
        ]}
      >
        {/* YENİ: PREMIUM ARAMA BAR (Silver Button Kullanımı) */}
        <PremiumButton
          variant="silver"
          onPress={() => setIsSearchModalVisible(true)}
          style={styles.compactSearchBtn} // Yeni stil (İnce ve zarif)
          gradientStyle={{
            flexDirection: "row",
            justifyContent: "flex-start",
            paddingHorizontal: 15, // İç boşluğu kıstık
            paddingVertical: 0, // Dikey boşluğu sıfırladık (height ile yöneteceğiz)
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
    position: "relative", // Çocukları absolute konumlandırmak için referans
    // 3D Gölge Efekti
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20, // Android için güçlü gölge
  },
  cocktailImage: {
    width: 220, // Çerçevenin "içine" sığacak kadar küçük olmalı (Deneme yanılma ile ayarla)
    height: 220,
    borderRadius: 5, // Yuvarlak veya kare, çerçevenin şekline göre ayarla
    // position: 'absolute' gerekmez çünkü wrapper flex center yapıyor
  },
  frameOverlay: {
    position: "absolute", // Kutunun üzerine yapış
    top: 0,
    left: 0,
    width: "100%", // Wrapper'ı tam kapla
    height: "100%",
    zIndex: 10, // En üstte dur
  },
  placeholderContainer: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 110, // Resimle aynı şekil
  },
  placeholderText: {
    textAlign: "center",
  },
  prepareButton: {
    marginTop: 5,
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
    flex: 1,
    width: "100%",
    justifyContent: "flex-start", // Üstten başlasın
    borderRadius: 30,
    marginTop: 20,
    paddingTop: 20,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  // Yeni Arama Butonu
  compactSearchBtn: {
    width: "85%", // Kenarlardan boşluk kalsın
    height: 40, // DÜZELTME: 50 -> 40px (Daha ince, kibar)
    marginBottom: 0,
    alignSelf: "center", // Ortala
    borderRadius: 10,
  },

  pickerContainer: {
    flex: 1, // Kalan tüm alanı kapla
    width: "100%",
    justifyContent: "center",
    overflow: "hidden", // Taşanları kes
  },
  pickerStyle: {
    width: "100%",
    height: "100%",
  },
  pickerItemStyle: {
    fontSize: 21,
    fontWeight: "500",
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
