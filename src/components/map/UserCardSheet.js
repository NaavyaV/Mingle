import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Avatar from '../Avatar/Avatar';
import Button from '../Button';
import { colors, radius, shadow, spacing, typography } from '../../theme';

/**
 * Bottom-aligned profile card that slides up when the user taps a pin
 * on the map. Designed to fit above the tab bar without covering the
 * map entirely.
 *
 * Props:
 *   user:         the tapped user (or null to keep dismissed)
 *   presence:     output of getPresenceDetail(user) — may be null if not
 *                 visible to the viewer
 *   isFriend:     boolean, true if the viewer is already friends
 *   isMe:         true if the tapped user is the viewer themselves
 *   onClose:      dismiss
 *   onFriend:     called when the viewer taps Add friend / Friends
 *   onMessage:    optional, opens a DM
 */
export default function UserCardSheet({
  user,
  presence,
  isFriend,
  isMe,
  onClose,
  onFriend,
  onMessage,
  busy,
}) {
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current;
  const activeAnim = useRef(null);

  // Open / close animation. We use timing (not spring) so:
  //   • the sheet never overshoots its rest position (no flying above)
  //   • every open starts from a clean slide=0 baseline, so the second,
  //     third, ... open animations look identical to the first.
  //
  // Switching directly from user A → user B (without closing first) is
  // a fresh open animation too — slide is forced to 0 then animates
  // back to 1, giving a clear visual "pop" on the new content.
  useEffect(() => {
    if (activeAnim.current) {
      activeAnim.current.stop();
      activeAnim.current = null;
    }

    if (!user) {
      const anim = Animated.timing(slide, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      });
      activeAnim.current = anim;
      anim.start(() => {
        activeAnim.current = null;
      });
      return;
    }

    slide.setValue(0);
    const anim = Animated.timing(slide, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    activeAnim.current = anim;
    anim.start(() => {
      activeAnim.current = null;
    });
  }, [user?.username, slide]);

  if (!user) return null;

  const interests = Array.isArray(user.interests) ? user.interests : [];

  return (
    <View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFillObject, styles.layer]}
    >
      {/* No scrim: we want touches outside the sheet to reach the map
          underneath so tapping another pin (or empty map → onPress)
          can switch / dismiss the sheet. */}

      <Animated.View
        style={[
          styles.sheet,
          {
            paddingBottom: insets.bottom + spacing.md,
            transform: [
              {
                translateY: slide.interpolate({
                  inputRange: [0, 1],
                  outputRange: [400, 0],
                  extrapolate: 'clamp',
                }),
              },
            ],
            opacity: slide,
          },
        ]}
      >
        <View style={styles.grabber} />

        <View style={styles.header}>
          <Avatar config={user.avatar} size={72} mode="bust" ring />
          <View style={styles.headerCopy}>
            <Text style={styles.name} numberOfLines={1}>
              {user.name || user.username}
            </Text>
            <Text style={styles.handle} numberOfLines={1}>
              @{user.username}
            </Text>
            {user.school ? (
              <Text style={styles.meta} numberOfLines={1}>
                <Ionicons name="school-outline" size={12} color={colors.textMuted} />{' '}
                {user.school}
              </Text>
            ) : null}
          </View>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </Pressable>
        </View>

        <PresenceBlock presence={presence} status={user.status} />

        {interests.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Interests</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {interests.map((tag) => (
                <View key={tag} style={styles.chip}>
                  <Text style={styles.chipText}>{tag}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {!isMe ? (
          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <Button
                title={isFriend ? 'Unfriend' : 'Add friend'}
                variant={isFriend ? 'outline' : 'primary'}
                onPress={onFriend}
                loading={busy}
                leading={
                  <Ionicons
                    name={isFriend ? 'person-remove' : 'person-add'}
                    size={16}
                    color={isFriend ? colors.danger : '#fff'}
                  />
                }
              />
            </View>
            {onMessage ? (
              <View style={{ flex: 1 }}>
                <Button
                  title="Message"
                  variant="outline"
                  onPress={onMessage}
                  leading={
                    <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
                  }
                />
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <Button title="That's you" variant="ghost" onPress={onClose} />
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

function PresenceBlock({ presence, status }) {
  if (!presence) {
    return (
      <View style={styles.presence}>
        <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
        <Text style={styles.presenceMuted}>Schedule hidden — add as friend to see what they're up to.</Text>
      </View>
    );
  }

  const isBusy = presence.kind === 'busy';
  const accent = isBusy ? colors.coral : colors.success;

  // Headline reads "Busy for 35m" / "Free for 2h 15m" / "Free".
  const headline = isBusy
    ? `Busy for ${presence.remaining}`
    : presence.remaining
    ? `Free for ${presence.remaining}`
    : 'Free';

  return (
    <View style={styles.presenceCard}>
      <View style={styles.presenceTop}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text style={[styles.presenceTitle, { color: accent }]}>{headline}</Text>
      </View>
      {isBusy && (presence.title || presence.location) ? (
        <Text style={styles.presenceDetail}>
          {presence.title}
          {presence.location ? ` · ${presence.location}` : ''}
        </Text>
      ) : null}
      {!isBusy && presence.nextLabel ? (
        <Text style={styles.presenceDetail}>then {presence.nextLabel}</Text>
      ) : null}
      {status ? <Text style={styles.statusLine}>“{status}”</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // zIndex + elevation make sure the sheet renders above the native
  // MapView surface (on iOS the map can otherwise hover over RN siblings).
  layer: { justifyContent: 'flex-end', zIndex: 50, elevation: 50 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.md,
    ...shadow.card,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerCopy: { flex: 1, gap: 2 },
  name: { ...typography.h2, color: colors.text },
  handle: { ...typography.caption, color: colors.textMuted },
  meta: { ...typography.small, color: colors.textMuted },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presenceCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
  },
  presenceTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  presenceTitle: { ...typography.body, fontWeight: '800' },
  presenceDetail: { ...typography.caption, color: colors.text },
  statusLine: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  presence: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
  },
  presenceMuted: { ...typography.caption, color: colors.textMuted, flex: 1 },
  section: { gap: spacing.xs },
  sectionLabel: {
    ...typography.small,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  chipRow: { gap: 6, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primary + '15',
  },
  chipText: { ...typography.small, color: colors.primary, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
