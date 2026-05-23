import { View, Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme';

export default function SwatchRow({ options, value, onChange, size = 36 }) {
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const selected = opt.id === value;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            style={({ pressed }) => [
              styles.dotWrap,
              {
                borderColor: selected ? colors.primary : 'transparent',
                opacity: pressed ? 0.7 : 1,
                padding: selected ? 2 : 2,
              },
            ]}
          >
            <View
              style={[
                styles.dot,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  backgroundColor: opt.color,
                },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dotWrap: {
    borderRadius: radius.pill,
    borderWidth: 2,
  },
  dot: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
});
