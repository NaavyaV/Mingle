import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import {
  WEEKDAY_LABELS,
  eventsForDay,
  fractionalHour,
  eventDuration,
  isSameDay,
} from '../utils/schedule';

const HOUR_HEIGHT = 56;
const RAIL_WIDTH = 44;
const DAY_START = 7; // 7am
const DAY_END = 21; // 9pm
const TOTAL_HOURS = DAY_END - DAY_START;

const EVENT_PALETTE = [colors.primary, colors.coral, colors.gold, colors.success, colors.primaryLight];

function hashColor(id = '') {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) % 997;
  return EVENT_PALETTE[h % EVENT_PALETTE.length];
}

function formatHourLabel(h) {
  if (h === 0) return '12a';
  if (h === 12) return '12p';
  if (h < 12) return `${h}a`;
  return `${h - 12}p`;
}

function EventBlock({ event, columnWidth }) {
  const start = new Date(event.start.dateTime);
  const startFrac = fractionalHour(start) - DAY_START;
  const durationHrs = eventDuration(event);
  const top = Math.max(0, startFrac * HOUR_HEIGHT);
  const height = Math.max(28, durationHrs * HOUR_HEIGHT - 2);
  const accent = hashColor(event.id || event.summary);

  return (
    <View
      style={[
        styles.event,
        {
          top,
          height,
          left: 2,
          width: columnWidth - 4,
          backgroundColor: `${accent}22`,
          borderLeftColor: accent,
        },
      ]}
    >
      <Text numberOfLines={1} style={[styles.eventTitle, { color: accent }]}>
        {event.summary}
      </Text>
      {height > 36 && event.location ? (
        <Text numberOfLines={1} style={styles.eventMeta}>
          {event.location}
        </Text>
      ) : null}
    </View>
  );
}

function NowLine({ columnWidth, columnIndex }) {
  const now = new Date();
  const frac = fractionalHour(now) - DAY_START;
  if (frac < 0 || frac > TOTAL_HOURS) return null;
  const top = frac * HOUR_HEIGHT;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.nowLine,
        {
          top,
          left: columnIndex * columnWidth + 2,
          width: columnWidth - 4,
        },
      ]}
    >
      <View style={styles.nowDot} />
      <View style={styles.nowBar} />
    </View>
  );
}

/**
 * Reusable Google Calendar-style grid. Renders a left hour rail plus one or
 * more day columns. Events from the supplied schedule are positioned
 * absolutely based on their start time and duration. Pure presentational —
 * callers decide which date range to show via `dates`.
 */
export default function CalendarView({ schedule, dates, columnWidth }) {
  const hours = useMemo(
    () => Array.from({ length: TOTAL_HOURS + 1 }).map((_, i) => DAY_START + i),
    []
  );

  const eventsByDay = useMemo(
    () => dates.map((d) => eventsForDay(schedule, d)),
    [schedule, dates]
  );

  const today = new Date();

  return (
    <View style={styles.wrap}>
      {/* Day header row */}
      <View style={styles.headerRow}>
        <View style={{ width: RAIL_WIDTH }} />
        {dates.map((d, idx) => {
          const todayCol = isSameDay(d, today);
          return (
            <View
              key={d.toISOString()}
              style={[styles.headerCell, { width: columnWidth }]}
            >
              <Text style={[styles.headerDow, todayCol && styles.headerDowToday]}>
                {WEEKDAY_LABELS[d.getDay()]}
              </Text>
              <View
                style={[
                  styles.headerDateWrap,
                  todayCol && styles.headerDateWrapToday,
                ]}
              >
                <Text
                  style={[
                    styles.headerDate,
                    todayCol && styles.headerDateToday,
                  ]}
                >
                  {d.getDate()}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
      >
        <View style={styles.grid}>
          {/* Hour rail */}
          <View style={[styles.rail, { width: RAIL_WIDTH }]}>
            {hours.slice(0, -1).map((h) => (
              <View key={h} style={[styles.railHour, { height: HOUR_HEIGHT }]}>
                <Text style={styles.railText}>{formatHourLabel(h)}</Text>
              </View>
            ))}
          </View>

          {/* Day columns */}
          {dates.map((d, idx) => (
            <View
              key={d.toISOString()}
              style={[styles.column, { width: columnWidth }]}
            >
              {hours.slice(0, -1).map((h) => (
                <View
                  key={h}
                  style={[styles.hourCell, { height: HOUR_HEIGHT }]}
                />
              ))}
              {eventsByDay[idx].map((ev) => (
                <EventBlock key={ev.id} event={ev} columnWidth={columnWidth} />
              ))}
            </View>
          ))}

          {/* Now-line overlay (only if a visible column is today) */}
          {dates.map((d, idx) =>
            isSameDay(d, today) ? (
              <NowLine
                key={`now-${idx}`}
                columnWidth={columnWidth}
                columnIndex={idx}
              />
            ) : null
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  headerCell: { alignItems: 'center', gap: 2 },
  headerDow: {
    ...typography.small,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  headerDowToday: { color: colors.primary },
  headerDateWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDateWrapToday: { backgroundColor: colors.primary },
  headerDate: { ...typography.caption, color: colors.text, fontWeight: '700' },
  headerDateToday: { color: colors.textInverse },
  scroll: { maxHeight: 380 },
  grid: { flexDirection: 'row' },
  rail: { paddingTop: 0 },
  railHour: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'flex-end',
    paddingRight: 6,
    paddingTop: 2,
  },
  railText: {
    ...typography.small,
    color: colors.textMuted,
    fontWeight: '600',
  },
  column: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    position: 'relative',
  },
  hourCell: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  event: {
    position: 'absolute',
    borderRadius: 6,
    borderLeftWidth: 3,
    paddingVertical: 4,
    paddingHorizontal: 6,
    overflow: 'hidden',
  },
  eventTitle: { ...typography.small, fontWeight: '700' },
  eventMeta: { ...typography.small, color: colors.textMuted, fontSize: 10 },
  nowLine: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    height: 2,
  },
  nowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.coral,
    marginLeft: -4,
  },
  nowBar: { flex: 1, height: 2, backgroundColor: colors.coral },
});
