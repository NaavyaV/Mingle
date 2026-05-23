import { View, Text, Pressable, StyleSheet } from 'react-native';
import Avatar from '../Avatar/Avatar';
import { colors, radius, shadow, spacing, typography } from '../../theme';

/**
 * Map pin: a tiny full-body avatar with an optional status caption
 * floating above it. Designed to sit inside a react-native-maps Marker
 * so the pin stays the same pixel size regardless of zoom level.
 *
 * On Apple Maps the surrounding <Marker> doesn't always forward taps
 * to its `onPress` handler when it contains a custom view, so we put
 * a Pressable here and fire `onPress` from React Native directly. The
 * caller should pass the same handler it would have given Marker.
 */
export default function UserPin({
  user,
  status,
  isMe = false,
  onPress,
  showStatus = true,
  showName = true,
}) {
  const name = isMe ? 'You' : user?.name?.split(' ')[0] || user?.username;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.85 }]}
    >
      {showStatus && status ? (
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
      {/* The viewer's own pin gets a coral ring + slightly larger
          avatar so it pops out of dense clusters. */}
      <View style={[styles.avatarWrap, isMe && styles.avatarWrapMe]}>
        <Avatar config={user?.avatar} size={isMe ? 56 : 48} mode="full" />
      </View>
      {showName ? (
        <View style={[styles.nameTag, isMe && styles.nameTagMe]}>
          <Text
            style={[styles.name, isMe && styles.nameMe]}
            numberOfLines={1}
          >
            {name}
          </Text>
        </View>
      ) : null}
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
    maxWidth: 130,
    alignSelf: 'center',
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
    padding: 3,
    borderRadius: 36,
    backgroundColor: colors.coral + '22',
    borderWidth: 2,
    borderColor: colors.coral,
  },
  nameTag: {
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    ...shadow.soft,
  },
  nameTagMe: {
    backgroundColor: colors.coral,
    paddingHorizontal: 8,
  },
  name: {
    ...typography.small,
    color: colors.text,
    fontWeight: '700',
    fontSize: 11,
  },
  nameMe: { color: '#fff', fontSize: 12 },
});
