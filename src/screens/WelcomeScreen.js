import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Button from '../components/Button';
import Avatar from '../components/Avatar/Avatar';
import { colors, spacing, typography } from '../theme';

const PEEK_AVATARS = [
  { skin: 'porcelain', hairColor: 'blonde', hairStyle: 'long', clothing: 'coral', gender: 'female' },
  { skin: 'tan', hairColor: 'black', hairStyle: 'quiff', clothing: 'gold', gender: 'male' },
  { skin: 'deep', hairColor: 'black', hairStyle: 'buzz', clothing: 'forest', gender: 'male' },
  { skin: 'warm', hairColor: 'auburn', hairStyle: 'wavy', clothing: 'rose', gender: 'female' },
];

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.hero}>
          <View style={styles.avatarStack}>
            {PEEK_AVATARS.map((a, i) => (
              <View
                key={i}
                style={[
                  styles.avatarSlot,
                  {
                    transform: [
                      { translateX: (i - (PEEK_AVATARS.length - 1) / 2) * 70 },
                      { translateY: i % 2 === 0 ? -8 : 8 },
                    ],
                    zIndex: i,
                  },
                ]}
              >
                <Avatar config={a} size={140} mode="full" ring />
              </View>
            ))}
          </View>

          <Text style={styles.brand}>Mingle</Text>
          <Text style={styles.tagline}>
            See what your friends are up to. Plan your week together.
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            title="Get started"
            variant="gold"
            onPress={() => navigation.navigate('Onboarding')}
          />
          <Pressable
            onPress={() => navigation.navigate('Login')}
            style={({ pressed }) => [styles.loginLink, { opacity: pressed ? 0.6 : 1 }]}
            hitSlop={10}
          >
            <Text style={styles.loginText}>
              Have an account? <Text style={styles.loginCta}>Log in</Text>
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'space-between' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  avatarStack: {
    height: 180,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSlot: {
    position: 'absolute',
  },
  brand: {
    ...typography.display,
    fontSize: 56,
    color: colors.textInverse,
    letterSpacing: 1,
    marginTop: spacing.xl,
  },
  tagline: {
    ...typography.body,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.85)',
    paddingHorizontal: spacing.lg,
  },
  actions: { paddingBottom: spacing.xl, gap: spacing.lg, alignItems: 'center' },
  loginLink: { paddingVertical: spacing.sm },
  loginText: { color: 'rgba(255,255,255,0.8)', ...typography.body },
  loginCta: { color: colors.gold, fontWeight: '700' },
});
