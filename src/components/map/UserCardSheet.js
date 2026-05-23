import { useEffect, useRef } from 'react';
import {
  Animated,
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

  useEffect(() => {
    Animated.spring(slide, {
      toValue: user ? 1 : 0,
      useNativeDriver: true,
      damping: 16,
      stiffness: 180,
      mass: 0.7,
    }).start();
  }, [user, slide]);

  if (!user) return null;

  const interests = Array.isArray(user.interests) ? user.interests : [];

  return (
    <View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFillObject, styles.layer]}
    >
      <Pressable style={styles.scrim} onPress={onClose} />

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
                title={isFriend ? 'Friends' : 'Add friend'}
                variant={isFriend ? 'outline' : 'primary'}
                onPress={onFriend}
                loading={busy}
                leading={
                  <Ionicons
                    name={isFriend ? 'checkmark' : 'person-add'}
                    size={16}
                    color={isFriend ? colors.primary : '#fff'}
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

  return (
    <View style={styles.presenceCard}>
      <View style={styles.presenceTop}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text style={[styles.presenceTitle, { color: accent }]}>
          {isBusy ? presence.title : 'Free'}
        </Text>
      </View>
      <Text style={styles.presenceDetail}>
        {isBusy
          ? `${presence.remaining} left${presence.until ? ` · until ${presence.until}` : ''}${
              presence.location ? ` · ${presence.location}` : ''
            }`
          : presence.until
          ? `${presence.freeFor} free until ${presence.until} (${presence.nextLabel})`
          : presence.freeFor || 'all day'}
      </Text>
      {status ? <Text style={styles.statusLine}>“{status}”</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' },
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
