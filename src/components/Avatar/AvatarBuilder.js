import { View, Text, StyleSheet, ScrollView } from 'react-native';
import SwatchRow from './SwatchRow';
import Chip from '../Chip';
import SegmentedControl from '../SegmentedControl';
import {
  SKIN_TONES,
  HAIR_COLORS,
  HAIR_STYLES_BY_GENDER,
  CLOTHING_COLORS,
  GENDERS,
  DEFAULT_HAIR_BY_GENDER,
  ensureValidHair,
} from './options';
import { colors, spacing, typography } from '../../theme';

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{title}</Text>
      {children}
    </View>
  );
}

/**
 * Controls-only avatar builder. The preview (Avatar + optional SpeechBubble)
 * is rendered by the caller so it can frame and position the character
 * however it wants — for example the onboarding step puts a status speech
 * bubble above the avatar.
 *
 * Pass `scrollable={false}` when this is mounted inside an outer
 * ScrollView (Profile edit screen) so vertical drags propagate to the
 * parent — nested ScrollViews on iOS swallow scroll gestures.
 */
export default function AvatarBuilder({ value, onChange, scrollable = true }) {
  const update = (patch) => onChange(ensureValidHair({ ...value, ...patch }));

  const handleGenderChange = (genderId) => {
    const nextHair =
      value.hairStyle &&
      HAIR_STYLES_BY_GENDER[genderId].some((s) => s.id === value.hairStyle)
        ? value.hairStyle
        : DEFAULT_HAIR_BY_GENDER[genderId];
    onChange({ ...value, gender: genderId, hairStyle: nextHair });
  };

  const hairStyles = HAIR_STYLES_BY_GENDER[value.gender] || [];

  const sections = (
    <>
      <Section title="Gender">
        <SegmentedControl
          options={GENDERS.map((g) => ({ label: g.label, value: g.id, color: g.color }))}
          value={value.gender}
          onChange={handleGenderChange}
        />
      </Section>

      <Section title="Skin tone">
        <SwatchRow
          options={SKIN_TONES}
          value={value.skin}
          onChange={(id) => update({ skin: id })}
        />
      </Section>

      <Section title="Hair color">
        <SwatchRow
          options={HAIR_COLORS}
          value={value.hairColor}
          onChange={(id) => update({ hairColor: id })}
        />
      </Section>

      <Section title="Hair style">
        <View style={styles.chipRow}>
          {hairStyles.map((s) => (
            <Chip
              key={s.id}
              label={s.label}
              selected={value.hairStyle === s.id}
              onPress={() => update({ hairStyle: s.id })}
            />
          ))}
        </View>
      </Section>

      <Section title="Top color">
        <SwatchRow
          options={CLOTHING_COLORS}
          value={value.clothing}
          onChange={(id) => update({ clothing: id })}
        />
      </Section>
    </>
  );

  if (!scrollable) {
    return <View style={styles.controls}>{sections}</View>;
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.controls}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {sections}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  controls: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: { gap: spacing.sm },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
