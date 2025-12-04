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
import { useTranslation } from "react-i18next"; // 1. Çeviri kancasını ekle
// 1. userSlice'tan (sağdaki) 'upgrade' (yükseltme) eylemini ve 'status'ü (durum) import et
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
  const { t } = useTranslation(); // 2. Çeviri fonksiyonunu al
  // 2. 'upgradeToPro' thunk'ının (API isteği) durumunu (state) Redux'tan oku
  const upgradeStatus = useSelector(getUpgradeStatus);
  const upgradeError = useSelector(getUpgradeError);

  /**
   * @desc  "Satın Al" butonuna basıldığında 'upgradeToPro' thunk'ını (API isteği) tetikler
   */
  const handleUpgrade = () => {
    // Zaten 'loading' (yükleniyor) ise tekrar basmayı engelle
    if (upgradeStatus === "loading") return;

    // 'userSlice'taki (sağdaki) 'upgradeToPro' thunk'ını çağır
    dispatch(upgradeToPro());
  };

  // 3. 'upgradeStatus' (Yükseltme Durumu) değişimlerini izle (dinle)
  useEffect(() => {
    // API isteği başarıyla tamamlandıysa ('fulfilled')
    if (upgradeStatus === "succeeded") {
      Alert.alert(
        t("upgrade.success_title") || "Tebrikler!",
        t("upgrade.success_msg") || "Başarıyla Pro üyeliğe yükseltildiniz."
      );
      // Kullanıcıyı (artık "PRO ÜYE" rozetini göreceği)
      // Profil ekranına geri gönder
      navigation.goBack();
    }
    // API isteği başarısız olduysa ('rejected')
    if (upgradeStatus === "failed") {
      Alert.alert(
        t("general.error") || "Hata",
        `${t("upgrade.error_msg") || "Yükseltme sırasında bir hata oluştu"}: ${upgradeError}`
      );
    }
  }, [upgradeStatus, navigation, upgradeError, t]); // Bu değerler değiştiğinde effect'i çalıştır

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Ionicons name="sparkles" size={64} color={colors.gold} />
      <Text style={[styles.title, { color: colors.text }]}>
        {t("upgrade.title") || "PRO Üyeliğe Geçin"}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t("upgrade.subtitle") ||
          "Kokteyl deneyiminizi bir üst seviyeye taşıyın."}
      </Text>

      {/* Özellik Listesi */}
      <View style={styles.featuresList}>
        <View style={styles.featureItem}>
          <Ionicons name="star" size={24} color={colors.primary} />
          <Text style={[styles.featureText, { color: colors.text }]}>
            {t("upgrade.feature_1") ||
              "Akıllı Alternatifler (Votka yerine Cin? Lime yerine Limon?)"}
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="filter" size={24} color={colors.primary} />
          <Text style={[styles.featureText, { color: colors.text }]}>
            {t("upgrade.feature_2") ||
              '"Barmen Asistanı"nda gelişmiş filtreleme'}
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons
            name="cloud-upload-outline"
            size={24}
            color={colors.primary}
          />
          <Text style={[styles.featureText, { color: colors.text }]}>
            {t("upgrade.feature_3") ||
              "Özel tariflerinizi kaydetme ve paylaşma (Çok Yakında)"}
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons
            name="remove-circle-outline"
            size={24}
            color={colors.primary}
          />
          <Text style={[styles.featureText, { color: colors.text }]}>
            {t("upgrade.feature_4") || "Reklamsız Deneyim"}
          </Text>
        </View>
      </View>

      {/* Sahte Satın Alma Butonu */}
      <Pressable
        style={[
          styles.button,
          { backgroundColor: colors.buttonBg, shadowColor: colors.shadow },
          upgradeStatus === "loading" && styles.buttonDisabled,
        ]}
        onPress={handleUpgrade} // 'upgradeToPro' thunk'ını (API isteği) tetikler
        disabled={upgradeStatus === "loading"}
      >
        {upgradeStatus === "loading" ? (
          <ActivityIndicator color={colors.buttonText} />
        ) : (
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>
            {t("upgrade.buy_btn") || "1 Yıllık PRO Satın Al (Test)"}
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
  },
  subtitle: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 30,
    textAlign: "center",
  },
  featuresList: {
    width: "100%",
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  featureText: {
    fontSize: 15,
    marginLeft: 15,
    flex: 1, // Metnin (ikonun yanına) düzgünce sığmasını sağlar
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
