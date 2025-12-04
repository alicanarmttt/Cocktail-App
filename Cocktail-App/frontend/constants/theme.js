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
  // --- YENİ: DARK MOD RENK ---
  // Bordo'nun "Karanlıkta Parlayan" versiyonu (Yakut Kırmızısı)
  neonRuby: "#E63946", // Veya biraz daha koyusu: "#D63447"

  // --- ARKA PLAN & YÜZEYLER ---
  cream: "#FCFAF2",
  white: "#FFFFFF",
  pianoBlack: "#141415", // Hafif metalik, mavimsi olmayan nötr/sıcak siyah
  charcoal: "#1F1F22", // Kartlar için yüzey rengi
  richGrey: "#2D2D30", // Modallar ve inputlar için

  // --- METİNLER ---
  inkBlack: "#121212",
  slateGrey: "#4A4A4A",
  cloudWhite: "#E0E0E0",

  // --- DURUMLAR ---
  success: "#4A7c59",
  danger: "#A63434",

  // ==========================================
  // 🌈 GRADYAN DİZİLERİ (Raw Data)
  // ==========================================
  goldGradient: ["#F1E5AC", "#D4AF37", "#996515"],
  silverGradient: ["#F5F5F5", "#C0C0C0", "#707070"],
  arcadeGradient: ["#FF7A00", "#D91E5B", "#450456"], // Sıcak Parti
  cyberGradient: ["#00C6FF", "#0072FF"], // Soğuk Neon
  partyGradient: ["#450456", "#D91E5B", "#FF7A00"], // Header Geçişi
  merlotGradient: ["#6B1B27", "#4A0E15", "#2A050A"],
  // ==========================================
  // ✨ 3D BUTON EFEKTLERİ (Highlight & Shadow)
  // ==========================================
  // Gold
  goldHighlight: "rgba(255, 255, 255, 0.6)",
  goldShadow: "rgba(100, 70, 0, 0.4)",

  // Silver
  silverHighlight: "rgba(255, 255, 255, 0.9)",
  silverShadow: "rgba(0, 0, 0, 0.3)",

  // Arcade (Sıcak Neon)
  arcadeHighlight: "rgba(255, 200, 100, 0.6)",
  arcadeShadow: "rgba(69, 4, 86, 0.8)",

  // Cyber (Soğuk Neon)
  cyberHighlight: "rgba(200, 255, 255, 0.6)",
  cyberShadow: "rgba(0, 50, 150, 0.8)",

  // Diğer Efektler
  goldShadowStyle: {
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
};

// ==========================================
// 🛠️ BUTON VARYANT OLUŞTURUCU (Helper)
// ==========================================
// Bu fonksiyon, PremiumButton'ın ihtiyaç duyduğu tüm veriyi paketler.
const getButtonVariants = (isDark) => ({
  gold: {
    gradient: palette.goldGradient,
    topHighlight: palette.goldHighlight,
    bottomShadow: palette.goldShadow,
    // Gold üstüne Dark modda siyah yazı, Light modda beyaz yazı daha iyi okunur
    textColor: isDark ? palette.pianoBlack : palette.white,
  },
  silver: {
    gradient: palette.silverGradient,
    topHighlight: palette.silverHighlight,
    bottomShadow: palette.silverShadow,
    textColor: palette.charcoal, // Gümüş üstüne hep koyu yazı
  },
  arcade: {
    gradient: palette.arcadeGradient,
    topHighlight: palette.arcadeHighlight,
    bottomShadow: palette.arcadeShadow,
    textColor: palette.white, // Neon üstüne beyaz yazı
  },
  cyber: {
    gradient: palette.cyberGradient,
    topHighlight: palette.cyberHighlight,
    bottomShadow: palette.cyberShadow,
    textColor: palette.white,
  },
});

// ==========================================
// 🔤 YAZI TİPİ AYARLARI
// ==========================================
const fonts = {
  regular: { fontFamily: "System", fontWeight: "400" },
  medium: { fontFamily: "System", fontWeight: "500" },
  light: { fontFamily: "System", fontWeight: "300" },
  thin: { fontFamily: "System", fontWeight: "100" },
};

// ==========================================
// ☀️ AYDINLIK TEMA (Light Theme)
// ==========================================
export const lightTheme = {
  dark: false,
  fonts,
  colors: {
    // Navigation & Temel
    primary: palette.royalMerlot,
    headerTint: palette.white,
    background: palette.cream,
    card: palette.white,
    text: palette.inkBlack,
    border: palette.silver,
    notification: palette.danger,

    // Özel Bileşenler
    textSecondary: palette.slateGrey,
    subCard: palette.platinum,
    icon: palette.inkBlack,
    iconActive: palette.goldPrime,
    gold: palette.goldPrime,
    proCardBg: palette.goldLight,

    // Standart Buton (Fallback)
    buttonBg: palette.goldPrime,
    buttonText: palette.white,

    // --- YENİ: MERKEZİ BUTON VARYANTLARI ---
    // PremiumButton artık burayı okuyacak
    buttonVariants: getButtonVariants(false),

    // Manuel Erişim İçin (Header vb.)
    partyGradient: palette.partyGradient,
    goldShadow: palette.goldShadowStyle,
    merlotGradient: palette.merlotGradient,
    // Form & Durumlar
    success: palette.success,
    error: palette.danger,
    inputBg: palette.white,
    inputBorder: "#E0E0E0",
    shadow: "#000000",
  },
};

// ==========================================
// 🌙 KARANLIK TEMA (Dark Theme)
// ==========================================
export const darkTheme = {
  dark: true,
  fonts,
  colors: {
    // Navigation & Temel
    primary: palette.neonRuby,
    background: palette.pianoBlack,
    card: palette.charcoal,
    text: palette.cloudWhite,
    border: palette.richGrey,
    notification: palette.neonRuby,

    // Özel Bileşenler
    textSecondary: palette.silver,
    subCard: palette.richGrey,
    icon: palette.cloudWhite,
    iconActive: palette.goldPrime,
    gold: palette.goldPrime,
    proCardBg: "#2A2510",

    // Standart Buton (Fallback)
    buttonBg: palette.goldPrime,
    buttonText: palette.inkBlack,

    // --- YENİ: MERKEZİ BUTON VARYANTLARI ---
    buttonVariants: getButtonVariants(true),

    // Manuel Erişim İçin
    partyGradient: palette.partyGradient,
    goldShadow: palette.goldShadowStyle,
    merlotGradient: palette.merlotGradient,
    // Form & Durumlar
    success: palette.success,
    error: palette.danger,
    inputBg: palette.charcoal,
    inputBorder: palette.richGrey,
    shadow: "#000000",
  },
};
