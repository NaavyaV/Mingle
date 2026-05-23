import { View, TextInput, StyleSheet } from 'react-native';
import { colors, radius, shadow, spacing, typography } from '../theme';

/**
 * Instagram-Notes-style speech bubble wrapping an editable TextInput.
 * Purely presentational — the parent owns the value and onChangeText.
 *
 * `tailSide` controls where the speech tail comes out:
 *   - 'bottom' (default): tail under the bubble, points down.
 *   - 'left':             tail on the left edge, points left, so the bubble
 *                          can sit to the right of a character.
 */
export default function SpeechBubble({
  value,
  onChangeText,
  placeholder = 'studying rn',
  maxLength = 40,
  tailSide = 'bottom',
}) {
  const input = (
    <View style={styles.bubble}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        maxLength={maxLength}
        returnKeyType="done"
        autoCorrect={false}
        style={styles.input}
      />
    </View>
  );

  if (tailSide === 'left') {
    return (
      <View style={styles.rowContainer}>
        <View style={styles.tailLeft} />
        {input}
      </View>
    );
  }

  return (
    <View style={styles.colContainer}>
      {input}
      <View style={styles.tailContainer}>
        <View style={styles.tailDown} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  colContainer: { alignItems: 'center' },
  rowContainer: { flexDirection: 'row', alignItems: 'center' },
  bubble: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    minWidth: 140,
    maxWidth: 220,
    ...shadow.card,
  },
  input: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
    padding: 0,
    minWidth: 100,
  },
  tailContainer: {
    width: 22,
    height: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  tailDown: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.surface,
  },
  tailLeft: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: colors.surface,
    marginRight: -1,
  },
});
