import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import Header from '../../components/Header';
import IconButton from '../../components/IconButton';
import SearchBar from '../../components/SearchBar';
import SegmentedControl from '../../components/SegmentedControl';
import EmptyState from '../../components/EmptyState';
import FriendRow from '../../components/friends/FriendRow';

import { api } from '../../api/client';
import { useUser } from '../../context/UserContext';
import { colors, spacing } from '../../theme';

const TABS = [
  { label: 'All people', value: 'all' },
  { label: 'Friends', value: 'friends' },
];

export default function MyFriendsScreen({ navigation }) {
  const { user } = useUser();
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [rel, setRel] = useState({ friends: [], incoming: [], outgoing: [] });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user?.username) return;
    try {
      const [all, r] = await Promise.all([
        api.listUsers(),
        api.getFriends(user.username),
      ]);
      setUsers(all || []);
      setRel(r || { friends: [], incoming: [], outgoing: [] });
    } catch {
      /* ignore */
    }
  }, [user?.username]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);

  const usersByUsername = useMemo(() => {
    const map = {};
    for (const u of users) map[u.username] = u;
    return map;
  }, [users]);

  const visible = useMemo(() => {
    let list = users.filter((u) => u.username !== user?.username);
    if (tab === 'friends') {
      list = rel.friends.map((u) => usersByUsername[u]).filter(Boolean);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (u) =>
          (u.username || '').toLowerCase().includes(q) ||
          (u.name || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, rel, tab, query, user?.username, usersByUsername]);

  const handleAction = async (other, kind) => {
    if (busy) return;
    setBusy(true);
    try {
      if (kind === 'request') await api.requestFriend(user.username, other);
      else if (kind === 'remove') await api.removeFriend(user.username, other);
      await load();
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  const actionsFor = (other) => {
    if (rel.friends.includes(other)) {
      return {
        primary: {
          label: 'Friends',
          variant: 'outline',
          onPress: () => handleAction(other, 'remove'),
        },
      };
    }
    return {
      primary: {
        label: 'Add friend',
        onPress: () => handleAction(other, 'request'),
      },
    };
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="My Friends"
        left={
          <IconButton
            icon="chevron-back"
            variant="ghost"
            onPress={() => navigation.goBack()}
            accessibilityLabel="Back"
          />
        }
      />

      <View style={styles.controls}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search people" />
        <SegmentedControl options={TABS} value={tab} onChange={setTab} />
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.username}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={tab === 'friends' ? 'No friends yet' : 'No one found'}
            body={
              tab === 'all'
                ? 'Try a different search.'
                : 'Switch to All people to find new friends.'
            }
          />
        }
        renderItem={({ item }) => {
          const a = actionsFor(item.username);
          return (
            <FriendRow
              user={item}
              primaryAction={a.primary}
              secondaryAction={a.secondary}
            />
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  controls: { paddingHorizontal: spacing.xl, gap: spacing.sm, paddingBottom: spacing.sm },
  sep: { height: 1, backgroundColor: colors.border, marginLeft: 72 },
});
