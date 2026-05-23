import { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/**
 * Full-screen layered-mountain background.
 *
 * Renders an off-white sky with several rolling-hill silhouettes
 * stacked behind one another. Each layer is filled to the bottom of
 * the screen, so the front layers occlude the back ones the way real
 * mountain ranges recede into the distance. Colors fade from a deep-
 * but-still-soft blue at the front to almost-white at the horizon for
 * a calming atmospheric-perspective effect.
 *
 * Non-interactive — drop as the first child of a screen container.
 */

// Back → front. `topRatio` is the silhouette's baseline as a fraction
// of the screen height, so layers re-position correctly on every
// device. Higher numbers = lower on screen = closer to the viewer.
// Ratios pushed up so the mountains occupy ~80% of the screen and
// only the topmost slice remains as sky.
const LAYERS = [
  { color: '#EEF3FB', topRatio: 0.18, amp: 18, freq: 0.006, phase: 0.3 },
  { color: '#DDE6F4', topRatio: 0.31, amp: 24, freq: 0.0085, phase: 1.2 },
  { color: '#C5D3EC', topRatio: 0.45, amp: 30, freq: 0.0105, phase: 2.1 },
  { color: '#ACBFE0', topRatio: 0.60, amp: 34, freq: 0.0125, phase: 3.0 },
  { color: '#92A9D3', topRatio: 0.76, amp: 40, freq: 0.014, phase: 3.9 },
];

const SKY_COLOR = '#FAFCFE';

function buildLayerPath({ width, height, layer }) {
  const { topRatio, amp, freq, phase } = layer;
  const baseY = height * topRatio;
  const step = 26;
  const yAt = (x) => baseY + Math.sin(x * freq + phase) * amp;

  // Quadratic Bezier between each pair of samples gives smooth rolling
  // hills without the polyline look at this stroke width.
  let prevX = -step;
  let prevY = yAt(prevX);
  let d = `M ${prevX.toFixed(1)} ${prevY.toFixed(1)}`;
  for (let x = 0; x <= width + step; x += step) {
    const y = yAt(x);
    const cpX = (prevX + x) / 2;
    const cpY = (prevY + y) / 2;
    d += ` Q ${cpX.toFixed(1)} ${cpY.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    prevX = x;
    prevY = y;
  }
  // Close the path down through the bottom corners so the layer is a
  // filled silhouette, not just an outline.
  d += ` L ${(width + step).toFixed(1)} ${height} L ${-step} ${height} Z`;
  return d;
}

export default function PatternBackground() {
  const { width, height } = useWindowDimensions();

  const paths = useMemo(
    () =>
      LAYERS.map((layer, i) => (
        <Path
          key={`m-${i}`}
          d={buildLayerPath({ width, height, layer })}
          fill={layer.color}
        />
      )),
    [width, height]
  );

  return (
    <View pointerEvents="none" style={[styles.layer, { backgroundColor: SKY_COLOR }]}>
      <Svg width={width} height={height}>
        {paths}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
});
