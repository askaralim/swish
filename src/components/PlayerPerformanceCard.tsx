import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/src/constants/theme';
import { getQrDownloadUrl } from '@/src/constants/appLinks';
import { getTeamImage } from '@/src/utils/teamImages';
import { getGisTier } from '@/src/utils/getGisTier';
import QRCode from 'react-native-qrcode-svg';

type TierVisual = {
  icon: keyof typeof Ionicons.glyphMap;
  gradient: readonly [string, string, string];
  iconBubble: string;
};

function getTierVisual(gis: number): TierVisual {
  if (gis >= 30) {
    return {
      icon: 'trophy',
      gradient: ['#292524', '#a16207', '#eab308'] as const,
      iconBubble: 'rgba(0,0,0,0.35)',
    };
  }
  if (gis >= 22) {
    return {
      icon: 'flash',
      gradient: ['#1e1b4b', '#6d28d9', '#a78bfa'] as const,
      iconBubble: 'rgba(0,0,0,0.3)',
    };
  }
  if (gis >= 15) {
    return {
      icon: 'trending-up',
      gradient: ['#0c1222', '#1d4ed8', '#38bdf8'] as const,
      iconBubble: 'rgba(0,0,0,0.28)',
    };
  }
  if (gis >= 8) {
    return {
      icon: 'pulse',
      gradient: ['#052e16', '#047857', '#34d399'] as const,
      iconBubble: 'rgba(0,0,0,0.28)',
    };
  }
  return {
    icon: 'ellipse-outline',
    gradient: ['#18181b', '#3f3f46', '#71717a'] as const,
    iconBubble: 'rgba(0,0,0,0.35)',
  };
}

export type PlayerPerformanceCardStats = {
  minutes: string;
  points: string | number;
  rebounds: string | number;
  assists: string | number;
  steals?: string | number;
  blocks?: string | number;
  plusMinus: string;
  fieldGoals?: string;
  threePointers?: string;
  freeThrows?: string;
  turnovers?: string;
  fouls?: string;
};

export type PlayerPerformanceCardData = {
  name: string;
  headshot: string;
  position: string;
  teamAbbreviation: string;
  teamNameZhCN: string;
  gameScore: string;
  gis: number | null;
  stats: PlayerPerformanceCardStats;
};

export type PlayerPerformanceCardProps = {
  cardWidth: number;
  player: PlayerPerformanceCardData;
  gameStatusLabel: string;
};

export function PlayerPerformanceCard({
  cardWidth,
  player,
  gameStatusLabel,
}: PlayerPerformanceCardProps) {
  const tierVisual = player.gis != null ? getTierVisual(player.gis) : null;
  const qrPayload = getQrDownloadUrl();

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      {player.gis != null && tierVisual != null && (
        <LinearGradient
          colors={[...tierVisual.gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tagGradientShell}
        >
          <View style={styles.tagShine} pointerEvents="none" />
          <View style={styles.tagRow}>
            <View style={[styles.tagIconBubble, { backgroundColor: tierVisual.iconBubble }]}>
              <Ionicons name={tierVisual.icon} size={22} color="#FFFFFF" />
            </View>
            <View style={styles.tagTextBlock}>
              <Text style={styles.tagEyebrow}>本场比赛 · GIS 定位</Text>
              <Text style={styles.tagTitle}>{getGisTier(player.gis)}</Text>
            </View>
          </View>
        </LinearGradient>
      )}

      <View style={styles.cardHeader}>
        <View style={styles.playerIdentity}>
          <Image source={{ uri: player.headshot }} style={styles.headshot} />
          <View style={styles.nameRow}>
            <Text style={styles.playerName}>{player.name}</Text>
            <Text style={styles.playerMeta}>
              {player.teamNameZhCN} · {player.position}
            </Text>
          </View>
        </View>
        <Image source={getTeamImage(player.teamAbbreviation)} style={styles.teamLogo} />
      </View>

      <View style={styles.gameInfo}>
        <Text style={styles.gameScore}>{player.gameScore}</Text>
        <Text style={styles.gameStatus}>{gameStatusLabel}</Text>
      </View>

      {player.gis != null && (
        <View style={styles.gisHighlight}>
          <Text style={styles.gisLabel}>Swish 评分</Text>
          <Text style={styles.gisValue}>{player.gis}</Text>
        </View>
      )}

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>时间</Text>
          <Text style={styles.statValue}>{player.stats.minutes}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>得分</Text>
          <Text style={styles.statValue}>{player.stats.points}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>篮板</Text>
          <Text style={styles.statValue}>{player.stats.rebounds}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>助攻</Text>
          <Text style={styles.statValue}>{player.stats.assists}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>抢断</Text>
          <Text style={styles.statValue}>{player.stats.steals || '0'}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>盖帽</Text>
          <Text style={styles.statValue}>{player.stats.blocks || '0'}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>+/-</Text>
          <Text
            style={[
              styles.statValue,
              parseFloat(String(player.stats.plusMinus)) > 0
                ? { color: COLORS.win }
                : parseFloat(String(player.stats.plusMinus)) < 0
                  ? { color: COLORS.loss }
                  : null,
            ]}
          >
            {parseFloat(String(player.stats.plusMinus)) > 0
              ? `${player.stats.plusMinus}`
              : player.stats.plusMinus}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.shootingRow}>
        <View style={styles.shootingItem}>
          <Text style={styles.shootingLabel}>投篮</Text>
          <Text style={styles.shootingValue}>{player.stats.fieldGoals || '-'}</Text>
        </View>
        <View style={styles.shootingItem}>
          <Text style={styles.shootingLabel}>三分</Text>
          <Text style={styles.shootingValue}>{player.stats.threePointers || '-'}</Text>
        </View>
        <View style={styles.shootingItem}>
          <Text style={styles.shootingLabel}>罚球</Text>
          <Text style={styles.shootingValue}>{player.stats.freeThrows || '-'}</Text>
        </View>
        <View style={styles.shootingItem}>
          <Text style={styles.shootingLabel}>失误</Text>
          <Text style={styles.shootingValue}>{player.stats.turnovers || '-'}</Text>
        </View>
        <View style={styles.shootingItem}>
          <Text style={styles.shootingLabel}>犯规</Text>
          <Text style={styles.shootingValue}>{player.stats.fouls || '-'}</Text>
        </View>
      </View>

      <View style={styles.branding}>
        <View style={styles.brandingCopy}>
          <Text style={styles.brandText}>唰数据</Text>
          <Text style={styles.brandTag}>swishinsight.com</Text>
        </View>
        <View style={styles.qrWrap}>
          <QRCode
            value={qrPayload}
            size={56}
            color="#0a0a0a"
            backgroundColor="#FFFFFF"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0A0A0C',
    borderRadius: 0,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1C1C1E',
  },
  tagGradientShell: {
    alignSelf: 'stretch',
    marginBottom: 18,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  tagShine: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  tagIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tagTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  tagEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  tagTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tagScorePill: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 8,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 2,
  },
  tagScorePillLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tagScorePillValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  playerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headshot: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1C1C1E',
    marginRight: 16,
  },
  nameRow: {
    justifyContent: 'center',
  },
  playerName: {
    color: COLORS.textMain,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  playerMeta: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  teamLogo: {
    width: 32,
    height: 32,
  },
  gameInfo: {
    marginBottom: 24,
  },
  gameScore: {
    color: COLORS.textMain,
    fontSize: 15,
    fontWeight: '700',
  },
  gameStatus: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  gisHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 10,
    marginBottom: 24,
    backgroundColor: `${COLORS.accent}25`,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: `${COLORS.accent}50`,
  },
  gisLabel: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  gisValue: {
    color: COLORS.accent,
    fontSize: 22,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
  },
  statValue: {
    color: COLORS.textMain,
    fontSize: 20,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: '#1C1C1E',
    marginBottom: 24,
  },
  shootingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  shootingItem: {
    flex: 1,
  },
  shootingLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  shootingValue: {
    color: COLORS.textMain,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  branding: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2C2C2E',
  },
  brandingCopy: {
    flex: 1,
    minWidth: 0,
  },
  brandText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  brandTag: {
    color: '#6A6A6C',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  qrWrap: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
});
