import { View, Text, StyleSheet } from 'react-native';
import Avatar from '../Avatar/Avatar';
import Button from '../Button';
import { colors, spacing, typography } from '../../theme';

/**
 * Single row used across the My Friends sub-screens.
 *
 *   variant: 'add' | 'cancel' | 'accept' | 'decline' | 'remove' | 'plain'
 *   primaryAction / secondaryAction: { label, onPress, variant }
 */
export default function FriendRow({ user, primaryAction, secondaryAction }) {
  return (
    <View style={styles.row}>
      <Avatar config={user?.avatar} size={44} mode="bust" />
      <View style={styles.middle}>
        <Text style={styles.name} numberOfLines={1}>
          {user?.name || user?.username}
        </Text>
        {user?.username ? (
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
  actions: { flexDirection: 'row', gap: spacing.sm },
});
