import { View, StyleSheet } from 'react-native';
import Avatar from './Avatar/Avatar';
import { colors } from '../theme';

/**
 * Renders 1-3 overlapping bust avatars to indicate "these people are
 * attached to this thing". Pass `users` as the underlying user objects
 * (only `avatar` is needed). `max` caps how many to render; the caller
 * is responsible for the "+N more" label since that pairs with a list
 * of names.
 */
export default function AvatarStack({ users = [], max = 3, size = 28 }) {
  const visible = users.slice(0, max);
  return (
    <View style={styles.row}>
      {visible.map((u, i) => (
        <View
          key={u?.username || u?._id || i}
          style={[
            styles.bubble,
            {
              width: size + 4,
              height: size + 4,
              borderRadius: (size + 4) / 2,
              marginLeft: i === 0 ? 0 : -size * 0.4,
              zIndex: visible.length - i,
            },
          ]}
        >
          <Avatar config={u?.avatar} size={size} mode="bust" />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  bubble: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.surface,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
