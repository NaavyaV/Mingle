import { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import Header from '../../components/Header';
import IconButton from '../../components/IconButton';
import CalendarView from '../../components/CalendarView';
import CalendarRangeBar, { buildRange } from '../../components/CalendarRangeBar';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';

import { api } from '../../api/client';
import { useUser } from '../../context/UserContext';
import { buildDemoSchedule, formatEventTime } from '../../utils/schedule';
import { colors, radius, spacing } from '../../theme';

export default function MyCalendarScreen({ navigation }) {
  const { user, setUser } = useUser();
  const [mode, setMode] = useState('3day');
  const anchor = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [resyncing, setResyncing] = useState(false);

  // Refresh user from server on focus so adding events on the next
  // screen flows back into the calendar.
  const refreshUser = useCallback(async () => {
    if (!user?.username) return;
    try {
      const fresh = await api.getUserByUsername(user.username);
      await setUser(fresh);
    } catch {
      /* ignore */
    }
  }, [user?.username, setUser]);

  useFocusEffect(useCallback(() => { refreshUser(); }, [refreshUser]));

  const dates = useMemo(() => buildRange(anchor, mode), [anchor, mode]);
  const width = Dimensions.get('window').width;
  const railWidth = 44;
  const horizontalPadding = spacing.xl * 2;
  const columnWidth = Math.floor((width - horizontalPadding - railWidth) / dates.length);

  const resync = async () => {
    if (!user?._id) return;
    try {
      setResyncing(true);
      const schedule = buildDemoSchedule();
      const updated = await api.updateUser(user._id, { schedule });
      await setUser(updated);
    } catch (e) {
      Alert.alert('Could not resync', e?.message || 'Try again.');
    } finally {
      setResyncing(false);
    }
  };

  const removeNext = async () => {
    const items = Array.isArray(user?.schedule?.items) ? user.schedule.items : [];
    const sorted = items
      .slice()
      .sort((a, b) => new Date(a.start.dateTime) - new Date(b.start.dateTime));
    const next = sorted.find((e) => new Date(e.start.dateTime) >= new Date());
    if (!next) {
      Alert.alert('No upcoming events to remove.');
      return;
    }
    Alert.alert(
      `Remove "${next.summary}"?`,
      `${formatEventTime(next)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const remaining = items.filter((e) => e.id !== next.id);
              const updated = await api.updateUser(user._id, {
                schedule: {
                  ...(user.schedule || { kind: 'calendar#events' }),
                  items: remaining,
                  updated: new Date().toISOString(),
                },
              });
              await setUser(updated);
            } catch (e) {
              Alert.alert('Could not remove', e?.message || 'Try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="My Calendar"
        subtitle={user?.school}
        right={
          <IconButton
            icon={resyncing ? 'hourglass-outline' : 'sync-outline'}
            variant="ghost"
            onPress={resync}
            accessibilityLabel="Resync calendar"
          />
        }
      />

      <View style={styles.content}>
        <CalendarRangeBar mode={mode} onChangeMode={setMode} anchor={anchor} />

        <View style={styles.calendarWrap}>
          {user?.schedule?.items?.length ? (
            <CalendarView
              schedule={user.schedule}
              dates={dates}
              columnWidth={columnWidth}
              maxHeight={400}
            />
          ) : (
            <EmptyState
              icon="calendar-outline"
              title="No events yet"
              body="Resync your calendar or add an event below."
              style={{ marginTop: spacing.lg }}
            />
          )}
        </View>

        <View style={styles.actionsRow}>
          <View style={{ flex: 1 }}>
            <Button
              title="Add event"
              leading={<Ionicons name="add" size={18} color="#fff" />}
              onPress={() => navigation.navigate('AddEvent')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="Remove next"
              variant="outline"
              leading={<Ionicons name="remove" size={18} color={colors.primary} />}
              onPress={removeNext}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  calendarWrap: { borderRadius: radius.lg, flexShrink: 1 },
  actionsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
});
