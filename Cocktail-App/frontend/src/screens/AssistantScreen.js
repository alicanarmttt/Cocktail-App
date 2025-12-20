import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// Alt Bileşenler
import AssistantManual from "../components/assistant/AssistantManual";
import AssistantWizard from "../components/assistant/AssistantWizard";

const BarmenMascot = require("../../assets/barmen_mascot.png");
const BarShelf = require("../../assets/bar_shelf.png");

/**
 * @desc    Assistant Main Container
 * @note    Kullanıcıyı karşılar ve "Rehber (Wizard)" veya "Manuel" mod seçimine yönlendirir.
 */
const AssistantScreen = () => {
  const { colors, dark } = useTheme(); // Dark mod kontrolü için 'dark' eklendi
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

  // --- RENDER: WIZARD MODU ---
  if (viewMode === "WIZARD") {
    return <AssistantWizard onCancel={handleBackToMode} />;
  }

  // --- RENDER: KARŞILAMA EKRANI (LANDING) ---
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* HEADER (ÇARPI BUTONU) KALDIRILDI */}

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
                borderColor: colors.primary,
                borderWidth: 1.5, // Daha belirgin çerçeve
                transform: [{ scale: pressed ? 0.98 : 1 }],
                // 3D EFEKTİ (GÖLGE)
                shadowColor: dark ? "#000" : colors.primary, // Light modda hafif renkli gölge
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: dark ? 0.4 : 0.15,
                shadowRadius: 12,
                elevation: 10, // Android için güçlü derinlik
              },
            ]}
            onPress={() => setViewMode("WIZARD")}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.primary + "15" }, // Daha soft zemin
              ]}
            >
              <Image
                source={BarmenMascot}
                style={{ width: 70, height: 70 }}
                resizeMode="contain"
              />
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
                borderWidth: 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
                // 3D EFEKTİ
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: dark ? 0.3 : 0.08,
                shadowRadius: 8,
                elevation: 6,
              },
            ]}
            onPress={() => setViewMode("MANUAL")}
          >
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: colors.textSecondary + "10",
                  overflow: "hidden",
                },
              ]}
            >
              <Image
                source={BarShelf}
                style={{
                  width: 55,
                  height: 55,
                  opacity: 0.8,
                }}
                resizeMode="contain"
              />
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    // justifyContent: "center" KALDIRILDI -> İçerik yukarı taşındı
    paddingTop: 60, // Üstten ideal boşluk
  },
  textContainer: {
    marginBottom: 50, // Başlık ile kartlar arasını biraz açtık
  },
  greetingTitle: {
    fontSize: 34, // Biraz daha büyük ve iddialı
    fontWeight: "800",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  greetingSubtitle: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 12,
  },
  greetingDesc: {
    fontSize: 16,
    lineHeight: 24,
    width: "90%", // Metnin çok yayılmasını engeller
  },
  cardsContainer: {
    gap: 24, // Kartlar arası boşluk artırıldı
  },
  modeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 22, // İç dolgu artırıldı
    borderRadius: 24,
    // Shadow özellikleri inline style içinde yönetiliyor (Theme uyumu için)
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 18,
  },
  cardTextContent: {
    flex: 1,
    paddingRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
});

export default AssistantScreen;
