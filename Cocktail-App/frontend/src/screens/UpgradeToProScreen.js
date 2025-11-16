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
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const dispatch = useDispatch();
  const navigation = useNavigation();

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
      Alert.alert("Tebrikler!", "Başarıyla Pro üyeliğe yükseltildiniz.");
      // Kullanıcıyı (artık "PRO ÜYE" rozetini göreceği)
      // Profil ekranına geri gönder
      navigation.goBack();
    }
    // API isteği başarısız olduysa ('rejected')
    if (upgradeStatus === "failed") {
      Alert.alert(
        "Hata",
        `Yükseltme sırasında bir hata oluştu: ${upgradeError}`
      );
    }
  }, [upgradeStatus, navigation, upgradeError]); // Bu değerler değiştiğinde effect'i çalıştır

  return (
    <SafeAreaView style={styles.container}>
      <Ionicons name="sparkles" size={64} color="#FFD700" />
      <Text style={styles.title}>PRO Üyeliğe Geçin</Text>
      <Text style={styles.subtitle}>
        Kokteyl deneyiminizi bir üst seviyeye taşıyın.
      </Text>

      {/* Özellik Listesi */}
      <View style={styles.featuresList}>
        <View style={styles.featureItem}>
          <Ionicons name="star" size={24} color="#f4511e" />
          <Text style={styles.featureText}>
            Akıllı Alternatifler (Votka yerine Cin? Lime yerine Limon?)
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="filter" size={24} color="#f4511e" />
          <Text style={styles.featureText}>
            "Barmen Asistanı"nda gelişmiş filtreleme
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="cloud-upload-outline" size={24} color="#f4511e" />
          <Text style={styles.featureText}>
            Özel tariflerinizi kaydetme ve paylaşma (Çok Yakında)
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="remove-circle-outline" size={24} color="#f4511e" />
          <Text style={styles.featureText}>Reklamsız Deneyim</Text>
        </View>
      </View>

      {/* Sahte Satın Alma Butonu */}
      <Pressable
        style={[
          styles.button,
          upgradeStatus === "loading" && styles.buttonDisabled,
        ]}
        onPress={handleUpgrade} // 'upgradeToPro' thunk'ını (API isteği) tetikler
        disabled={upgradeStatus === "loading"}
      >
        {upgradeStatus === "loading" ? (
          <ActivityIndicator color="#333" />
        ) : (
          <Text style={styles.buttonText}>1 Yıllık PRO Satın Al (Test)</Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
    marginTop: 15,
  },
  subtitle: {
    fontSize: 16,
    color: "#777",
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
    color: "#333",
    marginLeft: 15,
    flex: 1, // Metnin (ikonun yanına) düzgünce sığmasını sağlar
  },
  button: {
    width: "90%",
    backgroundColor: "#FFD700", // Altın (Gold) "Pro" rengi
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
    shadowColor: "transparent",
    elevation: 0,
  },
  buttonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default UpgradeToProScreen;
