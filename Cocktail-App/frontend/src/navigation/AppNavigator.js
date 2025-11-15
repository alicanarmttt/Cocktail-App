import { React } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import CocktailDetailScreen from "../screens/CocktailDetailScreen";
import AssistantScreen from "../screens/AssistantScreen";
import AssistantResultScreen from "../screens/AssistantResultScreen";
import LoginScreen from "../screens/LoginScreen";
// YENİ EKLENDİ: 'userSlice'taki 'selector' (veri okuyucu)
import { selectCurrentUser } from "../features/userSlice";
import { useSelector } from "react-redux";

// "Stack" (Yığın) tipinde bir navigasyon oluşturucu başlatıyoruz
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
// YENİ EKLENDİ: Giriş (Auth) yığını için ayrı bir Stack
const AuthStack = createNativeStackNavigator();
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
    </Stack.Navigator>
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
 * @desc    GÜNCELLENDİ: Ana Navigasyon Yönlendiricisi
 * Artık 'userSlice' (Redux) durumuna bakar ve
 * kullanıcıyı 'Auth' (Giriş) veya 'MainApp' (Ana Uygulama) ekranlarına yönlendirir.
 */
function AppNavigator() {
  // Redux store'dan (userSlice) mevcut kullanıcıyı seç
  const currentUser = useSelector(selectCurrentUser);

  return (
    <NavigationContainer>
      {/* Eğer 'currentUser' null değilse (Giriş yapmışsa) Ana Uygulamayı (Sekmeleri) göster.
        Eğer 'currentUser' null ise (Giriş yapmamışsa) Giriş (Auth) yığınını göster.
      */}
      {currentUser ? <MainAppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
/**
 * @desc    YENİ ADI: MainAppNavigator
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
      {/* SEKME 2: Barmen Asistanı */}
      <Tab.Screen
        name="Assistant"
        component={AssistantStackNavigator}
        options={{
          title: "Asistan",
        }}
      ></Tab.Screen>
    </Tab.Navigator>
  );
}

export default AppNavigator;
