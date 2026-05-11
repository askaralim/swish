import { Easing } from 'react-native';

export const COLORS = {
  bg: '#000000',
  header: '#121216',
  card: '#16161A',
  cardSecondary: '#1C1C1E',
  cardElevated: '#1B1B20',
  cardMuted: '#101014',
  textMain: '#FFFFFF',
  textSecondary: '#71767a',
  accent: '#1d9bf0',
  accentSoft: '#1d9bf022',
  borderSubtle: 'rgba(255,255,255,0.08)',
  divider: '#2c2c2e',
  win: '#10b981',
  loss: '#ef4444',
  live: '#ef4444',
};

export const MOTION = {
  Fast: 180,
  Standard: 220,
  Emphasis: 300,
  AppleEasing: Easing.bezier(0.2, 0, 0, 1),
};
