import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import TextField from './TextField';
import Button from './Button';
import { api } from '../api/client';
import { colors, radius, spacing, typography } from '../theme';

/**
 * Sheet for pasting a Google Calendar secret iCal URL, fetching events
 * from the server, and handing the parsed schedule back to the caller.
 */
export default function GoogleCalendarImportModal({
  visible,
  onClose,
  onImported,
  title = 'Google Calendar',
}) {
  const [icalUrl, setIcalUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    const trimmed = icalUrl.trim();
    if (!trimmed) {
      Alert.alert('Paste your link', 'Copy the secret iCal URL from Google Calendar settings.');
      return;
    }
    try {
      setLoading(true);
      const { schedule, eventCount } = await api.previewCalendar(trimmed);
      if (!schedule?.items?.length) {
        Alert.alert(
          'No upcoming events',
          'Your calendar loaded, but nothing fell in the next few weeks. Try widening your calendar or add events in Google Calendar.'
        );
      }
      onImported({ schedule, icalFeedUrl: trimmed, eventCount });
      setIcalUrl('');
      onClose();
    } catch (e) {
      Alert.alert('Could not import', e?.message || 'Check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.body}>
              In Google Calendar → Settings → your calendar →{' '}
              <Text style={styles.bold}>Integrate calendar</Text>, copy the{' '}
              <Text style={styles.bold}>Secret address in iCal format</Text>, and paste it
              below. We only read events — nothing is written back to Google.
            </Text>

            <TextField
              label="Secret iCal URL"
              value={icalUrl}
              onChangeText={setIcalUrl}
              placeholder="https://calendar.google.com/calendar/ical/…/basic.ics"
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              numberOfLines={3}
              style={[styles.urlInput]}
            />

            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
            ) : (
              <View style={styles.actions}>
                <View style={{ flex: 1 }}>
                  <Button title="Cancel" variant="outline" onPress={onClose} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button title="Import" onPress={handleImport} />
                </View>
              </View>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(17, 23, 38, 0.45)',
    justifyContent: 'flex-end',
  },
  keyboard: { width: '100%' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.xs,
  },
  title: { ...typography.h2, color: colors.text },
  body: { ...typography.body, color: colors.textMuted, lineHeight: 22 },
  bold: { fontWeight: '700', color: colors.text },
  urlInput: { minHeight: 72, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: spacing.md },
});
