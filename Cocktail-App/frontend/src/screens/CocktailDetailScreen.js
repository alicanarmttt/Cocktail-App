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
  Platform,
  TouchableOpacity,
  Alert, // Alert eklendi
} from "react-native";
import {
  fetchCocktailById,
  selectDetailedCocktail,
  getDetailedCocktailStatus,
  getDetailedCocktailError,
  clearDetail,
} from "../features/cocktails/cocktailSlice";
// DEĞİŞİKLİK 1: selectIsGuest import edildi
import {
  selectIsPro,
  selectCurrentUser,
  selectIsGuest,
  clearUser,
} from "../features/userSlice";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useTheme } from "@react-navigation/native";
import PremiumButton from "../ui/PremiumButton";
import CocktailImage from "../components/CocktailImage";

import CocktailDetailSkeleton from "../components/common/CocktailDetailSkeleton";
import ErrorView from "../components/common/ErrorView";
import { MaterialIcons } from "@expo/vector-icons";
import {
  addFavorite,
  removeFavorite,
  selectIsFavorite,
} from "../features/favoritesSlice";

const CocktailDetailScreen = ({ route }) => {
  const { colors, fonts } = useTheme();
  const { t, i18n } = useTranslation();

  const getLocaleText = (obj) => {
    if (!obj) return "";
    const langCode = i18n.language ? i18n.language.substring(0, 2) : "en";
    return obj[langCode] || obj["en"] || "";
  };

  const { cocktailId } = route.params;
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedAlternative, setSelectedAlternative] = useState(null);

  const currentUser = useSelector(selectCurrentUser);
  // DEĞİŞİKLİK 2: Misafir durumu çekildi
  const isGuest = useSelector(selectIsGuest);
  const cocktail = useSelector(selectDetailedCocktail);
  const status = useSelector(getDetailedCocktailStatus);
  const error = useSelector(getDetailedCocktailError);
  // const isPro = useSelector(selectIsPro); // Artık Pro kontrolüne gerek yok

  useEffect(() => {
    if (cocktailId !== undefined && cocktailId !== null) {
      dispatch(fetchCocktailById(cocktailId));
    }
    return () => {
      dispatch(clearDetail());
    };
  }, [cocktailId, dispatch]);

  const isFavorite = useSelector((state) =>
    selectIsFavorite(state, cocktailId)
  );

  // DEĞİŞİKLİK 3: Favori Butonu Logic Güncellemesi
  const handleToggleFavorite = () => {
    // A. Misafir Kontrolü
    if (isGuest) {
      Alert.alert(
        t("general.attention", "Dikkat"),
        t(
          "favorites.guest_warning",
          "Favorilere eklemek için giriş yapmalısınız."
        ),
        [
          { text: t("general.cancel", "İptal"), style: "cancel" },
          {
            text: t("auth.login_button", "Giriş Yap"),
            onPress: () => {
              // Misafir modunu kapatınca AppNavigator otomatik Login ekranına atar
              dispatch(clearUser());
            },
          },
        ]
      );
      return;
    }

    if (!currentUser) return; // Ek güvenlik

    const userId = currentUser.user_id || currentUser.id;

    if (isFavorite) {
      dispatch(removeFavorite({ userId, cocktailId }));
    } else {
      dispatch(addFavorite({ userId, cocktail: cocktail }));
    }
  };

  if (status === "loading" || status === "idle") {
    return <CocktailDetailSkeleton />;
  } else if (status === "failed") {
    return (
      <ErrorView
        title={t("general.error_title", "Bir Hata Oluştu")}
        message={error || t("general.error")}
        onRetry={() => dispatch(fetchCocktailById(cocktailId))}
      />
    );
  } else if (status === "succeeded" && cocktail) {
    return (
      <View
        style={[styles.listContainer, { backgroundColor: colors.background }]}
      >
        <ScrollView contentContainerStyle={styles.scrollContentContainer}>
          <View style={{ position: "relative" }}>
            <CocktailImage uri={cocktail.image_url} style={styles.image} />

            <TouchableOpacity
              onPress={handleToggleFavorite}
              style={styles.favoriteOverlay}
            >
              <MaterialIcons
                name={isFavorite ? "favorite" : "favorite-border"}
                size={28}
                color="white"
              />
            </TouchableOpacity>
          </View>
          <Text
            style={[styles.title, fonts.styles.h1, { color: colors.primary }]}
          >
            {getLocaleText(cocktail.name)}
          </Text>

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                fonts.styles.h2,
                {
                  color: colors.textSecondary,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              {t("detail.ingredients_title")}
            </Text>
            {cocktail.ingredients.map((ing) => (
              <View key={ing.requirement_id} style={styles.ingredientItem}>
                <Text
                  style={[
                    styles.ingredientText,
                    fonts.styles.body,
                    { color: colors.text },
                  ]}
                >
                  <Text style={fonts.styles.bodyBold}>
                    {getLocaleText(ing.amount)}
                    {"  "}
                  </Text>
                  {getLocaleText(ing.name)}
                </Text>
              </View>
            ))}
          </View>

          <PremiumButton
            style={styles.prepareButton}
            onPress={() => setIsModalVisible(true)}
            variant="gold"
            title={t("detail.missing_ingredients_btn")}
          ></PremiumButton>

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                fonts.styles.h2,
                {
                  color: colors.textSecondary,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              {t("detail.instructions_title")}
            </Text>
            <Text
              style={[styles.text, fonts.styles.body, { color: colors.text }]}
            >
              {getLocaleText(cocktail.instructions)}
            </Text>
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                fonts.styles.h2,
                {
                  color: colors.textSecondary,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              {t("detail.history_title")}
            </Text>
            <Text
              style={[styles.text, fonts.styles.body, { color: colors.text }]}
            >
              {getLocaleText(cocktail.history_notes)}
            </Text>
          </View>
        </ScrollView>

        {/* --- MODAL 1: EKSİK MALZEME SEÇİMİ (Herkese Açık) --- */}
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
            <Pressable
              style={[styles.modalContent, { backgroundColor: colors.card }]}
            >
              <Text
                style={[
                  styles.modalTitle,
                  fonts.styles.h3,
                  { color: colors.text },
                ]}
              >
                {t("detail.modal_title")}
              </Text>

              {/* LEJANT (Renk Açıklamaları) */}
              <View
                style={[
                  styles.legendContainer,
                  { backgroundColor: colors.subCard },
                ]}
              >
                <Text
                  style={[
                    styles.legendTitle,
                    fonts.styles.caption,
                    { color: colors.textSecondary, fontWeight: "bold" },
                  ]}
                >
                  {t("detail.legend_title")}
                </Text>
                {/* ... Lejant itemleri aynı ... */}
                {/* Sadece Pro yazan yerleri 'Alternatif' olarak düşünebiliriz ama metinler kalabilir */}
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendBox,
                      {
                        borderColor: colors.notification,
                        backgroundColor: colors.card,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.legendText,
                      fonts.styles.caption,
                      { color: colors.text },
                    ]}
                  >
                    {t("detail.legend_required")}
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendBox,
                      {
                        borderColor: colors.notification,
                        backgroundColor: colors.proCardBg,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.legendText,
                      fonts.styles.caption,
                      { color: colors.text },
                    ]}
                  >
                    {t("detail.legend_required")} (
                    {t("general.alternative") || "Alt."})
                  </Text>
                </View>
              </View>

              <View style={styles.modalButtonsContainer}>
                {cocktail?.ingredients.map((ing) => (
                  <Pressable
                    key={ing.requirement_id}
                    style={[
                      styles.ingredientButton,
                      { borderColor: ing.color_code || colors.border },
                      {
                        backgroundColor: ing.has_alternative
                          ? colors.proCardBg
                          : colors.card,
                      },
                    ]}
                    onPress={() => {
                      if (ing.has_alternative) {
                        setSelectedAlternative(ing);
                      } else {
                        alert(t("assistant.not_found"));
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.ingredientButtonText,
                        fonts.styles.body,
                        { color: colors.text, fontSize: 14 },
                      ]}
                    >
                      {getLocaleText(ing.name)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* --- MODAL 2: ALTERNATİF DETAYI (KORUMALI ALAN) --- */}
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
                  <Pressable
                    style={[
                      styles.modalContent2,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    {/* DEĞİŞİKLİK 4: isPro yerine currentUser kontrolü */}
                    {/* Giriş yapmışsa göster, Misafirse kilitle */}
                    {currentUser && selectedAlternative ? (
                      <>
                        <Ionicons
                          name="star"
                          size={32}
                          color={colors.gold}
                          style={styles.proIcon}
                        />
                        <Text
                          style={[
                            styles.proTitle,
                            fonts.styles.h2,
                            { color: colors.text },
                          ]}
                        >
                          {t("detail.pro_alt_title")}
                        </Text>
                        {(() => {
                          const ingredientName = getLocaleText(
                            selectedAlternative.name
                          );
                          return (
                            <Text
                              style={[
                                styles.proText,
                                fonts.styles.body,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {t("detail.pro_use_instead", {
                                ingredient: ingredientName,
                              })}
                            </Text>
                          );
                        })()}
                        <ScrollView style={{ maxHeight: 150, width: "100%" }}>
                          {selectedAlternative.alternatives &&
                            selectedAlternative.alternatives.map(
                              (alt, index) => (
                                <View
                                  key={index}
                                  style={[
                                    styles.altListItem,
                                    { borderBottomColor: colors.border },
                                  ]}
                                >
                                  <Ionicons
                                    name="arrow-forward"
                                    size={16}
                                    color={colors.primary}
                                  />
                                  <Text
                                    style={[
                                      styles.altListItemText,
                                      fonts.styles.body,
                                      { color: colors.text },
                                    ]}
                                  >
                                    <Text
                                      style={{
                                        fontWeight: "bold",
                                        color: colors.primary,
                                      }}
                                    >
                                      {getLocaleText(alt.amount)}{" "}
                                    </Text>
                                    {getLocaleText(alt.name)}
                                  </Text>
                                </View>
                              )
                            )}
                        </ScrollView>
                      </>
                    ) : (
                      // --- GİRİŞ YAPMAMIŞ KULLANICI EKRANI ---
                      <View style={styles.proLockContainer}>
                        <Ionicons
                          name="lock-closed"
                          size={48}
                          color={colors.primary}
                          style={styles.proLockIcon}
                        />
                        <Text
                          style={[
                            styles.proTitle,
                            fonts.styles.h2,
                            { color: colors.text },
                          ]}
                        >
                          {/* Başlık: Sadece Üyeler İçin */}
                          {t("detail.members_only_title", "Sadece Üyeler İçin")}
                        </Text>
                        <Text
                          style={[
                            styles.proText,
                            fonts.styles.body,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {/* Açıklama: Alternatifleri görmek için giriş yap */}
                          {t(
                            "detail.login_required_msg",
                            "Alternatif malzemeleri görmek için lütfen giriş yapın."
                          )}
                        </Text>

                        {/* Giriş Yap Butonu */}
                        <Pressable
                          style={[
                            styles.proButton,
                            { backgroundColor: colors.primary }, // Gold yerine Primary renk
                          ]}
                          onPress={() => {
                            setSelectedAlternative(null);
                            setIsModalVisible(false);
                            // Misafir modunu kapat -> Login'e atar
                            dispatch(clearUser());
                          }}
                        >
                          <Text
                            style={[
                              styles.proButtonText,
                              fonts.styles.button,
                              { color: "#fff" },
                            ]}
                          >
                            {t("auth.login_button", "Giriş Yap")}
                          </Text>
                        </Pressable>
                      </View>
                    )}

                    <Pressable
                      style={({ pressed }) => [
                        styles.modalCloseButton,
                        { backgroundColor: colors.textSecondary }, // Gri buton
                        pressed && { opacity: 0.8 },
                      ]}
                      onPress={() => setSelectedAlternative(null)}
                    >
                      <Text style={styles.modalCloseButtonText}>
                        {t("general.close", "Kapat")}
                      </Text>
                    </Pressable>
                  </Pressable>
                </Pressable>
              </Modal>

              <Pressable
                style={({ pressed }) => [
                  styles.modalCloseButton,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.modalCloseButtonText}>
                  {t("general.close", "Kapat")}
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    );
  }
  return (
    <ErrorView
      title={t("results.not_found", "Sonuç Bulunamadı")}
      message={t(
        "results.no_cocktail_msg",
        "Aradığınız kokteyl bilgilerine ulaşılamadı."
      )}
      iconName="search-off"
    />
  );
};

// ... Styles (Aynen Kalabilir, değişen bir şey yok) ...
const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 30,
  },
  image: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
  },
  favoriteOverlay: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
    padding: 8,
  },
  title: {
    margin: 15,
    textAlign: "center",
  },
  section: {
    width: "90%",
    alignSelf: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    marginBottom: 10,
    borderBottomWidth: 1,
    paddingBottom: 5,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  ingredientText: {
    flexShrink: 1,
  },
  prepareButton: {
    marginBottom: 15,
    alignSelf: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 15,
  },
  legendContainer: {
    width: "100%",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  legendTitle: {
    marginBottom: 5,
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
  ingredientButtonText: {},
  modalOverlay2: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent2: {
    width: "80%",
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  proIcon: {
    marginBottom: 10,
  },
  proTitle: {
    marginBottom: 10,
    textAlign: "center",
  },
  proText: {
    textAlign: "center",
    marginBottom: 5,
  },
  altListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    width: "100%",
  },
  altListItemText: {
    marginLeft: 10,
  },
  proLockContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  proLockIcon: {
    marginBottom: 15,
  },
  proButton: {
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 30,
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  proButtonText: {},
  modalCloseButton: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  modalCloseButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CocktailDetailScreen;
