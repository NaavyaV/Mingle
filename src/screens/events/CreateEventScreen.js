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

const DAY_OFFSETS = [0, 1, 2, 3, 4, 5, 6].map((d) => {
  const date = new Date();
  date.setDate(date.getDate() + d);
  return {
    label:
      d === 0
        ? 'Today'
        : d === 1
        ? 'Tom'
        : date.toLocaleDateString(undefined, { weekday: 'short' }),
    value: String(d),
  };
});

export default function CreateEventScreen({ navigation }) {
  const { user } = useUser();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [dayOffset, setDayOffset] = useState('0');

  const initialTime = useMemo(() => {
    const d = new Date();
    d.setHours(18, 0, 0, 0);
    return d;
  }, []);
  const [time, setTime] = useState(initialTime);

  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Give your event a name.');
      return;
    }
    const start = new Date();
    start.setDate(start.getDate() + Number(dayOffset));
    start.setHours(time.getHours(), time.getMinutes(), 0, 0);

    try {
      setSaving(true);
      const created = await api.createEvent({
        name: name.trim(),
        description: description.trim(),
        location: location.trim(),
        startAt: start.toISOString(),
        host: user.username,
      });
      navigation.replace('EventDetail', { eventId: created._id });
    } catch (e) {
      Alert.alert('Could not create', e?.message || 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Host an event"
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
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Basketball tourney"
          autoCapitalize="words"
        />
        <TextField
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Bring your A game and snacks"
          multiline
          numberOfLines={3}
        />
        <TextField
          label="Location"
          value={location}
          onChangeText={setLocation}
          placeholder="Main gym"
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

        <Button title="Create event" onPress={save} loading={saving} />
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
