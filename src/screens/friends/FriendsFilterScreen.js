import { useMemo, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '../../components/Header';
import IconButton from '../../components/IconButton';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import FriendCheckRow from '../../components/friends/FriendCheckRow';

import { colors, spacing } from '../../theme';

export default function FriendsFilterScreen({ navigation, route }) {
  const { friends = [], usersByUsername = {}, selected: initial } = route.params || {};

  const friendUsers = useMemo(
    () => friends.map((u) => usersByUsername[u]).filter(Boolean),
    [friends, usersByUsername]
  );

  const [selected, setSelected] = useState(() => new Set(initial || friends));

  const toggle = (username) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === friends.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(friends));
    }
  };

  const apply = () => {
    navigation.navigate({
      name: 'FriendsOverlap',
      params: { selected: Array.from(selected) },
      merge: true,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Filter friends"
        subtitle={`${selected.size} / ${friends.length} selected`}
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
        data={friendUsers}
        keyExtractor={(item) => item.username}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No friends yet"
            body="Add friends from the My Friends screen to start filtering."
          />
        }
        renderItem={({ item }) => (
          <FriendCheckRow
            user={item}
            checked={selected.has(item.username)}
            onToggle={() => toggle(item.username)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 200 }}
      />

      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Button
            title={selected.size === friends.length ? 'Clear all' : 'Select all'}
            variant="outline"
            onPress={selectAll}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Apply" onPress={apply} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  sep: { height: 1, backgroundColor: colors.border, marginLeft: 72 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
