import { View, Pressable, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

export default function SegmentedControl({ options, value, onChange }) {
  return (
    <View style={styles.track}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.seg, selected && styles.segActive]}
          >
            <Text style={[styles.text, selected && styles.textActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  seg: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  segActive: {
    backgroundColor: colors.surface,
    shadowColor: '#0B1020',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  text: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  textActive: { color: colors.text },
});
