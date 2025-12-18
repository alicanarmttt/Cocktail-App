import React, { useState, useMemo } from "react";
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

// Redux
import { selectAllIngredients } from "../../features/ingredientSlice";
// DİKKAT: barmenSlice içinden yeni aksiyonları çekiyoruz
import {
  findRecipes,
  fetchMenuHints,
  selectHints,
  getHintsStatus,
  clearHints,
} from "../../features/barmenSlice";
import PremiumButton from "../../ui/PremiumButton";

const { width } = Dimensions.get("window");

/**
 * @desc    YENİ NESİL BARMEN MODU (Smart Contextual Wizard)
 * Adım 1: Ana Grupları Gösterir (Backend'den bağımsız Frontend Gruplaması)
 * Adım 2 & 3: Seçilen gruba uygun "Akıllı Öneriler" sunar (Backend /hints endpoint'i)
 */
const AssistantWizard = ({ onCancel }) => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  // --- STATE ---
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]); // Tüm adımlarda toplanan ID'ler

  // --- DATA ---
  const allIngredients = useSelector(selectAllIngredients);
  const hints = useSelector(selectHints); // Backend'den gelen akıllı öneriler
  const hintsStatus = useSelector(getHintsStatus);

  // --- HELPER: Çeviri ---
  const getName = (item) => item.name[i18n.language] || item.name["en"] || "";
  const getCatName = (item) =>
    item.category_name["en"] ? item.category_name["en"].toLowerCase() : "";

  // --- ADIM 1: GRUPLAMA MANTIĞI (PARENT GROUPS) ---
  const groupData = useMemo(() => {
    if (currentStep !== 1 || !allIngredients) return [];

    // Ana İçki Ailelerini Tanımlıyoruz
    const GROUPS = [
      { id: "gin", label: "Cin", keywords: ["gin"] },
      { id: "vodka", label: "Votka", keywords: ["vodka"] },
      {
        id: "whiskey",
        label: "Viski",
        keywords: ["whisk", "scotch", "bourbon", "rye"],
      },
      { id: "rum", label: "Rom", keywords: ["rum", "bacardi"] },
      { id: "tequila", label: "Tekila", keywords: ["tequila", "mezcal"] },
      { id: "brandy", label: "Konyak", keywords: ["brandy", "cognac"] },
      { id: "wine", label: "Şarap", keywords: ["wine", "champagne"] },
    ];

    // Her grup için veritabanındaki karşılık gelen ID'leri buluyoruz
    return GROUPS.map((group) => {
      const matchingIngredients = allIngredients.filter((item) => {
        const cat = getCatName(item);
        const name = getName(item).toLowerCase();
        // Hem kategoriye hem isme bakıyoruz
        return group.keywords.some((k) => cat.includes(k) || name.includes(k));
      });

      // Sadece en az 1 tane malzemesi veritabanında olan grupları göster
      if (matchingIngredients.length === 0) return null;

      return {
        ...group,
        ingredientIds: matchingIngredients.map((i) => i.ingredient_id), // Bu grubun tüm ID paketleri
        count: matchingIngredients.length,
      };
    }).filter(Boolean); // Boşları at
  }, [allIngredients, currentStep, i18n.language]);

  // --- ADIM 2 & 3: HINTS FİLTRELEME (Backend Verisiyle) ---
  const hintData = useMemo(() => {
    if (!hints) return [];

    const mixerKeywords = [
      "liqueur",
      "vermouth",
      "aperitif",
      "syrup",
      "juice",
      "soda",
      "water",
      "tonic",
      "bitter",
      "mixer",
    ];

    // Adım 2: Karıştırıcılar (Mixers & Modifiers)
    if (currentStep === 2) {
      return hints.filter((item) => {
        const cat = getCatName(item);
        return mixerKeywords.some((k) => cat.includes(k));
      });
    }

    // Adım 3: Mutfak & Süs (Pantry)
    if (currentStep === 3) {
      return hints.filter((item) => {
        const cat = getCatName(item);
        // Mixer değilse buradadır (Meyve, Ot, Şeker vb.)
        return !mixerKeywords.some((k) => cat.includes(k));
      });
    }

    return [];
  }, [hints, currentStep]);

  // --- ACTIONS ---

  // Adım 1 için: Grubu seç/kaldır
  const toggleGroupSelection = (groupIds) => {
    // Basılan grubun ID'leri zaten seçili mi?
    const isSelected = groupIds.every((id) => selectedIds.includes(id));

    if (isSelected) {
      // Çıkar
      setSelectedIds((prev) => prev.filter((id) => !groupIds.includes(id)));
    } else {
      // Ekle (Mevcutları koru, yenileri ekle, duplicate önle)
      const uniqueIds = [...new Set([...selectedIds, ...groupIds])];
      setSelectedIds(uniqueIds);
    }
  };

  // Adım 2 ve 3 için: Tekil malzeme seçimi
  const toggleIngredientSelection = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      return [...prev, id];
    });
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      // Step 1 bitti, Backend'e sor: "Bu içkilerle ne gider?"
      if (selectedIds.length === 0) {
        // Uyarı vermek yerine devam ettirmiyoruz, basit bir alert veya UI feedback eklenebilir.
        // Şimdilik alert koyalım (veya toast)
        // alert("Lütfen en az bir içki grubu seçin.");
        return;
      }

      // Hintleri Getir (Redux Action)
      await dispatch(fetchMenuHints(selectedIds));
      setCurrentStep(2);
    } else if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      // Geri gelince Hintleri silmeye gerek yok, cache gibi kalsın.
    } else {
      dispatch(clearHints()); // Çıkarken temizle
      if (onCancel) onCancel();
    }
  };

  const handleFinish = async () => {
    try {
      await dispatch(
        findRecipes({ inventoryIds: selectedIds, mode: "flexible" })
      ).unwrap();
      navigation.navigate("AssistantResult");
    } catch (err) {
      console.error(err);
    }
  };

  // --- UI TEXTS ---
  const getBartenderMessage = () => {
    if (hintsStatus === "loading")
      return t("wizard.thinking", "Hımm, bir saniye düşünüyorum...");

    switch (currentStep) {
      case 1:
        return t(
          "wizard.step1_msg",
          "Önce temeli atalım. Elinde hangi ana içki aileleri var?"
        );
      case 2:
        return t(
          "wizard.step2_msg",
          "Güzel seçim. Bunlara uygun şu yan malzemelerden hangileri var?"
        );
      case 3:
        return t(
          "wizard.step3_msg",
          "Son dokunuşlar. Mutfakta veya dolapta şunlar bulunuyor mu?"
        );
      default:
        return "";
    }
  };

  // --- RENDER ---

  // Render Item: Adım 1 (Grup Kartları - BÜYÜK)
  const renderGroupItem = ({ item }) => {
    const isSelected = item.ingredientIds.every((id) =>
      selectedIds.includes(id)
    );

    return (
      <Pressable
        style={[styles.cardBig, isSelected && styles.cardSelected]}
        onPress={() => toggleGroupSelection(item.ingredientIds)}
      >
        <Ionicons
          name={isSelected ? "checkmark-circle" : "radio-button-off"}
          size={24}
          color={isSelected ? colors.primary : colors.textSecondary}
        />
        <Text
          style={[
            styles.cardBigTitle,
            { color: isSelected ? colors.primary : colors.text },
          ]}
        >
          {item.label}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary }}>
          {item.count} {t("wizard.varieties", "çeşit")}
        </Text>
      </Pressable>
    );
  };

  // Render Item: Adım 2 & 3 (Malzeme Kartları - KÜÇÜK)
  const renderIngredientItem = ({ item }) => {
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
      {/* CHAT BUBBLE */}
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
            {currentStep} / 3
          </Text>
        </View>
      </View>

      {/* CONTENT AREA */}
      {hintsStatus === "loading" ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          // Step 1 ise Grup verisini, değilse Hint verisini kullan
          data={currentStep === 1 ? groupData : hintData}
          keyExtractor={(item) =>
            currentStep === 1 ? item.id : item.ingredient_id.toString()
          }
          numColumns={2}
          columnWrapperStyle={{
            justifyContent: "space-between",
            paddingHorizontal: 20,
          }}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
          renderItem={
            currentStep === 1 ? renderGroupItem : renderIngredientItem
          }
          ListEmptyComponent={
            <Text
              style={{
                color: colors.textSecondary,
                textAlign: "center",
                marginTop: 20,
              }}
            >
              {currentStep === 1
                ? t("wizard.no_ingredients", "Malzeme verisi yüklenemedi.")
                : t(
                    "wizard.no_hints",
                    "Bu seçimlere uygun ek malzeme gerekmiyor veya bulunamadı. Devam edebilirsiniz."
                  )}
            </Text>
          }
        />
      )}

      {/* FOOTER */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <Pressable onPress={handleBack} style={styles.navBtnSmall}>
          <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
        </Pressable>

        <PremiumButton
          onPress={handleNext}
          variant="gold"
          disabled={hintsStatus === "loading"}
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
  container: { flex: 1 },
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

  // Step 1: Büyük Grup Kartları
  cardBig: {
    width: (width - 55) / 2,
    height: 100,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "transparent",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
  },
  cardSelected: {
    borderColor: "#FFD700", // Gold veya Primary color
    backgroundColor: "#FFD700" + "10", // %10 opacity
  },
  cardBigTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
  },

  // Step 2-3: Küçük Malzeme Kartları
  card: {
    width: (width - 55) / 2,
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
  },
  itemText: { textAlign: "center", fontSize: 15 },
  checkIcon: { position: "absolute", top: 5, right: 5 },

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
