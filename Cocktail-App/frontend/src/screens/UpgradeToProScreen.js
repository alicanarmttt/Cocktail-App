import React, { useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import {
  upgradeToPro,
  getUpgradeStatus,
  getUpgradeError,
} from "../features/userSlice";

/**
 * @desc    "Pro'ya Yükselt" (Sahte Satın Alma) ekranı.
 */
const UpgradeToProScreen = () => {
  const { colors, fonts } = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { t } = useTranslation();

  const upgradeStatus = useSelector(getUpgradeStatus);
  const upgradeError = useSelector(getUpgradeError);

  const handleUpgrade = () => {
    if (upgradeStatus === "loading") return;
    dispatch(upgradeToPro());
  };

  useEffect(() => {
    if (upgradeStatus === "succeeded") {
      Alert.alert(t("upgrade.success_title"), t("upgrade.success_msg"));
      navigation.goBack();
    }
    if (upgradeStatus === "failed") {
      Alert.alert(
        t("general.error"),
        `${t("upgrade.error_msg")}: ${upgradeError}`
      );
    }
  }, [upgradeStatus, navigation, upgradeError, t]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Ionicons name="sparkles" size={64} color={colors.gold} />

      <Text style={[styles.title, { color: colors.text }]}>
        {t("upgrade.title")}
      </Text>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t("upgrade.subtitle")}
      </Text>

      {/* Özellik Listesi */}
      <View style={styles.featuresList}>
        <View style={styles.featureItem}>
          <Ionicons name="star" size={24} color={colors.primary} />
          <Text style={[styles.featureText, { color: colors.text }]}>
            {t("upgrade.feature_1")}
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="filter" size={24} color={colors.primary} />
          <Text style={[styles.featureText, { color: colors.text }]}>
            {t("upgrade.feature_2")}
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons
            name="cloud-upload-outline"
            size={24}
            color={colors.primary}
          />
          <Text style={[styles.featureText, { color: colors.text }]}>
            {t("upgrade.feature_3")}
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons
            name="remove-circle-outline"
            size={24}
            color={colors.primary}
          />
          <Text style={[styles.featureText, { color: colors.text }]}>
            {t("upgrade.feature_4")}
          </Text>
        </View>
      </View>

      {/* Satın Alma Butonu */}
      <Pressable
        style={[
          styles.button,
          { backgroundColor: colors.buttonBg, shadowColor: colors.shadow },
          upgradeStatus === "loading" && styles.buttonDisabled,
        ]}
        onPress={handleUpgrade}
        disabled={upgradeStatus === "loading"}
      >
        {upgradeStatus === "loading" ? (
          <ActivityIndicator color={colors.buttonText} />
        ) : (
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>
            {t("upgrade.buy_btn")}
          </Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 15,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 30,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  featuresList: {
    width: "100%",
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    paddingHorizontal: 10,
  },
  featureText: {
    fontSize: 15,
    marginLeft: 15,
    flex: 1,
    lineHeight: 20,
  },
  button: {
    width: "90%",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    marginTop: "auto", // Butonu aşağı iter
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
    shadowColor: "transparent",
    elevation: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default UpgradeToProScreen;
