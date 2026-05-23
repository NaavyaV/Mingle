import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { formatDayLabel, formatTimeShort } from '../../utils/format';

/**
 * Pressable card that appears inside a DM thread when one user invites
 * another to an event. Tapping it jumps to the event detail screen.
 */
export default function EventInviteCard({ event, onPress, mine }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        mine ? styles.cardMine : styles.cardTheirs,
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={styles.headerRow}>
        <Ionicons name="calendar" size={16} color={mine ? '#fff' : colors.primary} />
        <Text style={[styles.tag, mine && styles.tagMine]}>EVENT INVITE</Text>
      </View>
      <Text style={[styles.title, mine && styles.textMine]} numberOfLines={2}>
        {event?.name || 'Event'}
      </Text>
      {event ? (
        <Text style={[styles.meta, mine && styles.metaMine]} numberOfLines={1}>
          {formatDayLabel(event.startAt)} • {formatTimeShort(event.startAt)}
          {event.location ? ` • ${event.location}` : ''}
        </Text>
      ) : null}
      <View style={styles.cta}>
        <Text style={[styles.ctaText, mine && styles.ctaMine]}>View event ›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: 4,
    minWidth: 220,
    ...shadow.soft,
  },
  cardMine: { backgroundColor: colors.primary },
  cardTheirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tag: { ...typography.small, color: colors.primary, fontWeight: '800', letterSpacing: 0.6 },
  tagMine: { color: '#fff' },
  title: { ...typography.h2, color: colors.text },
  textMine: { color: colors.textInverse },
  meta: { ...typography.caption, color: colors.textMuted },
  metaMine: { color: 'rgba(255,255,255,0.85)' },
  cta: { marginTop: spacing.xs },
  ctaText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  ctaMine: { color: '#fff' },
});
