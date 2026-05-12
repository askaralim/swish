import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export interface TopPerformer {
  id: string;
  name: string;
  teamNameZhCN?: string;
  teamAbbreviation: string;
  competitionId: string;
  headshot: string;
  value: number;
  statType: 'points' | 'rebounds' | 'assists' | 'gis';
  gis?: number;
  stats?: { points?: number; rebounds?: number; assists?: number };
  insight?: string;
}

interface HomePlayerCardProps {
  performer: TopPerformer;
  onCompare: (playerId: string, statType: TopPerformer['statType']) => void;
  onPress?: (playerId: string) => void;
  showCompare?: boolean;
  listLayout?: boolean;
  showPlayerHeadshots?: boolean;
  variant?: 'today' | 'season';
  presentation?: 'standard' | 'lead' | 'supporting';
  rank?: number;
  gameContext?: string;
}

export const HomePlayerCard: React.FC<HomePlayerCardProps> = ({
  performer,
  onCompare,
  onPress,
  showCompare = true,
  listLayout = false,
  showPlayerHeadshots = false,
  variant = 'today',
  presentation = 'standard',
  rank,
  gameContext,
}) => {
  const isSeasonVariant = variant === 'season';
  const isLead = presentation === 'lead';
  const isSupporting = presentation === 'supporting';
  const isGis = performer.statType === 'gis';

  const statLabel = () => {
    switch (performer.statType) {
      case 'points': return '得分';
      case 'rebounds': return '篮板';
      case 'assists': return '助攻';
      case 'gis': return 'Swish评分';
      default: return '';
    }
  };

  const stats = performer.stats;
  const hasStats = stats && (stats.points != null || stats.rebounds != null || stats.assists != null);
  const statItems: { value: number; unit: string }[] = hasStats
    ? [
        { value: stats!.points ?? 0, unit: '得分' },
        { value: stats!.rebounds ?? 0, unit: '篮板' },
        { value: stats!.assists ?? 0, unit: 'AST' },
      ]
    : [];

  const handleNameAreaPress = () => {
    if (onPress) {
      onPress(performer.id);
    } else if (!isGis && showCompare) {
      onCompare(performer.id, performer.statType);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const shouldShowHeadshot = (showPlayerHeadshots || isSeasonVariant) && Boolean(performer.headshot);

  const avatar = (
    shouldShowHeadshot ? (
      <Image
        source={{ uri: performer.headshot }}
        style={[
          styles.avatar,
          isLead && styles.avatarLead,
          isSupporting && styles.avatarSupporting,
        ]}
      />
    ) : (
      <View
        style={[
          styles.initialsAvatar,
          isLead && styles.avatarLead,
          isSupporting && styles.avatarSupporting,
        ]}
      >
        <Text style={styles.initialsText}>{getInitials(performer.name)}</Text>
      </View>
    )
  );

  const compareButton = showCompare ? (
    <TouchableOpacity
      style={[styles.compareButton, isSeasonVariant && styles.compareButtonSeason]}
      activeOpacity={0.7}
      onPress={() => onCompare(performer.id, isGis ? 'points' : performer.statType)}
    >
      <Ionicons
        name="git-compare-outline"
        size={isSeasonVariant ? 15 : 14}
        color={isSeasonVariant ? COLORS.textMain : COLORS.accent}
        style={styles.compareIcon}
      />
      <Text style={[styles.compareText, isSeasonVariant && styles.compareTextSeason]}>对比</Text>
    </TouchableOpacity>
  ) : null;

  if (isLead) {
    return (
      <View style={[styles.card, styles.cardListLayout, styles.cardLead]}>
        <View style={styles.leadHeader}>
          <View style={styles.rankPill}>
            <Text style={styles.rankPillText}>今日之星</Text>
          </View>
          {compareButton}
        </View>

        <TouchableOpacity style={styles.leadIdentity} activeOpacity={0.75} onPress={handleNameAreaPress}>
          {avatar}
          <View style={styles.infoContainer}>
            <Text style={styles.nameLead} numberOfLines={1}>{performer.name}</Text>
            <Text style={styles.teamLead} numberOfLines={1}>
              {performer.teamNameZhCN || performer.teamAbbreviation}
            </Text>
            {gameContext ? (
              <Text style={styles.gameContextLead} numberOfLines={1}>{gameContext}</Text>
            ) : null}
          </View>
          <View style={styles.leadScoreBlock}>
            <Text style={styles.leadScoreLabel}>{statLabel()}</Text>
            <Text style={styles.leadScoreValue}>{performer.value}</Text>
          </View>
        </TouchableOpacity>

        {statItems.length > 0 && (
          <View style={styles.leadStatsGrid}>
            {statItems.map((item) => (
              <View key={item.unit} style={styles.leadStatCell}>
                <Text style={styles.leadStatValue}>{item.value}</Text>
                <Text style={styles.leadStatUnit}>{item.unit}</Text>
              </View>
            ))}
          </View>
        )}

        {performer.insight ? (
          <View style={styles.leadInsight}>
            <Text style={styles.leadInsightText} numberOfLines={2}>{performer.insight}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  if (isSupporting) {
    return (
      <View style={[styles.card, styles.cardListLayout, styles.cardSupportingFull]}>
        <TouchableOpacity style={styles.supportingFullHeader} activeOpacity={0.75} onPress={handleNameAreaPress}>
          {avatar}
          <View style={styles.infoContainer}>
            <Text style={styles.nameSupporting} numberOfLines={1}>{performer.name}</Text>
            <Text style={styles.teamSupporting} numberOfLines={1}>
              {performer.teamNameZhCN || performer.teamAbbreviation}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.supportBodyRow}>
          <View style={styles.supportFullStatsRow}>
            {statItems.map((item, index) => (
              <React.Fragment key={item.unit}>
                <View style={styles.supportFullStatItem}>
                  <Text style={styles.supportFullStatValue}>{item.value}</Text>
                  <Text style={styles.supportFullStatUnit}>{item.unit}</Text>
                </View>
                {index < statItems.length - 1 ? (
                  <Text style={styles.supportFullStatDot}>·</Text>
                ) : null}
              </React.Fragment>
            ))}
          </View>
          <Text>
            <Text style={styles.supportFullScoreLabel}>Swish 评分 </Text>
            <Text style={styles.supportFullScoreValue}>{performer.value}</Text>
          </Text>
        </View>
        {performer.insight ? (
          <View style={styles.supportInsightDivider}>
            <Text style={styles.supportFullInsightText} numberOfLines={2}>{performer.insight}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  if (isSeasonVariant && listLayout) {
    return (
      <TouchableOpacity style={styles.seasonRowCard} activeOpacity={0.75} onPress={handleNameAreaPress}>
        <Text style={styles.seasonRowRank}>{rank ? `#${rank}` : ''}</Text>
        {avatar}
        <View style={styles.infoContainer}>
          <Text style={styles.seasonRowName} numberOfLines={1}>{performer.name}</Text>
          <Text style={styles.seasonRowTeam} numberOfLines={1}>
            {performer.teamNameZhCN || performer.teamAbbreviation}
          </Text>
        </View>
        <View style={styles.seasonRowValueBlock}>
          <Text style={styles.seasonRowValue}>{performer.value}</Text>
          <Text style={styles.seasonRowLabel}>{statLabel()}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.card,
        listLayout && styles.cardListLayout,
        isSeasonVariant && styles.cardSeason,
      ]}
    >
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.nameAreaTouchable} activeOpacity={0.7} onPress={handleNameAreaPress}>
          {avatar}
          <View style={styles.infoContainer}>
            <Text style={[styles.name, isSeasonVariant && styles.nameSeason]} numberOfLines={1}>
              {performer.name}
            </Text>
            <Text style={[styles.team, isSeasonVariant && styles.teamSeason]} numberOfLines={1}>
              {performer.teamNameZhCN || performer.teamAbbreviation}
            </Text>
          </View>
        </TouchableOpacity>
        {compareButton}
      </View>

      {isSeasonVariant ? (
        <View style={styles.seasonValueRow}>
          <Text style={[styles.statValue, rank === 1 && styles.statValueTop]}>{performer.value}</Text>
          <Text style={styles.statLabel}>{statLabel()}</Text>
        </View>
      ) : null}

      {!isSeasonVariant && (statItems.length > 0 || isGis) ? (
        <View style={styles.statsAndGisRow}>
          <View style={styles.statsRow}>
            {statItems.map((item, index) => (
              <React.Fragment key={item.unit}>
                <View style={styles.statSegment}>
                  <Text style={styles.statSegmentValue}>{item.value}</Text>
                  <Text style={styles.statSegmentUnit}>{item.unit}</Text>
                </View>
                {index < statItems.length - 1 && <Text style={styles.statSegmentDot}>·</Text>}
              </React.Fragment>
            ))}
          </View>
          <View style={styles.valueBlock}>
            <Text>
              <Text style={styles.valueLabelSwish}>Swish评分</Text>
              <Text style={[styles.valueNumber, isGis && styles.valueNumberAccent]}>{performer.value}</Text>
            </Text>
          </View>
        </View>
      ) : null}

      {!isSeasonVariant && performer.insight ? (
        <View style={styles.insightContainer}>
          <Text style={styles.insightText} numberOfLines={listLayout ? undefined : 2}>{performer.insight}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    width: 164,
    marginRight: 12,
    justifyContent: 'space-between',
    borderWidth: 0,
  },
  cardListLayout: {
    width: '100%',
    marginRight: 0,
    marginBottom: 10,
  },
  cardLead: {
    position: 'relative',
    backgroundColor: COLORS.cardElevated,
    padding: 16,
    paddingLeft: 16,
    overflow: 'hidden',
  },
  cardSupportingFull: {
    backgroundColor: COLORS.card,
    padding: 14,
  },
  cardSeason: {
    backgroundColor: COLORS.cardMuted,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankPill: {
    backgroundColor: 'rgba(29, 155, 240, 0.1)',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(29, 155, 240, 0.22)',
  },
  rankPillText: {
    color: '#D4E9FB',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  leadIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  nameAreaTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.header,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  avatarLead: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  avatarSupporting: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
  },
  initialsAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  initialsText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  infoContainer: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: COLORS.textMain,
    fontSize: 15,
    fontWeight: '700',
  },
  team: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  nameLead: {
    color: COLORS.textMain,
    fontSize: 20,
    fontWeight: '800',
  },
  teamLead: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  gameContextLead: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  nameSupporting: {
    color: COLORS.textMain,
    fontSize: 16,
    fontWeight: '800',
  },
  teamSupporting: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  nameSeason: {
    fontSize: 14,
    fontWeight: '700',
  },
  teamSeason: {
    fontSize: 12,
  },
  leadScoreBlock: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  leadScoreLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  leadScoreValue: {
    color: COLORS.textMain,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  leadStatsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  leadStatCell: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  leadStatValue: {
    color: COLORS.textMain,
    fontSize: 22,
    fontWeight: '900',
  },
  leadStatUnit: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  leadInsight: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  leadInsightText: {
    color: '#A8B0B8',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  supportingFullHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportBodyRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 14,
  },
  supportFullStatsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    minWidth: 0,
  },
  supportFullStatItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  supportFullStatValue: {
    color: COLORS.textMain,
    fontSize: 24,
    fontWeight: '900',
  },
  supportFullStatUnit: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  supportFullStatDot: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '400',
    marginHorizontal: 8,
  },
  supportFullScoreLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  supportFullScoreValue: {
    color: COLORS.textMain,
    fontSize: 24,
    fontWeight: '900',
  },
  supportInsightDivider: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  supportFullInsightText: {
    color: '#8F969D',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  seasonRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  seasonRowRank: {
    width: 28,
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '900',
  },
  seasonRowName: {
    color: COLORS.textMain,
    fontSize: 15,
    fontWeight: '800',
  },
  seasonRowTeam: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  seasonRowValueBlock: {
    alignItems: 'flex-end',
    marginLeft: 12,
    minWidth: 58,
  },
  seasonRowValue: {
    color: COLORS.textMain,
    fontSize: 22,
    fontWeight: '900',
  },
  seasonRowLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  seasonValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    color: COLORS.textMain,
    fontSize: 26,
    fontWeight: '900',
    marginRight: 5,
  },
  statValueTop: {
    color: COLORS.textMain,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  valueBlock: {
    alignItems: 'flex-end',
    marginBottom: 0,
  },
  valueLabelSwish: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
  valueNumber: {
    color: COLORS.textMain,
    fontSize: 20,
    fontWeight: '900',
  },
  valueNumberAccent: {
    color: COLORS.accent,
  },
  statsAndGisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginBottom: 0,
  },
  statSegment: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statSegmentValue: {
    color: COLORS.textMain,
    fontSize: 24,
    fontWeight: '900',
  },
  statSegmentUnit: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  statSegmentDot: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '400',
    marginHorizontal: 6,
  },
  insightContainer: {
    marginBottom: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  insightText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 16,
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 6,
    paddingRight: 0,
  },
  compareButtonSeason: {
    justifyContent: 'center',
    backgroundColor: COLORS.header,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  compareIcon: {
    marginRight: 4,
  },
  compareText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  compareTextSeason: {
    color: COLORS.textMain,
    fontSize: 12,
  },
});
