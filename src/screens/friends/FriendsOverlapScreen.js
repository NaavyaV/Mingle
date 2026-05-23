import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import Header from '../../components/Header';
import IconButton from '../../components/IconButton';
import Button from '../../components/Button';
import CalendarView from '../../components/CalendarView';
import CalendarRangeBar, { buildRange } from '../../components/CalendarRangeBar';
import AvatarStack from '../../components/AvatarStack';
import Card from '../../components/Card';

import { api } from '../../api/client';
import { useUser } from '../../context/UserContext';
import { buildOverlapSchedule } from '../../utils/overlap';
import { formatTimeShort } from '../../utils/format';
import { colors, spacing, typography } from '../../theme';

export default function FriendsOverlapScreen({ navigation, route }) {
  const { user } = useUser();
  const [mode, setMode] = useState('3day');
  const anchor = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [friends, setFriends] = useState([]); // usernames
  const [usersByUsername, setUsersByUsername] = useState({});
  const [selected, setSelected] = useState(null); // Set of usernames or null=all
  const [tappedAt, setTappedAt] = useState(null);

  const load = useCallback(async () => {
    if (!user?.username) return;
    try {
      const [rel, all] = await Promise.all([
        api.getFriends(user.username),
        api.listUsers(),
      ]);
      const map = {};
      for (const u of all || []) map[u.username] = u;
      setUsersByUsername(map);
      setFriends(rel?.friends || []);
    } catch {
      /* ignore */
    }
  }, [user?.username]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);

  // accept selection from filter screen
  useEffect(() => {
    if (route?.params?.selected) {
      setSelected(new Set(route.params.selected));
    }
  }, [route?.params?.selected]);

  const dates = useMemo(() => buildRange(anchor, mode), [anchor, mode]);
  const width = Dimensions.get('window').width;
  const railWidth = 44;
  const horizontalPadding = spacing.xl * 2;
  const columnWidth = Math.floor((width - horizontalPadding - railWidth) / dates.length);

  const visibleFriends = useMemo(() => {
    const usernames = selected ? friends.filter((u) => selected.has(u)) : friends;
    return usernames.map((u) => usersByUsername[u]).filter(Boolean);
  }, [friends, selected, usersByUsername]);

  const overlap = useMemo(
    () => buildOverlapSchedule(visibleFriends, dates, user),
    [visibleFriends, dates, user]
  );

  const bookedNow = tappedAt ? overlap.bookedAt(tappedAt) : [];
  const bookedUsers = bookedNow.map((u) => usersByUsername[u]).filter(Boolean);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Friends calendar"
        subtitle={
          selected
            ? `${visibleFriends.length} of ${friends.length} friends`
            : `${friends.length} friends`
        }
        right={
          <IconButton
            icon="options-outline"
            variant="ghost"
            onPress={() =>
              navigation.navigate('FriendsFilter', {
                friends,
                usersByUsername,
                selected: selected ? Array.from(selected) : null,
              })
            }
            accessibilityLabel="Filter friends"
          />
        }
      />

      <View style={styles.content}>
        <CalendarRangeBar mode={mode} onChangeMode={setMode} anchor={anchor} />

        <View style={styles.calendarWrap}>
          <CalendarView
            schedule={overlap.schedule}
            dates={dates}
            columnWidth={columnWidth}
            maxHeight={360}
            onPressTime={setTappedAt}
          />
        </View>

        <View style={styles.legend}>
          <LegendDot color={colors.primary} label="You" />
          <LegendDot color={colors.gold} label="Friends busy" />
          <Text style={styles.legendHint}>
            {tappedAt ? '' : "Tap the grid to see who's busy"}
          </Text>
        </View>

        {tappedAt ? (
          <Card style={styles.bookedCard}>
            <View style={styles.bookedHeader}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={styles.bookedTitle}>
                {formatTimeShort(tappedAt)} –{' '}
                {formatTimeShort(new Date(tappedAt.getTime() + 15 * 60000))}
              </Text>
            </View>
            {bookedUsers.length === 0 ? (
              <Text style={styles.bookedEmpty}>Everyone you picked is free 🎉</Text>
            ) : (
              <View style={styles.bookedRow}>
                <AvatarStack users={bookedUsers} max={4} size={28} />
                <Text style={styles.bookedNames} numberOfLines={2}>
                  {bookedUsers
                    .map((u) => u.name?.split(' ')[0] || u.username)
                    .join(', ')}{' '}
                  booked
                </Text>
              </View>
            )}
          </Card>
        ) : null}

        <View style={{ marginTop: 'auto' }}>
          <Button
            title="My Friends"
            variant="primary"
            leading={<Ionicons name="people" size={18} color="#fff" />}
            onPress={() => navigation.navigate('MyFriends')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function LegendDot({ color, label }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
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
  calendarWrap: { borderRadius: 12 },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { ...typography.small, color: colors.textMuted, fontWeight: '600' },
  legendHint: { ...typography.small, color: colors.textMuted, marginLeft: 'auto' },
  bookedCard: { gap: spacing.sm },
  bookedHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bookedTitle: { ...typography.body, color: colors.text, fontWeight: '700' },
  bookedEmpty: { ...typography.body, color: colors.textMuted },
  bookedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bookedNames: { ...typography.caption, color: colors.text, flex: 1 },
});
