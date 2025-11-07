import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Button,
  FlatList,
} from "react-native";

import {
  fetchCocktails,
  selectAllCocktails,
  getCocktailsError,
  getCocktailsStatus,
} from "../features/cocktails/cocktailSlice";

/**
 * @desc Uygulamanın ana ekranı. Kokteyl listesini gösterir.
 * @param "{object}" React navigation tarafından sağlanan otomatik props
 */

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  const cocktails = useSelector(selectAllCocktails);
  const status = useSelector(getCocktailsStatus);
  const error = useSelector(getCocktailsError);
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCocktails());
    }
  }, [status, dispatch]);

  let content;
  if (status === "loading") {
    content = (
      <ActivityIndicator size="large" color="#f4511e"></ActivityIndicator>
    );
  } else if (status === "succeeded") {
    // Gelen 'cocktails' dizisini (array) 'FlatList' ile ekrana basıyoruz
    // 'FlatList', 'map()' fonksiyonunun optimize edilmiş halidir.
    content = (
      <FlatList
        data={cocktails}
        keyExtractor={(item) => item.cocktail_id.toString()} // Her eleman için benzersiz ID
        renderItem={({ item }) => (
          <View style={styles.cocktailItem}>
            <Text style={styles.cocktailName}>
              {item.name} (ID: {item.cocktail_id})
            </Text>
            <Button
              title="See Recipe"
              onPress={() => {
                navigation.navigate("CocktailDetail", {
                  cocktailId: item.cocktail_id,
                });
              }}
              color="#f4511e"
            ></Button>
          </View>
        )}
      ></FlatList>
    );
  } else if (status === "failed") {
    content = <Text style={styles.errorText}>{error}</Text>;
  }

  return <View style={styles.container}>{content}</View>;
};

// === Stil Dosyaları ===
const styles = StyleSheet.create({
  container: {
    flex: 1, // Ekranı kapla
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  cocktailItem: {
    padding: 15,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    width: "90%",
    alignSelf: "center", // FlatList içinde kendini ortalaması için
  },
  cocktailName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: "red",
  },
});

export default HomeScreen;
