import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, space } from '../theme/colors';

type Props = {
  onPress: () => void;
};

export function HelpLink({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
      accessibilityRole="link"
      accessibilityLabel="How scores work"
      testID="help-link"
    >
      <Text style={styles.text}>How scores work</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: space.lg,
    paddingVertical: 0,
  },
  linkPressed: {
    opacity: 0.7,
  },
  text: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.primary,
  },
  chevron: {
    fontFamily: fonts.bodyMedium,
    fontSize: 18,
    color: colors.primary,
    marginTop: -1,
  },
});
