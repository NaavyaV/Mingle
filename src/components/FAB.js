import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../theme';

/**
 * Floating action button. Defaults to the bottom-right corner; pass
 * `position="top-right"` for screens that want the FAB in the header.
 */
export default function FAB({
  icon = 'add',
  onPress,
  color = colors.primary,
  iconColor = '#fff',
  size = 56,
  position = 'bottom-right',
  style,
  accessibilityLabel,
}) {
  const positions = {
    'bottom-right': { right: 20, bottom: 24 },
    'top-right': { right: 16, top: 12 },
    'bottom-left': { left: 20, bottom: 24 },
  };

  return (
    <View style={[styles.wrap, positions[position], style]} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [
          styles.btn,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Ionicons name={icon} size={size * 0.45} color={iconColor} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute' },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
});

export { radius };
