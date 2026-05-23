import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Avatar from '../components/Avatar/Avatar';
import UserCard from '../components/UserCard';
import DayPicker from '../components/DayPicker';
import AccountMenu from '../components/AccountMenu';
import { useUser } from '../context/UserContext';
import { api } from '../api/client';
import { colors, spacing, typography } from '../theme';

export default function HomeScreen() {
  const { user, signOut, deleteAccount } = useUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [date, setDate] = useState(new Date());

  const load = useCallback(async () => {
    try {
      setError('');
      const all = await api.listUsers();
      setUsers(all);
    } catch (e) {
      setError(e.message || 'Could not load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const orderedUsers = useMemo(() => {
    if (!user) return users;
    const self = users.find((u) => u._id === user._id);
    const others = users.filter((u) => u._id !== user._id);
    return self ? [self, ...others] : users;
  }, [users, user]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.brand}>Mingle</Text>
          <Text style={styles.headerSub}>
            {user?.school ? user.school : 'Around campus'}
          </Text>
        </View>
        {user ? (
          <AccountMenu onSignOut={signOut} onDelete={deleteAccount}>
            <Avatar config={user.avatar} size={44} mode="bust" ring />
          </AccountMenu>
        ) : null}
      </View>

      <DayPicker value={date} onChange={setDate} />

      <FlatList
        data={orderedUsers}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
        renderItem={({ item }) => (
          <UserCard user={item} date={date} highlight={item._id === user?._id} />
        )}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {error ? "Couldn't load anyone yet" : 'Nobody here yet'}
              </Text>
              <Text style={styles.emptyBody}>
                {error ||
                  'When friends create their account, you’ll see their schedules here.'}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerLeft: { gap: 2 },
  brand: { ...typography.display, fontSize: 28, color: colors.text },
  headerSub: { ...typography.caption, color: colors.textMuted },
  list: { padding: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxxl },
  empty: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: { ...typography.h2, color: colors.text },
  emptyBody: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});
