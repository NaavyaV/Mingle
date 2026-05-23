import { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, Dimensions, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import Header from '../../components/Header';
import IconButton from '../../components/IconButton';
import CalendarView from '../../components/CalendarView';
import CalendarRangeBar, { buildRange } from '../../components/CalendarRangeBar';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import PatternBackground from '../../components/PatternBackground';
import GoogleCalendarImportModal from '../../components/GoogleCalendarImportModal';

import { api } from '../../api/client';
import { useUser } from '../../context/UserContext';
import { colors, radius, spacing } from '../../theme';

const DEFAULT_GCAL_URL = process.env.EXPO_PUBLIC_DEFAULT_GCAL_URL || '';

export default function MyCalendarScreen({ navigation }) {
  const { user, setUser } = useUser();
  const [mode, setMode] = useState('3day');
  const anchor = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [syncing, setSyncing] = useState(false);
  const [gcalOpen, setGcalOpen] = useState(false);

  const isGoogle =
    user?.scheduleSource === 'google' || user?.schedule?.source === 'google';

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
    // Not yet connected to Google → either instant-connect (when a
    // default URL is configured) or open the paste-URL modal.
    if (!isGoogle) {
      if (DEFAULT_GCAL_URL) {
        try {
          setSyncing(true);
          const updated = await api.connectCalendar(user._id, DEFAULT_GCAL_URL);
          await setUser(updated);
          Alert.alert(
            'Google Calendar connected',
            `${updated.eventCount ?? updated.schedule?.items?.length ?? 0} events imported.`
          );
        } catch (e) {
          Alert.alert('Could not connect', e?.message || 'Try again.');
        } finally {
          setSyncing(false);
        }
        return;
      }
      Alert.alert(
        'Demo schedule',
        "This schedule won't auto-refresh. Connect Google Calendar to pull your real events.",
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Connect', onPress: () => setGcalOpen(true) },
        ]
      );
      return;
    }
    try {
      setSyncing(true);
      const updated = await api.syncCalendar(user._id);
      await setUser(updated);
      Alert.alert(
        'Calendar updated',
        `${updated.eventCount ?? updated.schedule?.items?.length ?? 0} events loaded from Google Calendar.`
      );
    } catch (e) {
      Alert.alert('Could not sync', e?.message || 'Try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleGoogleConnected = async ({ schedule, icalFeedUrl, eventCount }) => {
    if (!user?._id) return;
    try {
      setSyncing(true);
      const updated = await api.connectCalendar(user._id, icalFeedUrl);
      await setUser(updated);
      Alert.alert(
        'Google Calendar connected',
        `${eventCount ?? updated.schedule?.items?.length ?? 0} events imported.`
      );
    } catch (e) {
      Alert.alert('Could not save', e?.message || 'Try again.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PatternBackground />
      <Header
        title="My Calendar"
        subtitle={user?.school}
        right={
          <IconButton
            icon={syncing ? 'hourglass-outline' : 'sync-outline'}
            variant="ghost"
            onPress={resync}
            accessibilityLabel="Resync calendar"
          />
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
              title="Remove event"
              variant="outline"
              leading={<Ionicons name="trash-outline" size={18} color={colors.primary} />}
              onPress={() => navigation.navigate('RemoveEvent')}
            />
          </View>
        </View>
      </ScrollView>

      <GoogleCalendarImportModal
        visible={gcalOpen}
        onClose={() => setGcalOpen(false)}
        onImported={handleGoogleConnected}
        title="Connect Google Calendar"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  calendarWrap: { borderRadius: radius.lg, flexShrink: 1 },
  actionsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
});
