import { Pressable, StyleSheet, View } from 'react-native';
import Avatar from './Avatar/Avatar';
import { colors, shadow } from '../theme';

/**
 * Circular pressable showing a user's bust-mode avatar headshot.
 * Used as the profile FAB on the map (and anywhere we want a personal
 * "tap me" entry point that feels distinctly like the user).
 */
export default function AvatarButton({
  config,
  onPress,
  size = 48,
  accessibilityLabel = 'Open profile',
  ringColor = colors.primary,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.btn,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: ringColor,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.clip, { width: size, height: size, borderRadius: size / 2 }]}>
        <Avatar config={config} size={size} mode="bust" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow.soft,
  },
  clip: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
