import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '../../components/Header';
import IconButton from '../../components/IconButton';
import TextField from '../../components/TextField';
import Button from '../../components/Button';
import SegmentedControl from '../../components/SegmentedControl';
import TimeSpinner from '../../components/TimeSpinner';

import { api } from '../../api/client';
import { useUser } from '../../context/UserContext';
import { colors, spacing, typography } from '../../theme';

const DURATIONS = [
  { label: '30m', value: 0.5 },
  { label: '1h', value: 1 },
  { label: '1.5h', value: 1.5 },
  { label: '2h', value: 2 },
];
const DAY_OFFSETS = [0, 1, 2, 3, 4, 5, 6].map((d) => {
  const date = new Date();
  date.setDate(date.getDate() + d);
  const label =
    d === 0
      ? 'Today'
      : d === 1
      ? 'Tom'
      : date.toLocaleDateString(undefined, { weekday: 'short' });
  return { label, value: String(d) };
});

export default function AddEventScreen({ navigation }) {
  const { user, setUser } = useUser();
  const [summary, setSummary] = useState('');
  const [location, setLocation] = useState('');
  const [dayOffset, setDayOffset] = useState('0');
  const initialTime = useMemo(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  }, []);
  const [time, setTime] = useState(initialTime);
  const [duration, setDuration] = useState(1);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!summary.trim()) {
      Alert.alert('Add a title for your event.');
      return;
    }
    const start = new Date();
    start.setDate(start.getDate() + Number(dayOffset));
    start.setHours(time.getHours(), time.getMinutes(), 0, 0);
    const end = new Date(start.getTime() + duration * 3600 * 1000);

    const newEvent = {
      id: `local-${Date.now()}`,
      summary: summary.trim(),
      location: location.trim(),
      description: '',
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      source: 'manual',
    };

    try {
      setSaving(true);
      const existingItems = Array.isArray(user?.schedule?.items)
        ? user.schedule.items
        : [];
      const nextSchedule = {
        ...(user?.schedule || { kind: 'calendar#events' }),
        items: [...existingItems, newEvent],
        updated: new Date().toISOString(),
      };
      const updated = await api.updateUser(user._id, { schedule: nextSchedule });
      await setUser(updated);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Could not save', e?.message || 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Add event"
        left={
          <IconButton
            icon="chevron-back"
            variant="ghost"
            onPress={() => navigation.goBack()}
            accessibilityLabel="Back"
          />
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <TextField
          label="What is it?"
          value={summary}
          onChangeText={setSummary}
          placeholder="Calculus office hours"
          autoCapitalize="words"
        />
        <TextField
          label="Where? (optional)"
          value={location}
          onChangeText={setLocation}
          placeholder="Library, Room 204..."
          autoCapitalize="words"
        />

        <View style={styles.section}>
          <Text style={styles.label}>DAY</Text>
          <SegmentedControl
            options={DAY_OFFSETS}
            value={dayOffset}
            onChange={setDayOffset}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>STARTS AT</Text>
          <TimeSpinner value={time} onChange={setTime} />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>DURATION</Text>
          <SegmentedControl
            options={DURATIONS}
            value={duration}
            onChange={setDuration}
          />
        </View>

        <Button title="Add to calendar" onPress={save} loading={saving} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  section: { gap: spacing.sm },
  label: {
    ...typography.small,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});
