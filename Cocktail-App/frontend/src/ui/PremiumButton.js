import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@react-navigation/native";

// variant: "gold" | "silver" (Varsayılan: "gold")
const PremiumButton = ({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  isLoading = false,
  variant = "gold", // <--- YENİ ÖZELLİK
  children,
  gradientStyle,
}) => {
  const { colors } = useTheme();

  const isDisabled = disabled || isLoading;

  // Hangi gradyan dizisini kullanacağımızı seçiyoruz
  // colors.goldGradient veya colors.silverGradient
  const gradientColors = isDisabled
    ? ["#B0B0B0", "#808080"] // Disabled ise Gri
    : colors[`${variant}Gradient`]; // "gold" -> goldGradient, "silver" -> silverGradient

  // Metin rengini belirle (Gümüş buton üzerine siyah yazı daha iyi okunabilir)
  const getTextColor = () => {
    if (disabled) return "#E0E0E0";
    // Eğer gümüşse ve light moddaysak siyah yazı, değilse tema rengi
    if (variant === "silver") return "#1A1A1A";
    return colors.dark ? "#000" : "#FFF";
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.container,
        style,
        (pressed || isDisabled) && styles.pressedOrDisabled,
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, gradientStyle]}
      >
        {isLoading ? (
          <ActivityIndicator color={getTextColor()} />
        ) : children ? (
          // Eğer children (ikon vs) varsa, style'ı dışarıdan kontrol edebilirsin
          // ama genelde children içine gelen Text'lerin rengini manuel verirsin.
          <View style={styles.contentContainer}>{children}</View>
        ) : (
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
        )}
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderRadius: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pressedOrDisabled: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  text: {
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
});

export default PremiumButton;
