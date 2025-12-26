import { React, useEffect } from "react";
import { NavigationContainer, useTheme, dark } from "@react-navigation/native";
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

import { useSelector, useDispatch } from "react-redux";

import { auth } from "../api/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

import {
  selectCurrentUser,
  getIsAuthLoading,
  loginOrRegisterUser,
  clearUser,
  // YENİ EKLENDİ: Hem kullanıcı hem misafir kontrolü için selector
  selectIsAuthenticatedOrGuest,
} from "../features/userSlice";

import { CustomDarkTheme, CustomLightTheme } from "../../constants/theme";
import { selectThemeMode } from "../features/uiSlice";
import { LinearGradient } from "expo-linear-gradient";

import MerlotHeader from "../ui/MerlotHeader";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const RouletteStack = createNativeStackNavigator();

/**
 * @desc    Ana Navigasyon Yönlendiricisi
 */
function AppNavigator() {
  // YENİ: Sadece currentUser'a değil, misafir durumuna da bakıyoruz
  const isAuthenticatedOrGuest = useSelector(selectIsAuthenticatedOrGuest);

  const isAuthLoading = useSelector(getIsAuthLoading);
  const dispatch = useDispatch();

  const themeMode = useSelector(selectThemeMode);
  const systemScheme = useColorScheme();

  const currentTheme =
    themeMode === "system"
      ? systemScheme === "dark"
        ? CustomDarkTheme
        : CustomLightTheme
      : themeMode === "dark"
        ? CustomDarkTheme
        : CustomLightTheme;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Kullanıcı daha önce giriş yapmışsa, onu Redux'a kaydet (Misafir modunu ezer)
        dispatch(
          loginOrRegisterUser({
            firebase_uid: firebaseUser.uid,
            email: firebaseUser.email,
          })
        );
      } else {
        // Kimse yoksa temizle (ama misafir butonu ile girilirse isGuest true kalır)
        dispatch(clearUser());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  if (isAuthLoading) {
    return (
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
      {/* GÜNCELLEME: Eğer kullanıcı giriş yapmışsa VEYA misafir modundaysa 
         Ana Uygulamayı göster. Aksi halde Giriş Ekranını göster.
      */}
      {isAuthenticatedOrGuest ? <MainAppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

/**
 * @desc    Giriş (Auth) yığınını yönetir.
 */
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

/**
 * @desc MainAppNavigator - Ana Uygulama (Sekmeler)
 */
function MainAppNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      initialRouteName="CocktailList"
      screenOptions={({ route }) => ({
        headerShown: false,
        unmountOnBlur: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginBottom: Platform.OS === "ios" ? 0 : 3,
        },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          height: Platform.OS === "ios" ? 90 : 70,
          paddingBottom: Platform.OS === "ios" ? 30 : 12,
          paddingTop: 10,
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
      <Tab.Screen
        name="CocktailList"
        component={HomeStackNavigator}
        options={{ title: t("navigation.cocktails") }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("CocktailList", { screen: "Home" });
          },
        })}
      ></Tab.Screen>
      <Tab.Screen
        name="Roulette"
        component={RouletteStackNavigator}
        options={{ title: t("navigation.roulette") }}
      />
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

function HomeStackNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerTitleAlign: "center",
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AppNavigator;
