import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

/**
 * A single chat bubble. `mine` shifts the bubble to the right and uses
 * the primary color; otherwise it sits left with a muted surface.
 */
export default function ChatBubble({ mine, children, footer = null }) {
  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
      <View
        style={[
          styles.bubble,
          mine ? styles.bubbleMine : styles.bubbleTheirs,
        ]}
      >
        {typeof children === 'string' ? (
          <Text style={[styles.text, mine && styles.textMine]}>{children}</Text>
        ) : (
          children
        )}
      </View>
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginVertical: 4,
    maxWidth: '85%',
  },
  rowMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  rowTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.sm,
  },
  bubbleTheirs: {
    backgroundColor: colors.surfaceMuted,
    borderBottomLeftRadius: radius.sm,
  },
  text: { ...typography.body, color: colors.text },
  textMine: { color: colors.textInverse },
  footer: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: 2,
    paddingHorizontal: spacing.xs,
  },
});
