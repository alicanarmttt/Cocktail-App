import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

const IngredientSkeleton = () => {
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
      <View style={styles.row}>
        {/* İsim Bloğu */}
        <View>
          <Animated.View style={[styles.textBar, { width: 120, opacity }]} />
          <Animated.View
            style={[
              styles.textBar,
              { width: 80, marginTop: 6, height: 12, opacity },
            ]}
          />
        </View>
        {/* Sağdaki İkon Yuvarlağı */}
        <Animated.View style={[styles.circle, { opacity }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: "#f5f5f5", // Hafif gri
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textBar: {
    height: 16,
    backgroundColor: "#d0d0d0", // Koyu gri
    borderRadius: 4,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#d0d0d0",
  },
});

export default IngredientSkeleton;
