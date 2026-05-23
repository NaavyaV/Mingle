import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing, typography } from '../../theme';

/**
 * Floating "suggestion of the moment" card for the map screen.
 *
 * Designed to sit beside the 52px profile FAB in the upper-right of
 * the map, so the body text is intentionally compact (3-line cap) and
 * the chrome is reduced to just a small refresh affordance in the
 * top-right corner — no big "SUGGESTION" header label.
 *
 * `loading` swaps the refresh icon for a spinner while the AI tip is
 * being fetched, so the tap-to-refresh action is rate-limited
 * naturally and the user sees something is happening.
 */
export default function MapSuggestionTooltip({ tip, loading, onRefresh }) {
  if (!tip?.text && !loading) return null;

  return (
    <View style={styles.wrap}>
      {/* adjustsFontSizeToFit + a generous numberOfLines lets long
          suggestions shrink to fit the 52px row instead of getting
          truncated with a trailing ellipsis. */}
      <Text
        style={styles.body}
        numberOfLines={3}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
        ellipsizeMode="clip"
      >
        {tip?.text || 'Thinking up something fun…'}
      </Text>
      <Pressable
        onPress={loading ? undefined : onRefresh}
        hitSlop={10}
        disabled={loading}
        style={({ pressed }) => [
          styles.refresh,
          pressed && !loading && { opacity: 0.6 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="New suggestion"
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Ionicons name="refresh" size={13} color={colors.primary} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingLeft: spacing.md,
    // Reserve room for the floating refresh button on the right.
    paddingRight: 28,
    // Fixed height matches the 52px profile FAB so the two visually
    // align as a single row at the top of the map.
    height: 52,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  body: {
    ...typography.small,
    color: colors.text,
    fontWeight: '600',
    fontSize: 11.5,
    lineHeight: 14,
  },
  refresh: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
});
