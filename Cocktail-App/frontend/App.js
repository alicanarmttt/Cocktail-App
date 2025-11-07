import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useEffect } from "react";

import { Provider, useSelector, useDispatch } from "react-redux";
import { store } from "./src/app/store";
import {
  fetchCocktails,
  selectAllCocktails,
  getCocktailsStatus,
  getCocktailsError,
} from "./src/features/cocktails/cocktailSlice.js";

const CocktailList = () => {
  const dispatch = useDispatch();

  const cocktails = useSelector(selectAllCocktails);
  const status = useSelector(getCocktailsStatus);
  const error = useSelector(getCocktailsError);

  useEffect(() => {
    // Sadece 'status' (durum) 'idle' (boşta) ise API isteği at,
    if (status === "idle") {
      dispatch(fetchCocktails());
    }
  }, [status, dispatch]);

  let content;

  if (status === "loading") {
    content = (
      <ActivityIndicator size="large" color="#0000ff"></ActivityIndicator>
    );
  } else if (status === "succeeded") {
    content = cocktails.map((cocktail) => (
      <Text key={cocktail.cocktail_id} style={styles.cocktailName}>
        {cocktail.name} (ID: {cocktail.cocktail_id})
      </Text>
    ));
  } else if (status === "failed") {
    content = <Text style={styles.errorText}>{error}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kokteyller</Text>
      {content}
      <StatusBar style="auto" />
    </View>
  );
};

// Yorum: Burası projemizin ana giriş noktasıdır.
export default function App() {
  return (
    <Provider store={store}>
      <CocktailList />
    </Provider>
  );
}

// === Stil Dosyaları ===
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  cocktailName: {
    fontSize: 18,
    marginVertical: 5,
  },
  errorText: {
    fontSize: 16,
    color: "red",
  },
});
