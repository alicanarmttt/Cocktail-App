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

// Firebase Imports
import { auth } from "../api/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";

// Redux
import { loginOrRegisterUser, getLoginStatus } from "../features/userSlice";

// Native Google Sign-In Imports
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

import { useTranslation } from "react-i18next";
import PremiumButton from "../ui/PremiumButton";

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
      return "Bir hata oluştu: " + error.message;
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

  // Ortam değişkenlerini al
  const webClientId = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;

  // --- Google Sign-In Konfigürasyonu ---
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: webClientId, // DEĞİŞİKLİK: Hardcoded ID yerine tekrar değişkene bağladık (Temiz kod)
      offlineAccess: true,
      scopes: ["profile", "email"],
    });
  }, [webClientId]);

  // --- Native Google Login İşlemi ---
  const onGoogleButtonPress = async () => {
    // Zaten işlem yapılıyorsa durdur
    if (googleLoading || isFirebaseLoading || loginStatus === "loading") return;

    setGoogleLoading(true);
    try {
      // 1. Google Play Services kontrolü
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // 2. Kullanıcı seçimi ve Token alma
      const userInfo = await GoogleSignin.signIn();

      // Versiyon uyumluluğu için kontrol
      const idToken = userInfo.data?.idToken || userInfo.idToken;

      if (!idToken) {
        throw new Error("Google ID Token alınamadı.");
      }

      // 3. Firebase Credential oluştur
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // DEĞİŞİKLİK: Firebase'e dili bildir (Google ile girse bile dili bilsin)
      auth.languageCode = i18n.language;

      // 4. Firebase'e giriş yap
      const userCredential = await signInWithCredential(auth, googleCredential);
      const user = userCredential.user;

      // 5. Redux'a haber ver (Backend senkronizasyonu)
      await dispatch(
        loginOrRegisterUser({ firebase_uid: user.uid, email: user.email })
      ).unwrap();
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("Kullanıcı girişi iptal etti.");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("İşlem zaten devam ediyor.");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Hata", "Google Play Hizmetleri güncel değil veya eksik.");
      } else {
        console.error("Google Sign-In Hatası:", error);
        Alert.alert(
          "Giriş Başarısız",
          "Google ile giriş yapılırken bir sorun oluştu."
        );
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // --- Klasik Email/Şifre Kayıt İşlemleri ---
  const handleRegister = async () => {
    if (email === "" || password === "") {
      Alert.alert(t("general.error"), t("auth.errors.empty_fields"));
      return;
    }
    if (loginStatus === "loading" || isFirebaseLoading) return;
    setIsFirebaseLoading(true);

    try {
      // Burası zaten doğruydu, korundu:
      auth.languageCode = i18n.language;

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      await sendEmailVerification(user);

      Alert.alert(
        "Kayıt Başarılı!",
        "E-posta adresinize bir doğrulama bağlantısı gönderdik. Lütfen onaylayın.",
        [
          {
            text: "Tamam",
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

  const handleForgotPassword = async () => {
    if (email === "") {
      Alert.alert(
        "Uyarı",
        "Lütfen şifresini sıfırlamak istediğiniz e-posta adresini yazın."
      );
      return;
    }
    try {
      // Şifre sıfırlama maili de seçili dilde gider
      auth.languageCode = i18n.language;
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
          {/* --- VIDEO ALANI (Dokunulmadı) --- */}
          <View style={styles.videoWrapper}>
            <Video
              ref={video}
              style={styles.video}
              source={require("../../assets/home_480.mp4")}
              useNativeControls={false}
              resizeMode={ResizeMode.COVER}
              isLooping={false}
              shouldPlay={true}
              isMuted={true}
            />
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

            {/* --- GOOGLE BUTONU --- */}
            <Pressable
              style={[
                styles.googleButton,
                (loginStatus === "loading" ||
                  isFirebaseLoading ||
                  googleLoading) &&
                  styles.buttonDisabled,
              ]}
              disabled={
                loginStatus === "loading" || isFirebaseLoading || googleLoading
              }
              onPress={onGoogleButtonPress}
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
  videoWrapper: {
    width: width,
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
    height: 200,
    zIndex: 1,
  },
  formContainer: {
    marginTop: -100,
    paddingHorizontal: 24,
    zIndex: 2,
    paddingBottom: 40,
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
  mainButton: {
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
