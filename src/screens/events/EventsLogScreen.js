import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import Header from '../../components/Header';
import EmptyState from '../../components/EmptyState';
import FAB from '../../components/FAB';
import EventListItem from '../../components/events/EventListItem';

import { api } from '../../api/client';
import { useUser } from '../../context/UserContext';
import { colors, spacing } from '../../theme';

export default function EventsLogScreen({ navigation }) {
  const { user } = useUser();
  const [events, setEvents] = useState([]);
  const [usersByUsername, setUsersByUsername] = useState({});
  const [friends, setFriends] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.username) return;
    try {
      const [evs, all, rel] = await Promise.all([
        api.listEvents(),
        api.listUsers(),
        api.getFriends(user.username),
      ]);
      const map = {};
      for (const u of all || []) map[u.username] = u;
      setEvents(evs || []);
      setUsersByUsername(map);
      setFriends(rel?.friends || []);
    } catch {
      /* ignore */
    }
  }, [user?.username]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const friendsSet = useMemo(() => new Set(friends), [friends]);

  const renderItem = ({ item }) => {
    const goingFriends = (item.going || [])
      .filter((u) => u !== user?.username && friendsSet.has(u))
      .map((u) => usersByUsername[u])
      .filter(Boolean);
    return (
      <EventListItem
        event={item}
        goingUsers={goingFriends}
        onPress={() => navigation.navigate('EventDetail', { eventId: item._id })}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Events" subtitle="Happening on campus" />

      <FlatList
        data={events}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          <EmptyState
            icon="megaphone-outline"
            title="No events yet"
            body="Tap the + button to host the first one."
          />
        }
        renderItem={renderItem}
      />

      <FAB
        icon="add"
        onPress={() => navigation.navigate('CreateEvent')}
        accessibilityLabel="Create event"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg, paddingBottom: 120 },
});
