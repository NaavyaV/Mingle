import { View, Text, StyleSheet } from 'react-native';
import AvatarStack from '../AvatarStack';
import { colors, spacing, typography } from '../../theme';
import { goingLabel } from '../../utils/format';

/**
 * Larger version of the avatars+names row, used on the event detail screen.
 */
export default function GoingRow({ users = [], size = 36, label = 'going' }) {
  const names = users.map((u) => u?.name?.split(' ')[0] || u?.username).filter(Boolean);
  return (
    <View style={styles.row}>
      <AvatarStack users={users} max={3} size={size} />
      <Text style={styles.text} numberOfLines={1}>
        {users.length === 0 ? `No one ${label} yet` : goingLabel(names, 3)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  text: { ...typography.body, color: colors.text, flex: 1 },
});
