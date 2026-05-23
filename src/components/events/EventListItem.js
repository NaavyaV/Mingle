import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../Card';
import AvatarStack from '../AvatarStack';
import { colors, spacing, typography } from '../../theme';
import { formatDayLabel, formatTimeShort, goingLabel } from '../../utils/format';

/**
 * Event card used on the Events log. `goingUsers` should be only the
 * friends-of-the-viewer (not randoms), already filtered by the caller.
 */
export default function EventListItem({ event, goingUsers = [], onPress }) {
  const names = goingUsers.map((u) => u?.name?.split(' ')[0] || u?.username).filter(Boolean);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {event.name}
          </Text>
          <Text style={styles.time}>{formatTimeShort(event.startAt)}</Text>
        </View>

        <Text style={styles.meta} numberOfLines={1}>
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />{' '}
          {formatDayLabel(event.startAt)}
          {event.location ? `  •  ${event.location}` : ''}
        </Text>

        {event.description ? (
          <Text style={styles.desc} numberOfLines={2}>
            {event.description}
          </Text>
        ) : null}

        <View style={styles.goingRow}>
          <AvatarStack users={goingUsers} max={3} size={26} />
          <Text style={styles.goingText} numberOfLines={1}>
            {goingLabel(names, 3)}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...typography.h2, color: colors.text, flex: 1, marginRight: spacing.sm },
  time: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  meta: { ...typography.caption, color: colors.textMuted },
  desc: { ...typography.body, color: colors.text, marginTop: 2 },
  goingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  goingText: { ...typography.caption, color: colors.textMuted, flex: 1 },
});
