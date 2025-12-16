import React, { useEffect } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { useSelector, useDispatch } from "react-redux";

// 1. Senin yazdığın userSlice'dan hazır selector'ü çekiyoruz
import { selectCurrentUser } from "../features/userSlice";
import {
  fetchFavorites,
  selectAllFavorites,
  getFavoritesStatus,
} from "../features/favoritesSlice";

const FavoritesScreen = () => {
  const dispatch = useDispatch();

  // 2. Kullanıcı verisine ulaşmanın EN DOĞRU yolu (Senin koduna göre)
  // Bu bize direkt { user_id: 1, email: '...', is_pro: false } objesini verir.
  const currentUser = useSelector(selectCurrentUser);

  const favorites = useSelector(selectAllFavorites);
  const status = useSelector(getFavoritesStatus);

  useEffect(() => {
    // 3. currentUser null değilse ve bir ID'si varsa isteği at
    // Backend'inden dönen ID alanı 'id' mi yoksa 'user_id' mi?
    // Genelde veritabanı çıktılarında 'user_id' olur, ikisini de kontrol edelim.
    const userId = currentUser?.user_id || currentUser?.id;

    if (userId) {
      console.log("Favoriler isteniyor. User ID:", userId);
      dispatch(fetchFavorites(userId));
    } else {
      console.log("Kullanıcı oturum açmamış, favori isteği atılmadı.");
    }
  }, [dispatch, currentUser]);

  // --- UI KISMI ---

  if (!currentUser) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Favorilerinizi görmek için lütfen giriş yapın.</Text>
      </View>
    );
  }

  if (status === "loading") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (status === "failed") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Favoriler yüklenirken hata oluştu.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 10 }}>
      {favorites.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 20 }}>
          Henüz hiç favori kokteyliniz yok.
        </Text>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.cocktail_id.toString()}
          renderItem={({ item }) => (
            <View
              style={{
                marginBottom: 15,
                padding: 10,
                backgroundColor: "#f9f9f9",
              }}
            >
              <Text style={{ fontWeight: "bold" }}>{item.name}</Text>
              <Text>
                Favorilenme Tarihi:{" "}
                {new Date(item.favorited_at).toLocaleDateString()}
              </Text>
              {/* Buraya kendi Card bileşenini koyabilirsin */}
            </View>
          )}
        />
      )}
    </View>
  );
};

export default FavoritesScreen;
