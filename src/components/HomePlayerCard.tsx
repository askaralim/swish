import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

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
  /** When true and performer has a headshot URL, show ESPN image; otherwise initials. */
  showPlayerHeadshots?: boolean;
  /** 'season' = previous design (avatar + name, then stat row). 'today' = new design (value block on right). */
  variant?: 'today' | 'season';
}

export const HomePlayerCard: React.FC<HomePlayerCardProps> = ({
  performer,
  onCompare,
  onPress,
  showCompare = true,
  listLayout = false,
  showPlayerHeadshots = false,
  variant = 'today',
}) => {
  const statLabel = () => {
    switch (performer.statType) {
      case 'points': return '得分';
      case 'rebounds': return '篮板';
      case 'assists': return '助攻';
      case 'gis': return 'GIS';
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

  const isGis = performer.statType === 'gis';
  const hasGameLink = isGis && performer.competitionId;
  const handleNameAreaPress = () => {
    if (hasGameLink && onPress) {
      onPress(performer.id);
    } else if (!isGis && onPress) {
      onPress(performer.id);
    } else if (!isGis && showCompare) {
      onCompare(performer.id, performer.statType);
    }
  };

  const isSeasonVariant = variant === 'season';

  const getInitials = (name: string) => {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={[styles.card, listLayout && styles.cardListLayout, isSeasonVariant && styles.cardSeason]}>
      {/* Row 1: Identity + (today: value on right | season: identity only) */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.nameAreaTouchable}
          activeOpacity={0.7}
          onPress={handleNameAreaPress}
        >
          {showPlayerHeadshots && performer.headshot ? (
            <Image source={{ uri: performer.headshot }} style={styles.avatar} />
          ) : (
            <View style={styles.initialsAvatar}>
              <Text style={styles.initialsText}>{getInitials(performer.name)}</Text>
            </View>
          )}
          <View style={styles.infoContainer}>
            <Text style={[styles.name, isSeasonVariant && styles.nameSeason]} numberOfLines={1}>{performer.name}</Text>
            <Text style={[styles.team, isSeasonVariant && styles.teamSeason]}>{performer.teamNameZhCN || performer.teamAbbreviation}</Text>
          </View>
        </TouchableOpacity>
        {/* Compare: today = link-style; season = previous bordered button */}
        {showCompare && (
          <TouchableOpacity
            style={[styles.compareButton, isSeasonVariant && styles.compareButtonSeason]}
            activeOpacity={0.7}
            onPress={() => onCompare(performer.id, isGis ? 'points' : performer.statType)}
          >
            <Ionicons name="git-compare-outline" size={isSeasonVariant ? 16 : 14} color={isSeasonVariant ? COLORS.textMain : COLORS.accent} style={styles.compareIcon} />
            <Text style={[styles.compareText, isSeasonVariant && styles.compareTextSeason]}>对比</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Season: stat row (big value + label) */}
      {isSeasonVariant && (
        <View style={styles.statRow}>
          <Text style={styles.statValue}>{performer.value}</Text>
          <Text style={styles.statLabel}>{statLabel()}</Text>
        </View>
      )}

      {/* One row: left = stats (PTS · REB · AST), right = GIS */}
      {(!isSeasonVariant && (statItems.length > 0 || isGis)) && (
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
      )}

      {/* Insight (today only) */}
      {!isSeasonVariant && performer.insight && (
        <View style={styles.insightContainer}>
          <Text style={styles.insightText} numberOfLines={listLayout ? undefined : 2}>{performer.insight}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    width: 160,
    marginRight: 12,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  cardListLayout: {
    width: '100%',
    marginRight: 0,
    marginBottom: 12,
  },
  cardSeason: {
    borderWidth: 0,
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
  },
  initialsAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
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
    fontSize: 16,
    fontWeight: '700',
  },
  team: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  nameSeason: {
    fontSize: 14,
    fontWeight: '600',
  },
  teamSeason: {
    fontSize: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  statValue: {
    color: COLORS.textMain,
    fontSize: 24,
    fontWeight: '800',
    marginRight: 4,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  valueBlock: {
    alignItems: 'flex-end',
    marginBottom: 0,
  },
  valueLabelSwish: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  valueNumber: {
    color: COLORS.textMain,
    fontSize: 20,
    fontWeight: '800',
  },
  valueNumberAccent: {
    color: COLORS.accent,
  },
  valueLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  valueLabelAccent: {
    color: COLORS.accent,
    fontSize: 11,
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
    fontWeight: '800',
  },
  statSegmentUnit: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
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
  insightLabel: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
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
    fontWeight: '600',
  },
  compareTextSeason: {
    color: COLORS.textMain,
    fontSize: 12,
  },
});
