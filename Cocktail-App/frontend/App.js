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
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  );
}
