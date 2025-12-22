import { React, useEffect } from "react";
import {
  NavigationContainer,
  useTheme,
  dark, // YENİ: Tema renklerini alt bileşenlerde kullanmak için
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import {
  useColorScheme,
  View,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
// YENİ EKLENDİ: Dil desteği için import
import { useTranslation } from "react-i18next";

import HomeScreen from "../screens/HomeScreen";
import CocktailDetailScreen from "../screens/CocktailDetailScreen";
import AssistantScreen from "../screens/AssistantScreen";
import AssistantResultScreen from "../screens/AssistantResultScreen";
import LoginScreen from "../screens/LoginScreen";
import ProfileScreen from "../screens/ProfileScreen";
import UpgradeToProScreen from "../screens/UpgradeToProScreen";
import RouletteScreen from "../screens/RouletteScreen";
import FavoritesScreen from "../screens/FavoritesScreen";

// YENİ EKLENDİ: 'userSlice'taki 'selector' (veri okuyucu)
import { useSelector, useDispatch } from "react-redux";

// YENİ EKLENDİ (EKSİK 9): Firebase Auth Servisi ve "Auth Durum Dinleyicisi"
import { auth } from "../api/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

// YENİ EKLENDİ (EKSİK 9): 'userSlice' (sağdaki) dosyasından GEREKLİ eylem ve selector'ler
import {
  selectCurrentUser,
  getIsAuthLoading, // Yüklenme durumunu oku
  loginOrRegisterUser, // Backend (is_pro) ile yeniden senkronize et
  clearUser, // Auth 'null' ise Redux'u temizle
} from "../features/userSlice";

// 2. YENİ TEMA DOSYAMIZI IMPORT ET
import { CustomDarkTheme, CustomLightTheme } from "../../constants/theme";
import { selectThemeMode } from "../features/uiSlice";
import { LinearGradient } from "expo-linear-gradient";

import MerlotHeader from "../ui/MerlotHeader";

// "Stack" (Yığın) tipinde bir navigasyon oluşturucu başlatıyoruz
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const RouletteStack = createNativeStackNavigator();

/**
 * @desc    GÜNCELLENDİ: Ana Navigasyon Yönlendiricisi
 * Artık 'userSlice' (Redux) durumuna bakar ve
 * kullanıcıyı 'Auth' (Giriş) veya 'MainApp' (Ana Uygulama) ekranlarına yönlendirir.
 */
function AppNavigator() {
  // Redux store'dan (userSlice) mevcut kullanıcıyı ve Auth yüklenme durumunu seç
  const currentUser = useSelector(selectCurrentUser);
  const isAuthLoading = useSelector(getIsAuthLoading); // (userSlice'tan)
  const dispatch = useDispatch();

  // 3. Tema Mantığı
  const themeMode = useSelector(selectThemeMode); // Redux'tan gelen tercih ('system', 'light', 'dark')
  const systemScheme = useColorScheme(); // Telefonun ayarı ('light' veya 'dark')

  // Hangi tema objesini kullanacağız?
  const currentTheme =
    themeMode === "system"
      ? systemScheme === "dark"
        ? CustomDarkTheme
        : CustomLightTheme
      : themeMode === "dark"
        ? CustomDarkTheme
        : CustomLightTheme;

  //  (EKSİK 9): "Kalıcı Giriş" (Persistence) Köprüsü
  // Uygulama başlar başlamaz (bir kereliğine) çalışır
  useEffect(() => {
    // Firebase'e (AsyncStorage kullanarak) "Giriş yapmış birini hatırlıyor musun?"
    // diye sorar ve dinlemeye başlar.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // CEVAP 1: "Evet, hatırlıyorum."
        // Firebase (Frontend) kullanıcısını (uid, email) buldu.
        // Şimdi bu kullanıcıyı bizim Backend'imiz (is_pro) ile senkronize etmeliyiz.
        // 'loginOrRegisterUser' thunk'ı (sağdaki userSlice'ta)
        // hem API'yi çağırır hem de 'isAuthLoading: false' yapar.
        dispatch(
          loginOrRegisterUser({
            firebase_uid: firebaseUser.uid,
            email: firebaseUser.email,
          })
        );
      } else {
        // CEVAP 2: "Hayır, kimse giriş yapmamış."
        // 'clearUser' reducer'ı (sağdaki userSlice'ta)
        // 'currentUser: null' ve 'isAuthLoading: false' yapar.
        dispatch(clearUser());
      }
    });

    // Bu 'effect' (dinleyici) kapandığında abonelikten çık (hafıza sızıntısını önle)
    return () => unsubscribe();
  }, [dispatch]); // (Sadece bir kez çalışır)

  // YENİ EKLENDİ (EKSİK 9): "Göz Kırpma" (Flicker) Engelleme
  // 'onAuthStateChanged' (yukarıdaki) kontrolünü bitirene kadar
  // 'isAuthLoading' (sağdaki userSlice'ta) 'true' olacaktır.
  // Bu sırada, 'Login' veya 'Main' ekranını göstermek yerine
  // (ekranın "göz kırpmasını" engellemek için) bir "Yükleniyor" (Loading) ekranı gösteririz.
  if (isAuthLoading) {
    return (
      // GÜNCELLEME: Yüklenme ekranı arka planı ve spinner rengi dinamikleştirildi
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: currentTheme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={currentTheme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={currentTheme}>
      {/* Eğer 'currentUser' null değilse (Giriş yapmışsa) Ana Uygulamayı (Sekmeleri) göster.
        Eğer 'currentUser' null ise (Giriş yapmamışsa) Giriş (Auth) yığınını göster.
      */}
      {currentUser ? <MainAppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

/**
 * @desc    YENİ EKLENDİ: "Giriş" (Auth) yığınını yönetir.
 * (Şimdilik sadece LoginScreen içerir, ileride RegisterScreen de eklenebilir)
 */
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false, // Giriş ekranında başlık (header) olmasın
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      {/* <AuthStack.Screen name="Register" component={RegisterScreen} /> */}
    </AuthStack.Navigator>
  );
}

/**
 * @desc MainAppNavigator
 * Giriş yapıldığında gösterilecek Ana Uygulamayı (Sekmeler) yönetir.
 */
function MainAppNavigator() {
  // YENİ: Renkleri hook ile alıyoruz
  const { colors } = useTheme();
  const { t } = useTranslation(); // Çeviri kancası

  return (
    <Tab.Navigator
      initialRouteName="CocktailList"
      screenOptions={({ route }) => ({
        headerShown: false, // Her sayfanın kendi header'ı var

        // #8. PROBLEM ÇÖZÜMÜ: Navigasyon Karışıklığını Önleme
        unmountOnBlur: true,

        // --- İKON RENGİ BAĞLANTISI ---
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,

        // --- TEXT STİLİ ---
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginBottom: Platform.OS === "ios" ? 0 : 3,
        },

        // --- TAB BAR STİLİ (PREMIUM DOKUNUŞ) ---
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,

          // Yükseklik ayarı
          height: Platform.OS === "ios" ? 90 : 70,
          paddingBottom: Platform.OS === "ios" ? 30 : 12,
          paddingTop: 10,

          // Gölge (Shadow)
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -5 },
              shadowOpacity: dark ? 0.3 : 0.1,
              shadowRadius: 10,
            },
            android: {
              elevation: 20,
            },
          }),
        },

        // İkon Ayarları
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "CocktailList") {
            iconName = focused ? "list" : "list-outline";
          } else if (route.name === "Assistant") {
            iconName = focused ? "wine" : "wine-outline";
          } else if (route.name === "Roulette") {
            iconName = focused ? "shuffle" : "shuffle-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          if (!iconName) {
            iconName = "alert-circle-outline";
          }

          return (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={iconName} size={size} color={color} />
            </View>
          );
        },
      })}
    >
      {/* SEKME 1: Kokteyl Listesi */}
      <Tab.Screen
        name="CocktailList"
        component={HomeStackNavigator}
        options={{ title: t("navigation.cocktails") }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // 1. Varsayılan eylemi durdur (hafızadaki ekranı getirmesin)
            e.preventDefault();

            // 2. Bu stack'in en başına ('Home' ekranına) git
            // Not: 'CocktailList' tabın adı, 'Home' ise o stack'in içindeki ilk ekranın adı
            navigation.navigate("CocktailList", { screen: "Home" });
          },
        })}
      ></Tab.Screen>
      <Tab.Screen
        name="Roulette"
        component={RouletteStackNavigator}
        options={{ title: t("navigation.roulette") }}
      />
      {/* SEKME 2: Barmen Asistanı */}
      <Tab.Screen
        name="Assistant"
        component={AssistantStackNavigator}
        options={{
          title: t("navigation.assistant"),
        }}
      ></Tab.Screen>
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          title: t("navigation.profile"),
        }}
      ></Tab.Screen>
    </Tab.Navigator>
  );
}

/**
 * @desc    Manages the application's navigation structure (the "map").
 */
function HomeStackNavigator() {
  const { colors, fonts } = useTheme();
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        // #5. PROBLEM ÇÖZÜMÜ: Başlıkları Ortala
        headerTitleAlign: "center",
        // GÜNCELLEME: Header renkleri dinamik
        headerStyle: { backgroundColor: "transparent" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
        headerBackground: () => <MerlotHeader />,
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: t("navigation.cocktails") }}
      />
      <Stack.Screen
        name="CocktailDetail"
        component={CocktailDetailScreen}
        options={{ title: t("navigation.recipe_detail") }}
      />
      <Stack.Screen
        name="Roulette"
        component={RouletteScreen}
        options={{ title: t("navigation.roulette_wheel") }}
      />
    </Stack.Navigator>
  );
}

/**
 * @desc   Rulet sekmesi için navigasyon yığını.
 */
function RouletteStackNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.buttonText || "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Stack.Screen
        name="RouletteHome"
        component={RouletteScreen}
        options={{
          title: t("navigation.roulette_wheel"),
          headerTintColor: "#FFFFFF",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "transparent" },
          headerBackground: () => (
            <LinearGradient
              colors={colors.partyGradient}
              style={{ flex: 1 }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          ),
        }}
      />
      <Stack.Screen
        name="CocktailDetail"
        component={CocktailDetailScreen}
        options={{ title: t("navigation.recipe_detail") }}
      />
    </Stack.Navigator>
  );
}

/**
 * @desc    YENİ EKLENDİ: "Asistan" sekmesinin (Assistant, Results) iç yığınını yönetir.
 */
function AssistantStackNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: "transparent" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
        headerBackground: () => <MerlotHeader />,
      }}
    >
      <Stack.Screen
        name="AssistantHome"
        component={AssistantScreen}
        options={{ title: t("navigation.assistant_title") }}
      />
      <Stack.Screen
        name="AssistantResult"
        component={AssistantResultScreen}
        options={{ title: t("navigation.found_recipes") }}
      />
      <Stack.Screen
        name="CocktailDetail"
        component={CocktailDetailScreen}
        options={{ title: t("navigation.recipe_detail") }}
      />
    </Stack.Navigator>
  );
}

/**
 * @desc    "Profil" sekmesinin (Profile, UpgradeToPro) iç yığınını yönetir.
 */
function ProfileStackNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: "transparent" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
        headerBackground: () => <MerlotHeader />,
      }}
    >
      <ProfileStack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ title: t("navigation.profile") }}
      />
      <ProfileStack.Screen
        name="UpgradeToPro"
        component={UpgradeToProScreen}
        options={{ title: t("navigation.upgrade_pro") }}
      />
      <ProfileStack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ title: t("navigation.favorites") }}
      ></ProfileStack.Screen>
    </ProfileStack.Navigator>
  );
}

// YENİ EKLENDİ (EKSİK 9): Yüklenme (Loading) ekranı stili
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AppNavigator;
