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
} from "react-native";
import { useTheme, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// --- REDUX IMPORTS ---
import {
  fetchGuideStep1,
  fetchGuideStep2,
  fetchWizardResults, // <--- 1. DEĞİŞİKLİK: YENİ FONKSİYONU IMPORT ETTİK
  selectGuideStep1,
  selectGuideStep2,
  getGuideStatus,
  clearGuideData,
} from "../../features/barmenSlice";

import PremiumButton from "../../ui/PremiumButton";

const { width } = Dimensions.get("window");

const AssistantWizard = ({ onCancel }) => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  // --- STATE ---
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFamilyKey, setSelectedFamilyKey] = useState(null);
  const [selectedIngredientIds, setSelectedIngredientIds] = useState([]);

  // --- SELECTORS ---
  const step1Options = useSelector(selectGuideStep1);
  const step2Options = useSelector(selectGuideStep2);
  const status = useSelector(getGuideStatus);

  // --- INIT ---
  useEffect(() => {
    dispatch(fetchGuideStep1(i18n.language));
    return () => {
      dispatch(clearGuideData());
    };
  }, [dispatch, i18n.language]);

  // --- HANDLERS ---

  const handleSelectFamily = async (familyKey) => {
    setSelectedFamilyKey(familyKey);
    await dispatch(fetchGuideStep2({ family: familyKey, lang: i18n.language }));
    setCurrentStep(2);
  };

  const toggleIngredientSelection = (id) => {
    setSelectedIngredientIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      return [...prev, id];
    });
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      setSelectedIngredientIds([]);
      setSelectedFamilyKey(null);
    } else {
      if (onCancel) onCancel();
    }
  };

  // --- 2. DEĞİŞİKLİK: FİNİŞ FONKSİYONU GÜNCELLENDİ ---
  const handleFinish = async () => {
    try {
      // Flexible (findRecipes) yerine, Aile bilgisini de işleyen yeni fonksiyonu çağırıyoruz.
      await dispatch(
        fetchWizardResults({
          family: selectedFamilyKey, // Örn: "whiskey"
          selectedIds: selectedIngredientIds, // Örn: [12, 55] (Seçilen Yancılar)
        })
      ).unwrap();

      // Sonuçlar Redux'a yüklendi, şimdi sonuç ekranına git
      navigation.navigate("AssistantResult");
    } catch (err) {
      console.error("Arama hatası:", err);
    }
  };

  // --- UI PART (Aynen Kalıyor) ---
  const getBartenderMessage = () => {
    if (status === "loading")
      return t("wizard.thinking", "Hımm, mahzene bakıyorum...");

    switch (currentStep) {
      case 1:
        return t(
          "wizard.step1_msg",
          "Hoş geldin! Bugün temel olarak ne içmek istersin?"
        );
      case 2:
        return t(
          "wizard.step2_msg",
          "Harika seçim! Peki yanında bunlardan hangileri var?"
        );
      default:
        return "";
    }
  };

  const renderFamilyItem = ({ item }) => {
    const isSelected = selectedFamilyKey === item.key;
    return (
      <Pressable
        style={[styles.cardBig, isSelected && styles.cardSelected]}
        onPress={() => handleSelectFamily(item.key)}
      >
        <Ionicons
          name={isSelected ? "radio-button-on" : "radio-button-off"}
          size={24}
          color={isSelected ? colors.primary : colors.textSecondary}
          style={{ marginBottom: 10 }}
        />
        <Text
          style={[
            styles.cardBigTitle,
            { color: isSelected ? colors.primary : colors.text },
          ]}
        >
          {item.name}
        </Text>
      </Pressable>
    );
  };

  const renderIngredientItem = ({ item }) => {
    const isSelected = selectedIngredientIds.includes(item.ingredient_id);
    return (
      <Pressable
        style={[
          styles.cardSmall,
          {
            backgroundColor: isSelected ? colors.primary + "20" : colors.card,
            borderColor: isSelected ? colors.primary : "transparent",
            borderWidth: 1.5,
          },
        ]}
        onPress={() => toggleIngredientSelection(item.ingredient_id)}
      >
        <Text
          style={[
            styles.itemText,
            {
              color: isSelected ? colors.primary : colors.text,
              fontWeight: isSelected ? "700" : "500",
            },
          ]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        {isSelected && (
          <View style={styles.checkIcon}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={colors.primary}
            />
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.chatContainer}>
        <View
          style={[styles.avatarCircle, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="wine" size={24} color="#FFF" />
        </View>
        <View style={[styles.bubble, { backgroundColor: colors.card }]}>
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
            {currentStep} / 2
          </Text>
        </View>
      </View>

      {status === "loading" ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={currentStep === 1 ? step1Options : step2Options}
          keyExtractor={(item) =>
            currentStep === 1 ? item.key : item.ingredient_id.toString()
          }
          numColumns={2}
          columnWrapperStyle={{
            justifyContent: "space-between",
            paddingHorizontal: 20,
          }}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
          renderItem={
            currentStep === 1 ? renderFamilyItem : renderIngredientItem
          }
          ListEmptyComponent={
            <Text
              style={{
                color: colors.textSecondary,
                textAlign: "center",
                marginTop: 20,
              }}
            >
              {t("wizard.no_data", "Seçenek bulunamadı.")}
            </Text>
          }
        />
      )}

      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <Pressable onPress={handleBack} style={styles.navBtnSmall}>
          <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
        </Pressable>

        {currentStep === 2 && (
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
              {t("wizard.btn_finish", "Kokteylleri Bul")} (
              {selectedIngredientIds.length})
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
  chatContainer: {
    flexDirection: "row",
    padding: 20,
    alignItems: "flex-start",
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    elevation: 4,
  },
  bubble: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    elevation: 2,
  },
  bubbleText: { fontSize: 16, lineHeight: 22 },
  cardBig: {
    width: (width - 55) / 2,
    height: 110,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#fff",
    elevation: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardSelected: { borderColor: "#FFD700", backgroundColor: "#FFFBE6" },
  cardBigTitle: { fontSize: 18, fontWeight: "bold", textAlign: "center" },
  cardSmall: {
    width: (width - 55) / 2,
    height: 70,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    padding: 8,
    elevation: 1,
  },
  itemText: { textAlign: "center", fontSize: 14 },
  checkIcon: { position: "absolute", top: 4, right: 4 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    alignItems: "center",
  },
  navBtnSmall: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
  },
});

export default AssistantWizard;
