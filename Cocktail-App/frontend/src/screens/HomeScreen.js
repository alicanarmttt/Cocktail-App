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
  getCocktailsListError,
  getCocktailsListStatus,
} from "../features/cocktails/cocktailSlice";

/**
 * @desc Uygulamanın ana ekranı. Kokteyl listesini gösterir.
 * @param "{object}" React navigation tarafından sağlanan otomatik props
 */

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  const cocktails = useSelector(selectAllCocktails);
  const status = useSelector(getCocktailsListStatus);
  const error = useSelector(getCocktailsListError);
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
        style={styles.list}
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
    content = (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error}</Text>;
      </View>
    );
  }

  return <View style={styles.container}>{content}</View>;
};

// === Stil Dosyaları (DÜZELTİLDİ v2) ===
const styles = StyleSheet.create({
  // Bu stil, SADECE 'loading' ve 'failed' durumları için kullanılır
  // (Ortalamak için)
  centeredContainer: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  // Bu stil, SADECE 'succeeded' (liste) durumu için kullanılır
  // (Yayılmak için)
  listContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  list: {
    width: "100%", // Listenin tüm genişliği kaplamasını sağla
  },
  cocktailItem: {
    padding: 15,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    width: "90%",
    alignSelf: "center",
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
