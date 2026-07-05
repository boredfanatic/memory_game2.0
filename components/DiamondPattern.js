import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, StyleSheet, View } from "react-native";
import Svg, { Defs, Pattern, Rect } from "react-native-svg";

const { width: W, height: H } = Dimensions.get("window");

// Square tile size before 45° rotation.
// After rotation each square appears as a diamond with diagonal ≈ TILE * √2 ≈ 25px.
const TILE = 18;

// Exact period of the rotated grid in screen-space X and Y.
// Using the float value prevents any drift across infinite loops.
const REPEAT = TILE * Math.SQRT2; // ≈ 25.46

// Integer pixel margin so the SVG overflows the screen on every side,
// ensuring no gap is ever visible regardless of the current translate offset.
const MARGIN = Math.ceil(REPEAT); // 26

const SVG_W = W + MARGIN * 2;
const SVG_H = H + MARGIN * 2;

// 5 seconds per one tile-period of travel → very slow, relaxing drift.
const DURATION = 5000;

export default function DiamondPattern() {
  const anim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  useEffect(() => {
    // Diagonal drift: leftward (-X) and downward (+Y).
    // Translating by exactly one period in each axis = seamless invisible loop.
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: { x: -REPEAT, y: REPEAT },
        duration: DURATION,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/*
        The Animated.View is positioned MARGIN px off-screen on all sides so
        the SVG always covers the visible area even at maximum translate offset.
        renderToHardwareTextureAndroid / shouldRasterizeIOS bake the SVG into a
        single GPU texture once; after that the animation is a free GPU blit.
      */}
      <Animated.View
        style={[
          styles.canvas,
          { transform: [{ translateX: anim.x }, { translateY: anim.y }] },
        ]}
        renderToHardwareTextureAndroid
        shouldRasterizeIOS
      >
        <Svg width={SVG_W} height={SVG_H}>
          <Defs>
            {/*
              A square tile rotated 45° appears as a diamond.
              The 1px inset on each edge creates the thin border lines
              between adjacent diamonds without a separate <Line> element.
            */}
            <Pattern
              id="diamond_bg"
              x="0"
              y="0"
              width={TILE}
              height={TILE}
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <Rect
                x="1"
                y="1"
                width={TILE - 2}
                height={TILE - 2}
                fill="rgba(255,255,255,0.05)"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="1"
              />
            </Pattern>
          </Defs>
          <Rect x="0" y="0" width={SVG_W} height={SVG_H} fill="url(#diamond_bg)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    position: "absolute",
    top: -MARGIN,
    left: -MARGIN,
  },
});
