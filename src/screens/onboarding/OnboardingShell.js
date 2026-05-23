import { useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import ProgressBar from '../../components/ProgressBar';
import { colors, spacing, typography } from '../../theme';

/**
 * OnboardingShell renders a horizontally sliding stack of steps. Each step
 * receives `{ value, setValue, goNext, goBack, isFirst, isLast }` so it can
 * render its UI and contribute its slice of the form payload.
 *
 * The shell owns: layout, header, progress, footer buttons, and animated
 * page transitions. Steps only render their content + handle their own
 * `canContinue` rule.
 */
export default function OnboardingShell({
  steps,
  initialValue,
  onFinish,
  finishLabel = 'Finish',
  onClose,
}) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const scrollRef = useRef(null);
  const width = Dimensions.get('window').width;

  const current = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  const updateValue = useCallback(
    (patch) => setValue((prev) => ({ ...prev, ...patch })),
    []
  );

  const scrollTo = useCallback(
    (i) => {
      scrollRef.current?.scrollTo({ x: i * width, animated: true });
      setIndex(i);
    },
    [width]
  );

  const goNext = useCallback(async () => {
    setSubmitError('');
    if (isLast) {
      try {
        setSubmitting(true);
        await onFinish(value);
      } catch (e) {
        setSubmitError(e?.message || 'Something went wrong.');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    scrollTo(index + 1);
  }, [isLast, scrollTo, index, onFinish, value]);

  const goBack = useCallback(() => {
    setSubmitError('');
    if (isFirst) {
      onClose?.();
      return;
    }
    scrollTo(index - 1);
  }, [isFirst, scrollTo, index, onClose]);

  const canContinue = useMemo(
    () => (current.canContinue ? current.canContinue(value) : true),
    [current, value]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={goBack} hitSlop={10}>
            <Text style={styles.headerBtn}>‹ Back</Text>
          </Pressable>
          <Text style={styles.headerCounter}>
            {index + 1} / {steps.length}
          </Text>
        </View>

        <View style={styles.progressWrap}>
          <ProgressBar value={index + 1} total={steps.length} />
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
        >
          {steps.map((step) => {
            const StepComponent = step.component;
            return (
              <View key={step.id} style={[styles.page, { width }]}>
                <View style={styles.copy}>
                  <Text style={styles.title}>{step.title}</Text>
                  {step.subtitle ? (
                    <Text style={styles.subtitle}>{step.subtitle}</Text>
                  ) : null}
                </View>
                <View style={styles.stepBody}>
                  <StepComponent
                    value={value}
                    setValue={updateValue}
                    goNext={goNext}
                    goBack={goBack}
                  />
                </View>
              </View>
            );
          })}
        </ScrollView>

        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

        <View style={styles.footer}>
          <Button
            title={isLast ? finishLabel : 'Continue'}
            onPress={goNext}
            disabled={!canContinue}
            loading={submitting}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBtn: { ...typography.body, color: colors.primary, fontWeight: '600' },
  headerCounter: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  progressWrap: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  page: { paddingHorizontal: spacing.xl, gap: spacing.lg, flex: 1 },
  copy: { gap: spacing.sm },
  title: { ...typography.display, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted },
  stepBody: { flex: 1, paddingTop: spacing.md },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.md },
  errorText: {
    color: colors.danger,
    ...typography.caption,
    paddingHorizontal: spacing.xl,
    textAlign: 'center',
  },
});
