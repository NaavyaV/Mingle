import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActionSheetIOS,
  Platform,
  ScrollView,
  Keyboard,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '../../components/Header';
import IconButton from '../../components/IconButton';
import Avatar from '../../components/Avatar/Avatar';
import SpeechBubble from '../../components/SpeechBubble';
import Button from '../../components/Button';
import AvatarBuilder from '../../components/Avatar/AvatarBuilder';
import PatternBackground from '../../components/PatternBackground';

import { api } from '../../api/client';
import { useUser } from '../../context/UserContext';
import { colors, radius, spacing, typography } from '../../theme';

const STATUS_DEBOUNCE_MS = 500;

export default function ProfileScreen({ navigation }) {
  const { user, setUser, signOut, deleteAccount } = useUser();
  const [status, setStatus] = useState(user?.status || '');
  const [editing, setEditing] = useState(false);
  const [avatar, setAvatar] = useState(user?.avatar);
  const [saving, setSaving] = useState(false);
  const statusDebounce = useRef(null);
  const lastSavedStatus = useRef(user?.status || '');

  useEffect(() => {
    setStatus(user?.status || '');
    setAvatar(user?.avatar);
    lastSavedStatus.current = user?.status || '';
  }, [user?.username]);

  const persist = async (patch) => {
    if (!user?._id) return;
    try {
      setSaving(true);
      const updated = await api.updateUser(user._id, patch);
      await setUser(updated);
    } catch (e) {
      Alert.alert('Could not save', e?.message || 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  // Debounced auto-save of status while the user types.
  const handleStatusChange = (next) => {
    setStatus(next);
    if (statusDebounce.current) clearTimeout(statusDebounce.current);
    statusDebounce.current = setTimeout(async () => {
      const trimmed = (next || '').trim();
      if (trimmed === (lastSavedStatus.current || '').trim()) return;
      lastSavedStatus.current = trimmed;
      await persist({ status: trimmed });
    }, STATUS_DEBOUNCE_MS);
  };

  useEffect(() => {
    return () => {
      if (statusDebounce.current) clearTimeout(statusDebounce.current);
    };
  }, []);

  const onSaveAvatar = async () => {
    await persist({ avatar });
    setEditing(false);
  };

  const onSignOut = () => {
    Alert.alert('Sign out?', 'You can sign back in with your username.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  const onDelete = () => {
    Alert.alert(
      'Delete account?',
      'This permanently removes your profile from Mingle. There is no undo.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteAccount },
      ]
    );
  };

  // Settings (gear) menu — both account-level actions live here so the
  // profile body stays clean.
  const openSettings = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Account',
          options: ['Cancel', 'Sign out', 'Delete account'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (idx) => {
          if (idx === 1) onSignOut();
          else if (idx === 2) onDelete();
        }
      );
      return;
    }
    Alert.alert('Account', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', onPress: onSignOut },
      { text: 'Delete account', style: 'destructive', onPress: onDelete },
    ]);
  };

  // -------- EDIT MODE: one ScrollView that owns the whole screen so
  // scrolling works in every cell (avatar preview, swatches, chips, etc.)
  if (editing) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <PatternBackground />
        <Header
          title="Edit profile"
          left={
            <IconButton
              icon="chevron-back"
              variant="ghost"
              onPress={() => {
                setAvatar(user?.avatar);
                setEditing(false);
              }}
              accessibilityLabel="Cancel"
            />
          }
        />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.editContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.editPreview}>
            <Avatar config={avatar} size={200} mode="full" />
          </View>

          {/* AvatarBuilder is told to be inline (no inner ScrollView) so
              vertical drags everywhere on the page scroll the outer list. */}
          <AvatarBuilder value={avatar} onChange={setAvatar} scrollable={false} />

          <View style={styles.editActions}>
            <View style={{ flex: 1 }}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setAvatar(user?.avatar);
                  setEditing(false);
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Save changes" onPress={onSaveAvatar} loading={saving} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // -------- VIEW MODE
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PatternBackground />
      <Header
        title=""
        left={
          <IconButton
            icon="chevron-back"
            variant="ghost"
            onPress={() => navigation.goBack()}
            accessibilityLabel="Back"
          />
        }
        right={
          <IconButton
            icon="settings-outline"
            variant="ghost"
            onPress={openSettings}
            accessibilityLabel="Settings"
          />
        }
      />

      <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
        <View style={styles.viewContent}>
          <View style={styles.identity}>
            <Text style={styles.name}>{user?.name || user?.username}</Text>
            <Text style={styles.handle}>@{user?.username}</Text>
            {user?.school ? <Text style={styles.school}>{user.school}</Text> : null}
          </View>

          <View style={styles.previewRow}>
            {/* Stage = the avatar+bubble unit as one fixed-size frame.
                Avatar SVG is 138 wide and lives at left:0; bubble has
                a fixed width and lives at a fixed offset; the stage's
                total width is the union of both extents. Centering the
                stage in `previewRow` therefore centers the whole unit
                on-screen, regardless of what the user has typed. */}
            <View style={styles.stage}>
              <View style={styles.avatarSlot}>
                <Avatar config={avatar} size={220} mode="full" />
              </View>
              <View style={styles.bubbleSlot} pointerEvents="box-none">
                <SpeechBubble
                  value={status}
                  onChangeText={handleStatusChange}
                  tailSide="left"
                  placeholder="studying rn"
                  maxLength={80}
                  maxContentWidth={130}
                />
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title="Edit profile"
              onPress={() => setEditing(true)}
              variant="primary"
            />
            <Button title="Sign out" variant="outline" onPress={onSignOut} />
          </View>
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  viewContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  identity: { alignItems: 'center', gap: 4, marginTop: spacing.xs },
  name: { ...typography.display, color: colors.text, textAlign: 'center' },
  handle: { ...typography.caption, color: colors.textMuted },
  school: { ...typography.small, color: colors.textMuted, marginTop: 2 },

  previewRow: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Stage spans the avatar + the bubble's full extent so centering
  // the stage horizontally centers the whole unit. Width breakdown:
  //   avatar SVG (138) — at left:0
  //   bubble    (170)  — at left:88   ⇒ right edge at 258
  stage: {
    width: 258,
    height: 220,
  },
  avatarSlot: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  bubbleSlot: {
    position: 'absolute',
    // x: avatar's head right edge sits at viewBox x≈130 → 130/200×138 ≈ 90px,
    //    so anchoring at 88 lands the tail tip right at the cheek.
    // y: bubble's tail is fixed at 23px from its top (see SpeechBubble),
    //    and the mouth is at viewBox y=86 → 86/320×220 ≈ 59 → top 36
    //    + 23 = 59 ≈ mouth.
    left: 88,
    top: 36,
  },

  actions: { gap: spacing.sm },

  // edit mode
  editContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  editPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  editActions: { flexDirection: 'row', gap: spacing.md },
});
