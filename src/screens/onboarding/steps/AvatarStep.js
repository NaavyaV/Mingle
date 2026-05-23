import { View, StyleSheet, Pressable, Keyboard } from 'react-native';
import AvatarBuilder from '../../../components/Avatar/AvatarBuilder';
import Avatar from '../../../components/Avatar/Avatar';
import SpeechBubble from '../../../components/SpeechBubble';
import { spacing } from '../../../theme';

export default function AvatarStep({ value, setValue }) {
  return (
    <Pressable style={styles.wrap} onPress={Keyboard.dismiss}>
      <View style={styles.preview}>
        <Avatar config={value.avatar} size={240} mode="full" />
        <View style={styles.bubbleSlot} pointerEvents="box-none">
          <SpeechBubble
            value={value.status}
            onChangeText={(t) => setValue({ status: t })}
            tailSide="left"
          />
        </View>
      </View>
      <AvatarBuilder
        value={value.avatar}
        onChange={(next) => setValue({ avatar: next })}
      />
    </Pressable>
  );
}

AvatarStep.canContinue = (v) => !!v.avatar;

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  preview: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bubbleSlot: {
    position: 'absolute',
    right: spacing.xs,
    top: 36,
    maxWidth: 200,
  },
});
