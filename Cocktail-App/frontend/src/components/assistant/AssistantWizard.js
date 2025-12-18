import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  Dimensions,
} from "react-native";
import { useTheme, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// Redux & Components
import { selectAllIngredients } from "../../features/ingredientSlice";
import { findRecipes } from "../../features/barmenSlice";
import PremiumButton from "../../ui/PremiumButton";

const { width } = Dimensions.get("window");

/**
 * @desc    Barmen Modu (Wizard)
 * 3 Adımda kullanıcıdan malzeme toplar ve sonuç ekranına yönlendirir.
 */
const AssistantWizard = ({ onCancel }) => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  // --- STATE ---
  const [currentStep, setCurrentStep] = useState(1); // 1, 2, 3
  const [selectedIds, setSelectedIds] = useState([]);

  // --- DATA ---
  const allIngredients = useSelector(selectAllIngredients);

  // --- HELPER: İsim Çevirici ---
  const getName = (item) => item.name[i18n.language] || item.name["en"] || "";

  const getCatName = (item) =>
    item.category_name["en"] ? item.category_name["en"].toLowerCase() : "";

  // --- 1. MALZEMELERİ ADIMLARA GÖRE GRUPLA ---
  const stepData = useMemo(() => {
    if (!allIngredients) return [];

    // Filtreleme Anahtar Kelimeleri (Backend verisine göre esnek)
    const spiritKeywords = [
      "spirit",
      "gin",
      "vodka",
      "rum",
      "whisk",
      "tequila",
      "brandy",
      "liqueur",
      "wine",
      "alcohol",
    ];
    const mixerKeywords = [
      "fruit",
      "juice",
      "soft",
      "soda",
      "water",
      "syrup",
      "puree",
      "mixer",
    ];

    // Adım 1: Ana İçkiler
    if (currentStep === 1) {
      return allIngredients.filter((item) => {
        const cat = getCatName(item);
        return spiritKeywords.some((k) => cat.includes(k));
      });
    }

    // Adım 2: Yancılar (Meyve, Gazlı İçecek)
    if (currentStep === 2) {
      return allIngredients.filter((item) => {
        const cat = getCatName(item);
        return mixerKeywords.some((k) => cat.includes(k));
      });
    }

    // Adım 3: Mutfak (Geriye kalan her şey: Şeker, Baharat, Garnish, Süt...)
    if (currentStep === 3) {
      return allIngredients.filter((item) => {
        const cat = getCatName(item);
        const isSpirit = spiritKeywords.some((k) => cat.includes(k));
        const isMixer = mixerKeywords.some((k) => cat.includes(k));
        return !isSpirit && !isMixer; // Diğer ikisine girmeyenler
      });
    }

    return [];
  }, [allIngredients, currentStep]);

  // --- ACTIONS ---
  const toggleSelection = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      return [...prev, id];
    });
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      if (onCancel) onCancel(); // Ana ekrana dön
    }
  };

  const handleFinish = async () => {
    // Seçim yoksa bile boş arama yapmasın diye kontrol edilebilir
    // Ama "Elimde hiçbir şey yok" demek de bir sonuçtur (0 sonuç).
    try {
      await dispatch(
        findRecipes({ inventoryIds: selectedIds, mode: "flexible" })
      ).unwrap();
      navigation.navigate("AssistantResult");
    } catch (err) {
      console.error(err);
    }
  };

  // --- UI TEXTS (Barmen Konuşmaları) ---
  const getBartenderMessage = () => {
    switch (currentStep) {
      case 1:
        return t(
          "wizard.step1_msg",
          "Önce temeli atalım. Hangi sert içkiler var?"
        );
      case 2:
        return t(
          "wizard.step2_msg",
          "Süper. Peki bunları neyle karıştırabiliriz?"
        );
      case 3:
        return t(
          "wizard.step3_msg",
          "Son dokunuşlar. Mutfakta şeker, limon veya buz var mı?"
        );
      default:
        return "";
    }
  };

  // --- RENDER ITEM (Grid Görünüm) ---
  const renderItem = ({ item }) => {
    const isSelected = selectedIds.includes(item.ingredient_id);
    return (
      <Pressable
        style={[
          styles.card,
          {
            backgroundColor: isSelected ? colors.primary + "20" : colors.card,
            borderColor: isSelected ? colors.primary : "transparent",
            borderWidth: 1.5,
          },
        ]}
        onPress={() => toggleSelection(item.ingredient_id)}
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
          {getName(item)}
        </Text>
        {isSelected && (
          <View style={styles.checkIcon}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.primary}
            />
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 1. ÜST KISIM: Barmen Mesajı */}
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
          {/* Adım Göstergesi */}
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

      {/* 2. LİSTE (Grid) */}
      <FlatList
        data={stepData}
        keyExtractor={(item) => item.ingredient_id.toString()}
        numColumns={2} // Grid yapısı
        columnWrapperStyle={{
          justifyContent: "space-between",
          paddingHorizontal: 20,
        }}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text
            style={{
              color: colors.textSecondary,
              textAlign: "center",
              marginTop: 20,
            }}
          >
            {t("wizard.empty_cat", "Bu kategoride malzeme yok.")}
          </Text>
        }
      />

      {/* 3. ALT KISIM: Navigasyon Butonları */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        {/* Geri Butonu */}
        <Pressable onPress={handleBack} style={styles.navBtnSmall}>
          <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
        </Pressable>

        {/* İleri / Bitir Butonu */}
        <PremiumButton
          onPress={handleNext}
          variant="gold"
          style={{ flex: 1, marginLeft: 15 }}
        >
          <Text
            style={{
              fontWeight: "bold",
              color: colors.buttonText,
              fontSize: 16,
            }}
          >
            {currentStep === 3
              ? `${t("wizard.btn_finish", "Kokteylleri Bul")} (${selectedIds.length})`
              : t("wizard.btn_next", "Devam Et")}
          </Text>
          <Ionicons
            name={currentStep === 3 ? "search" : "arrow-forward"}
            size={20}
            color={colors.buttonText}
            style={{ marginLeft: 8 }}
          />
        </PremiumButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bubble: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderTopLeftRadius: 4, // Konuşma balonu efekti
    elevation: 2,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 22,
  },
  // Grid Kartları
  card: {
    width: (width - 55) / 2, // 2 Sütun hesaplaması
    height: 80,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    padding: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  itemText: {
    textAlign: "center",
    fontSize: 15,
  },
  checkIcon: {
    position: "absolute",
    top: 5,
    right: 5,
  },
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
