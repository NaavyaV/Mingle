import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

/**
 * Small icon-only round button. Used in headers and toolbars.
 *
 *   variant: 'solid' | 'ghost' | 'surface'
 */
export default function IconButton({
  icon,
  onPress,
  variant = 'surface',
  size = 40,
  color,
  iconSize,
  accessibilityLabel,
  style,
}) {
  const palette = {
    solid: { bg: colors.primary, fg: '#fff' },
    ghost: { bg: 'transparent', fg: colors.text },
    surface: { bg: colors.surface, fg: colors.text },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.btn,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.bg,
          opacity: pressed ? 0.7 : 1,
          borderWidth: variant === 'surface' ? 1 : 0,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={iconSize || size * 0.48} color={color || palette.fg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { alignItems: 'center', justifyContent: 'center' },
});

export { radius };
