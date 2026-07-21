// =============================================================================
// NjiaBox Mobile – Brand Theme
// Exact hex values from spec Section 2. Do not deviate from these.
//
// 60%  Deep Trust Navy    #0A192F  — backgrounds, headers, enterprise trust
// 30%  Clean Slate Grey   #F8FAFC  — card surfaces, inputs, neutral areas
// 10%  Transit Safety Orange #FF6B00 — CTAs, nav cues, live progress markers
//
// Typography: Inter (or Roboto fallback) — geometric, high legibility under
// outdoor sunlight at vehicle terminal depots (per spec intent).
// =============================================================================

export const Colors = {
  // Primary (60%)
  navy:         '#0A192F',
  navyLight:    '#112240',  // slightly lighter for hover/pressed states
  navyDark:     '#060F1C',  // deeper for pressed/active

  // Neutral (30%)
  slateLight:   '#F8FAFC',  // light mode background
  slateMid:     '#E2E8F0',  // dividers, input borders
  slateDark:    '#CBD5E1',  // disabled text, placeholders

  // Dark mode neutral
  darkSurface:  '#0F172A',  // dark mode background
  darkCard:     '#1E293B',  // dark mode card surface

  // Accent (10%)
  orange:       '#FF6B00',  // CTAs, live markers, primary actions
  orangeLight:  '#FF8C38',  // pressed/lighter orange
  orangeDark:   '#CC5600',  // very pressed

  // Semantic
  success:      '#10B981',  // Mobile Money Green — payment confirmed, delivered
  error:        '#EF4444',
  warning:      '#F59E0B',
  info:         '#3B82F6',

  // Text
  textPrimary:  '#0A192F',  // on light backgrounds
  textSecondary:'#64748B',
  textOnDark:   '#F8FAFC',  // on navy backgrounds
  textOnOrange: '#FFFFFF',  // on orange CTAs
} as const;

export const Typography = {
  fontFamily: {
    regular:  'System',
    medium:   'System',
    semiBold: 'System',
    bold:     'System',
  },
  fontSize: {
    xs:   11,
    sm:   13,
    base: 15,
    lg:   17,
    xl:   20,
    '2xl':24,
    '3xl':30,
  },
  lineHeight: {
    tight:  1.25,
    normal: 1.5,
    relaxed:1.75,
  },
} as const;

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  '2xl':32,
  '3xl':48,
} as const;

export const BorderRadius = {
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  full: 9999,
} as const;

export const Shadow = {
  card: {
    shadowColor: '#0A192F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#0A192F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
