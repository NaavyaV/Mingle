import { ScrollView, Pressable, View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { WEEKDAY_LABELS, getWeekDates, isSameDay } from '../utils/schedule';

export default function DayPicker({ value, onChange }) {
  const week = getWeekDates();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {week.map((d) => {
        const selected = isSameDay(d, value);
        const today = isSameDay(d, new Date());
        return (
          <Pressable
            key={d.toISOString()}
            onPress={() => onChange(d)}
            style={[
              styles.day,
              selected && styles.daySelected,
              !selected && today && styles.dayToday,
            ]}
          >
            <Text
              style={[
                styles.label,
                selected && styles.labelSelected,
              ]}
            >
              {WEEKDAY_LABELS[d.getDay()]}
            </Text>
            <Text
              style={[
                styles.date,
                selected && styles.labelSelected,
              ]}
            >
              {d.getDate()}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
  day: {
    width: 56,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  dayToday: {
    borderColor: colors.primary,
  },
  daySelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: { ...typography.small, color: colors.textMuted, fontWeight: '700' },
  date: { ...typography.h2, color: colors.text, marginTop: 2 },
  labelSelected: { color: colors.textInverse },
});
