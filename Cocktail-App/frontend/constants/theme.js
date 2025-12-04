// @react-navigation/native importunu kaldırdık, çünkü tüm değerleri manuel veriyoruz.
// Böylece "undefined" hatası riski sıfıra iniyor.

// ==========================================
// 🔤 YAZI TİPİ AYARLARI (ÖNCE BUNU TANIMLAMALIYIZ)
// ==========================================

const fontPixel = (size) => size; // İleride responsive scale fonksiyonu eklenebilir

const typography = {
  // 1. Temel Tanımlar (Tokens)
  families: {
    regular: "System",
    bold: "System",
  },
  sizes: {
    h1: fontPixel(32),
    h2: fontPixel(24),
    h3: fontPixel(20),
    body: fontPixel(16),
    caption: fontPixel(12),
  },

  // 2. Hazır Stiller (Variants)
  styles: {
    h1: {
      fontSize: 32,
      fontWeight: "700",
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: "600",
      lineHeight: 32,
    },
    body: {
      fontSize: 16,
      fontWeight: "400",
      lineHeight: 24,
    },
    caption: {
      fontSize: 12,
      fontWeight: "400",
      color: "#888",
    },
  },
};

// ==========================================
// 🎨 LÜKS & RAFİNE RENK PALETİ (Premium Palette)
// ==========================================

const palette = {
  // --- METALLER & TEMEL RENKLER ---
  goldPrime: "#D4AF37",
  goldLight: "#F1E5AC",
  goldMuted: "#C5A059",
  silver: "#C0C0C0",
  platinum: "#E5E4E2",
  royalMerlot: "#4A0E15",

  // --- DARK MOD RENK ---
  neonRuby: "#E63946",

  // --- ARKA PLAN & YÜZEYLER ---
  cream: "#FCFAF2",
  white: "#FFFFFF",
  pianoBlack: "#141415",
  charcoal: "#1F1F22",
  richGrey: "#2D2D30",

  // --- METİNLER ---
  inkBlack: "#121212",
  slateGrey: "#4A4A4A",
  cloudWhite: "#E0E0E0",

  // --- DURUMLAR ---
  success: "#4A7c59",
  danger: "#A63434",

  // ==========================================
  // 🌈 GRADYAN DİZİLERİ
  // ==========================================
  goldGradient: ["#F1E5AC", "#D4AF37", "#996515"],
  silverGradient: ["#F5F5F5", "#C0C0C0", "#707070"],
  arcadeGradient: ["#FF7A00", "#D91E5B", "#450456"],
  cyberGradient: ["#00C6FF", "#0072FF"],
  partyGradient: ["#450456", "#D91E5B", "#FF7A00"],
  merlotGradient: ["#6B1B27", "#4A0E15", "#2A050A"],

  // ==========================================
  // ✨ 3D BUTON EFEKTLERİ
  // ==========================================
  goldHighlight: "rgba(255, 255, 255, 0.6)",
  goldShadow: "rgba(100, 70, 0, 0.4)",
  silverHighlight: "rgba(255, 255, 255, 0.9)",
  silverShadow: "rgba(0, 0, 0, 0.3)",
  arcadeHighlight: "rgba(255, 200, 100, 0.6)",
  arcadeShadow: "rgba(69, 4, 86, 0.8)",
  cyberHighlight: "rgba(200, 255, 255, 0.6)",
  cyberShadow: "rgba(0, 50, 150, 0.8)",

  goldShadowStyle: {
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
};

// ==========================================
// 🛠️ BUTON VARYANT OLUŞTURUCU
// ==========================================
const getButtonVariants = (isDark) => ({
  gold: {
    gradient: palette.goldGradient,
    topHighlight: palette.goldHighlight,
    bottomShadow: palette.goldShadow,
    textColor: isDark ? palette.pianoBlack : palette.white,
  },
  silver: {
    gradient: palette.silverGradient,
    topHighlight: palette.silverHighlight,
    bottomShadow: palette.silverShadow,
    textColor: palette.charcoal,
  },
  arcade: {
    gradient: palette.arcadeGradient,
    topHighlight: palette.arcadeHighlight,
    bottomShadow: palette.arcadeShadow,
    textColor: palette.white,
  },
  cyber: {
    gradient: palette.cyberGradient,
    topHighlight: palette.cyberHighlight,
    bottomShadow: palette.cyberShadow,
    textColor: palette.white,
  },
});

// ==========================================
// ☀️ AYDINLIK TEMA (CustomLightTheme)
// ==========================================
export const CustomLightTheme = {
  dark: false, // DefaultTheme yerine manuel set ediyoruz
  colors: {
    // ...DefaultTheme.colors SİLİNDİ (Hata kaynağı buydu)

    // Navigation Zorunlu Renkler
    primary: palette.royalMerlot,
    background: palette.cream,
    card: palette.white,
    text: palette.inkBlack,
    border: palette.silver,
    notification: palette.danger,

    // Özel Bileşenler
    headerTint: palette.white,
    textSecondary: palette.slateGrey,
    subCard: palette.platinum,
    icon: palette.inkBlack,
    iconActive: palette.goldPrime,
    gold: palette.goldPrime,
    proCardBg: palette.goldLight,

    // Standart Buton
    buttonBg: palette.goldPrime,
    buttonText: palette.white,

    // Buton Varyantları
    buttonVariants: getButtonVariants(false),

    // Manuel Erişim
    partyGradient: palette.partyGradient,
    goldShadow: palette.goldShadowStyle,
    merlotGradient: palette.merlotGradient,
    success: palette.success,
    error: palette.danger,
    inputBg: palette.white,
    inputBorder: "#E0E0E0",
    shadow: "#000000",

    // Geriye dönük uyumluluk
    silver: palette.silver,
  },
  fonts: typography,
};

// ==========================================
// 🌙 KARANLIK TEMA (CustomDarkTheme)
// ==========================================
export const CustomDarkTheme = {
  dark: true, // DarkTheme yerine manuel set ediyoruz
  colors: {
    // ...DarkTheme.colors SİLİNDİ (Hata kaynağı buydu)

    // Navigation Zorunlu Renkler
    primary: palette.neonRuby,
    background: palette.pianoBlack,
    card: palette.charcoal,
    text: palette.cloudWhite,
    border: palette.richGrey,
    notification: palette.neonRuby,

    // Özel Bileşenler
    headerTint: palette.white, // Dark modda da header yazısı beyaz kalsın
    textSecondary: palette.silver,
    subCard: palette.richGrey,
    icon: palette.cloudWhite,
    iconActive: palette.goldPrime,
    gold: palette.goldPrime,
    proCardBg: "#2A2510",

    // Standart Buton
    buttonBg: palette.goldPrime,
    buttonText: palette.inkBlack,

    // Buton Varyantları
    buttonVariants: getButtonVariants(true),

    // Manuel Erişim
    partyGradient: palette.partyGradient,
    goldShadow: palette.goldShadowStyle,
    merlotGradient: palette.merlotGradient,
    success: palette.success,
    error: palette.danger,
    inputBg: palette.charcoal,
    inputBorder: palette.richGrey,
    shadow: "#000000",

    // Geriye dönük uyumluluk
    silver: palette.silver,
  },
  fonts: typography,
};
