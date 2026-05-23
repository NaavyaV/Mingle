import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { eventsForDay, formatEventTime } from '../utils/schedule';

const ACCENTS = [colors.primary, colors.coral, colors.gold, colors.success, colors.primaryLight];

export default function ScheduleTimeline({ schedule, date = new Date(), emptyLabel = 'Nothing scheduled today.' }) {
  const events = eventsForDay(schedule, date);

  if (events.length === 0) {
    return <Text style={styles.empty}>{emptyLabel}</Text>;
  }

  return (
    <View style={styles.list}>
      {events.map((ev, idx) => {
        const accent = ACCENTS[idx % ACCENTS.length];
        return (
          <View key={ev.id} style={styles.row}>
            <View style={[styles.accent, { backgroundColor: accent }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>
                {ev.summary}
              </Text>
              <Text style={styles.meta}>
                {formatEventTime(ev)}
                {ev.location ? ` · ${ev.location}` : ''}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  accent: { width: 4, height: 32, borderRadius: 2 },
  title: { ...typography.body, color: colors.text, fontWeight: '600' },
  meta: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  empty: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: spacing.sm,
  },
});
