import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

const variantStyle = {
  primary: { bg: colors.primary, fg: colors.textInverse, border: 'transparent' },
  gold: { bg: colors.gold, fg: colors.text, border: 'transparent' },
  coral: { bg: colors.coral, fg: colors.textInverse, border: 'transparent' },
  outline: { bg: 'transparent', fg: colors.primary, border: colors.primary },
  ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leading = null,
  trailing = null,
  fullWidth = true,
  style,
}) {
  const v = variantStyle[variant] || variantStyle.primary;
  const heights = { sm: 40, md: 52, lg: 60 };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          height: heights[size],
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
          paddingHorizontal: spacing.md,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.row}>
          {leading ? <View style={styles.icon}>{leading}</View> : null}
          <Text
            style={[styles.text, { color: v.fg }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            allowFontScaling={false}
          >
            {title}
          </Text>
          {trailing ? <View style={styles.icon}>{trailing}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  text: { ...typography.body, fontWeight: '700' },
  icon: { alignItems: 'center', justifyContent: 'center' },
});
