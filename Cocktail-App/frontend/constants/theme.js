// ==========================================
// 🎨 LÜKS & RAFİNE RENK PALETİ (Premium Palette)
// ==========================================

const palette = {
  // --- METALLER (Değerli Vurgular) ---
  goldPrime: "#D4AF37", // Klasik Altın (Logolar ve Ana Butonlar için)
  goldLight: "#F1E5AC", // Şampanya Köpüğü (Açık vurgular, Light mod arka planları)
  goldMuted: "#C5A059", // Mat Altın (Göz yormayan ikonlar için)
  silver: "#C0C0C0", // Gümüş (İkincil metinler ve borderlar)
  platinum: "#E5E4E2", // Platin (Açık gri yüzeyler)

  // --- IŞIK (Light Mode Temelleri) ---
  cream: "#FCFAF2", // Fildişi/Krem (Çiğ beyaz yerine asil arka plan)
  white: "#FFFFFF", // Saf Beyaz (Kartlar için)

  // --- KARANLIK (Dark Mode Temelleri) ---
  pianoBlack: "#050505", // Derin Siyah (Tam siyahın bir tık açığı, OLED dostu)
  charcoal: "#1A1A1A", // Antrasit (Dark mod kartları)
  richGrey: "#2C2C2E", // Zengin Gri (Modallar)

  // --- METİNLER ---
  inkBlack: "#121212", // Mürekkep Siyahı (Light mod ana metin)
  slateGrey: "#4A4A4A", // Arduvaz Grisi (Light mod yan metin)
  cloudWhite: "#E0E0E0", // Bulut Beyazı (Dark mod ana metin - Gözü delmez)

  // --- DURUMLAR ---
  success: "#4A7c59", // Zümrüt Yeşili (Cırtlak yeşil yerine)
  danger: "#A63434", // Yakut Kırmızısı (Cırtlak kırmızı yerine)
};

// ==========================================
// 🔤 YAZI TİPİ AYARLARI (Standart)
// ==========================================
const fonts = {
  regular: {
    fontFamily: "System",
    fontWeight: "400",
  },
  medium: {
    fontFamily: "System",
    fontWeight: "500",
  },
  light: {
    fontFamily: "System",
    fontWeight: "300",
  },
  thin: {
    fontFamily: "System",
    fontWeight: "100",
  },
};

// ==========================================
// ☀️ AYDINLIK TEMA (Light Theme) - "Champagne Brunch"
// ==========================================
export const lightTheme = {
  dark: false,
  fonts, // <--- BURASI EKSİKTİ: fonts objesini buraya ekledik
  colors: {
    // React Navigation Standartları
    primary: palette.goldPrime, // Aktif tablar, ana başlıklar
    background: palette.cream, // Arka plan (Hafif krem)
    card: palette.white, // Kartlar (Beyaz)
    text: palette.inkBlack, // Yazılar (Koyu Antrasit)
    border: palette.silver, // İnce çizgiler
    notification: palette.danger, // Bildirimler

    // Özel Bileşen Renkleri
    textSecondary: palette.slateGrey, // Alt başlıklar
    subCard: palette.platinum, // İç içe alanlar

    // İkonlar
    icon: palette.inkBlack, // İkonlar varsayılan siyah
    iconActive: palette.goldPrime, // Seçili ikon Altın

    // Pro / Özel Alanlar
    gold: palette.goldPrime,
    proCardBg: palette.goldLight, // Pro kutusu (Şampanya rengi)

    // Butonlar
    buttonBg: palette.goldPrime, // Buton Arka Planı (Altın)
    buttonText: palette.white, // Buton Yazısı (Beyaz)

    // Durumlar
    success: palette.success,
    error: palette.danger,

    // Input
    inputBg: palette.white,
    inputBorder: "#E0E0E0",

    shadow: "#000000",
  },
};

// ==========================================
// 🌙 KARANLIK TEMA (Dark Theme) - "Midnight Lounge"
// ==========================================
export const darkTheme = {
  dark: true,
  fonts, // <--- BURASI EKSİKTİ: fonts objesini buraya ekledik
  colors: {
    // React Navigation Standartları
    primary: palette.goldMuted, // Dark modda altın biraz daha matlaşır (Göz yormaz)
    background: palette.pianoBlack, // Arka plan (Derin Siyah)
    card: palette.charcoal, // Kartlar (Koyu Antrasit)
    text: palette.cloudWhite, // Yazılar (Kırık Beyaz)
    border: palette.richGrey, // Çizgiler (Koyu Gri)
    notification: palette.goldPrime,

    // Özel Bileşen Renkleri
    textSecondary: palette.silver, // Alt başlıklar (Gümüş)
    subCard: palette.richGrey,

    // İkonlar
    icon: palette.cloudWhite, // İkonlar beyaz
    iconActive: palette.goldPrime, // Seçili ikon Parlak Altın

    // Pro / Özel Alanlar
    gold: palette.goldPrime,
    proCardBg: "#2A2510", // Pro kutusu (Çok koyu altın/kahve)

    // Butonlar
    buttonBg: palette.goldPrime, // Buton yine Altın
    buttonText: palette.inkBlack, // Dark modda buton yazısı SİYAH olur (Kontrast için)

    // Durumlar
    success: palette.success,
    error: palette.danger,

    // Input
    inputBg: palette.charcoal,
    inputBorder: palette.richGrey,

    shadow: "#000000", // Dark modda "Glow" efekti için kullanılabilir
  },
};
