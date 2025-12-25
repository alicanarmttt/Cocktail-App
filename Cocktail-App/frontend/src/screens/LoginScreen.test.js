import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import LoginScreen from "./LoginScreen"; // Dosya yoluna dikkat

// --- 1. FIREBASE MOCK (EN ÖNEMLİSİ) ---
// LoginScreen, firebase fonksiyonlarını çağırıyor. Onları susturuyoruz.
const mockSignIn = jest.fn();
const mockCreateUser = jest.fn();

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({})),
  initializeAuth: jest.fn(),
  getReactNativePersistence: jest.fn(),
  // Ekranın içinde kullanılan fonksiyonları buraya ekliyoruz:
  signInWithEmailAndPassword: (...args) => mockSignIn(...args),
  createUserWithEmailAndPassword: (...args) => mockCreateUser(...args),
  sendPasswordResetEmail: jest.fn(),
  sendEmailVerification: jest.fn(),
}));

// firebaseConfig dosyasını da mockluyoruz
jest.mock("../api/firebaseConfig", () => ({
  auth: { languageCode: "en" },
}));

// --- 2. REDUX MOCK ---
// Ekran, dispatch ve useSelector kullanıyor.
// Yeni hali (unwrap fonksiyonu olan bir obje döndürsün):
const mockDispatch = jest.fn(() => ({ unwrap: jest.fn() }));

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) => {
    // Login status sorulduğunda 'idle' (boşta) desin
    if (selector?.name === "getLoginStatus") return "idle";
    return null;
  },
}));

// Thunk fonksiyonunu (loginOrRegisterUser) mockluyoruz
jest.mock("../features/userSlice", () => ({
  // .unwrap() fonksiyonu çağrıldığı için onu da taklit ediyoruz
  loginOrRegisterUser: jest.fn(() => ({ unwrap: jest.fn() })),
  getLoginStatus: { name: "getLoginStatus" },
}));

// --- 3. UI MOCKLARI (GÖRSEL BİLEŞENLER) ---

// Video bileşeni Jest'te çalışmaz, onu boş bir View yapıyoruz
jest.mock("expo-av", () => ({
  Video: "Video",
  ResizeMode: { COVER: "cover" },
}));

// Gradient (Arka plan gölgesi)
jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

// Navigation (useTheme hatası vermesin diye)
jest.mock("@react-navigation/native", () => ({
  useTheme: () => ({ colors: { text: "white", background: "black" } }),
}));

// Çeviri (t fonksiyonu anahtarı geri döndürsün)
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: "tr" },
  }),
}));

// İkonlar
jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));

// PremiumButton (Senin özel butonun)
// Testte butona tıklayabilmek için basit bir TouchableOpacity'ye çeviriyoruz
jest.mock("../ui/PremiumButton", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return (props) => (
    <TouchableOpacity onPress={props.onPress} testID="login-button">
      <Text>{props.title}</Text>
    </TouchableOpacity>
  );
});

// Arka plandaki .mp4 videosunu sayıya eşitle (Import hatasını önler)
jest.mock("../../assets/home_480.mp4", () => 1);

// --- TEST SENARYOLARI ---
describe("LoginScreen UI Testleri", () => {
  beforeEach(() => {
    // Her testten önce sayaçları sıfırla
    mockDispatch.mockClear();
    mockSignIn.mockClear();
  });

  it("Ekran açıldığında Email ve Şifre kutuları görünmeli", () => {
    const { getByPlaceholderText } = render(<LoginScreen />);

    expect(getByPlaceholderText("auth.email_placeholder")).toBeTruthy();
    expect(getByPlaceholderText("auth.password_placeholder")).toBeTruthy();
  });

  it("Kullanıcı Email ve Şifre yazabilmeli", () => {
    const { getByPlaceholderText } = render(<LoginScreen />);

    const emailInput = getByPlaceholderText("auth.email_placeholder");
    const passInput = getByPlaceholderText("auth.password_placeholder");

    // Yazı yazma simülasyonu
    fireEvent.changeText(emailInput, "sef@test.com");
    fireEvent.changeText(passInput, "123456");

    // Değerler değişti mi?
    expect(emailInput.props.value).toBe("sef@test.com");
    expect(passInput.props.value).toBe("123456");
  });

  it("Butona basınca Firebase ve Redux tetiklenmeli", async () => {
    // 1. Firebase'in "Başarılı" döneceğini ayarlıyoruz
    mockSignIn.mockResolvedValue({
      user: { uid: "firebase_id_123", email: "sef@test.com" },
    });

    const { getByPlaceholderText, getByTestId } = render(<LoginScreen />);

    // 2. Formu doldur
    fireEvent.changeText(
      getByPlaceholderText("auth.email_placeholder"),
      "sef@test.com"
    );
    fireEvent.changeText(
      getByPlaceholderText("auth.password_placeholder"),
      "123456"
    );

    // 3. Butona tıkla (PremiumButton mock'una verdiğimiz testID)
    fireEvent.press(getByTestId("login-button"));

    // 4. Firebase çağrıldı mı? (Bekleyerek kontrol et)
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        expect.anything(),
        "sef@test.com",
        "123456"
      );
    });

    // 5. Redux dispatch çağrıldı mı? (loginOrRegisterUser action'ı)
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalled();
    });
  });
});
