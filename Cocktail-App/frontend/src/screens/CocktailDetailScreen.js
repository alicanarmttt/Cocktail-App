import { React, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import {
  fetchCocktailById,
  selectDetailedCocktail,
  getDetailedCocktailStatus,
  getDetailedCocktailError,
  clearDetail,
} from "../features/cocktails/cocktailSlice";

/**
 * @desc    Tek bir kokteylin detaylarını gösterir.
 * @param   {object} route - React Navigation tarafından sağlanan ve 'params' (parametreler) içeren prop.
 */
const CocktailDetailScreen = ({ route }) => {
  const { cocktailId } = route.params;
  const dispatch = useDispatch();

  const cocktail = useSelector(selectDetailedCocktail);
  const status = useSelector(getDetailedCocktailStatus);
  const error = useSelector(getDetailedCocktailError);

  // 3. Adım: Ekran yüklendiğinde (veya ID değiştiğinde) API isteğini tetikle
  useEffect(() => {
    // DÜZELTME: 'if (cocktailId)' kontrolü, ID '0' (sıfır) olduğunda
    // 'false' (yanlış) döner ve API isteğini engeller.
    // '0' sayısının geçerli bir ID olduğunu kontrol etmeliyiz.
    if (cocktailId !== undefined && cocktailId !== null) {
      dispatch(fetchCocktailById(cocktailId));
    }

    // 4. Adım (Cleanup): Ekran kapandığında (unmount) 'detail' state'ini temizle.
    return () => {
      dispatch(clearDetail());
    };
  }, [cocktailId, dispatch]); // Bu 'effect', ID değiştiğinde tekrar çalışır

  // 5. Adım: Duruma göre içeriği render et
  let content;
  if (status === "loading" || status === "idle") {
    // 'idle' durumunda da 'loading' gösteriyoruz, çünkü 'fetch' hemen başlayacak
    content = <ActivityIndicator size="large" color="#f4511e" />;
  } else if (status === "failed") {
    content = <Text style={styles.errorText}>{error}</Text>;
  } else if (status === "succeeded" && cocktail) {
    // BAŞARILI: 'cocktail' objesi (içindeki 'ingredients' dizisiyle) elimizde!
    content = (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Resim */}
        <Image source={{ uri: cocktail.image_url }} style={styles.image} />

        {/* Başlık (Navigator'dan geliyor ama istersek buraya da koyabiliriz) */}
        <Text style={styles.title}>{cocktail.name}</Text>

        {/* Bölüm: Malzemeler (Planımızın ana hedefi) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients (Malzemeler)</Text>
          {cocktail.ingredients.map((ing) => (
            <View key={ing.name} style={styles.ingredientItem}>
              {/* Renkli nokta (Önem seviyesine göre) */}
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: ing.color_code || "#ccc" },
                ]}
              />

              <Text style={styles.ingredientText}>
                {/* Örn: "50 ml Beyaz Rom (Kesin Şart)" */}
                {ing.amount} {ing.name} ({ing.level_name})
              </Text>
            </View>
          ))}
        </View>

        {/* Bölüm: Hazırlanışı */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions (Hazırlanışı)</Text>
          <Text style={styles.text}>{cocktail.instructions}</Text>
        </View>

        {/* Bölüm: Tarihi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>History & Notes</Text>
          <Text style={styles.text}>{cocktail.history_notes}</Text>
        </View>
      </ScrollView>
    );
  } else if (!cocktail) {
    // (Bu, 'succeeded' olmasına rağmen 'cocktail'in 'null' olduğu
    // veya API'den boş döndüğü bir kenar durumdur)
    content = <Text style={styles.errorText}>Cocktail not found!</Text>;
  }

  return <View style={styles.container}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  scrollContainer: {
    paddingBottom: 30, // Kaydırmanın en altta bitmesi için
  },
  image: {
    width: "100%",
    height: 300,
    resizeMode: "cover", // Resmi kaplayacak şekilde ayarla
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    margin: 15,
    textAlign: "center",
  },
  section: {
    width: "90%",
    alignSelf: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 5,
  },
  ingredientItem: {
    flexDirection: "row", // Nokta ve metni yan yana koy
    alignItems: "center",
    marginVertical: 4,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  ingredientText: {
    fontSize: 16,
    flexShrink: 1, // Uzun metinlerin sığması için
  },
  text: {
    fontSize: 16,
    lineHeight: 24, // Okunabilirlik için satır aralığı
  },
  errorText: {
    fontSize: 16,
    color: "red",
  },
});

export default CocktailDetailScreen;
