import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import Header from '../../components/Header';
import IconButton from '../../components/IconButton';
import Card from '../../components/Card';
import Button from '../../components/Button';
import GoingRow from '../../components/events/GoingRow';
import PatternBackground from '../../components/PatternBackground';

import { api } from '../../api/client';
import { useUser } from '../../context/UserContext';
import { colors, spacing, typography } from '../../theme';
import { formatDayLabel, formatTimeShort } from '../../utils/format';

export default function EventDetailScreen({ navigation, route }) {
  const { eventId } = route.params || {};
  const { user } = useUser();
  const [event, setEvent] = useState(null);
  const [usersByUsername, setUsersByUsername] = useState({});
  const [friends, setFriends] = useState([]);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    if (!eventId) return;
    try {
      const [ev, all, rel] = await Promise.all([
        api.getEvent(eventId),
        api.listUsers(),
        user?.username
          ? api.getFriends(user.username)
          : Promise.resolve({ friends: [] }),
      ]);
      const map = {};
      for (const u of all || []) map[u.username] = u;
      setEvent(ev);
      setUsersByUsername(map);
      setFriends(rel?.friends || []);
    } catch (e) {
      Alert.alert('Could not load', e?.message || 'Try again.');
    }
  }, [eventId, user?.username]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);

  if (!event) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <PatternBackground />
        <Header
          title="Event"
          left={
            <IconButton
              icon="chevron-back"
              variant="ghost"
              onPress={() => navigation.goBack()}
            />
          }
        />
      </SafeAreaView>
    );
  }

  const friendsSet = new Set(friends);
  const goingFriends = (event.going || [])
    .filter((u) => u !== user?.username && friendsSet.has(u))
    .map((u) => usersByUsername[u])
    .filter(Boolean);

  const iAmGoing = (event.going || []).includes(user?.username);
  const host = usersByUsername[event.host];

  const toggleGoing = async () => {
    if (working) return;
    setWorking(true);
    try {
      const updated = await api.setEventGoing(event._id, user.username, !iAmGoing);
      setEvent(updated);
    } catch (e) {
      Alert.alert('Could not update', e?.message || 'Try again.');
    } finally {
      setWorking(false);
    }
  };

  const invite = () => {
    navigation.navigate('EventInvitePicker', { eventId: event._id });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PatternBackground />
      <Header
        title="Event"
        left={
          <IconButton
            icon="chevron-back"
            variant="ghost"
            onPress={() => navigation.goBack()}
          />
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.name}>{event.name}</Text>

        <Card style={styles.metaCard}>
          <Meta icon="calendar-outline" label={formatDayLabel(event.startAt)} />
          <Meta icon="time-outline" label={formatTimeShort(event.startAt)} />
          {event.location ? <Meta icon="location-outline" label={event.location} /> : null}
          {host ? (
            <Meta
              icon="person-outline"
              label={`Hosted by ${host.name || host.username}`}
            />
          ) : (
            <Meta icon="person-outline" label={`Hosted by @${event.host}`} />
          )}
        </Card>

        {event.description ? (
          <Card>
            <Text style={styles.descTitle}>About</Text>
            <Text style={styles.desc}>{event.description}</Text>
          </Card>
        ) : null}

        <Card>
          <Text style={styles.descTitle}>Friends going</Text>
          <GoingRow users={goingFriends} size={36} />
          <Text style={styles.totalCount}>
            {event.going?.length || 0} total going
          </Text>
        </Card>

        <View style={styles.actions}>
          <Button
            title={iAmGoing ? "I'm going ✓" : "I'm going"}
            variant={iAmGoing ? 'gold' : 'primary'}
            onPress={toggleGoing}
            loading={working}
          />
          <Button
            title="Invite..."
            variant="outline"
            leading={<Ionicons name="paper-plane-outline" size={18} color={colors.primary} />}
            onPress={invite}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Meta({ icon, label }) {
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={16} color={colors.textMuted} />
      <Text style={styles.metaText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 120 },
  name: { ...typography.display, color: colors.text },
  metaCard: { gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { ...typography.body, color: colors.text },
  descTitle: {
    ...typography.small,
    color: colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  desc: { ...typography.body, color: colors.text },
  totalCount: { ...typography.small, color: colors.textMuted, marginTop: 4 },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
