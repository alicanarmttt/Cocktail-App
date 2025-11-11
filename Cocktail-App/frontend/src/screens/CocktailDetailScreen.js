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

/**
 * @desc    Tek bir kokteylin detaylarını gösterir.
 * @param   {object} route - React Navigation tarafından sağlanan ve 'params' (parametreler) içeren prop.
 */
const CocktailDetailScreen = ({ route }) => {
  const { cocktailId } = route.params;
  const dispatch = useDispatch();

  const [isModalVisible, setIsModalVisible] = useState(false);

  const cocktail = useSelector(selectDetailedCocktail);
  const status = useSelector(getDetailedCocktailStatus);
  const error = useSelector(getDetailedCocktailError);

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
              <View key={ing.name} style={styles.ingredientItem}>
                <Text style={styles.ingredientText}>
                  {ing.amount} {ing.name}
                </Text>
              </View>
            ))}
          </View>

          {/* "Eksik Malzemem Var" Butonu */}
          <View style={styles.buttonContainer}>
            <Button
              title="Eksik malzemem var"
              onPress={() => setIsModalVisible(true)} // Modal'ı açar
              color="#f4511e"
            />
          </View>

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

              {/* Renkler için bilgilendirme (Legend) kutusu */}
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  {/* GÜNCELLEME: Renkler artık 'seed' dosyamızdaki (backend) veriye göre 
                      (geçici olarak) hard-code edildi. */}
                  <View
                    style={[styles.legendDot, { backgroundColor: "#FF4136" }]}
                  />
                  <Text style={styles.legendText}>Zorunlu</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#FF851B" }]}
                  />
                  <Text style={styles.legendText}>Alternatifi Gör (Pro)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#2ECC40" }]}
                  />
                  <Text style={styles.legendText}>İsteğe Bağlı</Text>
                </View>
              </View>

              {/* Malzeme Butonları */}
              <View style={styles.modalButtonsContainer}>
                {cocktail?.ingredients.map((ing) => (
                  <Pressable
                    key={ing.name}
                    style={[
                      styles.ingredientButton,
                      // GÜNCELLEME: 'borderColor' (çerçeve rengi) artık 'ezilmiyor',
                      // doğrudan backend'den gelen 'ing.color_code'u kullanıyor.
                      { borderColor: ing.color_code || "#ccc" },
                    ]}
                    onPress={() => alert("PRO Sürüm Gerekli!")}
                  >
                    <Text style={styles.ingredientButtonText}>{ing.name}</Text>
                  </Pressable>
                ))}
              </View>

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

// === Stil Dosyaları ===
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
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },

  // Bilgilendirme (Legend) Kutusu
  legendContainer: {
    width: "100%",
    backgroundColor: "#f7f7f7",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
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
    borderWidth: 2,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
  },
  ingredientButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
});
export default CocktailDetailScreen;
