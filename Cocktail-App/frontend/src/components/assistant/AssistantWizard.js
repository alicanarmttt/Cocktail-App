import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
} from "react-native";
import { useTheme, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

// --- REDUX IMPORTS ---
import {
  fetchGuideStep1,
  fetchGuideStep2,
  fetchGuideStep3,
  fetchWizardResults,
  selectGuideStep1,
  selectGuideStep2,
  selectGuideStep3,
  getGuideStatus,
  clearGuideData,
} from "../../features/barmenSlice";

import PremiumButton from "../../ui/PremiumButton";

const BarmenMascot = require("../../../assets/barmen_mascot.png");
const { width } = Dimensions.get("window");

const AssistantWizard = ({ onCancel }) => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  // --- STATE ---
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFamilyKey, setSelectedFamilyKey] = useState(null);

  const [step2Selection, setStep2Selection] = useState([]);
  const [step3Selection, setStep3Selection] = useState([]);

  // --- SELECTORS ---
  const step1Options = useSelector(selectGuideStep1);
  const step2Options = useSelector(selectGuideStep2);
  const step3Options = useSelector(selectGuideStep3);
  const status = useSelector(getGuideStatus);

  // --- INIT ---
  useEffect(() => {
    dispatch(fetchGuideStep1(i18n.language));
    return () => {
      dispatch(clearGuideData());
    };
  }, [dispatch, i18n.language]);

  // --- HELPER: Titreşim ---
  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // --- HANDLERS ---
  const handleSelectFamily = async (familyKey) => {
    triggerHaptic();
    setSelectedFamilyKey(familyKey);
    await dispatch(fetchGuideStep2({ family: familyKey, lang: i18n.language }));
    setCurrentStep(2);
  };

  const handleNextToStep3 = async () => {
    triggerHaptic();
    await dispatch(
      fetchGuideStep3({
        family: selectedFamilyKey,
        step2Ids: step2Selection,
        lang: i18n.language,
      })
    );
    setCurrentStep(3);
  };

  const handleFinish = async () => {
    triggerHaptic();
    try {
      const totalInventory = [...step2Selection, ...step3Selection];
      await dispatch(
        fetchWizardResults({
          family: selectedFamilyKey,
          selectedIds: totalInventory,
        })
      ).unwrap();

      navigation.navigate("AssistantResult");
    } catch (err) {
      console.error("Arama hatası:", err);
    }
  };

  const toggleIngredientSelection = (id) => {
    triggerHaptic();
    if (currentStep === 2) {
      setStep2Selection((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else if (currentStep === 3) {
      setStep3Selection((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    }
  };

  const handleBack = () => {
    if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(1);
      setStep2Selection([]);
      setSelectedFamilyKey(null);
    } else {
      if (onCancel) onCancel();
    }
  };

  // --- UI PART ---
  const getBartenderMessage = () => {
    if (status === "loading")
      return t("assistant.wizard.thinking", "Hımm, mahzene bakıyorum...");

    switch (currentStep) {
      case 1:
        return t(
          "assistant.wizard.step1_msg",
          "Hoş geldin! Bugün temel olarak ne içmek istersin?"
        );
      case 2:
        return t(
          "assistant.wizard.step2_msg",
          "Harika! Peki eşlikçi olarak elinde hangi şişeler var?"
        );
      case 3:
        return t(
          "assistant.wizard.step3_msg",
          "Son olarak, dolapta taze meyve veya kiler malzemesi var mı?"
        );
      default:
        return "";
    }
  };

  const getCurrentData = () => {
    if (currentStep === 1) return step1Options;
    if (currentStep === 2) return step2Options;
    return step3Options;
  };

  // --- RENDERERS ---

  // ADIM 1: Ana İçkiler (Hero Cards - İKONSUZ & KOMPAKT)
  const renderFamilyItem = ({ item }) => {
    const isSelected = selectedFamilyKey === item.key;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.cardBig,
          {
            backgroundColor: isSelected ? colors.primary + "10" : colors.card,
            borderColor: isSelected ? colors.primary : "transparent",
            borderWidth: isSelected ? 2 : 0,
            transform: [{ scale: pressed ? 0.96 : 1 }],
            shadowOpacity: isSelected ? 0 : 0.08,
            elevation: isSelected ? 0 : 4,
          },
        ]}
        onPress={() => handleSelectFamily(item.key)}
      >
        <Text
          style={[
            styles.cardBigTitle,
            {
              color: isSelected ? colors.primary : colors.text,
              fontWeight: isSelected ? "800" : "600",
              fontSize: isSelected ? 18 : 17,
            },
          ]}
        >
          {item.name}
        </Text>

        {isSelected && (
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.primary,
              marginTop: 8,
            }}
          />
        )}
      </Pressable>
    );
  };

  // ADIM 2 & 3: Malzemeler
  const renderIngredientItem = ({ item }) => {
    const isSelected =
      currentStep === 2
        ? step2Selection.includes(item.ingredient_id)
        : step3Selection.includes(item.ingredient_id);

    return (
      <Pressable
        style={({ pressed }) => [
          styles.cardSmall,
          {
            backgroundColor: isSelected ? colors.primary : colors.card,
            borderColor: isSelected ? colors.primary : "transparent",
            transform: [{ scale: pressed ? 0.97 : 1 }],
            shadowOpacity: isSelected ? 0.3 : 0.05,
            shadowColor: isSelected ? colors.primary : "#000",
            elevation: isSelected ? 8 : 2,
          },
        ]}
        onPress={() => toggleIngredientSelection(item.ingredient_id)}
      >
        <View style={styles.cardContentRow}>
          <Text
            style={[
              styles.itemText,
              {
                color: isSelected ? "#FFF" : colors.text,
                fontWeight: isSelected ? "700" : "500",
                flex: 1,
              },
            ]}
            numberOfLines={2}
          >
            {item.name}
          </Text>

          <Ionicons
            name={isSelected ? "checkmark-circle" : "add-circle-outline"}
            size={22}
            color={isSelected ? "#FFF" : colors.textSecondary}
            style={{ marginLeft: 8 }}
          />
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 1. CHAT ALANI */}
      <View style={styles.chatContainer}>
        <View
          style={[styles.avatarCircle, { backgroundColor: colors.primary }]}
        >
          <Image
            source={BarmenMascot}
            style={{ width: 60, height: 60 }}
            resizeMode="contain"
          />
        </View>
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.bubbleText, { color: colors.text }]}>
            {getBartenderMessage()}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.textSecondary,
              marginTop: 5,
              textAlign: "right",
            }}
          >
            {currentStep} / 3
          </Text>
        </View>
      </View>

      {/* 2. LİSTE ALANI */}
      {status === "loading" ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={getCurrentData()}
          keyExtractor={(item) =>
            currentStep === 1 ? item.key : item.ingredient_id.toString()
          }
          numColumns={2}
          columnWrapperStyle={{
            justifyContent: "space-between",
            paddingHorizontal: 20,
          }}
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }}
          renderItem={
            currentStep === 1 ? renderFamilyItem : renderIngredientItem
          }
          ListEmptyComponent={
            <Text
              style={{
                color: colors.textSecondary,
                textAlign: "center",
                marginTop: 40,
                fontSize: 16,
              }}
            >
              {t("assistant.wizard.no_data", "Seçenek bulunamadı.")}
            </Text>
          }
        />
      )}

      {/* 3. FOOTER */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.05,
            shadowRadius: 5,
            elevation: 10,
          },
        ]}
      >
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.navBtnSmall,
            { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>

        {/* --- YENİ EKLENEN KISIM: ADIM 1 İÇİN İPUCU NOTU --- */}
        {currentStep === 1 && (
          <View style={styles.step1HintContainer}>
            <Text
              style={[styles.step1HintText, { color: colors.textSecondary }]}
            >
              {t("assistant.wizard_step1_hint", "Seçim yapmak için dokun")}
            </Text>
          </View>
        )}

        {currentStep === 2 && (
          <PremiumButton
            onPress={handleNextToStep3}
            variant="outline"
            disabled={status === "loading"}
            style={{ flex: 1, marginLeft: 15 }}
          >
            {/* GÜNCELLEME: Rengi colors.primary yaptık */}
            <Text
              style={{
                fontWeight: "bold",
                color: colors.primary,
                fontSize: 16,
              }}
            >
              {t("assistant.wizard.btn_next", "Devam Et")} (
              {step2Selection.length})
            </Text>
            {/* İkon rengini de uyumlu yaptık */}
            <Ionicons
              name="arrow-forward"
              size={20}
              color={colors.primary}
              style={{ marginLeft: 8 }}
            />
          </PremiumButton>
        )}

        {currentStep === 3 && (
          <PremiumButton
            onPress={handleFinish}
            variant="gold"
            disabled={status === "loading"}
            style={{ flex: 1, marginLeft: 15 }}
          >
            <Text
              style={{
                fontWeight: "bold",
                color: colors.buttonText,
                fontSize: 16,
              }}
            >
              {t("assistant.wizard.btn_finish", "Kokteylleri Bul")}
            </Text>
            <Ionicons
              name="search"
              size={20}
              color={colors.buttonText}
              style={{ marginLeft: 8 }}
            />
          </PremiumButton>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerLoading: { flex: 1, justifyContent: "center", alignItems: "center" },

  // CHAT ALANI
  chatContainer: {
    flexDirection: "row",
    padding: 20,
    alignItems: "center",
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  bubble: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderTopLeftRadius: 2,
    borderWidth: 1,
    borderBottomWidth: 2,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  bubbleText: { fontSize: 16, lineHeight: 22 },

  // ADIM 1 KARTLARI
  cardBig: {
    width: (width - 55) / 2,
    height: 90,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  cardBigTitle: {
    textAlign: "center",
  },

  // ADIM 2-3 KARTLARI
  cardSmall: {
    width: (width - 55) / 2,
    height: 75,
    borderRadius: 16,
    justifyContent: "center",
    marginBottom: 12,
    paddingHorizontal: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  cardContentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  itemText: {
    fontSize: 14,
    textAlign: "left",
  },

  // FOOTER & HINT
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
    borderTopWidth: 1,
    alignItems: "center",
  },
  navBtnSmall: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  // Step 1 Hint Alanı
  step1HintContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.7,
    paddingLeft: 15,
  },
  step1HintText: {
    fontSize: 14,
    fontStyle: "italic",
    fontWeight: "500",
  },
});

export default AssistantWizard;
