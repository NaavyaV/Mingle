import { useCallback, useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '../../components/Header';
import IconButton from '../../components/IconButton';
import Button from '../../components/Button';
import SearchBar from '../../components/SearchBar';
import EmptyState from '../../components/EmptyState';
import FriendCheckRow from '../../components/friends/FriendCheckRow';

import { api } from '../../api/client';
import { useUser } from '../../context/UserContext';
import { colors, spacing } from '../../theme';

export default function EventInvitePickerScreen({ navigation, route }) {
  const { eventId } = route.params || {};
  const { user } = useUser();
  const [users, setUsers] = useState({});
  const [friends, setFriends] = useState([]);
  const [picked, setPicked] = useState(() => new Set());
  const [query, setQuery] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!user?.username) return;
    try {
      const [all, rel] = await Promise.all([
        api.listUsers(),
        api.getFriends(user.username),
      ]);
      const map = {};
      for (const u of all || []) map[u.username] = u;
      setUsers(map);
      setFriends(rel?.friends || []);
    } catch {
      /* ignore */
    }
  }, [user?.username]);

  useEffect(() => { load(); }, [load]);

  const friendUsers = friends
    .map((u) => users[u])
    .filter(Boolean)
    .filter((u) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q)
      );
    });

  const toggle = (username) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });
  };

  const send = async () => {
    if (picked.size === 0) return;
    setSending(true);
    try {
      await Promise.all(
        Array.from(picked).map((to) =>
          api.sendMessage({
            from: user.username,
            to,
            kind: 'eventInvite',
            eventId,
            body: '',
          })
        )
      );
      Alert.alert('Invites sent!', `Sent to ${picked.size} friend${picked.size === 1 ? '' : 's'}.`);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Could not send', e?.message || 'Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Invite friends"
        subtitle={`${picked.size} selected`}
        left={
          <IconButton
            icon="chevron-back"
            variant="ghost"
            onPress={() => navigation.goBack()}
            accessibilityLabel="Back"
          />
        }
      />

      <View style={styles.searchWrap}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search your friends" />
      </View>

      <FlatList
        data={friendUsers}
        keyExtractor={(item) => item.username}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={{ paddingBottom: 160 }}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No friends yet"
            body="Add friends from the My Friends screen first."
          />
        }
        renderItem={({ item }) => (
          <FriendCheckRow
            user={item}
            checked={picked.has(item.username)}
            onToggle={() => toggle(item.username)}
          />
        )}
      />

      <View style={styles.footer}>
        <Button
          title={`Invite ${picked.size || ''}`}
          onPress={send}
          loading={sending}
          disabled={picked.size === 0}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  searchWrap: { paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
  sep: { height: 1, backgroundColor: colors.border, marginLeft: 72 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
