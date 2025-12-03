import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@react-navigation/native";
import { StyleSheet, View } from "react-native";

const MerlotHeader = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <LinearGradient
        // Temadan gelen diziyi kullanıyoruz
        colors={colors.merlotGradient || ["#4A0E15", "#2A050A"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }} // Sol Üst (Işık buradan gelir)
        end={{ x: 1, y: 1 }} // Sağ Alt (Gölge buraya düşer)
      />

      {/* İNCE DETAY: Header'ın en altına çok ince bir çizgi (Gölge veya Altın) */}
      {/* Bu, Header ile İçeriği birbirinden jilet gibi ayırır */}
      <View style={{ height: 1, backgroundColor: "rgba(0,0,0,0.3)" }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
});

export default MerlotHeader;
