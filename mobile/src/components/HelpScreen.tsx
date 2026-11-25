import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, space } from '../theme/colors';

type Props = {
  onBack: () => void;
};

function Section({
  code,
  title,
  intro,
  children,
}: {
  code: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section} testID={`help-${code.toLowerCase()}`}>
      <View style={styles.sectionHead}>
        <Text style={styles.code}>{code}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Text style={styles.body}>{intro}</Text>
      {children}
    </View>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

function Formula({ children }: { children: string }) {
  return <Text style={styles.formula}>{children}</Text>;
}

export function HelpScreen({ onBack }: Props) {
  return (
    <View style={styles.screen} testID="help-screen">
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Back"
        testID="help-back"
      >
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>How scores work</Text>
        <Text style={styles.lead}>
          LyveeInvest Analyzer applies its own rule-based formulas to market
          data from Yahoo Finance — not AI and not personalized advice. Each
          pillar scores 0–10 from the metrics available for that ticker. Missing
          fields are skipped; if nothing is available, that pillar defaults to
          5.0.
        </Text>

        <Section
          code="ASYM"
          title="Asymmetry"
          intro="Higher when downside looks limited relative to upside — price near the 52-week low, room to the analyst target, and/or trading below the 200-day average."
        >
          <Text style={styles.subhead}>What goes in</Text>
          <Bullet>
            52-week range position — where today’s price sits between the past
            year’s high and low (near the low can mean more room to recover)
          </Bullet>
          <Bullet>
            Upside to mean analyst price target — how far Wall Street’s average
            target is above (or below) the current price
          </Bullet>
          <Bullet>
            Price vs 200-day moving average — whether the stock is below its
            longer-term trend (below can imply mean-reversion room)
          </Bullet>
          <Text style={styles.subhead}>How it’s combined</Text>
          <Formula>Average of the available component scores (each kept between 0 and 10)</Formula>
          <Bullet>
            Range: 10 − (% of range ÷ 10) — nearer the 52W low → higher score
          </Bullet>
          <Bullet>
            Target upside: 5 + (upside% ÷ 8) — more upside to target → higher
          </Bullet>
          <Bullet>
            vs 200-day MA: 5 − (vsMA% ÷ 6) — below the average → higher
          </Bullet>
        </Section>

        <Section
          code="VAL"
          title="Valuation"
          intro="Higher when multiples look cheaper and/or dividend yield is attractive on fixed bands. Not adjusted for sector peers yet."
        >
          <Text style={styles.subhead}>What goes in</Text>
          <Bullet>
            Forward P/E (or trailing if forward is missing) — price divided by
            expected (or past) earnings; lower often looks cheaper
          </Bullet>
          <Bullet>
            PEG — P/E relative to earnings growth; helps judge if a high P/E is
            paid for by growth
          </Bullet>
          <Bullet>
            Price/Sales — market value vs revenue; useful when earnings are
            thin or volatile
          </Bullet>
          <Bullet>
            Price/Book — price vs net assets on the balance sheet
          </Bullet>
          <Bullet>
            EV/EBITDA — enterprise value vs cash operating earnings; common
            “whole company” multiple
          </Bullet>
          <Bullet>
            Dividend yield — annual dividends as a % of price (only if
            meaningful; reward is capped so extreme yields don’t dominate)
          </Bullet>
          <Bullet>
            Revenue growth (YoY) — year-over-year sales growth; shown for
            context and can soften a rich P/E slightly
          </Bullet>
          <Text style={styles.subhead}>How it’s combined</Text>
          <Formula>Average of the available component scores (each kept between 0 and 10)</Formula>
          <Bullet>P/E: 12 − (PE ÷ 4) — about 15 scores high, about 40 mid</Bullet>
          <Bullet>PEG: 11 − (PEG × 4) — lower PEG → higher score</Bullet>
          <Bullet>P/S: 10 − (P/S ÷ 1.5)</Bullet>
          <Bullet>P/B: 10 − (P/B ÷ 1.2)</Bullet>
          <Bullet>EV/EBITDA: 11 − (EV/EBITDA ÷ 3)</Bullet>
          <Bullet>
            Yield: 3 + (min(yield%, 5) × 1.4) when yield is above ~0.05% — extreme
            yields are capped so they don’t max the score alone
          </Bullet>
          <Bullet>
            If PE &gt; 25 and YoY revenue growth &gt; 15%: an extra mid score (6.5) is
            averaged in
          </Bullet>
        </Section>

        <Section
          code="RISK"
          title="Risk"
          intro="Higher means more concerning — the opposite direction of ASYM and VAL. Volatility, leverage, thin margins, payout pressure, and sky-high yields push this up."
        >
          <Text style={styles.subhead}>What goes in</Text>
          <Bullet>
            Beta — how hard the stock tends to move vs the overall market
            (higher = more volatile)
          </Bullet>
          <Bullet>
            Short interest (% of float) — share of tradable stock borrowed and
            sold short; elevated shorting can signal skepticism
          </Bullet>
          <Bullet>
            Profit margin — how much profit is left from each dollar of sales
            (losses or thin margins raise risk)
          </Bullet>
          <Bullet>
            Debt / equity — how much debt the company carries vs shareholder
            equity (higher leverage = more balance-sheet risk)
          </Bullet>
          <Bullet>
            Current ratio — short-term assets ÷ short-term liabilities; below 1
            means weaker near-term liquidity
          </Bullet>
          <Bullet>
            Dividend payout ratio — % of earnings paid out as dividends; very
            high payouts can be hard to sustain
          </Bullet>
          <Bullet>
            Very high dividend yield (≥ 6%) — can look attractive but may signal
            distress or a value trap
          </Bullet>
          <Text style={styles.subhead}>How it’s combined</Text>
          <Formula>Average of the available component scores (each kept between 0 and 10)</Formula>
          <Bullet>Beta: beta × 4.5 (e.g. beta 1 → about 4.5, beta 2 → about 9)</Bullet>
          <Bullet>Short %: short% ÷ 2</Bullet>
          <Bullet>
            Margins / liquidity / payout use fixed bands (e.g. losses → higher
            risk score)
          </Bullet>
          <Bullet>Debt/equity: D/E × 2.5</Bullet>
          <Bullet>
            Yield ≥ 6%: adds elevated risk (higher still if ≥ 8%)
          </Bullet>
        </Section>

        <View style={styles.section} testID="help-verdict">
          <View style={styles.sectionHead}>
            <Text style={styles.code}>OUT</Text>
            <Text style={styles.sectionTitle}>Verdict</Text>
          </View>
          <Text style={styles.body}>
            RISK is flipped so lower risk helps the composite. All three pillars
            weigh equally.
          </Text>
          <Formula>(ASYM + VAL + (10 − RISK)) / 3</Formula>
          <Text style={styles.subhead}>Bands</Text>
          <Bullet>≥ 8.0 → STRONG BUY</Bullet>
          <Bullet>≥ 6.5 → BUY</Bullet>
          <Bullet>≥ 5.0 → HOLD</Bullet>
          <Bullet>≥ 3.5 → AVOID</Bullet>
          <Bullet>&lt; 3.5 → STRONG AVOID</Bullet>
          <Text style={styles.note}>
            Not investment advice · Rule-based scores and for research only.
            Data from Yahoo Finance can be incomplete or delayed.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: space.md,
  },
  back: {
    alignSelf: 'flex-start',
    marginBottom: space.md,
    paddingVertical: 4,
    paddingHorizontal: space.lg,
  },
  backPressed: {
    opacity: 0.7,
  },
  backText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.primary,
  },
  scroll: {
    paddingHorizontal: space.lg,
    paddingBottom: 56,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    color: colors.text,
    marginBottom: space.sm,
  },
  lead: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    marginBottom: space.xl,
  },
  section: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.lg,
    marginBottom: space.md,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.sm,
    marginBottom: space.sm,
  },
  code: {
    fontFamily: fonts.monoBold,
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    marginBottom: space.md,
  },
  subhead: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.text,
    marginTop: space.sm,
    marginBottom: space.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginBottom: 6,
    paddingRight: space.sm,
  },
  bulletDot: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textDim,
    lineHeight: 20,
  },
  bulletText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  formula: {
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 18,
    color: colors.warning,
    backgroundColor: colors.warningMuted,
    borderRadius: radius.sm,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    marginBottom: space.sm,
    overflow: 'hidden',
  },
  note: {
    marginTop: space.md,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 19,
    color: colors.warning,
  },
});
