import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

// JSON Dosyalarını İçe Aktar
import en from "./en/common.json";
import tr from "./tr/common.json";
import de from "./de/common.json";
import es from "./es/common.json";
import it from "./it/common.json";
import pt from "./pt/common.json";

// Desteklenen dilleri bir liste olarak tutmak yönetimi kolaylaştırır
const SUPPORTED_LANGUAGES = ["en", "tr", "de", "es", "it", "pt"];

const RESOURCES = {
  en: { translation: en },
  tr: { translation: tr },
  de: { translation: de },
  es: { translation: es },
  it: { translation: it },
  pt: { translation: pt },
};

const LANGUAGE_DETECTOR = {
  type: "languageDetector",
  async: true,
  detect: async (callback) => {
    try {
      // 1. Önce kullanıcının daha önce seçtiği bir dil var mı (AsyncStorage) bak
      const savedLanguage = await AsyncStorage.getItem("user-language");
      if (savedLanguage) {
        return callback(savedLanguage);
      }

      // 2. Yoksa, telefonun dil ayarlarını kontrol et
      const locales = Localization.getLocales();
      const deviceLanguage = locales[0]?.languageCode; // 'tr', 'en', 'es' vb. döner

      // 3. Telefonun dili bizim desteklediğimiz dillerden biri mi?
      if (deviceLanguage && SUPPORTED_LANGUAGES.includes(deviceLanguage)) {
        console.log("Cihaz dili algılandı ve ayarlandı:", deviceLanguage);
        return callback(deviceLanguage);
      } else {
        // 4. Desteklenmeyen bir dilse (örn: Japonca) varsayılan olarak EN yap
        console.log("Dil desteklenmiyor, varsayılan (en) ayarlandı.");
        return callback("en");
      }
    } catch (error) {
      console.log("Dil algılama hatası:", error);
      callback("en"); // Hata olursa İngilizce aç
    }
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    // Kullanıcı uygulama içinden dil değiştirdiğinde bunu hafızaya kaydet
    try {
      await AsyncStorage.setItem("user-language", language);
    } catch (error) {
      console.log("Dil kaydetme hatası:", error);
    }
  },
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    resources: RESOURCES,
    fallbackLng: "en", // Bir çeviri anahtarı eksikse İngilizcesini göster
    supportedLngs: SUPPORTED_LANGUAGES, // Desteklenen dilleri buraya da ekledik
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: "v3",
    react: {
      useSuspense: false, // React Native'de suspense sorun çıkarabilir, kapalı kalsın
    },
  });

export default i18n;
