import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { COLORS } from '@/src/constants/theme';
import { getTeamImage } from '@/src/utils/teamImages';
import { getGisTier } from '@/src/utils/getGisTier';

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
  return (
    <View style={[styles.card, { width: cardWidth }]}>
      {player.gis != null && (
        <View style={styles.tagBanner}>
          <Text style={styles.tagBannerText}>{getGisTier(player.gis)}</Text>
        </View>
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
        <Text style={styles.brandText}>唰！ Swish</Text>
        <Text style={styles.brandTag}>swishinsight.com</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0A0A0C',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1C1C1E',
  },
  tagBanner: {
    alignSelf: 'stretch',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: `${COLORS.accent}18`,
    borderWidth: 1,
    borderColor: `${COLORS.accent}44`,
  },
  tagBannerText: {
    color: COLORS.accent,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
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
    borderRadius: 14,
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
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2C2C2E',
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
  },
});
