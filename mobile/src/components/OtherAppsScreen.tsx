import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, space } from '../theme/colors';

type Props = {
  onBack: () => void;
};

export function OtherAppsScreen({ onBack }: Props) {
  return (
    <View style={styles.screen} testID="other-apps-screen">
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Back"
        testID="other-apps-back"
      >
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <Text style={styles.title}>My other apps</Text>
      <Text style={styles.comingSoon}>Coming soon-ish</Text>
      <Text style={styles.subtitle}>
        My other apps are still stuck in traffic. They swore they left early.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  back: {
    alignSelf: 'flex-start',
    marginBottom: space.xl,
    paddingVertical: 4,
  },
  backPressed: {
    opacity: 0.7,
  },
  backText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.primary,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    color: colors.text,
    marginBottom: space.lg,
  },
  comingSoon: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.text,
    marginBottom: space.sm,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
});
