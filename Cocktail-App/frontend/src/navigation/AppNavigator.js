import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import CocktailDetailScreen from "../screens/CocktailDetailScreen";

// "Stack" (Yığın) tipinde bir navigasyon oluşturucu başlatıyoruz
const Stack = createNativeStackNavigator();

/**
 * @desc    Manages the application's navigation structure (the "map").
 * Defines which screens exist and how they transition.
 * <NavigationContainer> is the root component for navigation.
 */
function AppNavigator() {
  return (
    <NavigationContainer>
      {/* Stack.Navigator, "ileri" ve "geri" gidebilen ekranları yönetir */}
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: "#f4511e", // (Örnek bir renk)
          },
          headerTintColor: "#fff", // (Başlık yazısı rengi)
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        {/* Ana Sayfa Ekranımız */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Kokteyller" }}
        ></Stack.Screen>

        {/* Tarif Detay Ekranımız */}
        <Stack.Screen
          name="CocktailDetail"
          component={CocktailDetailScreen}
          options={{ title: "Tarif Detayı" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
export default AppNavigator;
