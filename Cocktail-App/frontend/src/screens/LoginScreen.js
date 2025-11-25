import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";

// 1. Firebase Auth servisi
import { auth } from "../api/firebaseConfig";
// 2. Firebase'in Email/Şifre fonksiyonlarını içe aktar
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

// 3. Redux Thunk (API isteği) ve Selector'leri (userSlice.js'ten) içe aktar
import { loginOrRegisterUser, getLoginStatus } from "../features/userSlice";
import * as WebBrowser from "expo-web-browser";
import { useAuthRequest, makeRedirectUri } from "expo-auth-session";
// 'GoogleAuthProvider' (Google'ın 'idToken'ını Firebase'e çevirmek için)
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { useTranslation } from "react-i18next"; // 1. Çeviri kancasını ekle

// (Giriş (Auth) akışı web tarayıcısını (web browser) tamamladığında çağrılır)
WebBrowser.maybeCompleteAuthSession();

// --- YARDIMCI FONKSİYON: Hata Mesajlarını Çevir ---
const getFriendlyErrorMessage = (error) => {
  switch (error.code) {
    case "auth/email-already-in-use":
      return t("auth.errors.email_in_use");
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return t("auth.errors.invalid_cred");
    case "auth/weak-password":
      return t("auth.errors.weak_pass");
    case "auth/invalid-email":
      return t("auth.errors.invalid_email");
    default:
      return t("general.error");
  }
};
/**
 * @desc    Kullanıcıların giriş yapmasını (Login) veya kayıt olmasını (Register) sağlar.
 */
const LoginScreen = () => {
  const dispatch = useDispatch();
  const loginStatus = useSelector(getLoginStatus);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false); // Mod (Giriş / Kayıt)
  const { t } = useTranslation(); // 2. Çeviri fonksiyonunu al

  // Firebase (Adım 1) için lokal 'loading' state'i
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(false);

  // === YENİ EKLENDİ (EKSİK 11 - Google Girişi Mantığı) ===
  const [googleLoading, setGoogleLoading] = useState(false); // (Google butonu için ayrı 'loading')

  const redirectUri = makeRedirectUri({
    useProxy: true,
  });
  // 1. 'useAuthRequest' kancasını (hook) .env anahtarlarıyla (keys) başlat
  const [request, response, promptAsync] = useAuthRequest(
    {
      // iosClientId:
      //   "441299631588-et88h77510u8k46b7pm34l56pkfs25a6.apps.googleusercontent.com",
      // androidClientId:
      //   "441299631588-et88h77510u8k46b7pm34l56pkfs25a6.apps.googleusercontent.com",
      // (webClientId .env'de yok, ancak Expo Go için 'expoClientId'yi kullanabiliriz)
      clientId:
        "441299631588-et88h77510u8k46b7pm34l56pkfs25a6.apps.googleusercontent.com",
      redirectUri,
      esponseType: "id_token", // önemli: Google için id_token alıyoruz
      scopes: ["openid", "profile", "email"],
      // optional: prompt: "select_account" // ister isen ekle
    },

    {
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenEndpoint: "https://oauth2.googleapis.com/token",
    }
  );

  // 2. Google "popup" (web) ekranından (response) bir yanıt geldiğinde 'useEffect'i tetikle
  useEffect(() => {
    if (response) {
      if (response?.type === "success") {
        const { id_token } = response.params;
        // 3. Google'ın 'id_token'ı ile 'handleGoogleSignIn'ı (aşağıdaki) çağır
        handleGoogleSignIn(id_token);
      } else {
        // (Kullanıcı popup'ı kapattı veya hata oluştu)
        setGoogleLoading(false);
      }
    }
  }, [response]);

  /**
   * @desc  Google'dan gelen 'idToken'ı alır, Firebase'e (Auth) gönderir,
   * ardından bizim Backend'imizle (is_pro) senkronize eder.
   */
  const handleGoogleSignIn = async (id_token) => {
    try {
      // 1. ADIM: Google 'id_token'ını Firebase 'credential' (kimlik bilgisi) haline getir
      const credential = GoogleAuthProvider.credential(id_token);

      // 2. ADIM: Firebase (Frontend) - Bu 'credential' (kimlik bilgisi) ile Giriş Yap
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      // 3. ADIM: Redux (Frontend) -> Backend (Senkronizasyon)
      // (Email/Şifre ile aynı 'thunk'ı (sağdaki userSlice.js) çağırıyoruz)
      await dispatch(
        loginOrRegisterUser({
          firebase_uid: user.uid,
          email: user.email,
        })
      ).unwrap();
      // (Başarılı. AppNavigator.js (sağdaki) bizi otomatik olarak Ana Ekrana yönlendirecek)
    } catch (error) {
      console.error("Google Giriş Hatası:", error);
      Alert.alert(
        "Google Giriş Hatası",
        getFriendlyErrorMessage(error) // (Aynı hata çeviriciyi kullan)
      );
    } finally {
      setGoogleLoading(false);
    }
  };
  // ==================================================

  /**
   * @desc  Firebase'e YENİ KULLANICI kaydı yapar,
   * ardından bizim Backend'imizle senkronize eder.
   */
  const handleRegister = async () => {
    if (email === "" || password === "") {
      Alert.alert(t("general.error"), t("auth.errors.empty_fields"));
      return;
    }
    if (loginStatus === "loading" || isFirebaseLoading) return;

    // YENİ EKLENDİ (Tepkisizlik Çözümü): Yüklenmeyi başlat
    setIsFirebaseLoading(true);

    try {
      // 1. ADIM: Firebase (Frontend) - Kullanıcıyı Oluştur
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // 2. ADIM: Redux (Frontend) -> Backend (Senkronizasyon)
      // (userSlice.js'teki 'loginOrRegisterUser' Thunk'ını çağır)
      await dispatch(
        loginOrRegisterUser({
          firebase_uid: user.uid,
          email: user.email,
        })
      ).unwrap();

      // (Başarılı. AppNavigator.js bizi otomatik olarak Ana Ekrana yönlendirecek)
    } catch (error) {
      // (Hata yönetimi)
      console.error("Kayıt Hatası:", error);
      Alert.alert(t("general.error"), getFriendlyErrorMessage(error));
    } finally {
      // YENİ EKLENDİ (Tepkisizlik Çözümü): Yüklenmeyi (her durumda) bitir
      setIsFirebaseLoading(false);
    }
  };

  /**
   * @desc  Firebase'e GİRİŞ yapar,
   * ardından bizim Backend'imizle senkronize eder.
   */
  const handleLogin = async () => {
    if (email === "" || password === "") {
      Alert.alert(t("general.error"), t("auth.errors.empty_fields"));
      return;
    }
    if (loginStatus === "loading" || isFirebaseLoading) return;

    // YENİ EKLENDİ (Tepkisizlik Çözümü): Yüklenmeyi başlat
    setIsFirebaseLoading(true);

    try {
      // 1. ADIM: Firebase (Frontend) - Giriş Yap
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // 2. ADIM: Redux (Frontend) -> Backend (Senkronizasyon)
      // (Aynı Thunk'ı çağırıyoruz. Backend'deki 'findOrCreateUser'
      // kullanıcıyı bulup 'is_pro' bayrağını döndürecek)
      await dispatch(
        loginOrRegisterUser({
          firebase_uid: user.uid,
          email: user.email,
        })
      ).unwrap();

      // (Başarılı. AppNavigator.js bizi otomatik olarak Ana Ekrana yönlendirecek)
    } catch (error) {
      // (Hata yönetimi)
      console.error("Giriş Hatası:", error);
      Alert.alert(t("general.error"), getFriendlyErrorMessage(error));
    } finally {
      // YENİ EKLENDİ (Tepkisizlik Çözümü): Yüklenmeyi (her durumda) bitir
      setIsFirebaseLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Ionicons
            name="wine-outline"
            size={80}
            color="#f4511e"
            style={styles.logo}
          />
          <Text style={styles.title}>
            {isRegistering ? t("auth.register") : t("auth.login")}
          </Text>
          <Text style={styles.subtitle}>{t("auth.subtitle")}</Text>

          {/* Email Girişi */}
          <TextInput
            style={styles.input}
            placeholder={t("auth.email_placeholder")}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#999"
          />

          {/* Şifre Girişi */}
          <TextInput
            style={styles.input}
            placeholder={t("auth.password_placeholder")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry // Şifreyi gizler
            placeholderTextColor="#999"
          />

          {/* Ana Buton (Giriş veya Kayıt) */}
          <Pressable
            style={[
              styles.button,
              // GÜNCELLEME: İki 'loading' durumunu da kontrol et
              (loginStatus === "loading" ||
                isFirebaseLoading ||
                googleLoading) &&
                styles.buttonDisabled,
            ]}
            onPress={isRegistering ? handleRegister : handleLogin}
            disabled={
              loginStatus === "loading" || isFirebaseLoading || googleLoading
            }
          >
            {loginStatus === "loading" || isFirebaseLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isRegistering ? t("auth.register") : t("auth.login")}
              </Text>
            )}
          </Pressable>

          {/* Mod Değiştirme Butonu */}
          <Pressable
            style={styles.toggleButton}
            onPress={() => setIsRegistering(!isRegistering)}
          >
            <Text style={styles.toggleText}>
              {isRegistering ? t("auth.have_account") : t("auth.no_account")}
            </Text>
          </Pressable>

          {/* --- Google Giriş Butonu) --- */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>{t("general.or")}</Text>
            <View style={styles.divider} />
          </View>

          <Pressable
            style={[
              styles.button,
              styles.googleButton,
              // GÜNCELLEME: *Herhangi* bir 'loading' durumunda pasif yap
              (!request ||
                loginStatus === "loading" ||
                isFirebaseLoading ||
                googleLoading) &&
                styles.buttonDisabled,
            ]}
            disabled={
              !request ||
              loginStatus === "loading" ||
              isFirebaseLoading ||
              googleLoading
            }
            onPress={() => {
              setGoogleLoading(true); // (Firebase 'popup'ı açılmadan hemen önce)
              promptAsync(); // Google "popup" (web) ekranını açar
            }}
          >
            {googleLoading ? (
              <ActivityIndicator color="#000" /> // Siyah spinner
            ) : (
              <>
                <Ionicons
                  name="logo-google"
                  size={20}
                  color="#333"
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>
                  {t("auth.google_login")}
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  logo: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#777",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    width: "100%",
    backgroundColor: "#f4511e",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#f4511e",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
    shadowColor: "transparent",
    elevation: 0,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  toggleButton: {
    marginTop: 20,
  },
  toggleText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginTop: 20,
    marginBottom: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#999",
    fontWeight: "600",
  },
  googleButton: {
    backgroundColor: "#fff", // Beyaz arka plan
    borderColor: "#ddd", // Gri çerçeve
    borderWidth: 1,
    shadowColor: "#000", // Siyah gölge
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3, // (Daha hafif gölge)
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: "#333", // Koyu renk yazı
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default LoginScreen;
