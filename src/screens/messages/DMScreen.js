import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '../../components/Header';
import IconButton from '../../components/IconButton';
import Avatar from '../../components/Avatar/Avatar';
import ChatBubble from '../../components/messages/ChatBubble';
import EventInviteCard from '../../components/messages/EventInviteCard';
import EmptyState from '../../components/EmptyState';

import { api } from '../../api/client';
import { useUser } from '../../context/UserContext';
import { colors, radius, spacing, typography } from '../../theme';
import { formatTimeShort } from '../../utils/format';

export default function DMScreen({ route, navigation }) {
  const { user } = useUser();
  const { other, otherUser: paramUser } = route.params || {};
  const [otherUser, setOtherUser] = useState(paramUser || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [eventsById, setEventsById] = useState({});
  const listRef = useRef(null);

  const load = useCallback(async () => {
    if (!user?.username || !other) return;
    try {
      const [thread, otherProfile] = await Promise.all([
        api.getThread(user.username, other),
        otherUser ? Promise.resolve(otherUser) : api.getUserByUsername(other),
      ]);
      setMessages(thread || []);
      if (otherProfile) setOtherUser(otherProfile);

      const eventIds = (thread || [])
        .filter((m) => m.kind === 'eventInvite' && m.eventId)
        .map((m) => String(m.eventId));
      if (eventIds.length) {
        const fetched = await Promise.all(
          [...new Set(eventIds)].map((id) =>
            api.getEvent(id).catch(() => null)
          )
        );
        const next = {};
        for (const e of fetched) if (e) next[e._id] = e;
        setEventsById(next);
      }
    } catch {
      /* ignore */
    }
  }, [user?.username, other, otherUser]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);

  const onSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const msg = await api.sendMessage({
        from: user.username,
        to: other,
        kind: 'text',
        body: text.trim(),
      });
      setMessages((prev) => [...prev, msg]);
      setText('');
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }) => {
    const mine = item.from === user?.username;
    if (item.kind === 'eventInvite') {
      const ev = eventsById[String(item.eventId)];
      return (
        <View style={[styles.rowWrap, mine ? styles.alignRight : styles.alignLeft]}>
          <EventInviteCard
            event={ev}
            mine={mine}
            onPress={() => ev && navigation.navigate('EventDetail', { eventId: ev._id })}
          />
          <View style={{ height: 4 }} />
        </View>
      );
    }
    return (
      <ChatBubble mine={mine} footer={formatTimeShort(item.createdAt)}>
        {item.body}
      </ChatBubble>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title={otherUser?.name || other || 'Chat'}
        subtitle={otherUser?.username ? `@${otherUser.username}` : ''}
        left={
          <IconButton
            icon="chevron-back"
            variant="ghost"
            onPress={() => navigation.goBack()}
            accessibilityLabel="Back"
          />
        }
        right={
          otherUser ? (
            <View style={styles.headerAvatar}>
              <Avatar config={otherUser.avatar} size={30} mode="bust" />
            </View>
          ) : null
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => String(item._id)}
          renderItem={renderItem}
          contentContainerStyle={styles.thread}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubble-ellipses-outline"
              title="Start the conversation"
              body="Send a message to get the ball rolling."
            />
          }
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
        />

        <View style={styles.composer}>
          <Pressable style={styles.input}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Message..."
              placeholderTextColor={colors.textMuted}
              style={styles.textInput}
              multiline
            />
          </Pressable>
          <Pressable
            onPress={onSend}
            disabled={!text.trim() || sending}
            style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.5 }]}
          >
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thread: { padding: spacing.lg, flexGrow: 1 },
  rowWrap: { maxWidth: '85%' },
  alignRight: { alignSelf: 'flex-end' },
  alignLeft: { alignSelf: 'flex-start' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    justifyContent: 'center',
  },
  textInput: { ...typography.body, color: colors.text, padding: 0 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
