import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

const ResultCardSkeleton = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
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
    <View style={styles.card}>
      {/* Sol: Resim Kutusu */}
      <Animated.View style={[styles.image, { opacity }]} />

      {/* Orta: İçerik */}
      <View style={styles.content}>
        <Animated.View
          style={[styles.textBar, { width: "70%", height: 18, opacity }]}
        />
        <Animated.View
          style={[
            styles.textBar,
            { width: "50%", height: 14, marginTop: 8, opacity },
          ]}
        />
      </View>

      {/* Sağ: Ok İkonu */}
      <Animated.View style={[styles.circle, { opacity }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    borderColor: "#e0e0e0",
    borderWidth: 1,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#d0d0d0",
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  textBar: {
    backgroundColor: "#d0d0d0",
    borderRadius: 4,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#d0d0d0",
  },
});

export default ResultCardSkeleton;
