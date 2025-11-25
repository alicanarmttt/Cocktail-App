import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization"; // <--- DEĞİŞİKLİK BURADA
import AsyncStorage from "@react-native-async-storage/async-storage";

// JSON Dosyalarını İçe Aktar
import en from "./en/common.json";
import tr from "./tr/common.json";

const RESOURCES = {
  en: { translation: en },
  tr: { translation: tr },
};

const LANGUAGE_DETECTOR = {
  type: "languageDetector",
  async: true,
  detect: async (callback) => {
    try {
      // 1. Önce kullanıcının daha önce seçtiği bir dil var mı bak
      const savedLanguage = await AsyncStorage.getItem("user-language");
      if (savedLanguage) {
        return callback(savedLanguage);
      }

      // 2. Yoksa, telefonun dil ayarlarını kontrol et
      const locales = Localization.getLocales();
      const bestLanguage = locales[0]?.languageCode; // 'tr', 'en', 'fr' vb.

      // Eğer telefon dili TR ise TR yap, değilse varsayılan olarak EN yap
      if (bestLanguage === "tr") {
        return callback("tr");
      } else {
        return callback("en");
      }
    } catch (error) {
      console.log("Dil algılama hatası:", error);
      callback("en"); // Hata olursa İngilizce aç
    }
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    // Kullanıcı dil değiştirdiğinde bunu hafızaya kaydet
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
    fallbackLng: "en", // Bilinmeyen bir durumda İngilizceye dön
    interpolation: {
      escapeValue: false, // React zaten XSS koruması sağlar
    },
    compatibilityJSON: "v3", // Android uyumluluğu için
  });

export default i18n;
