import { Platform, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, radius } from '../theme';

/**
 * Native scrollable hour/minute/AM-PM picker. Wraps the community
 * DateTimePicker in the iOS "spinner" display so users can flick to
 * the time they want without tapping repeatedly.
 *
 *   value:    Date
 *   onChange: (Date) => void
 *   minuteInterval: defaults to 15
 */
export default function TimeSpinner({ value, onChange, minuteInterval = 15 }) {
  return (
    <View style={styles.wrap}>
      <DateTimePicker
        mode="time"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        value={value}
        minuteInterval={minuteInterval}
        onChange={(_event, selected) => {
          if (selected) onChange(selected);
        }}
        style={styles.picker}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 160 : undefined,
  },
});
