import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AvatarButton from '../../components/AvatarButton';
import UserPin from '../../components/map/UserPin';
import UserCardSheet from '../../components/map/UserCardSheet';

import { api } from '../../api/client';
import { useUser } from '../../context/UserContext';
import { inferPresence, getPresenceDetail } from '../../utils/presence';
import { DEFAULT_CAMPUS, deterministicLocation } from '../../utils/geo';
import { colors, spacing } from '../../theme';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState([]); // usernames
  const [loading, setLoading] = useState(true);
  const [selectedUsername, setSelectedUsername] = useState(null);
  const [friendBusy, setFriendBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const tasks = [api.listUsers()];
      if (user?.username) tasks.push(api.getFriends(user.username));
      const [list, rel] = await Promise.all(tasks);
      setUsers(list || []);
      if (rel) setFriends(rel.friends || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [user?.username]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);

  const pins = useMemo(() => {
    const meUsername = user?.username;
    const myCoord = meUsername
      ? deterministicLocation(meUsername, DEFAULT_CAMPUS, 0.0005)
      : DEFAULT_CAMPUS;

    return (users || []).map((u) => {
      const isMe = u.username === meUsername;
      const coord = isMe ? myCoord : deterministicLocation(u.username);
      return {
        key: u.username,
        coord,
        user: u,
        isMe,
        status: inferPresence(u),
      };
    });
  }, [users, user?.username]);

  const initialRegion = useMemo(
    () => ({
      ...(user
        ? deterministicLocation(user.username, DEFAULT_CAMPUS, 0.0005)
        : DEFAULT_CAMPUS),
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    }),
    [user?.username]
  );

  const selected = useMemo(
    () => users.find((u) => u.username === selectedUsername) || null,
    [users, selectedUsername]
  );

  const selectedIsMe = selected?.username === user?.username;
  const selectedIsFriend = selected ? friends.includes(selected.username) : false;
  // Schedule shown to viewer when public or when we're friends (or it's me).
  const canSeeSchedule =
    selected &&
    (selectedIsMe ||
      selected.scheduleVisibility === 'public' ||
      (selected.scheduleVisibility !== 'private' && selectedIsFriend));
  const presence = canSeeSchedule ? getPresenceDetail(selected) : null;

  const handleFriend = async () => {
    if (!selected || selectedIsMe || friendBusy) return;
    try {
      setFriendBusy(true);
      if (selectedIsFriend) {
        await api.removeFriend(user.username, selected.username);
      } else {
        await api.requestFriend(user.username, selected.username);
      }
      const rel = await api.getFriends(user.username);
      setFriends(rel?.friends || []);
    } catch {
      /* ignore */
    } finally {
      setFriendBusy(false);
    }
  };

  const handleMessage = () => {
    if (!selected || selectedIsMe) return;
    setSelectedUsername(null);
    navigation.getParent()?.navigate('MessagesTab', {
      screen: 'DM',
      params: { other: selected.username },
    });
  };

  return (
    <View style={styles.wrap}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsCompass={false}
        showsPointsOfInterest
        showsBuildings
        loadingEnabled
        onPress={() => setSelectedUsername(null)}
      >
        {pins.map((p) => (
          <Marker
            key={p.key}
            coordinate={p.coord}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
            onPress={() => setSelectedUsername(p.key)}
          >
            <UserPin user={p.user} status={p.status} isMe={p.isMe} />
          </Marker>
        ))}
      </MapView>

      {loading ? (
        <View style={[styles.loader, { top: insets.top + 12 }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}

      <View style={[styles.profileBtn, { top: insets.top + 8 }]}>
        <AvatarButton
          config={user?.avatar}
          size={52}
          onPress={() => navigation.navigate('Profile')}
        />
      </View>

      <UserCardSheet
        user={selected}
        presence={presence}
        isFriend={selectedIsFriend}
        isMe={selectedIsMe}
        busy={friendBusy}
        onClose={() => setSelectedUsername(null)}
        onFriend={handleFriend}
        onMessage={handleMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  profileBtn: {
    position: 'absolute',
    right: spacing.lg,
  },
  loader: {
    position: 'absolute',
    alignSelf: 'center',
    padding: 8,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
});
