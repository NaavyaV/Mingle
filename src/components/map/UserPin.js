import { View, Text, Pressable, StyleSheet } from 'react-native';
import Avatar from '../Avatar/Avatar';
import { colors, radius, shadow, spacing, typography } from '../../theme';

/**
 * Map pin: a tiny full-body avatar with an optional status caption
 * floating above it. Designed to sit inside a react-native-maps Marker
 * so the pin stays the same pixel size regardless of zoom level.
 *
 * `isMe` highlights the pin with a coral ring under the feet.
 */
export default function UserPin({ user, status, isMe = false, onPress }) {
  const name = isMe ? 'You' : user?.name?.split(' ')[0] || user?.username;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.85 }]}
    >
      {status ? (
        <View style={styles.statusBubble}>
          <Text
            numberOfLines={4}
            ellipsizeMode="tail"
            style={styles.statusText}
          >
            {status}
          </Text>
        </View>
      ) : null}
      <View style={[styles.avatarWrap, isMe && styles.avatarWrapMe]}>
        <Avatar config={user?.avatar} size={48} mode="full" />
      </View>
      <View style={styles.nameTag}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: 110 },
  statusBubble: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
    marginBottom: 2,
    maxWidth: 110,
    ...shadow.soft,
  },
  statusText: {
    ...typography.small,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  avatarWrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  avatarWrapMe: {
    borderBottomWidth: 3,
    borderBottomColor: colors.coral,
    paddingBottom: 1,
  },
  nameTag: {
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    ...shadow.soft,
  },
  name: {
    ...typography.small,
    color: colors.text,
    fontWeight: '700',
    fontSize: 11,
  },
});
