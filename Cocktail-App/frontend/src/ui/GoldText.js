import React from "react";
import { Text } from "react-native";
import { useTheme } from "@react-navigation/native";

const GoldText = ({ children, style, size = 16 }) => {
  const { colors } = useTheme();

  // Dark moddaysa parlasın, Light moddaysa düz gold olsun (okunabilirlik için)
  const glowStyle = colors.dark
    ? {
        textShadowColor: "rgba(212, 175, 55, 0.6)",
        textShadowRadius: 10,
        color: "#FFD700", // Daha parlak sarı
      }
    : {
        color: "#C5A059", // Mat gold (Daha okunaklı)
      };

  return (
    <Text style={[{ fontSize: size, fontWeight: "bold" }, glowStyle, style]}>
      {children}
    </Text>
  );
};

export default GoldText;
