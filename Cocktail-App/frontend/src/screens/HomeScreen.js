// GÜNCELLEME: 'useState' (seçili kokteyli tutmak için) eklendi
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Image, // GÜNCELLEME: Kokteyl resmini göstermek için eklendi
  Pressable, // GÜNCELLEME: 'Button' yerine 'Pressable' (daha şık buton)
} from "react-native";
// GÜNCELLEME: 'SafeAreaView' (çentik/kenar boşlukları için)
import { SafeAreaView } from "react-native-safe-area-context";

// GÜNCELLEME: Yeni kurduğumuz 'Picker' (Rulet) kütüphanesini import ediyoruz
import { Picker } from "@react-native-picker/picker";

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
  const dispatch = useDispatch();

  // 1. Dil Kancasını (Hook) Başlat
  const { t, i18n } = useTranslation();
  // Dinamik İsim Seçici (Helper)
  const getName = (item) =>
    i18n.language === "tr" ? item.name_tr : item.name_en;

  // 1. ADIM: Tüm kokteylleri Redux'tan çek (4 kokteylimiz)
  const allCocktails = useSelector(selectAllCocktails);
  const status = useSelector(getCocktailsListStatus);
  const error = useSelector(getCocktailsListError);

  // 2. ADIM: Rulette 'o an' hangisinin seçili olduğunu tutmak için lokal 'state'
  // GÜNCELLEME: Başlangıç değeri 'null' (Boş) olarak ayarlandı.
  const [selectedCocktailId, setSelectedCocktailId] = useState(null);

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

  // 5. ADIM: Duruma göre içeriği çiz

  // Yükleniyor durumu (Sadece ilk yüklemede)
  if (status === "loading" && allCocktails.length === 0) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#f4511e" />
        <Text style={{ marginTop: 10 }}>{t("general.loading")}</Text>
      </View>
    );
  }

  // Hata durumu
  if (status === "failed") {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error || t("general.error")}</Text>
      </View>
    );
  }

  // Başarılı (succeeded) durumu
  return (
    <SafeAreaView style={styles.container}>
      {/* GÖSTERGE ALANI (Ekranın Üstü)
          GÜNCELLEME: Bu alanı büyütmek için flex: 3 verdik
      */}
      <View style={styles.displayArea}>
        {/* "Afilli Cümle" Eklendi */}
        <Text style={styles.headerQuote}>{t("home.quote")}</Text>

        {/* "Altın Çerçeve" Eklendi (İç içe View kullanarak) */}
        <View style={styles.frameOuter}>
          <View style={styles.frameInner}>
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
                <View style={styles.placeholderContainer}>
                  <Text style={styles.placeholderText}>
                    {t("home.pick_cocktail")}
                  </Text>
                </View>
              )
            }
          </View>
        </View>

        {/* GÜNCELLEME: 'Button' yerine 'Pressable' (Şık Buton) eklendi
            Başlangıçta (ID 'null' iken) buton 'disabled' (pasif) olur.
        */}
        <Pressable
          style={[
            styles.prepareButton,
            !selectedCocktail && styles.prepareButtonDisabled, // Pasifken soluk görün
          ]}
          disabled={!selectedCocktail}
          onPress={() => {
            navigation.navigate("CocktailDetail", {
              cocktailId: selectedCocktail.cocktail_id,
            });
          }}
        >
          <Text style={styles.prepareButtonText}>{t("prepare_btn")}</Text>
        </Pressable>
      </View>

      {/* RULET ALANI (Ekranın Altı)
          GÜNCELLEME: Bu alanı küçültmek için flex: 2 verdik
      */}
      <View style={styles.pickerArea}>
        <Picker
          selectedValue={selectedCocktailId}
          onValueChange={(itemValue) => setSelectedCocktailId(itemValue)}
          style={styles.pickerStyle}
          itemStyle={styles.pickerItemStyle} // iOS'taki yazı stili
        >
          {/* GÜNCELLEME: Başlangıç değeri (Placeholder) eklendi */}
          <Picker.Item label={t("home.pick_cocktail") + "..."} value={null} />

          {/* Redux'tan gelen 'allCocktails' dizisini dönüyoruz */}
          {allCocktails.map((cocktail) => (
            <Picker.Item
              // Dinamik İsim Kullanımı (TR/EN)
              key={cocktail.cocktail_id}
              label={getName(cocktail)}
              value={cocktail.cocktail_id}
            />
          ))}
        </Picker>
      </View>
    </SafeAreaView>
  );
};

// === Stil Dosyaları (Yeniden Yapılandırıldı) ===
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
  // ÜST ALAN: Resim, Başlık, Buton
  displayArea: {
    flex: 3, // GÜNCELLEME: Ekranın üst kısmı büyütüldü (flex: 3)
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    width: "100%",
  },
  headerQuote: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#666",
    marginBottom: 20,
  },
  // "Altın Çerçeve" Stilleri
  frameOuter: {
    padding: 10,
    borderRadius: 15,
    backgroundColor: "#FFD700", // Altın Rengi
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  frameInner: {
    padding: 3,
    backgroundColor: "black", // İç ince çerçeve
    borderRadius: 5, // Çerçeveye uyumlu
  },
  image: {
    width: 250, // GÜNCELLEME: Resim boyutu büyütüldü
    height: 250,
    borderRadius: 5, // İç çerçeveye uyumlu
  },
  placeholderContainer: {
    width: 250,
    height: 250,
    borderRadius: 5,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 18,
    color: "#999",
    fontWeight: "500",
  },
  // "Hazırla" Butonu Stilleri
  prepareButton: {
    marginTop: 25,
    backgroundColor: "#f4511e",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25, // Tam yuvarlak kenarlar
    shadowColor: "#f4511e",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
  },
  prepareButtonDisabled: {
    backgroundColor: "#ccc",
    shadowColor: "transparent",
  },
  prepareButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  // ALT ALAN: Rulet
  pickerArea: {
    flex: 2, // GÜNCELLEME: Ekranın alt kısmı (flex: 2)
    width: "100%",
    justifyContent: "center",
  },
  pickerStyle: {
    width: "100%",
  },
  pickerItemStyle: {
    color: "#000",
    fontSize: 22, // Rulet yazı boyutu
  },
  errorText: {
    fontSize: 16,
    color: "red",
  },
});

export default HomeScreen;
