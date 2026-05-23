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
import PatternBackground from '../../components/PatternBackground';
import UserCardSheet from '../../components/map/UserCardSheet';

import { api } from '../../api/client';
import { useUser } from '../../context/UserContext';
import { getPresenceDetail } from '../../utils/presence';
import { colors, spacing } from '../../theme';

const TABS = [
  { label: 'Friends', value: 'friends' },
  { label: 'Recommended', value: 'recommended' },
  { label: 'All', value: 'all' },
];

export default function MyFriendsScreen({ navigation }) {
  const { user } = useUser();
  const [tab, setTab] = useState('friends');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [rel, setRel] = useState({ friends: [], incoming: [], outgoing: [] });
  const [busy, setBusy] = useState(false);
  const [selectedUsername, setSelectedUsername] = useState(null);

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

  // The viewer's interests, normalized for case-insensitive overlap.
  const myInterests = useMemo(() => {
    const arr = Array.isArray(user?.interests) ? user.interests : [];
    return new Set(arr.map((s) => String(s).toLowerCase()));
  }, [user?.interests]);

  // For each non-self, non-friend user, compute the set of interests
  // shared with the viewer. We attach `shared` (preserving original
  // casing) so the row can render "3 shared: Coding, Coffee, Gym".
  const recommendations = useMemo(() => {
    if (!user?.username || myInterests.size === 0) return [];
    const friendSet = new Set(rel.friends || []);
    const out = [];
    for (const u of users) {
      if (u.username === user.username) continue;
      if (friendSet.has(u.username)) continue;
      const theirs = Array.isArray(u.interests) ? u.interests : [];
      const shared = theirs.filter((i) =>
        myInterests.has(String(i).toLowerCase())
      );
      if (shared.length === 0) continue;
      out.push({ user: u, shared });
    }
    // Most shared first; deterministic tiebreak by name so the order
    // doesn't shuffle on every render.
    out.sort((a, b) => {
      if (b.shared.length !== a.shared.length) {
        return b.shared.length - a.shared.length;
      }
      return (a.user.name || a.user.username).localeCompare(
        b.user.name || b.user.username
      );
    });
    return out;
  }, [users, rel.friends, user?.username, myInterests]);

  const visible = useMemo(() => {
    let list;
    if (tab === 'friends') {
      list = rel.friends.map((u) => usersByUsername[u]).filter(Boolean);
    } else if (tab === 'recommended') {
      list = recommendations.map((r) => r.user);
    } else {
      list = users.filter((u) => u.username !== user?.username);
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
  }, [users, rel, tab, query, user?.username, usersByUsername, recommendations]);

  // Quick lookup of shared-interest lists keyed by username for the
  // Recommended tab; cheap to maintain and keeps render code simple.
  const sharedByUsername = useMemo(() => {
    const map = {};
    for (const r of recommendations) map[r.user.username] = r.shared;
    return map;
  }, [recommendations]);

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

  const selected = useMemo(
    () => users.find((u) => u.username === selectedUsername) || null,
    [users, selectedUsername]
  );
  const selectedIsMe = selected?.username === user?.username;
  const selectedIsFriend = selected
    ? rel.friends.includes(selected.username)
    : false;
  // Friends-only view always has visibility; for the All-people tab we
  // still respect the same visibility rules the map uses.
  const canSeeSchedule =
    selected &&
    (selectedIsMe ||
      selected.scheduleVisibility === 'public' ||
      (selected.scheduleVisibility !== 'private' && selectedIsFriend));
  const presence = useMemo(
    () => (canSeeSchedule ? getPresenceDetail(selected) : null),
    [selected, canSeeSchedule]
  );

  const handleSheetFriend = async () => {
    if (!selected || selectedIsMe) return;
    await handleAction(
      selected.username,
      selectedIsFriend ? 'remove' : 'request'
    );
  };

  const handleSheetMessage = () => {
    if (!selected || selectedIsMe) return;
    setSelectedUsername(null);
    // initial: false makes React Navigation lay the stack out as
    // [MessagesList, DM] so the back button in DM returns to the
    // user's conversation list (not the screen they came from).
    navigation.getParent()?.navigate('MessagesTab', {
      screen: 'DM',
      params: { other: selected.username },
      initial: false,
    });
  };

  const actionsFor = (other) => {
    if (rel.friends.includes(other)) {
      return {
        primary: {
          label: 'Unfriend',
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
      <PatternBackground />
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
            title={
              tab === 'friends'
                ? 'No friends yet'
                : tab === 'recommended'
                ? 'No matches yet'
                : 'No one found'
            }
            body={
              tab === 'recommended'
                ? 'Add more interests in your profile to see people who share them.'
                : tab === 'all'
                ? 'Try a different search.'
                : 'Switch to Recommended or All to find new friends.'
            }
          />
        }
        renderItem={({ item }) => {
          const a = actionsFor(item.username);
          let subtitle;
          if (tab === 'recommended') {
            const shared = sharedByUsername[item.username] || [];
            if (shared.length) {
              subtitle = `${shared.length} shared · ${shared.slice(0, 3).join(', ')}`;
            }
          }
          return (
            <FriendRow
              user={item}
              primaryAction={a.primary}
              secondaryAction={a.secondary}
              subtitle={subtitle}
              onPress={() => setSelectedUsername(item.username)}
            />
          );
        }}
      />

      <UserCardSheet
        user={selected}
        presence={presence}
        isFriend={selectedIsFriend}
        isMe={selectedIsMe}
        busy={busy}
        onClose={() => setSelectedUsername(null)}
        onFriend={handleSheetFriend}
        onMessage={handleSheetMessage}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  controls: { paddingHorizontal: spacing.xl, gap: spacing.sm, paddingBottom: spacing.sm },
  sep: { height: 1, backgroundColor: colors.border, marginLeft: 72 },
});
