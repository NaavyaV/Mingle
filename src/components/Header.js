import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

/**
 * Standard screen header: optional left slot, title, optional right slot.
 * Slot props (`left`, `right`) are ReactNodes so callers can put icon
 * buttons, FABs, or anything else in them.
 */
export default function Header({ title, subtitle, left = null, right = null, style }) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.side}>{left}</View>
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      <View style={[styles.side, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    minHeight: 56,
  },
  side: { width: 56, justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center' },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});
