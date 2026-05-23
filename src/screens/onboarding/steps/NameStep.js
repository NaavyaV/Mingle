import { View, StyleSheet } from 'react-native';
import TextField from '../../../components/TextField';
import { spacing } from '../../../theme';

export default function NameStep({ value, setValue }) {
  return (
    <View style={styles.wrap}>
      <TextField
        label="First name"
        value={value.name}
        onChangeText={(t) => setValue({ name: t })}
        placeholder="Alex"
        autoCapitalize="words"
        autoCorrect={false}
        maxLength={40}
        autoFocus
      />
      <TextField
        label="School"
        value={value.school}
        onChangeText={(t) => setValue({ school: t })}
        placeholder="Sunnyvale Community College"
        autoCapitalize="words"
        hint="So we can match you with people at your campus."
      />
    </View>
  );
}

NameStep.canContinue = (v) => v.name.trim().length > 0;

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
});
