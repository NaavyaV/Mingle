import { G, Path, Circle } from 'react-native-svg';

/**
 * Hair shapes are designed against the head at (100, 70) with radius 30.
 *   top of head crown ≈ y 40
 *   brow line         ≈ y 62
 *   eye line          ≈ y 72
 *   chin line         ≈ y 100
 *
 * Rule: the front hairline never crosses below y ≈ 56 so it can't bleed onto
 * the face. Sides can extend lower for medium and long styles, but never use
 * semi-transparent overlays that tint the face — instead, render hair as a
 * solid shape that sits on top of the head only where hair actually is.
 */

function Male({ style, color }) {
  switch (style) {
    case 'buzz':
      // Very short crew cut: thin solid cap sitting flush on the scalp.
      return (
        <Path
          d="M72 56 C72 42 86 38 100 38 C114 38 128 42 128 56 Q124 52 116 53 Q108 50 100 51 Q92 50 84 53 Q76 52 72 56 Z"
          fill={color}
        />
      );

    case 'fade':
      // Hair on top with shorter sides — narrower base than 'short'.
      return (
        <Path
          d="M76 56 C76 36 88 30 100 30 C112 30 124 36 124 56 Q120 50 114 51 Q108 46 100 48 Q92 46 86 51 Q80 50 76 56 Z"
          fill={color}
        />
      );

    case 'curly':
      // Bumpy cap suggesting curls — solid base plus small circles on top.
      return (
        <G>
          <Path
            d="M70 58 C68 38 84 30 100 30 C116 30 132 38 130 58 Q124 50 116 52 Q110 46 100 48 Q90 46 84 52 Q76 50 70 58 Z"
            fill={color}
          />
          <Circle cx={78} cy={42} r={6} fill={color} />
          <Circle cx={92} cy={34} r={7} fill={color} />
          <Circle cx={108} cy={34} r={7} fill={color} />
          <Circle cx={122} cy={42} r={6} fill={color} />
        </G>
      );

    case 'quiff':
      // Tall front swept up. Peak at top center, sides hug head.
      return (
        <Path
          d="M72 58 C70 42 82 36 92 36 C94 24 110 24 112 36 C122 36 130 44 130 58 Q124 50 116 52 Q110 42 100 44 Q90 42 84 52 Q76 50 72 58 Z"
          fill={color}
        />
      );

    case 'short':
    default:
      // Classic short male cut: rounded dome with a natural arched hairline.
      return (
        <Path
          d="M70 58 C68 36 84 30 100 30 C116 30 132 36 130 58 Q124 50 116 52 Q108 44 100 46 Q92 44 84 52 Q76 50 70 58 Z"
          fill={color}
        />
      );
  }
}

function Female({ style, color }) {
  switch (style) {
    case 'bob':
      // Chin-length cut framing the face, ends at neck.
      return (
        <Path
          d="M68 92 L68 60 C68 38 84 28 100 28 C116 28 132 38 132 60 L132 92 L122 92 L122 70 Q118 60 108 58 Q100 60 92 58 Q82 60 78 70 L78 92 Z"
          fill={color}
        />
      );

    case 'bun':
      return (
        <G>
          {/* hairline / sleek top, paint first so bun sits over the parting */}
          <Path
            d="M72 60 C70 42 84 32 100 32 C116 32 130 42 128 60 Q124 52 116 54 Q108 48 100 50 Q92 48 84 54 Q76 52 72 60 Z"
            fill={color}
          />
          {/* bun on top */}
          <Circle cx={100} cy={26} r={13} fill={color} />
          <Circle cx={100} cy={26} r={8} fill={color} opacity={0.85} />
        </G>
      );

    case 'ponytail':
      return (
        <G>
          {/* trailing ponytail — base sits inside the top-hair region so the
              top hair (painted next) hides the join, making the tail look
              like it emerges from the hair itself */}
          <Path
            d="M118 50 C148 68 150 118 140 152 C137 156 130 156 130 152 C134 118 132 80 124 46 Z"
            fill={color}
          />
          {/* sleek top — painted AFTER so it covers the tail base */}
          <Path
            d="M70 60 C68 40 84 30 100 30 C118 30 132 40 130 60 Q124 52 116 54 Q108 46 100 48 Q92 46 84 54 Q76 52 70 60 Z"
            fill={color}
          />
        </G>
      );

    case 'wavy':
      // Long hair with real S-curves down the sides so the silhouette reads
      // as wavy from across the room, not just at the very bottom edge.
      return (
        <Path
          d="M66 150 Q54 130 72 110 Q54 90 68 70 C68 46 84 28 100 28 C116 28 132 46 132 70 Q146 90 128 110 Q146 130 134 150 L122 150 L122 72 Q118 60 108 58 Q100 60 92 58 Q82 60 78 72 L78 150 Z"
          fill={color}
        />
      );

    case 'long':
    default:
      // Long straight hair past shoulders, framing the face cleanly.
      return (
        <Path
          d="M66 150 L66 60 C66 38 84 28 100 28 C116 28 134 38 134 60 L134 150 L122 150 L122 72 Q118 60 108 58 Q100 60 92 58 Q82 60 78 72 L78 150 Z"
          fill={color}
        />
      );
  }
}

export default function Hair({ gender, style, color }) {
  if (gender === 'female') return <Female style={style} color={color} />;
  return <Male style={style} color={color} />;
}
