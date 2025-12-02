import { React, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import HomeScreen from "../screens/HomeScreen";
import CocktailDetailScreen from "../screens/CocktailDetailScreen";
import AssistantScreen from "../screens/AssistantScreen";
import AssistantResultScreen from "../screens/AssistantResultScreen";
import LoginScreen from "../screens/LoginScreen";
import ProfileScreen from "../screens/ProfileScreen";
import UpgradeToProScreen from "../screens/UpgradeToProScreen";
import RouletteScreen from "../screens/RouletteScreen";
import { View, ActivityIndicator, StyleSheet } from "react-native";

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
import { lightTheme, darkTheme } from "../constants/theme";
import { selectThemeMode } from "../features/uiSlice";

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

  // Hangi tema aktif olacak?
  const currentTheme =
    themeMode === "system"
      ? systemScheme === "dark"
        ? darkTheme
        : lightTheme
      : themeMode === "dark"
        ? darkTheme
        : lightTheme;

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f4511e" />
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
  return (
    <Tab.Navigator
      initialRouteName="CocktailList"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "CocktailList") {
            iconName = focused ? "wine" : "wine-outline";
          } else if (route.name === "Assistant") {
            iconName = focused ? "build" : "build-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === "RouletteTab") {
            iconName = focused ? "dice" : "dice-outline";
          }
          return (
            <Ionicons name={iconName} size={size} color={color}></Ionicons>
          );
        },
        tabBarActiveTintColor: "#f4511e",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      {/* SEKME 1: Kokteyl Listesi */}
      <Tab.Screen
        name="CocktailList"
        component={HomeStackNavigator}
        options={{ title: "Kokteyller" }}
      ></Tab.Screen>
      <Tab.Screen
        name="RouletteTab"
        component={RouletteStackNavigator}
        options={{ title: "Rulet" }}
      />
      {/* SEKME 2: Barmen Asistanı */}
      <Tab.Screen
        name="Assistant"
        component={AssistantStackNavigator}
        options={{
          title: "Asistan",
        }}
      ></Tab.Screen>
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          title: "Profil",
        }}
      ></Tab.Screen>
    </Tab.Navigator>
  );
}

/**
 * @desc    Manages the application's navigation structure (the "map").
 * Defines which screens exist and how they transition.
 * <NavigationContainer> is the root component for navigation.
 */
function HomeStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: "#f4511e" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Kokteyller" }}
      />
      <Stack.Screen
        name="CocktailDetail"
        component={CocktailDetailScreen}
        options={{ title: "Tarif Detayı" }}
      />
      <Stack.Screen
        name="Roulette"
        component={RouletteScreen}
        options={{ title: "Kokteyl Çarkı 🎲" }}
      />
    </Stack.Navigator>
  );
}
/**
 * @desc   Rulet sekmesi için navigasyon yığını.
 * İçinde Rulet ve Detay sayfası olur.
 */
function RouletteStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#f4511e" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Stack.Screen
        name="RouletteHome"
        component={RouletteScreen}
        options={{ title: "Kokteyl Çarkı 🎲" }}
      />
      <Stack.Screen
        name="CocktailDetail"
        component={CocktailDetailScreen}
        options={{ title: "Tarif Detayı" }}
      />
    </Stack.Navigator>
  );
}

/**
 * @desc    YENİ EKLENDİ: "Asistan" sekmesinin (Assistant, Results) iç yığınını yönetir.
 */
function AssistantStackNavigator() {
  return (
    <Stack.Navigator
      // Bu yığının da stilini diğeriyle aynı yapalım
      screenOptions={{
        headerStyle: { backgroundColor: "#f4511e" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Stack.Screen
        name="AssistantHome" // Yığının ana ekranı
        component={AssistantScreen}
        options={{ title: "Barmen'in Asistanı" }}
      />
      <Stack.Screen
        name="AssistantResult" // AssistantScreen'in yönlendireceği ekran
        component={AssistantResultScreen}
        options={{ title: "Bulunan Tarifler" }}
      />
      <Stack.Screen
        name="CocktailDetail"
        component={CocktailDetailScreen}
        options={{ title: "Tarif Detayı" }}
      />
    </Stack.Navigator>
  );
}

/**
 * @desc    "Profil" sekmesinin (Profile, UpgradeToPro) iç yığınını yönetir.
 */
function ProfileStackNavigator() {
  return (
    // ÖNEMLİ: Bu yığının (Stack) kendi başlığı (header) VARDIR
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#f4511e" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <ProfileStack.Screen
        name="ProfileHome" // Yığının ana ekranı
        component={ProfileScreen}
        options={{ title: "Profil" }}
      />
      <ProfileStack.Screen
        name="UpgradeToPro" // 'Satın Alma' ekranı
        component={UpgradeToProScreen}
        options={{ title: "PRO'ya Yükselt" }}
      />
    </ProfileStack.Navigator>
  );
}

// YENİ EKLENDİ (EKSİK 9): Yüklenme (Loading) ekranı stili
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff", // Başlangıç ekranı arka planı
  },
});

export default AppNavigator;
