import { View } from 'react-native';
import Svg, {
  Circle,
  Ellipse,
  Path,
  Rect,
  G,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import Hair from './Hair';
import {
  SKIN_TONES,
  HAIR_COLORS,
  CLOTHING_COLORS,
  DEFAULT_AVATAR,
  getColorById,
  ensureValidHair,
} from './options';
import { colors } from '../../theme';

const VB_W = 200;
const VB_H = 320;

function Face() {
  return (
    <G>
      {/* eyes */}
      <Ellipse cx={87} cy={72} rx={3.2} ry={3.6} fill="#1B1B1F" />
      <Ellipse cx={113} cy={72} rx={3.2} ry={3.6} fill="#1B1B1F" />
      <Circle cx={88} cy={71} r={1} fill="#FFFFFF" />
      <Circle cx={114} cy={71} r={1} fill="#FFFFFF" />
      {/* brows */}
      <Path
        d="M80 62 Q87 59, 94 62"
        stroke="#3B2A2A"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M106 62 Q113 59, 120 62"
        stroke="#3B2A2A"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      {/* mouth: gentle smile */}
      <Path
        d="M92 86 Q100 92, 108 86"
        stroke="#3B2A2A"
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />
      {/* subtle cheek blush */}
      <Ellipse cx={84} cy={82} rx={4} ry={2.4} fill="#FF7A59" opacity={0.18} />
      <Ellipse cx={116} cy={82} rx={4} ry={2.4} fill="#FF7A59" opacity={0.18} />
    </G>
  );
}

function MaleBody({ skin, shirtColor }) {
  const pantsColor = '#2A2F3A';
  const shoeColor = '#1B1B1F';
  return (
    <G>
      {/* shoes */}
      <Path
        d="M76 290 L100 290 L102 300 Q102 304, 98 304 L74 304 Q70 304, 70 300 Z"
        fill={shoeColor}
      />
      <Path
        d="M100 290 L124 290 L130 300 Q130 304, 126 304 L102 304 Q98 304, 98 300 Z"
        fill={shoeColor}
      />
      {/* pants */}
      <Path
        d="M78 178 L122 178 L124 290 L102 290 L101 200 L99 200 L98 290 L76 290 Z"
        fill={pantsColor}
      />
      {/* torso (shirt) */}
      <Path
        d="M72 110 L128 110 L132 182 L68 182 Z"
        fill={shirtColor}
      />
      {/* sleeves */}
      <Path
        d="M68 110 L82 110 L78 150 L60 152 Z"
        fill={shirtColor}
      />
      <Path
        d="M118 110 L132 110 L140 152 L122 150 Z"
        fill={shirtColor}
      />
      {/* lower arms (skin) */}
      <Path d="M60 148 L78 150 L74 196 L56 198 Z" fill={skin} />
      <Path d="M122 150 L140 148 L144 198 L126 196 Z" fill={skin} />
      {/* hands */}
      <Circle cx={65} cy={202} r={9} fill={skin} />
      <Circle cx={135} cy={202} r={9} fill={skin} />
      {/* neck */}
      <Path d="M92 96 L108 96 L110 112 L90 112 Z" fill={skin} />
      {/* head */}
      <Circle cx={100} cy={70} r={30} fill={skin} />
    </G>
  );
}

function FemaleBody({ skin, shirtColor }) {
  const skirtColor = '#2A2F3A';
  const shoeColor = '#1B1B1F';
  return (
    <G>
      {/* shoes */}
      <Ellipse cx={84} cy={300} rx={11} ry={5} fill={shoeColor} />
      <Ellipse cx={116} cy={300} rx={11} ry={5} fill={shoeColor} />
      {/* legs (skin) below skirt */}
      <Path d="M84 256 L94 256 L90 296 L78 296 Z" fill={skin} />
      <Path d="M106 256 L116 256 L122 296 L110 296 Z" fill={skin} />
      {/* skirt (flared trapezoid) */}
      <Path
        d="M78 180 L122 180 L138 260 L62 260 Z"
        fill={skirtColor}
      />
      {/* torso (top) — slight waist taper */}
      <Path
        d="M78 110 L122 110 Q130 130, 126 158 Q124 168, 128 180 L72 180 Q76 168, 74 158 Q70 130, 78 110 Z"
        fill={shirtColor}
      />
      {/* short sleeves */}
      <Path
        d="M70 110 L82 110 L80 138 L62 140 Z"
        fill={shirtColor}
      />
      <Path
        d="M118 110 L130 110 L138 140 L120 138 Z"
        fill={shirtColor}
      />
      {/* lower arms (skin) */}
      <Path d="M62 138 L80 138 L76 192 L58 194 Z" fill={skin} />
      <Path d="M120 138 L138 138 L142 194 L124 192 Z" fill={skin} />
      {/* hands */}
      <Circle cx={66} cy={198} r={8} fill={skin} />
      <Circle cx={134} cy={198} r={8} fill={skin} />
      {/* neck */}
      <Path d="M93 96 L107 96 L109 112 L91 112 Z" fill={skin} />
      {/* head */}
      <Circle cx={100} cy={70} r={30} fill={skin} />
    </G>
  );
}

function Background() {
  return (
    <G>
      <Defs>
        <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#EEF1F8" stopOpacity="1" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={VB_W} height={VB_H} fill="url(#bg)" />
      {/* soft floor shadow */}
      <Ellipse cx={100} cy={306} rx={56} ry={6} fill="#0B1020" opacity={0.08} />
    </G>
  );
}

/**
 * Avatar renders a full-body character. `mode` controls framing:
 *   - 'full':  whole body, used in the builder + Welcome.
 *   - 'bust':  head and shoulders only, used in tight spaces like list rows.
 */
export default function Avatar({
  config = DEFAULT_AVATAR,
  size = 160,
  mode = 'full',
  ring = false,
  background = true,
}) {
  const merged = ensureValidHair({ ...DEFAULT_AVATAR, ...(config || {}) });
  const skin = getColorById(SKIN_TONES, merged.skin);
  const hair = getColorById(HAIR_COLORS, merged.hairColor);
  const shirt = getColorById(CLOTHING_COLORS, merged.clothing);

  const isBust = mode === 'bust';
  const viewBox = isBust ? '40 30 120 120' : `0 0 ${VB_W} ${VB_H}`;
  const aspect = isBust ? 1 : VB_W / VB_H;
  const width = size * aspect;

  const Body = merged.gender === 'female' ? FemaleBody : MaleBody;

  const inner = (
    <Svg width={width} height={size} viewBox={viewBox}>
      {background ? <Background /> : null}
      <Body skin={skin} shirtColor={shirt} />
      <Hair gender={merged.gender} style={merged.hairStyle} color={hair} />
      <Face />
    </Svg>
  );

  if (!ring) return <View>{inner}</View>;

  return (
    <View
      style={{
        padding: 4,
        borderRadius: isBust ? size : 18,
        backgroundColor: colors.surface,
        borderWidth: 2,
        borderColor: colors.primary,
        overflow: 'hidden',
      }}
    >
      {inner}
    </View>
  );
}
