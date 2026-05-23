import { View, StyleSheet } from 'react-native';
import { colors, radius, shadow, spacing } from '../theme';

export default function Card({ children, style, padded = true, elevated = true }) {
  return (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        elevated && shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  padded: { padding: spacing.lg },
});
