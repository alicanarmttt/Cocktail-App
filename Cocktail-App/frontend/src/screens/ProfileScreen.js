import React from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

// 1. userSlice'tan (sağdaki) gerekli selector ve action'ları import et
import {
  selectCurrentUser,
  selectIsPro,
  clearUser,
} from "../features/userSlice";

// 2. Firebase Auth (Çıkış) servisini import et
import { auth } from "../api/firebaseConfig";
import { signOut } from "firebase/auth";

// YENİ EKLENDİ (EKSİK 13): Dil yönetimi ve veri yenileme için importlar
import { setLanguage, selectLanguage } from "../features/uiSlice";
import { fetchIngredients } from "../features/ingredientSlice";
import { clearSearchResults } from "../features/barmenSlice";
import {
  clearDetail,
  fetchCocktails,
} from "../features/cocktails/cocktailSlice";

/**
 * @desc    Kullanıcı profilini gösterir, "Çıkış Yap" (Logout)
 * ve "Pro'ya Yükselt" işlemlerini yönetir.
 */
const ProfileScreen = () => {
  const dispatch = useDispatch();
  // 1. Çeviri Hook'u
  const { t, i18n } = useTranslation();

  // 3. Redux'tan mevcut kullanıcıyı ve Pro durumunu oku
  const currentUser = useSelector(selectCurrentUser);
  const isPro = useSelector(selectIsPro);
  const navigation = useNavigation();

  // YENİ EKLENDİ: Mevcut dili oku
  const currentLanguage = useSelector(selectLanguage);

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
      Alert.alert("general.error", "Çıkış yapılırken bir sorun oluştu.");
    }
  };

  /**
   * @desc  Çıkış yapmadan önce kullanıcıya onay sorusu sorar.
   */
  const confirmLogout = () => {
    Alert.alert(
      t("auth.logout_confirm_title"), // "Çıkış Yap"
      t("auth.logout_confirm_msg"), // "Emin misiniz?"
      [
        // Butonlar
        {
          text: t("general.cancel"),
          style: "cancel", // (iOS'ta sola yaslar)
        },
        {
          text: t("auth.logout"),
          style: "destructive", // (iOS'ta kırmızı yazar)
          onPress: handleLogout, // Sadece 'Çıkış Yap'a basılırsa çalıştır
        },
      ]
    );
  };

  // YENİ EKLENDİ (EKSİK 13): Dil Değiştirme Fonksiyonu
  const toggleLanguage = async () => {
    const newLang = currentLanguage === "tr" ? "en" : "tr";

    // 1. Dili değiştir
    await i18n.changeLanguage(newLang);
    // 2. Redux state'ini güncelle (UI tercihi olarak saklamak için)
    await dispatch(setLanguage(newLang));

    // 3. Verileri Yenileme Zinciri
    await dispatch(fetchIngredients());
    await dispatch(clearSearchResults());
    await dispatch(clearDetail());
    await dispatch(fetchCocktails());

    // 4. Navigasyon Resetleme Mantığı
    // navigation.getParent(), bizi ProfileStack'ten çıkarıp Tab Navigator'a ulaştırır.
    navigation.getParent()?.dispatch((state) => {
      if (!state) return;

      // Tab'daki rotaları (CocktailList, Assistant, Profile) tek tek geziyoruz
      const freshRoutes = state.routes.map((route) => {
        // Eğer sıra şu anki aktif tab'a (Profile) geldiyse:
        // ONUN MEVCUT DURUMUNU KORU (Böylece profil sayfası yenilenmez/kapanmaz)
        if (route.key === state.routes[state.index].key) {
          return route;
        }

        // Diğer tablar (CocktailList ve Assistant) için:
        // Sadece ismini döndürerek içindeki Stack geçmişini (history) SIFIRLIYORUZ.
        // React Navigation, state vermediğimiz için bunları "ilk açılış" varsayar.
        return { name: route.name };
      });

      // Yeni oluşturduğumuz temizlenmiş rota yapısını navigasyona zorluyoruz
      return CommonActions.reset({
        ...state,
        routes: freshRoutes,
        index: state.index, // Kullanıcının odağını (focus) değiştirmeden Profil'de tut
      });
    });
    Alert.alert(
      t("profile.language_changed"),
      `Current Language: ${newLang.toUpperCase()}`
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
            <Text style={styles.proText}>{t("profile.pro_member")}</Text>
          </View>
        ) : (
          <View style={styles.freeBadge}>
            <Text style={styles.freeText}>{t("profile.free_member")}</Text>
          </View>
        )}
      </View>

      {/* Ana Eylem Butonları */}
      <View style={styles.buttonContainer}>
        {/* Dil Değiştir Butonu */}
        <Pressable
          style={[styles.button, styles.languageButton]}
          onPress={toggleLanguage}
        >
          <Text style={[styles.buttonText, styles.languageButtonText]}>
            <Ionicons name="language-outline" size={16} />{" "}
            {t("profile.language_select")}:{" "}
            {currentLanguage === "tr" ? "Türkçe 🇹🇷" : "English 🇬🇧"}
          </Text>
        </Pressable>

        {/* "Pro'ya Yükselt" butonu (Sadece 'Free' üye ise gösterilir) */}
        {!isPro && (
          <Pressable
            style={[styles.button, styles.upgradeButton]}
            onPress={() => navigation.navigate("UpgradeToPro")}
          >
            <Text style={[styles.buttonText, styles.upgradeButtonText]}>
              <Ionicons name="star-outline" size={16} />{" "}
              {t("profile.upgrade_btn")}
            </Text>
          </Pressable>
        )}

        {/* "Çıkış Yap" Butonu */}
        <Pressable
          style={[styles.button, styles.logoutButton]}
          onPress={confirmLogout} // Onay sorusu sor
        >
          <Text style={[styles.buttonText, styles.logoutButtonText]}>
            <Ionicons name="log-out-outline" size={16} />
            {t("auth.logout")}
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
  // Dil Butonu Stili
  languageButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#333",
  },
  languageButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
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
