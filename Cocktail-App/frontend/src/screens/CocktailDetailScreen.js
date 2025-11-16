import { React, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  Pressable,
  Button,
} from "react-native";
import {
  fetchCocktailById,
  selectDetailedCocktail,
  getDetailedCocktailStatus,
  getDetailedCocktailError,
  clearDetail,
} from "../features/cocktails/cocktailSlice";
import { selectIsPro } from "../features/userSlice";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

/**
 * @desc    Tek bir kokteylin detaylarını gösterir.
 * @param   {object} route - React Navigation tarafından sağlanan ve 'params' (parametreler) içeren prop.
 */
const CocktailDetailScreen = ({ route }) => {
  const { cocktailId } = route.params;
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [isModalVisible, setIsModalVisible] = useState(false);
  // YENİ EKLENDİ (EKSİK 3): "İç İçe Modal" (Modal 2) için state
  // (Tıklanan malzemenin 'ing' objesini (tüm detaylarıyla) tutar)
  const [selectedAlternative, setSelectedAlternative] = useState(null);

  const cocktail = useSelector(selectDetailedCocktail);
  const status = useSelector(getDetailedCocktailStatus);
  const error = useSelector(getDetailedCocktailError);
  // YENİ EKLENDİ: Pro üyelik durumunu Redux'tan (userSlice) oku
  const isPro = useSelector(selectIsPro);

  // 3. Adım: Ekran yüklendiğinde (veya ID değiştiğinde) API isteğini tetikle
  useEffect(() => {
    // DÜZELTME: 'if (cocktailId)' kontrolü, ID '0' (sıfır) olduğunda
    // 'false' (yanlış) döner ve API isteğini engeller.
    // '0' sayısının geçerli bir ID olduğunu kontrol etmeliyiz.
    if (cocktailId !== undefined && cocktailId !== null) {
      dispatch(fetchCocktailById(cocktailId));
    }

    // 4. Adım (Cleanup): Ekran kapandığında (unmount) 'detail' state'ini temizle.
    return () => {
      dispatch(clearDetail());
    };
  }, [cocktailId, dispatch]); // Bu 'effect', ID değiştiğinde tekrar çalışır

  // 5. Adım: Duruma göre içeriği render et
  if (status === "loading" || status === "idle") {
    // 'idle' durumunda da 'loading' gösteriyoruz, çünkü 'fetch' hemen başlayacak
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#f4511e" />
      </View>
    );
  } else if (status === "failed") {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  // 'succeeded' durumu için (ve 'cocktail' objesi mevcutsa)
  else if (status === "succeeded" && cocktail) {
    return (
      <View style={styles.listContainer}>
        <ScrollView contentContainerStyle={styles.scrollContentContainer}>
          <Image source={{ uri: cocktail.image_url }} style={styles.image} />
          <Text style={styles.title}>{cocktail.name}</Text>

          {/* Bölüm: Malzemeler */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients (Malzemeler)</Text>
            {/* Ana listeden renkleri ve parantezleri kaldırdık (istediğiniz gibi) */}
            {cocktail.ingredients.map((ing) => (
              <View key={ing.requirement_id} style={styles.ingredientItem}>
                <Text style={styles.ingredientText}>
                  {ing.amount} {ing.name}
                </Text>
              </View>
            ))}
          </View>

          {/* GÜNCELLEME: Standart <Button> yerine <Pressable> kullanıldı */}
          <Pressable
            style={styles.prepareButton} // HomeScreen'deki stilin aynısı
            onPress={() => setIsModalVisible(true)} // Modal'ı açar
          >
            <Text style={styles.prepareButtonText}>Eksik malzemem var</Text>
          </Pressable>

          {/* Bölüm: Hazırlanışı */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions (Hazırlanışı)</Text>
            <Text style={styles.text}>{cocktail.instructions}</Text>
          </View>

          {/* Bölüm: Tarihi */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>History & Notes</Text>
            <Text style={styles.text}>{cocktail.history_notes}</Text>
          </View>
        </ScrollView>

        {/* Modal (Popup) Bileşeni */}
        <Modal
          visible={isModalVisible}
          transparent={true} // Bu, 'overlay' (üstte) görünümü için şarttır
          animationType="fade" // Yumuşak bir giriş efekti
          onRequestClose={() => setIsModalVisible(false)} // (Android Geri tuşu için)
        >
          {/* Dışarı tıklamayı algılayan, yarı saydam arka plan */}
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setIsModalVisible(false)} // Dışarı tıklayınca Modal'ı kapat
          >
            {/* İçerik kutucuğu (Beyaz kutu) */}
            {/* 'onPress' ekleyerek bu kutuya tıklamanın Modal'ı kapatmasını engelliyoruz */}
            <Pressable style={styles.modalContent}>
              <Text style={styles.modalTitle}>Eksik Malzemeyi seçin</Text>

              {/* GÜNCELLEME: Renkler için bilgilendirme (Legend) kutusu */}
              <View style={styles.legendContainer}>
                <Text style={styles.legendTitle}>Malzeme Göstergesi:</Text>

                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendBox,
                      { borderColor: "#FF4136", backgroundColor: "#ffffff" },
                    ]}
                  />
                  <Text style={styles.legendText}>
                    Gerekli (Alternatifi Yok)
                  </Text>
                </View>

                <View style={styles.legendItem}>
                  {/* (Renkler 'seed' dosyamızdaki ('Gerekli') ve ('Gold') ile eşleşmeli) */}
                  <View
                    style={[
                      styles.legendBox,
                      { borderColor: "#FF4136", backgroundColor: "#f1e6a2d3" },
                    ]}
                  />
                  <Text style={styles.legendText}>
                    Gerekli (Alternatifi Var - PRO)
                  </Text>
                </View>

                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendBox,
                      { borderColor: "#2ECC40", backgroundColor: "#ffffff" },
                    ]}
                  />
                  <Text style={styles.legendText}>
                    Süsleme (Alternatifi Yok)
                  </Text>
                </View>

                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendBox,
                      { borderColor: "#2ECC40", backgroundColor: "#f1e6a2d3" },
                    ]}
                  />
                  <Text style={styles.legendText}>
                    Süsleme (Alternatifi Var - PRO)
                  </Text>
                </View>
              </View>

              {/* Malzeme Butonları */}
              {/* Malzeme Butonları */}
              <View style={styles.modalButtonsContainer}>
                {cocktail?.ingredients.map((ing) => (
                  <Pressable
                    key={ing.requirement_id}
                    // GÜNCELLEME: Stil artık 'has_alternative' bayrağına göre dinamik
                    style={[
                      styles.ingredientButton,
                      // 1. Çerçeve Rengi = Önem (DB'den gelen Kırmızı/Yeşil)
                      { borderColor: ing.color_code || "#ccc" },

                      // 2. Arka Plan Rengi = Alternatif Var mı? (Gold/Beyaz)
                      // (API'den gelen 'has_alternative' bayrağını (1 veya 0) kontrol ediyoruz)
                      {
                        backgroundColor: ing.has_alternative
                          ? "#f1e6a2d3"
                          : "#ffffff",
                      }, // Gold or White
                    ]}
                    onPress={() => {
                      // (Daha sonra burayı Pro yönlendirmesiyle güncelleyeceğiz)
                      if (ing.has_alternative) {
                        setSelectedAlternative(ing);
                      } else {
                        alert("Bu malzeme için alternatif bulunmuyor.");
                      }
                    }}
                  >
                    <Text style={styles.ingredientButtonText}>{ing.name}</Text>
                  </Pressable>
                ))}
              </View>
              {/*
             // === YENİ EKLENDİ (EKSİK 3): "İÇ İÇE MODAL" (Modal 2) ===
             // (Alternatif detayını veya 'Pro Satın Al' uyarısını gösterir)
            */}
              <Modal
                visible={!!selectedAlternative} // 'selectedAlternative' null değilse görünür
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedAlternative(null)} // Kapat
              >
                <Pressable
                  style={styles.modalOverlay2} // Farklı stil (daha koyu olabilir)
                  onPress={() => setSelectedAlternative(null)} // Dışarı tıklayınca kapat
                >
                  <Pressable style={styles.modalContent2}>
                    {/* === Pro Kullanıcı Arayüzü === */}
                    {isPro && selectedAlternative ? (
                      <>
                        <Ionicons
                          name="star"
                          size={32}
                          color="#FFD700"
                          style={styles.proIcon}
                        />
                        <Text style={styles.proTitle}>PRO Alternatif</Text>
                        <Text style={styles.proText}>
                          "{selectedAlternative.name}" yerine:
                        </Text>
                        <Text style={styles.proHighlight}>
                          {selectedAlternative.alternative_amount}{" "}
                          {selectedAlternative.alternative_name}
                        </Text>
                        <Text style={styles.proText}>kullanabilirsiniz.</Text>
                      </>
                    ) : (
                      /* === Free Kullanıcı Arayüzü (Satın Al Uyarısı) === */
                      <View style={styles.proLockContainer}>
                        <Ionicons
                          name="lock-closed"
                          size={48}
                          color="#f4511e"
                          style={styles.proLockIcon}
                        />
                        <Text style={styles.proTitle}>PRO Özellik</Text>
                        <Text style={styles.proText}>
                          Bu kokteylin alternatif tariflerini görmek ve "Barmen
                          Asistanı" özelliğini tam kapasite kullanmak için
                          Profil'den Pro üyeliğe geçin!
                        </Text>
                        {/* (İleride buradaki buton 'Satın Alma Ekranı'na yönlendirir) */}
                        <Pressable
                          style={styles.proButton}
                          onPress={() => navigation.navigate("UpgradeToPro")}
                        >
                          <Text style={styles.proButtonText}>PRO'ya Geç</Text>
                        </Pressable>
                      </View>
                    )}

                    <Button
                      title="Kapat"
                      onPress={() => setSelectedAlternative(null)}
                      color="#f4511e"
                    />
                  </Pressable>
                </Pressable>
              </Modal>
              {/* === "İÇ İÇE MODAL" SONU === */}

              <Button
                title="Kapat"
                onPress={() => setIsModalVisible(false)}
                color="#f4511e"
              />
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    );
  }
  // 'succeeded' ama 'cocktail' 'null' ise (kenar durum)
  return (
    <View style={styles.centeredContainer}>
      <Text style={styles.errorText}>Cocktail not found!</Text>
    </View>
  );
};

// === Stil Dosyaları (GÜNCELLENDİ) ===
const styles = StyleSheet.create({
  // 'loading' veya 'failed' durumları için ortalanmış stil
  centeredContainer: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  // 'succeeded' (başarılı) durumu için liste stili (yayıl)
  listContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContentContainer: {
    paddingBottom: 30, // Kaydırmanın en altta bitmesi için
  },
  image: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    margin: 15,
    textAlign: "center",
  },
  section: {
    width: "90%",
    alignSelf: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 5,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  ingredientText: {
    fontSize: 16,
    flexShrink: 1,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
  errorText: {
    fontSize: 16,
    color: "red",
  },
  buttonContainer: {
    width: "90%",
    alignSelf: "center",
    marginBottom: 20,
  },
  // "Hazırla" Butonu Stilleri
  prepareButton: {
    marginTop: 15,
    marginBottom: 15,
    backgroundColor: "#f4511e",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25, // Tam yuvarlak kenarlar
    shadowColor: "#f4511e",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
    alignSelf: "center",
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

  // --- YENİ MODAL (POPUP) STİLLERİ ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    // GÜNCELLEME: modalTitle stilini Bilgilendirme kutusuna taşıdık
    // (veya burada bırakabiliriz, ama Bilgilendirme daha mantıklı)
    // Şimdilik kalsın, ama Legend'e taşıyabiliriz.
    // DÜZELTME: Bu başlık "Eksik Malzemeyi seçin" olmalı,
    // Bilgilendirme (Legend) başlığı ayrı. Stili düzeltelim:
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },

  // GÜNCELLEME: Bilgilendirme (Legend) Kutusu
  legendContainer: {
    width: "100%",
    backgroundColor: "#f7f7f7",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  legendBox: {
    // (Nokta yerine kutu)
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 8,
    borderWidth: 2,
  },
  legendText: {
    fontSize: 12,
    color: "#333",
  },

  // Malzeme Butonları (Komponentleri)
  modalButtonsContainer: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
  },
  ingredientButton: {
    borderWidth: 2, // Çerçeve kalınlığı
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
    backgroundColor: "white", // Varsayılan arka plan
  },
  ingredientButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },

  // === YENİ EKLENDİ (EKSİK 3): İç İçe Modal (Modal 2) Stilleri ===
  modalOverlay2: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)", // Ana Modal'dan daha koyu
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent2: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  // Pro Kullanıcı Stilleri
  proIcon: {
    marginBottom: 10,
  },
  proTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  proText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 10,
  },
  proHighlight: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f4511e",
    marginBottom: 10,
  },
  // Free Kullanıcı (Kilit) Stilleri
  proLockContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  proLockIcon: {
    marginBottom: 15,
  },
  proButton: {
    backgroundColor: "#FFD700", // "Pro" rengi
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 30,
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  proButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },
  // === STİL GÜNCELLEMESİ SONU ===
});

export default CocktailDetailScreen;
