import { initializeApp } from "firebase/app";
// (Gelecekte 'Auth' (Giriş) için 'getAuth'u da buradan import edeceğiz)
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
// 1. .env dosyasındaki anahtarları oku (Expo'nun 'EXPO_PUBLIC_' önekini kullandık)
//    (Bu anahtarları Firebase Proje Ayarları'ndan alman gerekiyor)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// 2. Firebase uygulamasını başlat (Initialize)
const app = initializeApp(firebaseConfig);

// 3. Firebase Authentication servisini başlat ve dışa aktar (GÜNCELLENDİ)
//    'getAuth()' yerine 'initializeAuth()' kullanarak
//    ve 'persistence' (kalıcılık) seçeneğini 'AsyncStorage' olarak belirterek
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
// 4. (Gelecekte ihtiyaç olursa diye 'app'i de dışa aktar)
export default app;
