import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../Avatar/Avatar';
import { colors, spacing, typography } from '../../theme';

/**
 * Row used in the Friends filter screen: avatar + name + a checkbox.
 */
export default function FriendCheckRow({ user, checked, onToggle }) {
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}
    >
      <Avatar config={user?.avatar} size={40} mode="bust" />
      <Text style={styles.name} numberOfLines={1}>
        {user?.name || user?.username}
      </Text>
      <View style={[styles.box, checked && styles.boxOn]}>
        {checked ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  name: { ...typography.body, color: colors.text, flex: 1 },
  box: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});
