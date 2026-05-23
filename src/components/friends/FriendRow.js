import { View, Text, StyleSheet, Pressable } from 'react-native';
import Avatar from '../Avatar/Avatar';
import Button from '../Button';
import { colors, spacing, typography } from '../../theme';

/**
 * Single row used across the My Friends sub-screens.
 *
 *   primaryAction / secondaryAction: { label, onPress, variant }
 *   onPress: optional, makes the row tappable to open the profile card.
 *   subtitle: optional string shown below the name in place of the @handle
 *             (e.g. "3 shared: Coffee, Gym, Lo-fi" on the recommended tab).
 */
export default function FriendRow({
  user,
  primaryAction,
  secondaryAction,
  onPress,
  subtitle,
}) {
  const Body = (
    <View style={styles.row}>
      <Avatar config={user?.avatar} size={44} mode="bust" />
      <View style={styles.middle}>
        <Text style={styles.name} numberOfLines={1}>
          {user?.name || user?.username}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : user?.username ? (
          <Text style={styles.handle} numberOfLines={1}>
            @{user.username}
          </Text>
        ) : null}
      </View>
      <View style={styles.actions}>
        {secondaryAction ? (
          <Button
            title={secondaryAction.label}
            onPress={secondaryAction.onPress}
            variant={secondaryAction.variant || 'outline'}
            size="sm"
            fullWidth={false}
          />
        ) : null}
        {primaryAction ? (
          <Button
            title={primaryAction.label}
            onPress={primaryAction.onPress}
            variant={primaryAction.variant || 'primary'}
            size="sm"
            fullWidth={false}
          />
        ) : null}
      </View>
    </View>
  );

  if (!onPress) return Body;
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: colors.surfaceMuted }}
      style={({ pressed }) => [pressed && { opacity: 0.85 }]}
    >
      {Body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  middle: { flex: 1 },
  name: { ...typography.body, color: colors.text, fontWeight: '700' },
  handle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  subtitle: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
