import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import TextField from '../components/TextField';
import Button from '../components/Button';
import { useUser } from '../context/UserContext';
import { colors, spacing, typography } from '../theme';

export default function LoginScreen({ navigation }) {
  const { signIn } = useUser();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim()) {
      setError('Enter your username.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signIn(username);
    } catch (e) {
      setError(e.status === 404 ? "We couldn't find that username." : e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer keyboardAvoiding>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>
          Sign in with your Mingle username. No password needed for the demo.
        </Text>

        <View style={styles.form}>
          <TextField
            label="Username"
            value={username}
            onChangeText={(t) => {
              setUsername(t);
              if (error) setError('');
            }}
            placeholder="alex-2491"
            autoCapitalize="none"
            autoCorrect={false}
            error={error}
            onSubmitEditing={handleLogin}
          />

          <Button title="Log in" onPress={handleLogin} loading={loading} />
        </View>
      </View>

      <Pressable
        onPress={() => navigation.navigate('Onboarding')}
        style={({ pressed }) => [styles.altLink, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Text style={styles.altText}>
          New here? <Text style={styles.altCta}>Create an account</Text>
        </Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingTop: spacing.sm, paddingBottom: spacing.lg },
  back: { ...typography.body, color: colors.primary, fontWeight: '600' },
  content: { flex: 1, gap: spacing.lg },
  title: { ...typography.display, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted },
  form: { gap: spacing.lg, marginTop: spacing.md },
  altLink: { alignItems: 'center', paddingVertical: spacing.lg },
  altText: { ...typography.body, color: colors.textMuted },
  altCta: { color: colors.primary, fontWeight: '700' },
});
