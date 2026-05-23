import { useCallback, useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '../../components/Header';
import SearchBar from '../../components/SearchBar';
import EmptyState from '../../components/EmptyState';
import FAB from '../../components/FAB';
import ConversationRow from '../../components/messages/ConversationRow';

import { api } from '../../api/client';
import { useUser } from '../../context/UserContext';
import { colors, spacing } from '../../theme';

export default function MessagesScreen({ navigation }) {
  const { user } = useUser();
  const [conversations, setConversations] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.username) return;
    try {
      const [convs, allUsers] = await Promise.all([
        api.listConversations(user.username),
        api.listUsers(),
      ]);
      const byUsername = {};
      for (const u of allUsers || []) byUsername[u.username] = u;
      setUsersById(byUsername);
      setConversations(convs || []);
    } catch {
      /* swallow for hackathon */
    }
  }, [user?.username]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = conversations.filter((c) => {
    if (!query.trim()) return true;
    const u = usersById[c.other];
    const q = query.toLowerCase();
    return (
      c.other.toLowerCase().includes(q) ||
      (u?.name || '').toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Messages" />
      <View style={styles.searchWrap}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search conversations" />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.other}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="No messages yet"
            body="Tap the + button to start a chat with a friend."
          />
        }
        renderItem={({ item }) => (
          <ConversationRow
            otherUser={usersById[item.other] || { username: item.other }}
            lastMessage={item.lastMessage}
            unread={item.unread}
            onPress={() =>
              navigation.navigate('DM', {
                other: item.other,
                otherUser: usersById[item.other],
              })
            }
          />
        )}
      />

      <FAB
        icon="create-outline"
        onPress={() => navigation.navigate('NewMessage')}
        accessibilityLabel="New message"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  searchWrap: { paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
  sep: { height: 1, backgroundColor: colors.border, marginLeft: 72 },
});
