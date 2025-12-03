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

const PremiumButton = ({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  isLoading = false,
  variant = "gold", // Varsayılan
  children,
  gradientStyle,
}) => {
  const { colors } = useTheme();

  // 1. TEMADAN VARYANTI ÇEK
  // Eğer yanlış bir variant ismi girilirse (örn: "muzlu"), patlamasın diye 'gold'a düşür.
  const currentVariant =
    colors.buttonVariants[variant] || colors.buttonVariants.gold;

  const isDisabled = disabled || isLoading;

  // 2. Renkleri Ata
  const gradientColors = isDisabled
    ? ["#B0B0B0", "#808080"]
    : currentVariant.gradient;

  const textColor = isDisabled ? "#E0E0E0" : currentVariant.textColor;

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
        style={[
          styles.gradient,
          // 3D EFEKTLERİ ARTIK TEMADAN GELİYOR
          {
            borderTopColor: currentVariant.topHighlight,
            borderLeftColor: currentVariant.topHighlight,
            borderBottomColor: currentVariant.bottomShadow,
            borderRightColor: currentVariant.bottomShadow,
            borderWidth: 1,
          },
          gradientStyle,
        ]}
      >
        <View style={styles.innerGlassBorder} />

        <View style={styles.contentWrapper}>
          {isLoading ? (
            <ActivityIndicator color={textColor} />
          ) : children ? (
            <View style={styles.contentContainer}>{children}</View>
          ) : (
            <Text style={[styles.text, { color: textColor }, textStyle]}>
              {title}
            </Text>
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 8,
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  innerGlassBorder: {
    position: "absolute",
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    zIndex: 1,
  },
  contentWrapper: { zIndex: 2 },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pressedOrDisabled: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }, { translateY: 2 }],
    shadowOpacity: 0.1,
    elevation: 2,
  },
  text: {
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default PremiumButton;
