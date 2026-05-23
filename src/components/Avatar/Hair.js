import { G, Path, Circle, Ellipse } from 'react-native-svg';

/**
 * Hair styles, designed against the head circle:
 *   center (100, 70), radius 30  →  top of head y=40, sides x=70..130
 *
 * Each style returns its own SVG group, sized to overlay the head naturally.
 * Female styles can extend down past the shoulders; male styles stay close
 * to the scalp.
 */

function Male({ style, color }) {
  switch (style) {
    case 'buzz':
      return (
        <Path
          d="M70 70 C70 45, 84 36, 100 36 C116 36, 130 45, 130 70 L130 72 L70 72 Z"
          fill={color}
          opacity={0.55}
        />
      );
    case 'fade':
      return (
        <G>
          <Path
            d="M70 70 C70 45, 84 36, 100 36 C116 36, 130 45, 130 70 L130 70 L70 70 Z"
            fill={color}
            opacity={0.3}
          />
          <Path
            d="M74 56 C76 40, 88 32, 100 32 C112 32, 124 40, 126 56 C 122 50, 116 48, 110 50 C 108 44, 92 44, 90 50 C 84 48, 78 50, 74 56 Z"
            fill={color}
          />
        </G>
      );
    case 'curly':
      return (
        <G>
          <Path
            d="M70 66 C68 44, 84 30, 100 30 C116 30, 132 44, 130 66 C 130 56, 120 52, 116 58 C 112 50, 104 50, 100 56 C 96 50, 88 50, 84 58 C 80 52, 70 56, 70 66 Z"
            fill={color}
          />
          <Circle cx={78} cy={48} r={6} fill={color} />
          <Circle cx={94} cy={42} r={7} fill={color} />
          <Circle cx={108} cy={42} r={7} fill={color} />
          <Circle cx={122} cy={48} r={6} fill={color} />
          <Circle cx={86} cy={56} r={5} fill={color} />
          <Circle cx={114} cy={56} r={5} fill={color} />
        </G>
      );
    case 'quiff':
      return (
        <Path
          d="M72 66 C70 50, 78 34, 92 32 C 96 22, 110 24, 112 32 C 124 32, 132 46, 130 66 C 128 56, 122 52, 118 56 C 116 44, 106 38, 100 40 C 94 38, 86 42, 84 56 C 80 52, 74 56, 72 66 Z"
          fill={color}
        />
      );
    case 'short':
    default:
      return (
        <Path
          d="M70 68 C68 46, 84 32, 100 32 C116 32, 132 46, 130 68 C 126 58, 118 54, 112 58 C 108 50, 92 50, 88 58 C 82 54, 74 58, 70 68 Z"
          fill={color}
        />
      );
  }
}

function Female({ style, color }) {
  switch (style) {
    case 'bob':
      return (
        <G>
          <Path
            d="M68 92 L68 64 C68 42, 84 30, 100 30 C116 30, 132 42, 132 64 L132 92 L122 92 L122 70 C 118 58, 108 56, 100 58 C 92 56, 82 58, 78 70 L78 92 Z"
            fill={color}
          />
        </G>
      );
    case 'bun':
      return (
        <G>
          {/* bun */}
          <Circle cx={100} cy={26} r={14} fill={color} />
          {/* hairline */}
          <Path
            d="M70 68 C68 46, 84 34, 100 34 C116 34, 132 46, 130 68 C 126 58, 118 54, 112 58 C 108 50, 92 50, 88 58 C 82 54, 74 58, 70 68 Z"
            fill={color}
          />
        </G>
      );
    case 'ponytail':
      return (
        <G>
          {/* ponytail behind shoulder (visible to the right) */}
          <Path
            d="M126 60 C144 70, 146 110, 134 140 C 130 142, 124 142, 122 138 C 130 110, 130 80, 122 64 Z"
            fill={color}
          />
          <Path
            d="M70 68 C68 44, 84 30, 100 30 C118 30, 132 44, 130 68 C 124 58, 116 54, 112 60 C 108 50, 92 50, 88 60 C 82 54, 74 58, 70 68 Z"
            fill={color}
          />
        </G>
      );
    case 'wavy':
      return (
        <G>
          {/* main mass extending past shoulders with subtle waves */}
          <Path
            d="M66 130 C58 110, 62 80, 70 60 C 76 38, 90 28, 100 28 C 110 28, 124 38, 130 60 C 138 80, 142 110, 134 130 C 130 122, 126 122, 122 128 C 124 110, 122 88, 116 72 C 110 62, 102 62, 100 70 C 98 62, 90 62, 84 72 C 78 88, 76 110, 78 128 C 74 122, 70 122, 66 130 Z"
            fill={color}
          />
        </G>
      );
    case 'long':
    default:
      return (
        <G>
          {/* long straight, falls past shoulders */}
          <Path
            d="M66 150 L66 64 C66 42, 84 28, 100 28 C116 28, 134 42, 134 64 L134 150 L122 150 L122 72 C 118 60, 108 58, 100 60 C 92 58, 82 60, 78 72 L78 150 Z"
            fill={color}
          />
          {/* tiny shine */}
          <Ellipse cx={88} cy={48} rx={4} ry={2} fill="rgba(255,255,255,0.25)" />
        </G>
      );
  }
}

export default function Hair({ gender, style, color }) {
  if (gender === 'female') return <Female style={style} color={color} />;
  return <Male style={style} color={color} />;
}
