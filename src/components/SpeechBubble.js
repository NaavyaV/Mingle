import { View, TextInput, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, shadow, typography } from '../theme';

/**
 * Editable speech bubble.
 *
 * Structure:
 *   - A rounded-rect <View> with shadow + 1px outline is the bubble body.
 *     A multi-line <TextInput> inside it grows downward as the user
 *     types (scrollEnabled={false}), so the bubble's height tracks the
 *     content exactly — no measurement plumbing, no clipping.
 *   - A small <Svg> triangle is absolutely positioned on the bubble's
 *     left or bottom edge to form the "tail". Its joint edge overlaps
 *     the bubble by 1px so the bubble's outline is hidden cleanly under
 *     the tail's joint — the two shapes read as one continuous outline.
 *
 * The bubble has a **fixed horizontal width** (= `maxContentWidth` +
 * internal padding) regardless of what is typed. This eliminates layout
 * jitter on every keystroke and lets the caller reserve a stable slot
 * for the bubble alongside other UI (e.g. an avatar).
 *
 * Props:
 *   tailSide:        'bottom' (default) | 'left'
 *   maxContentWidth: how wide the TEXT may grow (px). The bubble adds
 *                    its own padding around this.
 *   maxLength:       caps typed text length (bubble grows in height
 *                    until that cap is reached, then stops).
 */

const PAD_H = 14;
const PAD_V = 10;
const RADIUS = 14;
const TAIL_W = 12;
const TAIL_H = 18;
// Distance from the top of the bubble to the top of the left tail.
// The tail's vertical center then lands at TAIL_TOP_OFFSET + TAIL_H/2 = 23.
// Callers anchor the bubble so this Y matches whatever the tail should
// point at (e.g. the avatar's mouth).
const TAIL_TOP_OFFSET = 14;
const LINE_H = 22;
const STROKE_COLOR = '#D6DCEA';
const FILL_COLOR = '#FFFFFF';

function LeftTail() {
  // Open path (no Z): only the two slanted edges get stroked; the right
  // edge is hidden by a 1px overlap into the bubble, so the outline
  // reads as one continuous shape with the bubble body.
  return (
    <Svg width={TAIL_W + 1} height={TAIL_H + 2}>
      <Path
        d={`M ${TAIL_W + 1} 1 L 0 ${TAIL_H / 2 + 1} L ${TAIL_W + 1} ${TAIL_H + 1}`}
        fill={FILL_COLOR}
        stroke={STROKE_COLOR}
        strokeWidth={1}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function BottomTail() {
  return (
    <Svg width={TAIL_W * 2 + 2} height={TAIL_H + 1}>
      <Path
        d={`M 1 0 L ${TAIL_W + 1} ${TAIL_H} L ${TAIL_W * 2 + 1} 0`}
        fill={FILL_COLOR}
        stroke={STROKE_COLOR}
        strokeWidth={1}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function SpeechBubble({
  value,
  onChangeText,
  placeholder = 'studying rn',
  maxLength = 80,
  tailSide = 'bottom',
  maxContentWidth = 180,
}) {
  const bubbleWidth = maxContentWidth + PAD_H * 2;
  const wrapWidth = bubbleWidth + (tailSide === 'left' ? TAIL_W : 0);

  return (
    <View style={[styles.wrap, { width: wrapWidth }]}>
      <View
        style={[
          styles.bubble,
          {
            width: bubbleWidth,
            marginLeft: tailSide === 'left' ? TAIL_W : 0,
            marginBottom: tailSide === 'bottom' ? TAIL_H : 0,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          maxLength={maxLength}
          autoCorrect={false}
          multiline
          textAlignVertical="top"
          scrollEnabled={false}
          style={styles.input}
        />
      </View>

      {tailSide === 'left' && (
        <View style={[styles.tailLayer, { top: TAIL_TOP_OFFSET, left: 0 }]}>
          <LeftTail />
        </View>
      )}

      {tailSide === 'bottom' && (
        <View style={[styles.tailLayer, styles.tailLayerBottom]}>
          <BottomTail />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // alignSelf: 'flex-start' keeps the wrap at its intrinsic content
  // width instead of stretching to the parent.
  wrap: { alignSelf: 'flex-start' },
  bubble: {
    backgroundColor: FILL_COLOR,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: STROKE_COLOR,
    paddingHorizontal: PAD_H,
    paddingVertical: PAD_V,
    ...shadow.card,
  },
  input: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    padding: 0,
    margin: 0,
    minHeight: LINE_H,
    lineHeight: LINE_H,
    width: '100%',
    textAlignVertical: 'top',
  },
  tailLayer: { position: 'absolute' },
  tailLayerBottom: {
    bottom: 0,
    left: '50%',
    marginLeft: -(TAIL_W + 1),
  },
});
