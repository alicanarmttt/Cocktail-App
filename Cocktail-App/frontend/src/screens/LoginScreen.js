import React, { useState } from "react";
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

// 1. Firebase Auth servisini (firebaseConfig.js'ten) içe aktar
import { auth } from "../api/firebaseConfig";
// 2. Firebase'in Email/Şifre fonksiyonlarını içe aktar
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

// 3. Redux Thunk (API isteği) ve Selector'leri (userSlice.js'ten) içe aktar
import { loginOrRegisterUser, getLoginStatus } from "../features/userSlice";

// YENİ EKLENDİ (Hata Çevirisi): Firebase hata kodlarını Türkçe'ye çevirir
const getFriendlyErrorMessage = (error) => {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "Bu email adresi zaten kullanılıyor. Lütfen giriş yapmayı deneyin.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential": // (Yeni Firebase sürümleri 'invalid-credential' kullanır)
      return "Email veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.";
    case "auth/weak-password":
      return "Şifre çok zayıf. Lütfen en az 6 karakterli bir şifre girin.";
    case "auth/invalid-email":
      return "Geçersiz bir email adresi girdiniz.";
    default:
      // (Beklenmedik bir hata olursa)
      return "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
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

  // YENİ EKLENDİ (Tepkisizlik Çözümü):
  // Firebase (Adım 1) için lokal 'loading' state'i
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(false);

  /**
   * @desc  Firebase'e YENİ KULLANICI kaydı yapar,
   * ardından bizim Backend'imizle senkronize eder.
   */
  const handleRegister = async () => {
    if (email === "" || password === "") {
      Alert.alert("Hata", "Email ve şifre boş bırakılamaz.");
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
      Alert.alert("Kayıt Hatası", getFriendlyErrorMessage(error));
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
      Alert.alert("Hata", "Email ve şifre boş bırakılamaz.");
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
      Alert.alert("Giriş Hatası", getFriendlyErrorMessage(error));
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
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Ionicons
            name="wine-outline"
            size={80}
            color="#f4511e"
            style={styles.logo}
          />
          <Text style={styles.title}>
            {isRegistering ? "Kayıt Ol" : "Giriş Yap"}
          </Text>
          <Text style={styles.subtitle}>
            Başlamak için lütfen bilgilerinizi girin.
          </Text>

          {/* Email Girişi */}
          <TextInput
            style={styles.input}
            placeholder="Email Adresiniz"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#999"
          />

          {/* Şifre Girişi */}
          <TextInput
            style={styles.input}
            placeholder="Şifreniz"
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
              (loginStatus === "loading" || isFirebaseLoading) &&
                styles.buttonDisabled,
            ]}
            onPress={isRegistering ? handleRegister : handleLogin}
            disabled={loginStatus === "loading"}
          >
            {loginStatus === "loading" || isFirebaseLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isRegistering ? "Kayıt Ol" : "Giriş Yap"}
              </Text>
            )}
          </Pressable>

          {/* Mod Değiştirme Butonu */}
          <Pressable
            style={styles.toggleButton}
            onPress={() => setIsRegistering(!isRegistering)}
          >
            <Text style={styles.toggleText}>
              {isRegistering
                ? "Zaten hesabınız var mı? Giriş Yapın"
                : "Hesabınız yok mu? Kayıt Olun"}
            </Text>
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
});

export default LoginScreen;
