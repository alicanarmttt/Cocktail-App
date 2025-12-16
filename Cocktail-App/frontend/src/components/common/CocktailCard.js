import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import CocktailImage from "../CocktailImage"; // Var olan bileşenini kullanalım

const CocktailCard = ({ item, onPress, displayName }) => {
  const { colors } = useTheme();

  // İsim kontrolü: Dışarıdan displayName gelirse onu kullan, yoksa item içinden bak
  const name =
    displayName || (typeof item.name === "object" ? item.name.en : item.name);

  return (
    <TouchableOpacity
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.text, // Temaya göre gölge rengi
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Resim Alanı */}
      <View
        style={[styles.imageContainer, { backgroundColor: colors.subCard }]}
      >
        <CocktailImage
          uri={item.image_url}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Alkol Rozeti (Opsiyonel - Sağ üst köşe) */}
        {item.is_alcoholic !== undefined && (
          <View
            style={[
              styles.badge,
              { backgroundColor: item.is_alcoholic ? "#FF5757" : "#4CAF50" },
            ]}
          >
            <Ionicons
              name={item.is_alcoholic ? "wine" : "leaf"}
              size={12}
              color="#FFF"
            />
          </View>
        )}
      </View>

      {/* Bilgi Alanı */}
      <View style={styles.infoContainer}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {name}
        </Text>

        {/* Zorluk Derecesi (Varsa) */}
        {item.difficulty_level && (
          <Text style={[styles.difficulty, { color: colors.textSecondary }]}>
            {/* Text secondary yoksa opacity kullanırız */}
            {item.difficulty_level}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    margin: 6,
    borderRadius: 16,
    borderWidth: 1,
    // Kart Gölgelendirmesi
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
    overflow: "hidden", // Resim köşelerden taşmasın
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1, // Kare resim alanı
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  infoContainer: {
    padding: 10,
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  difficulty: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
});

export default CocktailCard;
