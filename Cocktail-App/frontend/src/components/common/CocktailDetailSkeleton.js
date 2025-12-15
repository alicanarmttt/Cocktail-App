import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const CocktailDetailSkeleton = () => {
  // Animasyon Değeri (Opaklık)
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Sonsuz Yanıp Sönme Döngüsü
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
  }, [opacity]);

  return (
    <View style={styles.container}>
      {/* 1. BÜYÜK RESİM İSKELETİ */}
      <Animated.View style={[styles.imageSkeleton, { opacity }]} />

      {/* 2. BAŞLIK İSKELETİ (Ortada) */}
      <Animated.View style={[styles.titleSkeleton, { opacity }]} />

      {/* 3. BÖLÜM: MALZEMELER */}
      <View style={styles.section}>
        <Animated.View style={[styles.headerSkeleton, { opacity }]} />
        {/* Alt alta 4 tane malzeme çizgisi */}
        {[1, 2, 3, 4].map((i) => (
          <Animated.View key={i} style={[styles.lineSkeleton, { opacity }]} />
        ))}
      </View>

      {/* 4. BUTON İSKELETİ */}
      <Animated.View style={[styles.buttonSkeleton, { opacity }]} />

      {/* 5. BÖLÜM: TARİF */}
      <View style={styles.section}>
        <Animated.View style={[styles.headerSkeleton, { opacity }]} />
        <Animated.View style={[styles.blockSkeleton, { opacity }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", // Temana göre değiştirebilirsin
  },
  imageSkeleton: {
    width: "100%",
    height: 300,
    backgroundColor: "#e1e4e8",
  },
  titleSkeleton: {
    width: "60%",
    height: 30,
    borderRadius: 8,
    backgroundColor: "#e1e4e8",
    alignSelf: "center",
    marginVertical: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerSkeleton: {
    width: "40%",
    height: 20,
    borderRadius: 5,
    backgroundColor: "#e1e4e8",
    marginBottom: 10,
  },
  lineSkeleton: {
    width: "90%",
    height: 15,
    borderRadius: 5,
    backgroundColor: "#e1e4e8",
    marginBottom: 8,
  },
  buttonSkeleton: {
    width: "80%",
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e1e4e8",
    alignSelf: "center",
    marginBottom: 25,
  },
  blockSkeleton: {
    width: "100%",
    height: 80, // Paragraf gibi görünsün
    borderRadius: 5,
    backgroundColor: "#e1e4e8",
  },
});

export default CocktailDetailSkeleton;
