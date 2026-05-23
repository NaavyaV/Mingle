import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Dimensions } from 'react-native';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import SegmentedControl from '../../../components/SegmentedControl';
import CalendarView from '../../../components/CalendarView';
import GoogleCalendarImportModal from '../../../components/GoogleCalendarImportModal';
import { api } from '../../../api/client';
import { buildDemoSchedule, getRange, shortMonth } from '../../../utils/schedule';
import { colors, spacing, typography } from '../../../theme';

const DEFAULT_GCAL_URL = process.env.EXPO_PUBLIC_DEFAULT_GCAL_URL || '';

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
  const [gcalOpen, setGcalOpen] = useState(false);
  const [gcalBusy, setGcalBusy] = useState(false);
  const schedule = value.schedule;
  const hasSchedule = !!schedule;
  const isGoogle = value.scheduleSource === 'google';

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

  // If a default URL is configured (EXPO_PUBLIC_DEFAULT_GCAL_URL), the
  // button instantly imports — no extra paste step. Otherwise it falls
  // back to the paste-URL modal.
  const handleGoogle = async () => {
    if (!DEFAULT_GCAL_URL) {
      setGcalOpen(true);
      return;
    }
    try {
      setGcalBusy(true);
      const { schedule: imported, eventCount } = await api.previewCalendar(DEFAULT_GCAL_URL);
      handleGoogleImported({ schedule: imported, icalFeedUrl: DEFAULT_GCAL_URL, eventCount });
    } catch (e) {
      Alert.alert('Could not import', e?.message || 'Check your connection and try again.');
    } finally {
      setGcalBusy(false);
    }
  };

  const handleGoogleImported = ({ schedule: imported, icalFeedUrl, eventCount }) => {
    setValue({
      schedule: imported,
      scheduleSource: 'google',
      icalFeedUrl,
    });
    Alert.alert(
      'Google Calendar connected',
      `${eventCount} event${eventCount === 1 ? '' : 's'} loaded. Your schedule will stay in sync from the calendar tab.`
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
          title={gcalBusy ? 'Importing…' : 'Import from Google Calendar'}
          variant="outline"
          onPress={handleGoogle}
          loading={gcalBusy}
          fullWidth
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
              {isGoogle ? ' · Google Calendar' : ''}
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

      <GoogleCalendarImportModal
        visible={gcalOpen}
        onClose={() => setGcalOpen(false)}
        onImported={handleGoogleImported}
      />
    </ScrollView>
  );
}

ScheduleStep.canContinue = (v) => !!v.schedule;

const styles = StyleSheet.create({
  wrap: { gap: spacing.md, paddingBottom: spacing.xl },
  importRow: { gap: spacing.md },
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
