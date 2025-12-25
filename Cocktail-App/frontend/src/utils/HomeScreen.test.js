import React from "react";
import { render } from "@testing-library/react-native";
import HomeScreen from "../screens/HomeScreen";
import { Platform } from "react-native"; // React Native'den Platform'u çağırdık

// --- 1. PLATFORM MOCK (GASP ETME YÖNTEMİ) ---
// Jest Mock kullanmak yerine, Platform objesinin OS özelliğini zorla değiştiriyoruz.
beforeAll(() => {
  Object.defineProperty(Platform, "OS", {
    get: () => "android", // "Hey Platform, OS nedir?" dendiğinde "android" dönecek.
  });
});

// --- 2. SLICE MOCKLARI (REDUX TOOLKIT) ---
jest.mock("../../src/features/cocktails/cocktailSlice", () => ({
  fetchCocktails: jest.fn(),
  selectAllCocktails: { name: "selectAllCocktails" },
  getCocktailsListError: { name: "getCocktailsListError" },
  getCocktailsListStatus: { name: "getCocktailsListStatus" },
  selectCocktailById: jest.fn(),
}));

jest.mock("../../src/features/userSlice", () => ({
  selectCurrentUser: { name: "selectCurrentUser" },
}));

jest.mock("../../src/features/favoritesSlice", () => ({
  fetchFavorites: jest.fn(),
}));

// --- 3. REDUX MOCK (HOOKS) ---
jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn(),
  useSelector: (selector) => {
    if (selector.name === "selectAllCocktails") {
      return [
        {
          cocktail_id: 1,
          name: { en: "Mojito" },
          image_url: "http://test.com/mojito.jpg",
        },
        {
          cocktail_id: 2,
          name: { en: "Margarita" },
          image_url: "http://test.com/margarita.jpg",
        },
      ];
    }
    if (selector.name === "selectCurrentUser")
      return { user_id: 123, name: "Test Şef" };
    if (selector.name === "getCocktailsListStatus") return "succeeded";
    if (selector.name === "getCocktailsListError") return null;
    return null;
  },
}));

// --- 4. NAVIGATION & THEME & I18N ---
jest.mock("@react-navigation/native", () => ({
  useTheme: () => ({
    colors: {
      background: "white",
      text: "black",
      primary: "blue",
      card: "white",
      textSecondary: "gray",
      border: "gray",
      subCard: "gray",
      shadow: "black",
    },
    fonts: { styles: { caption: { fontSize: 12 } } },
  }),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: "en" },
  }),
}));

// --- 5. ASSETS & COMPONENTS ---
jest.mock("../../assets/gold_frame.png", () => 1);
jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("../components/CocktailImage", () => "CocktailImage");
jest.mock("../components/CocktailSelectorModal", () => "CocktailSelectorModal");
jest.mock("../components/common/SkeletonCard", () => "SkeletonCard");
jest.mock("../components/common/ErrorView", () => "ErrorView");
jest.mock("../ui/PremiumButton", () => "PremiumButton");

// --- TEST SENARYOLARI ---
describe("HomeScreen Tests", () => {
  it('kokteyl listesi yüklendiğinde "Mojito" ve "Margarita" ekranda görünmeli', () => {
    const navigationMock = { navigate: jest.fn() };

    // Render işlemi
    const { getByText } = render(<HomeScreen navigation={navigationMock} />);

    // Artık kesinlikle Android modundayız.
    expect(getByText("MOJITO")).toBeTruthy();
    expect(getByText("MARGARITA")).toBeTruthy();
  });

  it("Quote (Günün Sözü) alanı render edilmeli", () => {
    const navigationMock = { navigate: jest.fn() };
    const { getByText } = render(<HomeScreen navigation={navigationMock} />);
    expect(getByText("home.quote")).toBeTruthy();
  });
});
