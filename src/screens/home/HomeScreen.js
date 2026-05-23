import { useCallback, useMemo, useRef, useState } from 'react';
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

// How often we re-fetch the user list while the map is foregrounded.
// Cheap polling gives the demo a "live" feel without standing up
// websockets — bumps friend changes, status edits, and new sign-ups
// into the map within seconds.
const POLL_INTERVAL_MS = 10000;
// How often we recompute presence text (which depends on "now").
const TICK_INTERVAL_MS = 60000;

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState([]); // usernames
  const [loading, setLoading] = useState(true);
  const [selectedUsername, setSelectedUsername] = useState(null);
  const [friendBusy, setFriendBusy] = useState(false);
  // Tracks the most recent marker tap so MapView.onPress can ignore the
  // ghost "background" tap that iOS Apple Maps sometimes fires right
  // after a marker selection — that ghost was instantly closing the
  // sheet, making pins feel like they "randomly" worked.
  const lastMarkerTapAt = useRef(0);
  // Bumps every minute so memoized presence strings recompute.
  const [nowTick, setNowTick] = useState(0);

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

  // Foreground polling: fetch immediately on focus, then every POLL_INTERVAL_MS
  // until the screen blurs. Clearing the interval on blur prevents wasted
  // requests when the user is on another tab.
  useFocusEffect(
    useCallback(() => {
      load();
      const id = setInterval(load, POLL_INTERVAL_MS);
      return () => clearInterval(id);
    }, [load])
  );

  // Independent minute-by-minute tick so presence text ("45m left",
  // "free until 3pm") stays current even between server polls.
  useFocusEffect(
    useCallback(() => {
      const id = setInterval(() => setNowTick((t) => t + 1), TICK_INTERVAL_MS);
      return () => clearInterval(id);
    }, [])
  );

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
    // nowTick included so the per-minute status text updates without
    // needing the server payload to change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, user?.username, nowTick]);

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
  // Re-evaluate presence whenever `nowTick` changes so the sheet copy
  // stays in sync with the actual clock.
  const presence = useMemo(
    () => (canSeeSchedule ? getPresenceDetail(selected) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, canSeeSchedule, nowTick]
  );

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

  const openPin = useCallback((username) => {
    lastMarkerTapAt.current = Date.now();
    setSelectedUsername(username);
  }, []);

  const handleMapPress = useCallback(() => {
    // Swallow the synthetic background press that fires alongside a
    // marker tap on iOS (always < ~350ms after the marker event).
    if (Date.now() - lastMarkerTapAt.current < 400) return;
    setSelectedUsername(null);
  }, []);

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
        onPress={handleMapPress}
      >
        {pins.map((p) => {
          const open = () => openPin(p.key);
          return (
            <Marker
              key={p.key}
              coordinate={p.coord}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={false}
              onPress={open}
            >
              <UserPin user={p.user} status={p.status} isMe={p.isMe} onPress={open} />
            </Marker>
          );
        })}
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
    zIndex: 40,
    elevation: 40,
  },
  loader: {
    position: 'absolute',
    alignSelf: 'center',
    padding: 8,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
});
