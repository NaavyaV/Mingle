import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Dimensions } from 'react-native';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import SegmentedControl from '../../../components/SegmentedControl';
import CalendarView from '../../../components/CalendarView';
import { buildDemoSchedule, getRange, shortMonth } from '../../../utils/schedule';
import { colors, radius, spacing, typography } from '../../../theme';

const VISIBILITY_OPTIONS = [
  { label: 'Private', value: 'private' },
  { label: 'Friends', value: 'friends' },
  { label: 'Public', value: 'public' },
];

const VISIBILITY_HINT = {
  private: 'Only you can see your schedule.',
  friends: 'People you connect with can see your schedule.',
  public: 'Anyone at your school can see your schedule.',
};

const VIEW_OPTIONS = [
  { label: 'Day', value: 'day' },
  { label: '3 Day', value: '3day' },
  { label: 'Week', value: 'week' },
];

function rangeLabel(dates) {
  if (dates.length === 1) {
    return dates[0].toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }
  const first = dates[0];
  const last = dates[dates.length - 1];
  if (first.getMonth() === last.getMonth()) {
    return `${shortMonth(first)} ${first.getDate()} – ${last.getDate()}`;
  }
  return `${shortMonth(first)} ${first.getDate()} – ${shortMonth(last)} ${last.getDate()}`;
}

export default function ScheduleStep({ value, setValue }) {
  const [viewMode, setViewMode] = useState('week');
  const [anchorDate] = useState(() => new Date());
  const schedule = value.schedule;
  const hasSchedule = !!schedule;

  const dates = useMemo(() => getRange(viewMode, anchorDate), [viewMode, anchorDate]);

  // Layout math so the grid fits the screen for any mode.
  const screenWidth = Dimensions.get('window').width;
  const containerHorizontalPadding = spacing.xl * 2; // ScreenContainer padding
  const calendarBorder = 2;
  const railWidth = 44;
  const availableForColumns =
    screenWidth - containerHorizontalPadding - calendarBorder - railWidth;
  const columnWidth = Math.floor(Math.max(46, availableForColumns / dates.length));

  const handleDemo = () => {
    setValue({
      schedule: buildDemoSchedule({ seed: Math.floor(Math.random() * 100) }),
      scheduleSource: 'demo',
    });
  };

  const handleGoogle = () => {
    Alert.alert(
      'Coming soon',
      'Google Calendar import is not wired up yet. Use the demo schedule for now.'
    );
  };

  const handleIcal = () => {
    Alert.alert(
      'Coming soon',
      'iCal import is not wired up yet. Use the demo schedule for now.'
    );
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.wrap}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.importRow}>
        <Button
          title="Google Calendar"
          variant="outline"
          onPress={handleGoogle}
          fullWidth={false}
          style={{ flex: 1 }}
        />
        <Button
          title="iCal"
          variant="outline"
          onPress={handleIcal}
          fullWidth={false}
          style={{ flex: 1 }}
        />
      </View>

      <View style={styles.dividerWrap}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.divider} />
      </View>

      <Button
        title={hasSchedule ? 'Shuffle demo schedule' : 'Use a demo schedule'}
        variant={hasSchedule ? 'ghost' : 'primary'}
        size={hasSchedule ? 'sm' : 'md'}
        onPress={handleDemo}
      />

      {hasSchedule ? (
        <View style={styles.calendarBlock}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarRangeLabel}>{rangeLabel(dates)}</Text>
            <Text style={styles.calendarSubLabel}>
              {schedule.items.length} events · {schedule.timeZone}
            </Text>
          </View>

          <SegmentedControl
            options={VIEW_OPTIONS}
            value={viewMode}
            onChange={setViewMode}
          />

          <CalendarView
            schedule={schedule}
            dates={dates}
            columnWidth={columnWidth}
          />
        </View>
      ) : (
        <Card>
          <Text style={styles.placeholderTitle}>No schedule yet</Text>
          <Text style={styles.placeholderBody}>
            Pick an import option above or grab a demo to see your week here.
          </Text>
        </Card>
      )}

      <View style={styles.shareSection}>
        <Text style={styles.sectionLabel}>Who can see this?</Text>
        <SegmentedControl
          options={VISIBILITY_OPTIONS}
          value={value.scheduleVisibility}
          onChange={(v) => setValue({ scheduleVisibility: v })}
        />
        <Text style={styles.sectionHint}>
          {VISIBILITY_HINT[value.scheduleVisibility]}
        </Text>
      </View>
    </ScrollView>
  );
}

ScheduleStep.canContinue = (v) => !!v.schedule;

const styles = StyleSheet.create({
  wrap: { gap: spacing.md, paddingBottom: spacing.xl },
  importRow: { flexDirection: 'row', gap: spacing.md },
  dividerWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...typography.caption, color: colors.textMuted },
  calendarBlock: { gap: spacing.sm },
  calendarHeader: { gap: 2 },
  calendarRangeLabel: { ...typography.h2, color: colors.text, fontSize: 18 },
  calendarSubLabel: { ...typography.small, color: colors.textMuted },
  placeholderTitle: { ...typography.h2, color: colors.text },
  placeholderBody: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  shareSection: { gap: spacing.sm, marginTop: spacing.sm },
  sectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionHint: { ...typography.small, color: colors.textMuted },
});
