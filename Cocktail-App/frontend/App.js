import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useEffect } from "react";
import AppNavigator from "./src/navigation/AppNavigator";

import { Provider, useSelector, useDispatch } from "react-redux";
import { store } from "./src/app/store";
import {
  fetchCocktails,
  selectAllCocktails,
  getCocktailsStatus,
  getCocktailsError,
} from "./src/features/cocktails/cocktailSlice.js";

// Yorum: Burası projemizin ana giriş noktasıdır.
export default function App() {
  return (
    <View style={styles.container}>
      <Provider store={store}>
        <AppNavigator />
      </Provider>
      {/* StatusBar'ı (saat, pil) en dışa almak ve sekmelerle 
          uyumlu hale getirmek iyi bir pratiktir */}
      <StatusBar style="light" backgroundColor="#f4511e" />
    </View>
  );
}

// "flex: 1" stilini tanımlıyoruz
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", // Arka plan rengi (opsiyonel)
  },
});
