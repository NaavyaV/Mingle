import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Chip from '../../../components/Chip';
import { INTERESTS } from '../../../utils/interests';
import { colors, spacing, typography } from '../../../theme';

export default function InterestsStep({ value, setValue }) {
  const selected = value.interests || [];

  const toggle = (item) => {
    if (selected.includes(item)) {
      setValue({ interests: selected.filter((i) => i !== item) });
    } else {
      setValue({ interests: [...selected, item] });
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.counter}>
        {selected.length} selected · pick at least 3
      </Text>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.chipGrid}
      >
        {INTERESTS.map((item) => (
          <Chip
            key={item}
            label={item}
            selected={selected.includes(item)}
            onPress={() => toggle(item)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

InterestsStep.canContinue = (v) => (v.interests?.length || 0) >= 3;

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: spacing.md },
  counter: { ...typography.caption, color: colors.textMuted },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
});
