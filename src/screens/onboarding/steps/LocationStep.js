import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Location from 'expo-location';
import Button from '../../../components/Button';
import Card from '../../../components/Card';
import { colors, radius, spacing, typography } from '../../../theme';

const STATUS_LABEL = {
  pending: 'Decide later',
  granted: 'Granted',
  denied: 'Skipped',
};

export default function LocationStep({ value, setValue }) {
  const [busy, setBusy] = useState(false);
  const status = value.locationStatus || 'pending';

  const handleEnable = async () => {
    setBusy(true);
    try {
      const { status: result } = await Location.requestForegroundPermissionsAsync();
      setValue({ locationStatus: result === 'granted' ? 'granted' : 'denied' });
    } catch (e) {
      setValue({ locationStatus: 'denied' });
    } finally {
      setBusy(false);
    }
  };

  const handleSkip = () => setValue({ locationStatus: 'denied' });

  return (
    <View style={styles.wrap}>
      <Card>
        <View style={styles.iconBubble}>
          <Text style={styles.iconText}>📍</Text>
        </View>
        <Text style={styles.cardTitle}>Share where you are</Text>
        <Text style={styles.cardBody}>
          Mingle uses your location to put you on the campus map so friends can see
          when you're nearby. We never share precise location with anyone you
          haven't connected with.
        </Text>

        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  status === 'granted'
                    ? colors.success
                    : status === 'denied'
                    ? colors.coral
                    : colors.textMuted,
              },
            ]}
          />
          <Text style={styles.statusText}>{STATUS_LABEL[status]}</Text>
        </View>
      </Card>

      <View style={styles.actions}>
        <Button
          title={status === 'granted' ? 'Location enabled' : 'Allow location'}
          onPress={handleEnable}
          loading={busy}
          disabled={status === 'granted'}
        />
        <Pressable onPress={handleSkip} hitSlop={8} style={styles.skip}>
          <Text style={styles.skipText}>Not right now</Text>
        </Pressable>
      </View>
    </View>
  );
}

LocationStep.canContinue = (v) => !!v.locationStatus && v.locationStatus !== 'pending';

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: spacing.xl },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconText: { fontSize: 24 },
  cardTitle: { ...typography.h2, color: colors.text },
  cardBody: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { ...typography.caption, color: colors.text, fontWeight: '600' },
  actions: { gap: spacing.md, alignItems: 'center' },
  skip: { paddingVertical: spacing.sm },
  skipText: { ...typography.body, color: colors.textMuted, fontWeight: '600' },
});
