import React, { useState, useEffect, useRef } from "react";
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
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "@react-navigation/native";
import { Video, ResizeMode } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";

import { auth } from "../api/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth";
import { loginOrRegisterUser, getLoginStatus } from "../features/userSlice";
import * as WebBrowser from "expo-web-browser";
import { useAuthRequest, makeRedirectUri } from "expo-auth-session";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { useTranslation } from "react-i18next";
import PremiumButton from "../ui/PremiumButton";

WebBrowser.maybeCompleteAuthSession();

// Ekran genişliği
const { width } = Dimensions.get("window");

const getFriendlyErrorMessage = (error) => {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "E-posta zaten kullanımda.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Hatalı e-posta veya şifre.";
    case "auth/weak-password":
      return "Şifre çok zayıf.";
    case "auth/invalid-email":
      return "Geçersiz e-posta formatı.";
    case "auth/too-many-requests":
      return "Çok fazla deneme yaptınız. Lütfen bekleyin.";
    default:
      return "Bir hata oluştu.";
  }
};

const LoginScreen = () => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const loginStatus = useSelector(getLoginStatus);
  const video = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const { t, i18n } = useTranslation();

  const [isFirebaseLoading, setIsFirebaseLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const androidClientId = process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;

  const redirectUri = makeRedirectUri({ useProxy: true });

  const [request, response, promptAsync] = useAuthRequest(
    {
      androidClientId: androidClientId,
      clientId: webClientId,
      redirectUri,
      responseType: "id_token",
      scopes: ["openid", "profile", "email"],
    },
    {
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenEndpoint: "https://oauth2.googleapis.com/token",
    }
  );

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    } else if (response?.type === "error" || response?.type === "dismiss") {
      setGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleSignIn = async (id_token) => {
    try {
      const credential = GoogleAuthProvider.credential(id_token);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;
      await dispatch(
        loginOrRegisterUser({ firebase_uid: user.uid, email: user.email })
      ).unwrap();
    } catch (error) {
      console.error("Google Giriş Hatası:", error);
      Alert.alert("Google Giriş Hatası", getFriendlyErrorMessage(error));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRegister = async () => {
    if (email === "" || password === "") {
      Alert.alert(t("general.error"), t("auth.errors.empty_fields"));
      return;
    }
    if (loginStatus === "loading" || isFirebaseLoading) return;
    setIsFirebaseLoading(true);

    try {
      auth.languageCode = i18n.language;
      // 1. Kullanıcıyı oluştur
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // 2. YENİ ADIM: Doğrulama E-postası Gönder
      await sendEmailVerification(user);

      // 3. Kullanıcıya bilgi ver
      Alert.alert(
        "Kayıt Başarılı!",
        "E-posta adresinize bir doğrulama bağlantısı gönderdik. Hesabınızın güvenliği ve şifre kurtarma işlemleri için lütfen onaylayın.",
        [
          {
            text: "Tamam",
            // Kullanıcı "Tamam"a basınca giriş işlemini tamamla
            onPress: async () => {
              await dispatch(
                loginOrRegisterUser({
                  firebase_uid: user.uid,
                  email: user.email,
                })
              ).unwrap();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Kayıt Hatası:", error);
      Alert.alert(t("general.error"), getFriendlyErrorMessage(error));
    } finally {
      setIsFirebaseLoading(false);
    }
  };

  const handleLogin = async () => {
    if (email === "" || password === "") {
      Alert.alert(t("general.error"), t("auth.errors.empty_fields"));
      return;
    }
    if (loginStatus === "loading" || isFirebaseLoading) return;
    setIsFirebaseLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      await dispatch(
        loginOrRegisterUser({ firebase_uid: user.uid, email: user.email })
      ).unwrap();
    } catch (error) {
      console.error("Giriş Hatası:", error);
      Alert.alert(t("general.error"), getFriendlyErrorMessage(error));
    } finally {
      setIsFirebaseLoading(false);
    }
  };

  // YENİ: Şifre Sıfırlama Fonksiyonu
  const handleForgotPassword = async () => {
    if (email === "") {
      Alert.alert(
        "Uyarı",
        "Lütfen şifresini sıfırlamak istediğiniz e-posta adresini yazın."
      );
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        "Başarılı",
        "Şifre sıfırlama bağlantısı e-postana gönderildi."
      );
    } catch (error) {
      Alert.alert("Hata", getFriendlyErrorMessage(error));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* --- PREMIUM VIDEO ALANI --- */}
          <View style={styles.videoWrapper}>
            <Video
              ref={video}
              style={styles.video}
              // NOT: Gerçek cihazda çalışması için assets içindeki dosya adının doğru olduğundan emin ol
              source={require("../../assets/home_480.mp4")}
              useNativeControls={false}
              resizeMode={ResizeMode.COVER} // Arka plan siyah olduğu için COVER kullanıp alttan siliyoruz, sorun yok.
              isLooping={false}
              shouldPlay={true}
              isMuted={true}
            />
            {/* Fade Out Effect */}
            <LinearGradient
              colors={["transparent", "#000000"]}
              style={styles.videoOverlay}
            />
          </View>

          {/* --- FORM ALANI --- */}
          <View style={styles.formContainer}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.welcomeText}>
                {isRegistering ? t("auth.join_us") : t("auth.welcome_chef")}
              </Text>
              <Text style={styles.subText}>{t("auth.subtitle")}</Text>
            </View>

            {/* Email Girişi */}
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#888"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t("auth.email_placeholder")}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#666"
              />
            </View>

            {/* Şifre Girişi */}
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#888"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t("auth.password_placeholder")}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#666"
              />
            </View>

            {/* YENİ: Şifremi Unuttum (Sadece Giriş Modunda) */}
            {!isRegistering && (
              <Pressable
                onPress={handleForgotPassword}
                style={{ alignSelf: "flex-end", marginBottom: 20 }}
              >
                <Text style={{ color: "#aaa", fontSize: 13 }}>
                  {t("auth.forgot_password")}
                </Text>
              </Pressable>
            )}

            {/* Ana Buton */}
            <PremiumButton
              title={isRegistering ? t("auth.register") : t("auth.login")}
              onPress={isRegistering ? handleRegister : handleLogin}
              variant="gold"
              isLoading={
                loginStatus === "loading" || isFirebaseLoading || googleLoading
              }
              disabled={
                loginStatus === "loading" || isFirebaseLoading || googleLoading
              }
              style={styles.mainButton}
            />

            {/* Mod Değiştirme */}
            <Pressable
              style={styles.toggleButton}
              onPress={() => setIsRegistering(!isRegistering)}
            >
              <Text style={styles.toggleText}>
                {isRegistering ? t("auth.have_account") : t("auth.no_account")}
                <Text style={{ color: "#D4AF37", fontWeight: "bold" }}>
                  {" "}
                  {t("auth.click_here")}
                </Text>
              </Text>
            </Pressable>

            {/* Bölücü Çizgi */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>{t("general.or")}</Text>
              <View style={styles.divider} />
            </View>

            {/* Google Butonu */}
            <Pressable
              style={[
                styles.googleButton,
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
                setGoogleLoading(true);
                promptAsync();
              }}
            >
              {googleLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="logo-google"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 10 }}
                  />
                  <Text style={styles.googleButtonText}>
                    {t("auth.google_login")}
                  </Text>
                </>
              )}
            </Pressable>

            {/* YENİ: Yasal Uyarı Metni (Legal Footer) */}
            <View style={{ marginTop: 30, paddingHorizontal: 10 }}>
              <Text
                style={{
                  color: "#444",
                  fontSize: 11,
                  textAlign: "center",
                  lineHeight: 16,
                }}
              >
                {t("auth.terms_privacy")}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
    backgroundColor: "#000",
  },
  // --- VIDEO STİLLERİ ---
  videoWrapper: {
    width: width,
    // DEĞİŞİKLİK: Videoyu biraz kısalttım (4/3 yerine yaklaşık 1.2 oranı)
    // Bu sayede form daha yukarı gelebilir.
    height: width * 1.2,
    position: "relative",
    zIndex: 0,
    backgroundColor: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  videoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200, // Gradyanı biraz daha uzattım, yumuşak geçiş için
    zIndex: 1,
  },
  // --- FORM ALANI ---
  formContainer: {
    // DEĞİŞİKLİK: Daha fazla yukarı çektim (-80'den -100'e)
    // Bu, formun videonun üzerine daha çok binmesini sağlar.
    marginTop: -100,
    paddingHorizontal: 24,
    zIndex: 2,
    paddingBottom: 40, // Alt kısımda biraz boşluk
  },
  headerTextContainer: {
    marginBottom: 30,
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 1,
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    textAlign: "center",
  },
  subText: {
    fontSize: 14,
    color: "#ccc",
    opacity: 0.8,
    textAlign: "center",
  },
  // --- INPUT STİLLERİ ---
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 16,
    height: 56,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    height: "100%",
  },
  // --- BUTONLAR ---
  mainButton: {
    // Şifremi unuttum eklendiği için margin'i biraz azalttım
    marginTop: 5,
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  toggleButton: {
    marginTop: 20,
    alignItems: "center",
  },
  toggleText: {
    color: "#888",
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#333",
  },
  dividerText: {
    marginHorizontal: 12,
    color: "#666",
    fontWeight: "600",
    fontSize: 12,
    textTransform: "uppercase",
  },
  googleButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#222",
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default LoginScreen;
