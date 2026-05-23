import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AvatarButton from '../../components/AvatarButton';
import UserPin from '../../components/map/UserPin';
import UserCardSheet from '../../components/map/UserCardSheet';
import MapSuggestionTooltip from '../../components/map/MapSuggestionTooltip';

import { api } from '../../api/client';
import { useUser } from '../../context/UserContext';
import { inferPresence, getPresenceDetail } from '../../utils/presence';
import { DEFAULT_CAMPUS, deterministicLocation } from '../../utils/geo';
import { pickMapSuggestion } from '../../utils/suggestions';
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
  // Imperative handle for the MapView so the "find me" FAB can animate
  // the camera back to the viewer's pin.
  const mapRef = useRef(null);
  // Bumps every minute so memoized presence strings recompute.
  const [nowTick, setNowTick] = useState(0);
  // Tracks the visible map region so we can cluster bubbles. We only
  // care about the deltas (zoom level), so we keep this minimal to
  // avoid spamming re-renders on every pan.
  const [region, setRegion] = useState(null);
  // Seed for the suggestion tooltip. Initialized once per HomeScreen
  // mount ("once per app load" in practice, since the map tab stays
  // mounted), and bumped manually by the refresh button.
  const [tipSeed, setTipSeed] = useState(() => Math.floor(Math.random() * 1e6));
  // The currently displayed suggestion. Populated asynchronously
  // (Gemini call) or via the local fallback if the server is down
  // or the AI request fails. `loading` toggles the tooltip skeleton.
  const [tip, setTip] = useState(null);
  const [tipLoading, setTipLoading] = useState(false);

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

    const base = (users || []).map((u) => {
      const isMe = u.username === meUsername;
      // Prefer a fixed homeLocation (set by demo seed) over the
      // deterministic scatter so personas land on real buildings.
      const fixed = u?.homeLocation;
      const coord = isMe
        ? myCoord
        : fixed && typeof fixed.latitude === 'number' && typeof fixed.longitude === 'number'
        ? { latitude: fixed.latitude, longitude: fixed.longitude }
        : deterministicLocation(u.username);
      return {
        key: u.username,
        coord,
        user: u,
        isMe,
        status: inferPresence(u),
      };
    });

    // Bubble + name-tag clustering. With 50+ pins on screen at once
    // both the status bubbles and the name tags overlap into an
    // unreadable blob. We bucket pins into two independent grids:
    //   • a coarse grid for status bubbles (one per ~viewport/5)
    //   • a finer  grid for name tags     (one per ~viewport/10)
    // so name tags appear earlier than status bubbles as you zoom in.
    // Within each cell, the viewer's own pin always wins; then friends,
    // then others (alphabetical username tiebreak for stability).
    //
    // Fall back to the same delta we use for initialRegion below
    // (0.012) until the map reports its first region.
    const dLat = region?.latitudeDelta || 0.012;
    const dLng = region?.longitudeDelta || 0.012;
    const friendSet = new Set(friends || []);
    const score = (p) => (p.isMe ? 2 : friendSet.has(p.key) ? 1 : 0);

    const buildWinners = (gridN) => {
      const cellLat = dLat / gridN;
      const cellLng = dLng / gridN;
      const winners = new Map();
      const cellOf = (p) =>
        `${Math.floor(p.coord.latitude / cellLat)}:${Math.floor(p.coord.longitude / cellLng)}`;
      for (const p of base) {
        const k = cellOf(p);
        const prev = winners.get(k);
        if (
          !prev ||
          score(p) > score(prev) ||
          (score(p) === score(prev) && p.key < prev.key)
        ) {
          winners.set(k, p);
        }
      }
      return (p) => winners.get(cellOf(p)) === p;
    };

    const isBubbleWinner = buildWinners(5);
    const isNameWinner = buildWinners(10);

    return base.map((p) => ({
      ...p,
      // The viewer's own pin always shows both label and bubble so
      // they can always spot themselves in the cluster.
      showStatus: p.isMe || isBubbleWinner(p),
      showName: p.isMe || isNameWinner(p),
    }));
    // nowTick included so the per-minute status text updates without
    // needing the server payload to change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, user?.username, nowTick, region, friends]);

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

  // Compute the rules-based local suggestion. Used as the safety net
  // when Gemini is unreachable / returns an error, and as the data
  // the AI prompt indirectly depends on for "freshness" (changing
  // `users`/`friends` invalidates the cached AI tip too).
  const localTip = useMemo(() => {
    if (!user?.username) return null;
    const friendSet = new Set(friends || []);
    const friendObjs = users.filter((u) => friendSet.has(u.username));
    const myInterests = new Set(
      (user.interests || []).map((s) => String(s).toLowerCase())
    );
    const recommendedObjs =
      myInterests.size === 0
        ? []
        : users.filter(
            (u) =>
              u.username !== user.username &&
              !friendSet.has(u.username) &&
              (u.interests || []).some((i) =>
                myInterests.has(String(i).toLowerCase())
              )
          );
    return pickMapSuggestion({
      me: user,
      friends: friendObjs,
      recommended: recommendedObjs,
      seed: tipSeed,
      now: new Date(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, users, friends, tipSeed, nowTick]);

  // AI-powered tip. We fire one request per (username, tipSeed) — so
  // once on app load, and again every time the user taps refresh.
  // The request is racey-cancellation-safe: if `tipSeed` bumps mid-
  // flight, the stale resolver just no-ops because `cancelled` flips.
  useEffect(() => {
    if (!user?.username) return undefined;
    let cancelled = false;
    setTipLoading(true);
    api
      .getAiSuggestion(user.username, tipSeed)
      .then((res) => {
        if (cancelled) return;
        if (res?.text) {
          const tokens = res?.meta?.tokens;
          console.log(
            `[suggestions] tip from ${res.model || 'gemini'}` +
              (tokens
                ? ` (in/out=${tokens.prompt}/${tokens.output})`
                : '')
          );
          setTip({ text: res.text, source: res.source || 'gemini' });
        } else {
          throw new Error('empty AI response');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        // Server already logged the underlying error in its terminal
        // ("[suggestions/map] gemini call failed for …"). Log a brief
        // breadcrumb here too so the dev catches it in Metro logs.
        console.log(
          '[suggestions] AI tip unavailable, falling back to local:',
          err?.message || err
        );
        setTip(localTip);
      })
      .finally(() => {
        if (!cancelled) setTipLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // We intentionally do NOT depend on `localTip` so a friends-list
    // poll mid-flight doesn't trigger a new Gemini call. The fallback
    // closure captures the latest localTip via setState when needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.username, tipSeed]);

  // While we wait for the very first AI response, show the local tip
  // so the tooltip isn't empty. Once `tip` is set, we keep showing it
  // until the next refresh (loading spinner overlays via tipLoading).
  const displayTip = tip || localTip;

  // Find the viewer's own pin and decide whether it's currently in
  // view. If not, the "find me" FAB is shown bottom-left.
  const myPin = pins.find((p) => p.isMe) || null;
  const meOffScreen = useMemo(() => {
    if (!myPin || !region) return false;
    const halfLat = region.latitudeDelta / 2;
    const halfLng = region.longitudeDelta / 2;
    const { latitude, longitude } = myPin.coord;
    return (
      latitude < region.latitude - halfLat ||
      latitude > region.latitude + halfLat ||
      longitude < region.longitude - halfLng ||
      longitude > region.longitude + halfLng
    );
  }, [myPin, region]);

  const flyToMe = useCallback(() => {
    if (!myPin || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: myPin.coord.latitude,
        longitude: myPin.coord.longitude,
        latitudeDelta: 0.006,
        longitudeDelta: 0.006,
      },
      450
    );
  }, [myPin]);

  const handleMessage = () => {
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

  return (
    <View style={styles.wrap}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsCompass={false}
        showsPointsOfInterest
        showsBuildings
        loadingEnabled
        onPress={handleMapPress}
        onRegionChangeComplete={setRegion}
      >
        {pins.map((p) => {
          const open = () => openPin(p.key);
          // Including showStatus / showName in the key forces the
          // native marker to re-rasterize when label visibility flips
          // (otherwise react-native-maps caches the original render).
          return (
            <Marker
              key={`${p.key}-${p.showStatus ? 'b' : 'n'}-${p.showName ? 'l' : 'h'}`}
              coordinate={p.coord}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={false}
              onPress={open}
            >
              <UserPin
                user={p.user}
                status={p.status}
                isMe={p.isMe}
                showStatus={p.showStatus}
                showName={p.showName}
                onPress={open}
              />
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

      {/* Suggestion tooltip. Fills the empty space to the left of
          the profile FAB and extends downward — one AI-generated tip
          per app load, refresh icon kicks off a new Gemini call. */}
      {displayTip || tipLoading ? (
        <View
          pointerEvents="box-none"
          style={[styles.tipSlot, { top: insets.top + 8 }]}
        >
          <MapSuggestionTooltip
            tip={displayTip}
            loading={tipLoading}
            onRefresh={() => setTipSeed((s) => s + 1)}
          />
        </View>
      ) : null}

      {/* "Find me" FAB. Appears bottom-left whenever the viewer's
          own avatar has been panned off-screen; recenters the map
          on their pin. */}
      {meOffScreen ? (
        <Pressable
          onPress={flyToMe}
          style={({ pressed }) => [
            styles.findMeBtn,
            { bottom: insets.bottom + 16 },
            pressed && { opacity: 0.85 },
          ]}
          hitSlop={8}
        >
          <Ionicons name="navigate" size={18} color="#fff" />
        </Pressable>
      ) : null}

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
  tipSlot: {
    position: 'absolute',
    left: spacing.lg,
    // Leave room for the 52px profile FAB at right: spacing.lg with
    // an 8px gutter between the two.
    right: spacing.lg + 52 + 8,
    zIndex: 30,
    elevation: 30,
  },
  loader: {
    position: 'absolute',
    alignSelf: 'center',
    padding: 8,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  findMeBtn: {
    position: 'absolute',
    left: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
    elevation: 40,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
