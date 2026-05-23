import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '../../components/Header';
import IconButton from '../../components/IconButton';
import EmptyState from '../../components/EmptyState';
import PatternBackground from '../../components/PatternBackground';

import { api } from '../../api/client';
import { useUser } from '../../context/UserContext';
import { formatEventTime } from '../../utils/schedule';
import { colors, radius, shadow, spacing, typography } from '../../theme';

function isUpcoming(event, now) {
  const start = new Date(event?.start?.dateTime);
  if (Number.isNaN(start.getTime())) return false;
  return start.getTime() >= now.getTime();
}

function hashColor(seed = '') {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const hues = [colors.primary, colors.gold, colors.coral, colors.success];
  return hues[h % hues.length];
}

/**
 * Lists every upcoming event in the user's schedule and lets them
 * delete the one(s) they pick. Used in place of the previous
 * "remove next event" shortcut so the user is in control of *which*
 * event disappears.
 */
export default function RemoveEventScreen({ navigation }) {
  const { user, setUser } = useUser();
  const [busyId, setBusyId] = useState(null);

  const items = useMemo(() => {
    const all = Array.isArray(user?.schedule?.items) ? user.schedule.items : [];
    const now = new Date();
    return all
      .filter((e) => isUpcoming(e, now))
      .sort((a, b) => new Date(a.start.dateTime) - new Date(b.start.dateTime));
  }, [user?.schedule?.items]);

  const removeEvent = (event) => {
    Alert.alert(
      `Remove "${event.summary}"?`,
      formatEventTime(event),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setBusyId(event.id);
              const all = Array.isArray(user?.schedule?.items)
                ? user.schedule.items
                : [];
              const remaining = all.filter((e) => e.id !== event.id);
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
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PatternBackground />
      <Header
        title="Remove event"
        subtitle="Tap any event to delete it"
        left={
          <IconButton
            icon="chevron-back"
            variant="ghost"
            onPress={() => navigation.goBack()}
            accessibilityLabel="Back"
          />
        }
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="Nothing upcoming"
            body="No future events on your calendar."
            style={{ marginTop: spacing.xxl }}
          />
        }
        renderItem={({ item }) => (
          <EventRow
            event={item}
            busy={busyId === item.id}
            onPress={() => removeEvent(item)}
          />
        )}
      />
    </SafeAreaView>
  );
}

function EventRow({ event, onPress, busy }) {
  const accent = hashColor(event.id || event.summary);
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [
        styles.row,
        pressed && { opacity: 0.85 },
        busy && { opacity: 0.5 },
      ]}
    >
      <View style={[styles.stripe, { backgroundColor: accent }]} />
      <View style={styles.rowBody}>
        <Text style={styles.title} numberOfLines={1}>
          {event.summary}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {formatEventTime(event)}
          {event.location ? ` · ${event.location}` : ''}
        </Text>
      </View>
      <View style={styles.trash}>
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.soft,
  },
  stripe: { width: 4 },
  rowBody: { flex: 1, padding: spacing.md, gap: 2 },
  title: { ...typography.body, color: colors.text, fontWeight: '700' },
  meta: { ...typography.caption, color: colors.textMuted },
  trash: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
