import { View, Text, StyleSheet } from 'react-native';
import SegmentedControl from './SegmentedControl';
import { colors, spacing, typography } from '../theme';

const MODE_OPTIONS = [
  { label: '1 day', value: 'day' },
  { label: '3 day', value: '3day' },
  { label: 'Week', value: 'week' },
];

export const MODE_DAYS = { day: 1, '3day': 3, week: 7 };

/**
 * Always returns a range starting at `anchor` (i.e. today) and running
 * forward by the number of days for the chosen mode. We intentionally
 * don't snap "week" to a Sunday-start because the app wants the view
 * to feel consistent: today is always the leftmost column.
 */
export function buildRange(anchor, mode) {
  const days = MODE_DAYS[mode] || 1;
  const base = new Date(anchor);
  base.setHours(0, 0, 0, 0);
  return Array.from({ length: days }).map((_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d;
  });
}

function formatRangeTitle(range) {
  if (!range.length) return '';
  const fmt = (d) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (range.length === 1) return fmt(range[0]);
  return `${fmt(range[0])} – ${fmt(range[range.length - 1])}`;
}

/**
 * Range selector: just the day/3day/week toggle plus a static range
 * label. We deliberately don't expose a way to navigate forward or back
 * in time so the calendar stays anchored to "from today onwards".
 */
export default function CalendarRangeBar({ mode, onChangeMode, anchor }) {
  return (
    <View style={styles.wrap}>
      <SegmentedControl
        options={MODE_OPTIONS}
        value={mode}
        onChange={onChangeMode}
      />
      <Text style={styles.title}>{formatRangeTitle(buildRange(anchor, mode))}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  title: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    textAlign: 'center',
  },
});
