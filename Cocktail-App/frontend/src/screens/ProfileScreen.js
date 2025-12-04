import React from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useNavigation,
  CommonActions,
  useTheme,
} from "@react-navigation/native";
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
import {
  setLanguage,
  selectLanguage,
  setThemeMode,
  selectThemeMode,
} from "../features/uiSlice";
import { fetchIngredients } from "../features/ingredientSlice";
import { clearSearchResults } from "../features/barmenSlice";
import {
  clearDetail,
  fetchCocktails,
} from "../features/cocktails/cocktailSlice";
import PremiumButton from "../ui/PremiumButton";
/**
 * @desc    Kullanıcı profilini gösterir, "Çıkış Yap" (Logout)
 * ve "Pro'ya Yükselt" işlemlerini yönetir.
 */
const ProfileScreen = () => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  // 1. Çeviri Hook'u
  const { t, i18n } = useTranslation();

  // 3. Redux'tan mevcut kullanıcıyı ve Pro durumunu oku
  const currentUser = useSelector(selectCurrentUser);
  const isPro = useSelector(selectIsPro);
  const navigation = useNavigation();

  // YENİ EKLENDİ: Mevcut dili oku
  const currentLanguage = useSelector(selectLanguage);
  // YENİ: Mevcut tema modunu Redux'tan oku ('system' | 'light' | 'dark')
  const currentThemeMode = useSelector(selectThemeMode);

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

  // --- YENİ: TEMA DEĞİŞTİRME MANTIĞI ---

  const cycleTheme = () => {
    // Döngü: system -> light -> dark -> system
    let newMode;
    if (currentThemeMode === "system") newMode = "light";
    else if (currentThemeMode === "light") newMode = "dark";
    else newMode = "system";

    dispatch(setThemeMode(newMode));
  };

  // Helper: Tema ikonunu ve metnini belirle
  const getThemeIcon = () => {
    switch (currentThemeMode) {
      case "light":
        return "sunny";
      case "dark":
        return "moon";
      default:
        return "phone-portrait"; // System için telefon ikonu
    }
  };

  const getThemeLabel = () => {
    // Bu metinleri de dil dosyasına eklemelisin! (Şimdilik hardcoded örnek)
    switch (currentThemeMode) {
      case "light":
        return t("profile.theme_light");
      case "dark":
        return t("profile.theme_dark");
      default:
        return t("profile.theme_system");
    }
  };

  // (Kenar durum: Eğer bir şekilde buraya 'null' kullanıcı gelirse)
  if (!currentUser) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.errorText, { color: colors.notification }]}>
          Kullanıcı bulunamadı.
        </Text>
      </SafeAreaView>
    );
  }

  // 4. Arayüzü (UI) Render Et
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Profil Başlığı */}
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={80} color={colors.text} />
        <Text style={[styles.emailText, { color: colors.text }]}>
          {currentUser.email}
        </Text>

        {/* Pro / Free Rozeti (Badge) */}
        {isPro ? (
          <View style={[styles.proBadge, { backgroundColor: colors.gold }]}>
            <Ionicons name="star" size={16} color={colors.buttonText} />
            <Text style={[styles.proText, { color: colors.buttonText }]}>
              {t("profile.pro_member")}
            </Text>
          </View>
        ) : (
          <View style={[styles.freeBadge, { backgroundColor: colors.subCard }]}>
            <Text style={[styles.freeText, { color: colors.textSecondary }]}>
              {t("profile.free_member")}
            </Text>
          </View>
        )}
      </View>

      {/* Ana Eylem Butonları */}
      <View style={styles.buttonContainer}>
        {/* 1. DİL DEĞİŞTİR (Silver) */}
        <PremiumButton
          variant="silver"
          onPress={toggleLanguage}
          style={styles.profileBtn} // Sadece genişlik ayarı
        >
          <Ionicons
            name="language-outline"
            size={20}
            style={{ marginRight: 10 }}
          />
          <Text style={{ fontSize: 16, fontWeight: "600" }}>
            {t("profile.language_select")}:{" "}
            {currentLanguage === "tr" ? "Türkçe 🇹🇷" : "English 🇬🇧"}
          </Text>
        </PremiumButton>

        {/* 2. PRO'YA YÜKSELT (Gold - Sadece Free Üyeye) */}
        {!isPro && (
          <PremiumButton
            variant="gold"
            onPress={() => navigation.navigate("UpgradeToPro")}
            style={styles.profileBtn}
          >
            <Ionicons
              name="star-outline"
              size={20}
              // Gold buton üstünde yazı rengi (Theme helper'dan gelmeli ama children olduğu için manuel veriyoruz)
              color={colors.dark ? "#000" : "#FFF"}
              style={{ marginRight: 10 }}
            />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: colors.dark ? "#000" : "#FFF",
              }}
            >
              {t("profile.upgrade_btn")}
            </Text>
          </PremiumButton>
        )}

        {/* 3. TEMA DEĞİŞTİR (Silver) */}
        <PremiumButton
          variant="silver"
          onPress={cycleTheme}
          style={styles.profileBtn}
        >
          <Ionicons
            name={getThemeIcon()}
            size={20}
            style={{ marginRight: 10 }}
          />
          <Text style={{ fontSize: 16, fontWeight: "600" }}>
            {t("profile.theme_title") || "Tema"}: {getThemeLabel()}
          </Text>
        </PremiumButton>

        {/* 4. ÇIKIŞ YAP (Silver ama Kırmızı İçerik) */}
        <PremiumButton
          variant="silver"
          onPress={confirmLogout}
          style={styles.profileBtn}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color={colors.notification} // Kırmızı İkon
            style={{ marginRight: 10 }}
          />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.notification,
            }}
          >
            {t("auth.logout")}
          </Text>
        </PremiumButton>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 40,
  },
  emailText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 15,
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginTop: 15,
    borderWidth: 1,
  },
  proText: {
    fontWeight: "bold",
    marginLeft: 5,
    fontSize: 14,
  },
  freeBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginTop: 15,
  },
  freeText: {
    fontWeight: "600",
    fontSize: 14,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    gap: 15,
    paddingBottom: 40,
  },
  profileBtn: {
    width: "100%",
  },
});

export default ProfileScreen;
