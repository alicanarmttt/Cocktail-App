import React from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

// 1. userSlice'tan (sağdaki) gerekli selector ve action'ları import et
import {
  selectCurrentUser,
  selectIsPro,
  clearUser,
} from "../features/userSlice";

// 2. Firebase Auth (Çıkış) servisini import et
import { auth } from "../api/firebaseConfig";
import { signOut } from "firebase/auth";

/**
 * @desc    Kullanıcı profilini gösterir, "Çıkış Yap" (Logout)
 * ve "Pro'ya Yükselt" işlemlerini yönetir.
 */
const ProfileScreen = () => {
  const dispatch = useDispatch();
  // 3. Redux'tan mevcut kullanıcıyı ve Pro durumunu oku
  const currentUser = useSelector(selectCurrentUser);
  const isPro = useSelector(selectIsPro);

  /**
   * @desc  Kullanıcıyı hem Firebase'den (Servis) hem de
   * Redux'tan (Lokal State) çıkarır.
   */
  const handleLogout = async () => {
    try {
      // 1. Adım: Firebase servisinden (buluttan) çıkış yap
      await signOut(auth);

      // 2. Adım: Redux state'ini (lokal) temizle
      // (Bu, AppNavigator'ün (sağdaki) bizi LoginScreen'e (sağdaki) atmasını tetikler)
      dispatch(clearUser());
    } catch (error) {
      console.error("Çıkış yaparken hata:", error);
      Alert.alert("Hata", "Çıkış yapılırken bir sorun oluştu.");
    }
  };

  /**
   * @desc  Çıkış yapmadan önce kullanıcıya onay sorusu sorar.
   */
  const confirmLogout = () => {
    Alert.alert(
      "Çıkış Yap", // Başlık
      "Çıkış yapmak istediğinizden emin misiniz?", // Mesaj
      [
        // Butonlar
        {
          text: "İptal",
          style: "cancel", // (iOS'ta sola yaslar)
        },
        {
          text: "Çıkış Yap",
          style: "destructive", // (iOS'ta kırmızı yazar)
          onPress: handleLogout, // Sadece 'Çıkış Yap'a basılırsa çalıştır
        },
      ]
    );
  };

  // (Kenar durum: Eğer bir şekilde buraya 'null' kullanıcı gelirse)
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Kullanıcı bulunamadı.</Text>
      </SafeAreaView>
    );
  }

  // 4. Arayüzü (UI) Render Et
  return (
    <SafeAreaView style={styles.container}>
      {/* Profil Başlığı */}
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={80} color="#333" />
        <Text style={styles.emailText}>{currentUser.email}</Text>

        {/* Pro / Free Rozeti (Badge) */}
        {isPro ? (
          <View style={styles.proBadge}>
            <Ionicons name="star" size={16} color="#333" />
            <Text style={styles.proText}>PRO ÜYE</Text>
          </View>
        ) : (
          <View style={styles.freeBadge}>
            <Text style={styles.freeText}>FREE ÜYE</Text>
          </View>
        )}
      </View>

      {/* Ana Eylem Butonları */}
      <View style={styles.buttonContainer}>
        {/* "Pro'ya Yükselt" butonu (Sadece 'Free' üye ise gösterilir) */}
        {!isPro && (
          <Pressable
            style={[styles.button, styles.upgradeButton]}
            onPress={() => alert("Satın alma ekranı açılacak!")}
          >
            <Text style={[styles.buttonText, styles.upgradeButtonText]}>
              <Ionicons name="star-outline" size={16} /> PRO'ya Yükselt
            </Text>
          </Pressable>
        )}

        {/* "Çıkış Yap" Butonu */}
        <Pressable
          style={[styles.button, styles.logoutButton]}
          onPress={confirmLogout} // Onay sorusu sor
        >
          <Text style={[styles.buttonText, styles.logoutButtonText]}>
            <Ionicons name="log-out-outline" size={16} /> Çıkış Yap
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    alignItems: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 30, // (iOS için)
    marginBottom: 40,
  },
  emailText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 15,
  },
  // Pro Rozeti
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFD700", // Altın (Gold)
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 15,
    marginTop: 15,
  },
  proText: {
    color: "#333",
    fontWeight: "bold",
    marginLeft: 5,
  },
  // Free Rozeti
  freeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0e0e0", // Gri
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 15,
    marginTop: 15,
  },
  freeText: {
    color: "#555",
    fontWeight: "bold",
  },
  // Butonlar
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  button: {
    width: "90%",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
  },
  // Pro Yükseltme Butonu
  upgradeButton: {
    backgroundColor: "#f4511e", // Ana renk (Turuncu)
    shadowColor: "#f4511e",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
  },
  upgradeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Çıkış Yap Butonu
  logoutButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f4511e", // Ana renk (Turuncu)
  },
  logoutButtonText: {
    color: "#f4511e",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonText: {
    marginHorizontal: 5, // İkon ile yazı arasına boşluk
  },
  errorText: {
    fontSize: 16,
    color: "red",
  },
});

export default ProfileScreen;
