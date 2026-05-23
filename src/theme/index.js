export const colors = {
  primary: '#4B5D9A',
  primaryDark: '#384876',
  primaryLight: '#6B7DBA',
  gold: '#FFC857',
  coral: '#FF7A59',

  bg: '#F6F7FB',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF1F8',
  border: '#E2E6F0',

  text: '#111726',
  textMuted: '#5B6478',
  textInverse: '#FFFFFF',

  success: '#2E9E6A',
  danger: '#E5484D',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const typography = {
  display: { fontSize: 32, fontWeight: '800', letterSpacing: 0.2 },
  title: { fontSize: 24, fontWeight: '700' },
  h2: { fontSize: 20, fontWeight: '700' },
  body: { fontSize: 16, fontWeight: '500' },
  caption: { fontSize: 13, fontWeight: '500' },
  small: { fontSize: 12, fontWeight: '500' },
};

export const shadow = {
  card: {
    shadowColor: '#0B1020',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  soft: {
    shadowColor: '#0B1020',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
};

export const theme = { colors, spacing, radius, typography, shadow };
export default theme;
