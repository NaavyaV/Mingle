import { View, Text, Pressable, StyleSheet } from 'react-native';
import Avatar from '../Avatar/Avatar';
import { colors, spacing, typography } from '../../theme';
import { formatRelative } from '../../utils/format';

/**
 * Row in the Messages list. Shows the other person's avatar+name, the
 * last message preview (or "Event invite" tag), a timestamp, and an
 * unread dot if applicable.
 */
export default function ConversationRow({ otherUser, lastMessage, unread = 0, onPress }) {
  const isInvite = lastMessage?.kind === 'eventInvite';
  const preview = isInvite ? '📅 Event invite' : lastMessage?.body || '';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}
    >
      <Avatar config={otherUser?.avatar} size={48} mode="bust" />
      <View style={styles.middle}>
        <View style={styles.topLine}>
          <Text style={styles.name} numberOfLines={1}>
            {otherUser?.name || otherUser?.username || 'Unknown'}
          </Text>
          {lastMessage ? (
            <Text style={styles.time}>{formatRelative(lastMessage.createdAt)}</Text>
          ) : null}
        </View>
        <Text
          style={[styles.preview, unread > 0 && styles.previewUnread]}
          numberOfLines={1}
        >
          {preview || 'Say hi!'}
        </Text>
      </View>
      {unread > 0 ? <View style={styles.dot} /> : null}
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
  middle: { flex: 1, gap: 2 },
  topLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  name: { ...typography.body, color: colors.text, fontWeight: '700', flex: 1, marginRight: spacing.sm },
  time: { ...typography.small, color: colors.textMuted },
  preview: { ...typography.caption, color: colors.textMuted },
  previewUnread: { color: colors.text, fontWeight: '600' },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.coral,
    marginLeft: spacing.sm,
  },
});
