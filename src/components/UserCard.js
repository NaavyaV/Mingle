import { View, Text, StyleSheet } from 'react-native';
import Card from './Card';
import Avatar from './Avatar/Avatar';
import StatusPill from './StatusPill';
import ScheduleTimeline from './ScheduleTimeline';
import { colors, spacing, typography } from '../theme';

const VISIBILITY_BADGE = {
  private: { label: 'Private', color: colors.textMuted },
  friends: { label: 'Friends only', color: colors.primary },
  public: { label: 'Public', color: colors.success },
};

export default function UserCard({ user, date, highlight = false }) {
  const visibility = VISIBILITY_BADGE[user.scheduleVisibility] || VISIBILITY_BADGE.friends;
  const canSeeSchedule = user.scheduleVisibility !== 'private' || highlight;

  return (
    <Card style={highlight ? styles.highlight : null}>
      <View style={styles.header}>
        <Avatar config={user.avatar} size={64} mode="bust" ring />
        <View style={styles.headerCopy}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {user.name}
            </Text>
            {highlight ? <Text style={styles.youBadge}>You</Text> : null}
          </View>
          <Text style={styles.handle}>@{user.username}</Text>
          {user.school ? <Text style={styles.meta}>{user.school}</Text> : null}
          <View style={styles.pillRow}>
            {user.status ? <StatusPill label={user.status} /> : null}
            <View
              style={[
                styles.visibilityChip,
                { borderColor: visibility.color },
              ]}
            >
              <Text style={[styles.visibilityText, { color: visibility.color }]}>
                {visibility.label}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.scheduleSection}>
        <Text style={styles.sectionLabel}>Today</Text>
        {canSeeSchedule ? (
          <ScheduleTimeline schedule={user.schedule} date={date} />
        ) : (
          <Text style={styles.privateNote}>Schedule is private.</Text>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  highlight: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  header: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  headerCopy: { flex: 1, gap: 4, paddingTop: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { ...typography.h2, color: colors.text, flexShrink: 1 },
  youBadge: {
    ...typography.small,
    color: colors.textInverse,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
    fontWeight: '700',
  },
  handle: { ...typography.caption, color: colors.textMuted },
  meta: { ...typography.small, color: colors.textMuted },
  pillRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.xs },
  visibilityChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  visibilityText: { ...typography.small, fontWeight: '700' },
  scheduleSection: { marginTop: spacing.lg, gap: spacing.sm },
  sectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  privateNote: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
