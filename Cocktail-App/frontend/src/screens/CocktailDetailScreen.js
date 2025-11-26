import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
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
 * @param   {object} route - React Navigation tarafından sağlanan prop.
 */
const CocktailDetailScreen = ({ route }) => {
  // 1. Çeviri Hook'u
  const { t, i18n } = useTranslation();
  // 2. Helper: Dile Göre Metin Seçici
  const getLocaleText = (tr, en) => (i18n.language === "tr" ? tr : en);

  const { cocktailId } = route.params;
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [isModalVisible, setIsModalVisible] = useState(false);

  // YENİ EKLENDİ (EKSİK 3): "İç İçe Modal" (Modal 2) için state
  // (Tıklanan malzemenin 'ing' objesini (artık içinde 'alternatives' dizisi var) tutar)
  const [selectedAlternative, setSelectedAlternative] = useState(null);

  const cocktail = useSelector(selectDetailedCocktail);
  const status = useSelector(getDetailedCocktailStatus);
  const error = useSelector(getDetailedCocktailError);
  // YENİ EKLENDİ: Pro üyelik durumunu Redux'tan (userSlice) oku
  const isPro = useSelector(selectIsPro);

  // 3. Adım: Ekran yüklendiğinde API isteğini tetikle
  useEffect(() => {
    if (cocktailId !== undefined && cocktailId !== null) {
      dispatch(fetchCocktailById(cocktailId));
    }

    // 4. Adım (Cleanup): Ekran kapandığında state'i temizle.
    return () => {
      dispatch(clearDetail());
    };
  }, [cocktailId, dispatch]);

  // 5. Adım: Duruma göre içeriği render et
  if (status === "loading" || status === "idle") {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#f4511e" />
      </View>
    );
  } else if (status === "failed") {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error || t("general.error")}</Text>
      </View>
    );
  }
  // 'succeeded' durumu
  else if (status === "succeeded" && cocktail) {
    return (
      <View style={styles.listContainer}>
        <ScrollView contentContainerStyle={styles.scrollContentContainer}>
          <Image source={{ uri: cocktail.image_url }} style={styles.image} />
          <Text style={styles.title}>
            {getLocaleText(cocktail.name_tr, cocktail.name_en)}
          </Text>

          {/* Bölüm: Malzemeler */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("detail.ingredients_title")}
            </Text>
            {cocktail.ingredients.map((ing) => (
              <View key={ing.requirement_id} style={styles.ingredientItem}>
                <Text style={styles.ingredientText}>
                  {getLocaleText(ing.amount_tr, ing.amount_en)}{" "}
                  {getLocaleText(ing.name_tr, ing.name_en)}
                </Text>
              </View>
            ))}
          </View>

          {/* "Eksik Malzemem Var" Butonu */}
          <Pressable
            style={styles.prepareButton}
            onPress={() => setIsModalVisible(true)}
          >
            <Text style={styles.prepareButtonText}>
              {t("detail.missing_ingredients_btn")}
            </Text>
          </Pressable>

          {/* Bölüm2: Hazırlanışı */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("detail.instructions_title")}
            </Text>
            <Text style={styles.text}>
              {getLocaleText(
                cocktail.instructions_tr,
                cocktail.instructions_en
              )}
            </Text>
          </View>

          {/* Bölüm3: Tarihçe */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("detail.history_title")}</Text>
            <Text style={styles.text}>
              {getLocaleText(
                cocktail.history_notes_tr,
                cocktail.history_notes_en
              )}
            </Text>
          </View>
        </ScrollView>

        {/* --- MODAL 1: EKSİK MALZEME SEÇİMİ (Ana Modal) --- */}
        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsModalVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setIsModalVisible(false)}
          >
            <Pressable style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t("detail.modal_title")}</Text>

              {/* Bilgilendirme (Legend) kutusu */}
              <View style={styles.legendContainer}>
                <Text style={styles.legendTitle}>
                  {t("detail.legend_title")}
                </Text>

                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendBox,
                      { borderColor: "#FF4136", backgroundColor: "#ffffff" },
                    ]}
                  />
                  <Text style={styles.legendText}>
                    {t("detail.legend_required")} (No Alt)
                  </Text>
                </View>

                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendBox,
                      { borderColor: "#FF4136", backgroundColor: "#f1e6a2d3" },
                    ]}
                  />
                  <Text style={styles.legendText}>
                    {t("detail.legend_required")} (Pro)
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
                    {t("detail.legend_garnish")}
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
                    {t("detail.legend_garnish")} (Pro)
                  </Text>
                </View>
              </View>

              {/* Malzeme Butonları */}
              <View style={styles.modalButtonsContainer}>
                {cocktail?.ingredients.map((ing) => (
                  <Pressable
                    key={ing.requirement_id}
                    // Stil 'has_alternative' bayrağına göre dinamik
                    style={[
                      styles.ingredientButton,
                      // 1. Çerçeve Rengi
                      { borderColor: ing.color_code || "#ccc" },
                      // 2. Arka Plan Rengi
                      {
                        backgroundColor: ing.has_alternative
                          ? "#f1e6a2d3"
                          : "#ffffff",
                      },
                    ]}
                    onPress={() => {
                      // Eğer alternatif varsa detay modalını aç
                      if (ing.has_alternative) {
                        setSelectedAlternative(ing);
                      } else {
                        // Basit alert (veya toast) kalabilir
                        alert(t("assistant.not_found"));
                      }
                    }}
                  >
                    <Text style={styles.ingredientButtonText}>
                      {getLocaleText(ing.name_tr, ing.name_en)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* --- MODAL 2: ALTERNATİF DETAYI (İÇ İÇE) --- 
                  GÜNCELLENDİ: Artık liste (array) yapısını destekler.
              */}
              <Modal
                visible={!!selectedAlternative}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedAlternative(null)}
              >
                <Pressable
                  style={styles.modalOverlay2}
                  onPress={() => setSelectedAlternative(null)}
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
                        <Text style={styles.proTitle}>
                          {t("detail.pro_alt_title")}
                        </Text>

                        {/* Dinamik Başlık: X Malzemesi Yerine... */}
                        <Text style={styles.proText}>
                          "
                          {getLocaleText(
                            selectedAlternative.name_tr,
                            selectedAlternative.name_en
                          )}
                          " {t("detail.pro_use_instead")}
                        </Text>

                        <Text style={[styles.proText, { marginBottom: 15 }]}>
                          {t(
                            "detail.pro_can_use_list",
                            "Aşağıdakilerden birini kullanabilirsiniz:"
                          )}
                        </Text>

                        {/* GÜNCELLEME: ALTERNATİFLER LİSTESİ 
                           Dizi (Array) üzerinden map yaparak hepsini listeliyoruz.
                        */}
                        <ScrollView style={{ maxHeight: 150, width: "100%" }}>
                          {selectedAlternative.alternatives &&
                            selectedAlternative.alternatives.map(
                              (alt, index) => (
                                <View key={index} style={styles.altListItem}>
                                  <Ionicons
                                    name="arrow-forward"
                                    size={16}
                                    color="#f4511e"
                                  />
                                  <Text style={styles.altListItemText}>
                                    {/* Miktar */}
                                    <Text
                                      style={{
                                        fontWeight: "bold",
                                        color: "#f4511e",
                                      }}
                                    >
                                      {getLocaleText(
                                        alt.amount_tr,
                                        alt.amount_en
                                      )}{" "}
                                    </Text>
                                    {/* İsim */}
                                    {getLocaleText(alt.name_tr, alt.name_en)}
                                  </Text>
                                </View>
                              )
                            )}
                        </ScrollView>
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
                        <Text style={styles.proTitle}>
                          {t("detail.pro_feature")}
                        </Text>
                        <Text style={styles.proText}>
                          {t("detail.pro_lock_msg")}
                        </Text>

                        <Pressable
                          style={styles.proButton}
                          onPress={() => {
                            setSelectedAlternative(null); // Modalı kapat
                            setIsModalVisible(false); // Ana modalı kapat
                            navigation.navigate("UpgradeToPro"); // Yönlendir
                          }}
                        >
                          <Text style={styles.proButtonText}>
                            {t("detail.get_pro_btn")}
                          </Text>
                        </Pressable>
                      </View>
                    )}

                    <Button
                      title={t("general.close", "Kapat")}
                      onPress={() => setSelectedAlternative(null)}
                      color="#f4511e"
                    />
                  </Pressable>
                </Pressable>
              </Modal>
              {/* === "İÇ İÇE MODAL" SONU === */}

              <Button
                title={t("general.close", "Kapat")}
                onPress={() => setIsModalVisible(false)}
                color="#f4511e"
              />
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    );
  }
  // 'succeeded' ama 'cocktail' 'null' ise
  return (
    <View style={styles.centeredContainer}>
      <Text style={styles.errorText}>{t("results.not_found")}</Text>
    </View>
  );
};

// === Stil Dosyaları ===
const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  listContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContentContainer: {
    paddingBottom: 30,
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
  prepareButton: {
    marginTop: 15,
    marginBottom: 15,
    backgroundColor: "#f4511e",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: "#f4511e",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
    alignSelf: "center",
  },
  prepareButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Modal Stilleri
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
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
    backgroundColor: "white",
  },
  ingredientButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
  // İç İçe Modal (Modal 2) Stilleri
  modalOverlay2: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
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
    marginBottom: 5,
  },
  // YENİ EKLENDİ: Alternatif Liste Elemanı Stili
  altListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    width: "100%",
  },
  altListItemText: {
    fontSize: 16,
    marginLeft: 10,
    color: "#333",
  },
  proLockContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  proLockIcon: {
    marginBottom: 15,
  },
  proButton: {
    backgroundColor: "#FFD700",
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
});

export default CocktailDetailScreen;
