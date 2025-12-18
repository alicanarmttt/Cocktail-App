import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// Alt Bileşenler
import AssistantManual from "../components/assistant/AssistantManual";
import AssistantWizard from "../components/assistant/AssistantWizard";

/**
 * @desc    Assistant Main Container
 * @note    Kullanıcıyı karşılar ve "Rehber (Wizard)" veya "Manuel" mod seçimine yönlendirir.
 */
const AssistantScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();

  // Modlar: 'LANDING' | 'WIZARD' | 'MANUAL'
  const [viewMode, setViewMode] = useState("LANDING");

  const handleBackToMode = () => {
    setViewMode("LANDING");
  };

  // --- RENDER: MANUEL MOD ---
  if (viewMode === "MANUAL") {
    return <AssistantManual onBackToMode={handleBackToMode} />;
  }

  // --- RENDER: WIZARD MODU (Placeholder) ---
  if (viewMode === "WIZARD") {
    // Gelecek adımda buraya <AssistantWizard /> gelecek.
    return <AssistantWizard onCancel={handleBackToMode} />;
  }

  // --- RENDER: KARŞILAMA EKRANI (LANDING) ---
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header: Sadece Kapatma Butonu */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.headerBackBtn}
        >
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.content}>
        {/* Başlık ve Açıklama */}
        <View style={styles.textContainer}>
          <Text style={[styles.greetingTitle, { color: colors.primary }]}>
            {t("assistant.landing_title", "Barmen Asistan")}
          </Text>
          <Text style={[styles.greetingSubtitle, { color: colors.text }]}>
            {t("assistant.landing_subtitle", "Bugün modun nasıl?")}
          </Text>
          <Text style={[styles.greetingDesc, { color: colors.textSecondary }]}>
            {t(
              "assistant.landing_desc",
              "İster sana rehberlik edeyim, ister dolabını kendin karıştır."
            )}
          </Text>
        </View>

        {/* Seçim Kartları */}
        <View style={styles.cardsContainer}>
          {/* 1. SİHİRBAZ (GUIDE ME) */}
          <Pressable
            style={({ pressed }) => [
              styles.modeCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.primary, // Vurgulu renk
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
            onPress={() => setViewMode("WIZARD")}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Ionicons name="chatbubbles" size={30} color={colors.primary} />
            </View>
            <View style={styles.cardTextContent}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {t("assistant.mode_wizard", "Bana Rehberlik Et")}
              </Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                {t(
                  "assistant.mode_wizard_desc",
                  "Adım adım sorularla en iyi tarifi bulalım."
                )}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </Pressable>

          {/* 2. MANUEL (PRO) */}
          <Pressable
            style={({ pressed }) => [
              styles.modeCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
            onPress={() => setViewMode("MANUAL")}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.textSecondary + "20" },
              ]}
            >
              <Ionicons name="list" size={30} color={colors.textSecondary} />
            </View>
            <View style={styles.cardTextContent}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {t("assistant.mode_manual", "Kendim Seçerim")}
              </Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                {t(
                  "assistant.mode_manual_desc",
                  "Tüm malzeme listesini göster, ben hallederim."
                )}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "flex-end",
  },
  headerBackBtn: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    paddingBottom: 80,
  },
  textContainer: {
    marginBottom: 40,
  },
  greetingTitle: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 8,
  },
  greetingSubtitle: {
    fontSize: 22, // Biraz küçülttüm
    fontWeight: "600",
    marginBottom: 12,
  },
  greetingDesc: {
    fontSize: 16,
    lineHeight: 24,
  },
  cardsContainer: {
    gap: 20,
  },
  modeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardTextContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default AssistantScreen;
