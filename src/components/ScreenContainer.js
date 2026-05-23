import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

export default function ScreenContainer({
  children,
  background = colors.bg,
  edges = ['top', 'bottom'],
  padded = true,
  keyboardAvoiding = false,
  style,
}) {
  const Wrapper = keyboardAvoiding ? KeyboardAvoidingView : View;
  const wrapperProps = keyboardAvoiding
    ? { behavior: Platform.OS === 'ios' ? 'padding' : undefined, style: { flex: 1 } }
    : { style: { flex: 1 } };

  return (
    <SafeAreaView edges={edges} style={[styles.safe, { backgroundColor: background }]}>
      <Wrapper {...wrapperProps}>
        <View style={[styles.inner, padded && styles.padded, style]}>{children}</View>
      </Wrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  inner: { flex: 1 },
  padded: { paddingHorizontal: spacing.xl },
});
