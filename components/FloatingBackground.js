import React, { useEffect, useRef } from "react";
import { Animated, Easing, Dimensions, Image, StyleSheet, View } from "react-native";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

// One shape per card image, spread across the screen with different speeds
const SHAPES = [
  { img: require("../assets/images/apple.png"),       x: 0.10, size: 58, duration: 13000 },
  { img: require("../assets/images/kitty.png"),       x: 0.38, size: 50, duration: 10500 },
  { img: require("../assets/images/penguin.png"),     x: 0.65, size: 62, duration: 12500 },
  { img: require("../assets/images/magic_wand.png"),  x: 0.85, size: 44, duration:  9500 },
  { img: require("../assets/images/swiss_cheese.png"),x: 0.28, size: 54, duration: 14000 },
  { img: require("../assets/images/fire_flower.png"), x: 0.72, size: 48, duration: 11000 },
];

// Single floating rhombus — animation runs entirely on the native UI thread
const FloatingShape = React.memo(({ shape }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Scatter shapes across the screen from the start (not all rising from bottom at once)
    anim.setValue(Math.random());

    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: shape.duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_H + 80, -140],
  });

  const imgSize = shape.size * 0.7;

  return (
    <Animated.View
      style={[
        styles.diamond,
        {
          width: shape.size,
          height: shape.size,
          left: SCREEN_W * shape.x - shape.size / 2,
          transform: [{ translateY }, { rotate: "45deg" }],
        },
      ]}
    >
      <Image
        source={shape.img}
        style={{ width: imgSize, height: imgSize, transform: [{ rotate: "-45deg" }], opacity: 0.65 }}
        resizeMode="contain"
      />
    </Animated.View>
  );
});

export default function FloatingBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {SHAPES.map((shape, i) => (
        <FloatingShape key={i} shape={shape} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  diamond: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
});
