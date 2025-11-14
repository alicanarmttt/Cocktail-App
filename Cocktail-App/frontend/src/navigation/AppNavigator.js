import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import CocktailDetailScreen from "../screens/CocktailDetailScreen";
import AssistantScreen from "../screens/AssistantScreen";
import AssistantResultScreen from "../screens/AssistantResultScreen";

// "Stack" (Yığın) tipinde bir navigasyon oluşturucu başlatıyoruz
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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
 * @desc    Uygulamamızın "ana haritası" artık burası.
 * Alt sekmeleri (Tabs) yönetir.
 */
function AppNavigator() {
  return (
    <NavigationContainer>
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
          // Aktif ve pasif sekme renkleri
          tabBarActiveTintColor: "#f4511e",
          tabBarInactiveTintColor: "gray",
          headerShown: false,
        })}
      >
        {/* SEKME 1: Kokteyl Listesi (içinde Stack Navigator var) */}
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
    </NavigationContainer>
  );
}

export default AppNavigator;
