import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '../../components/Header';
import IconButton from '../../components/IconButton';
import SearchBar from '../../components/SearchBar';
import FriendRow from '../../components/friends/FriendRow';
import EmptyState from '../../components/EmptyState';
import PatternBackground from '../../components/PatternBackground';

import { api } from '../../api/client';
import { useUser } from '../../context/UserContext';
import { colors, spacing } from '../../theme';

export default function NewMessageScreen({ navigation }) {
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    if (!user?.username) return;
    try {
      const [all, rel] = await Promise.all([
        api.listUsers(),
        api.getFriends(user.username),
      ]);
      setUsers(all || []);
      setFriends(rel?.friends || []);
    } catch {
      /* ignore */
    }
  }, [user?.username]);

  useEffect(() => { load(); }, [load]);

  const candidates = useMemo(() => {
    const others = (users || []).filter((u) => u.username !== user?.username);
    const friendsFirst = others.sort((a, b) => {
      const af = friends.includes(a.username) ? 0 : 1;
      const bf = friends.includes(b.username) ? 0 : 1;
      if (af !== bf) return af - bf;
      return (a.name || '').localeCompare(b.name || '');
    });
    if (!query.trim()) return friendsFirst;
    const q = query.toLowerCase();
    return friendsFirst.filter(
      (u) =>
        (u.username || '').toLowerCase().includes(q) ||
        (u.name || '').toLowerCase().includes(q)
    );
  }, [users, friends, query, user?.username]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PatternBackground />
      <Header
        title="New message"
        left={
          <IconButton
            icon="close"
            variant="ghost"
            onPress={() => navigation.goBack()}
            accessibilityLabel="Close"
          />
        }
      />
      <View style={styles.searchWrap}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search people"
          autoFocus
        />
      </View>

      <FlatList
        data={candidates}
        keyExtractor={(item) => item.username}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={
          <EmptyState icon="search-outline" title="No one found" />
        }
        renderItem={({ item }) => (
          <FriendRow
            user={item}
            primaryAction={{
              label: friends.includes(item.username) ? 'Message' : 'Say hi',
              onPress: () => {
                navigation.replace('DM', { other: item.username, otherUser: item });
              },
            }}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  searchWrap: { paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
  sep: { height: 1, backgroundColor: colors.border, marginLeft: 72 },
});
