import { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  Dimensions, 
  Animated, 
  Easing, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { fetchPlayerStats, fetchAppConfig } from '../src/services/api';
import {
  SEASON_TYPES,
  buildSeasonParam,
  getSeasonSubtitle,
  CURRENT_SEASON_YEAR,
} from '../src/constants/season';
import { STAT_SECTIONS } from '../src/config/playerStats';
import { PlayerStatsResponse, Player } from '../src/types/player';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, MOTION } from '../src/constants/theme';
import { AnimatedSection } from '../src/components/AnimatedSection';
import { Skeleton } from '../src/components/Skeleton';
import { ErrorState } from '../src/components/ErrorState';
import { ScreenHeader } from '../src/components/ScreenHeader';

const { width } = Dimensions.get('window');

export default function PlayersStatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [viewPostseasonStats, setViewPostseasonStats] = useState(false);
  const positionFilter = 'all-positions';

  const { data: appConfig } = useQuery({
    queryKey: ['appConfig'],
    queryFn: fetchAppConfig,
    staleTime: 30 * 60 * 1000,
  });
  const leagueYear = appConfig?.leagueSeason?.year ?? CURRENT_SEASON_YEAR;
  const leagueDisplay = appConfig?.leagueSeason?.displayName;

  const effectiveSeason = buildSeasonParam(
    viewPostseasonStats ? SEASON_TYPES.POSTSEASON : SEASON_TYPES.REGULAR,
    leagueYear
  );

  const { data, isLoading, error, refetch, isRefetching } = useQuery<PlayerStatsResponse>({
    queryKey: ['playerStats', effectiveSeason, positionFilter, leagueYear],
    queryFn: () =>
      fetchPlayerStats({
        season: effectiveSeason,
        position: positionFilter,
        limit: 100,
      }),
  });

  const showPostseasonStatsToggle = data?.seasonMeta?.postseasonAvailable === true;

  useEffect(() => {
    if (!showPostseasonStatsToggle && viewPostseasonStats) {
      setViewPostseasonStats(false);
    }
  }, [showPostseasonStatsToggle, viewPostseasonStats]);

  const renderPlayerCard = (player: Player, statName: string) => {
    const stat = player.stats[statName];
    const statValue = stat?.displayValue || '-';
    const gamesPlayed = player.stats.gamesPlayed?.displayValue || '-';
    const rank = player.statRank;

    const getRankBadgeColor = () => {
      if (rank === 1) return '#FCD34D'; // Gold
      if (rank === 2) return '#D1D5DB'; // Silver
      if (rank === 3) return '#FED7AA'; // Bronze
      return 'transparent';
    };

    return (
      <TouchableOpacity
        key={`${player.id}-${statName}`}
        style={styles.playerCard}
        activeOpacity={0.7}
        onPress={() => router.push(`/player/${player.id}`)}
      >
        <View style={styles.cardRankContainer}>
          <View style={[styles.rankBadge, rank <= 3 && { backgroundColor: getRankBadgeColor() }]}>
            <Text style={[styles.rankText, rank <= 3 && { color: '#000' }]}>{rank}</Text>
          </View>
        </View>

        <View style={styles.cardAvatarContainer}>
          <Image 
            source={{ uri: player.headshot || `https://a.espncdn.com/i/headshots/nba/600/${player.id}.png` }} 
            style={styles.playerAvatar} 
          />
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
          <View style={styles.playerTeamRow}>
            {player.teamLogo && (
              <Image source={{ uri: player.teamLogo }} style={styles.teamLogoSmall} />
            )}
            <Text style={styles.teamNameSmall} numberOfLines={1}>{player.teamNameZhCN}</Text>
          </View>
        </View>

        <View style={styles.cardStat}>
          <Text style={[styles.statValueText, rank === 1 && { color: '#FCD34D' }]}>{statValue}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStatSection = (section: typeof STAT_SECTIONS[0], index: number) => {
    const categoryData = data?.topPlayersByStat[section.statName];
    if (!categoryData || !categoryData.players || categoryData.players.length === 0) {
      return null;
    }

    // Show top 9 players
    const top9 = categoryData.players.slice(0, 9);

    return (
      <AnimatedSection key={section.statName} index={index} visible={!isLoading && !isRefetching}>
        <View style={styles.statSection}>
          <LinearGradient
            colors={[section.color + '40', section.color + '10', COLORS.bg]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.sectionHeaderGradient}
          >
            <View style={styles.sectionHeaderContent}>
              <Text style={styles.sectionIcon}>{section.icon}</Text>
              <View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionDescription}>{categoryData.description}</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.playersGrid}>
            {top9.map((player) => renderPlayerCard(player, section.statName))}
          </View>
        </View>
      </AnimatedSection>
    );
  };

  if (isLoading || (isRefetching && !data)) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title="赛季表现"
          subtitle={getSeasonSubtitle(SEASON_TYPES.REGULAR, leagueDisplay)}
          insetsTop={insets.top}
        />
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {[1, 2].map((i) => (
            <View key={i} style={styles.skeletonSection}>
              <Skeleton width={width - 32} height={100} borderRadius={16} />
              <View style={{ marginTop: 12 }}>
                {[1, 2, 3].map((j) => (
                  <View key={j} style={styles.skeletonPlayerRow}>
                    <Skeleton width={24} height={24} borderRadius={12} />
                    <Skeleton width={32} height={32} borderRadius={16} style={{ marginLeft: 12 }} />
                    <Skeleton width={120} height={16} style={{ marginLeft: 12 }} />
                    <View style={{ flex: 1 }} />
                    <Skeleton width={40} height={16} />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (error && !isRefetching) {
    return (
      <ErrorState 
        message={error instanceof Error ? error.message : '无法获取球员榜单'} 
        onRetry={refetch} 
      />
    );
  }

  const headerSubtitle = showPostseasonStatsToggle
    ? getSeasonSubtitle(
        viewPostseasonStats ? SEASON_TYPES.POSTSEASON : SEASON_TYPES.REGULAR,
        leagueDisplay
      )
    : data?.metadata
      ? leagueDisplay
        ? `${leagueDisplay} 赛季 • ${data.metadata.seasonType}`
        : `${data.metadata.season} • ${data.metadata.seasonType}`
      : getSeasonSubtitle(SEASON_TYPES.REGULAR, leagueDisplay);

  return (
    <View style={styles.container}>
      <ScreenHeader title="赛季表现" subtitle={headerSubtitle} insetsTop={insets.top} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {showPostseasonStatsToggle && (
          <View style={styles.seasonSegmentRow}>
            <TouchableOpacity
              style={[
                styles.seasonSegmentBtn,
                !viewPostseasonStats && styles.seasonSegmentBtnActive,
              ]}
              onPress={() => setViewPostseasonStats(false)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.seasonSegmentText,
                  !viewPostseasonStats && styles.seasonSegmentTextActive,
                ]}
              >
                常规赛
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.seasonSegmentBtn,
                viewPostseasonStats && styles.seasonSegmentBtnActive,
              ]}
              onPress={() => setViewPostseasonStats(true)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.seasonSegmentText,
                  viewPostseasonStats && styles.seasonSegmentTextActive,
                ]}
              >
                季后赛
              </Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.sectionsList}>
          {STAT_SECTIONS.map((section, index) => renderStatSection(section, index))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    color: COLORS.textMain,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  retryButtonText: {
    color: COLORS.textMain,
    fontWeight: '600',
  },
  seasonSegmentRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  seasonSegmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  seasonSegmentBtnActive: {
    backgroundColor: COLORS.accent + '22',
  },
  seasonSegmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  seasonSegmentTextActive: {
    color: COLORS.accent,
  },
  scrollView: {
    flex: 1,
  },
  sectionsList: {
    paddingTop: 10,
  },
  statSection: {
    marginBottom: 20,
  },
  sectionHeaderGradient: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIcon: {
    fontSize: 32,
  },
  sectionTitle: {
    color: COLORS.textMain,
    fontSize: 20,
    fontWeight: '700',
  },
  sectionDescription: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  playersGrid: {
    paddingHorizontal: 12,
    marginTop: 10,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardRankContainer: {
    width: 24,
    alignItems: 'center',
  },
  rankBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  cardAvatarContainer: {
    marginHorizontal: 12,
  },
  playerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.header,
  },
  cardInfo: {
    flex: 1,
  },
  playerName: {
    color: COLORS.textMain,
    fontSize: 15,
    fontWeight: '600',
  },
  playerTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  teamLogoSmall: {
    width: 14,
    height: 14,
  },
  teamNameSmall: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  cardStat: {
    alignItems: 'flex-end',
    width: 70,
  },
  statValueText: {
    color: COLORS.textMain,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  gpText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  skeletonSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  skeletonPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.divider,
  },
});
