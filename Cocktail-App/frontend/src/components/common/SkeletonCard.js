import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const SkeletonCard = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Yanıp sönme (Pulse) animasyonu
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
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
      {/* Resim Alanı İskeleti */}
      <Animated.View style={[styles.imageSkeleton, { opacity }]} />
      {/* Yazı Alanı İskeleti */}
      <View style={styles.textContainer}>
        <Animated.View style={[styles.titleSkeleton, { opacity }]} />
        <Animated.View style={[styles.subtitleSkeleton, { opacity }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width / 2 - 20, // İki sütunlu yapı varsayımıyla
    margin: 10,
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
    overflow: "hidden",
  },
  imageSkeleton: {
    width: "100%",
    height: 150,
    backgroundColor: "#e1e4e8",
  },
  textContainer: {
    padding: 10,
  },
  titleSkeleton: {
    width: "80%",
    height: 15,
    borderRadius: 4,
    backgroundColor: "#e1e4e8",
    marginBottom: 8,
  },
  subtitleSkeleton: {
    width: "50%",
    height: 12,
    borderRadius: 4,
    backgroundColor: "#e1e4e8",
  },
});

export default SkeletonCard;
