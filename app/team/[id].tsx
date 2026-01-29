import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions, 
  Animated, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  fetchTeamOverview, 
  fetchTeamLeaders,
  fetchTeamRecentGames,
  fetchTeamSchedule
} from '../../src/services/api';
import { getTeamImage } from '../../src/utils/teamImages';
import { COLORS, MOTION } from '../../src/constants/theme';
import { AnimatedSection } from '../../src/components/AnimatedSection';

const { width } = Dimensions.get('window');

const HEADER_EXPANDED_HEIGHT = 160;
const HEADER_COLLAPSED_HEIGHT = 100;

// --- Types ---

// --- Types ---

interface TeamOverview {
  team: {
    id: string;
    name: string;
    nameZhCN?: string;
    city: string;
    cityZhCN?: string;
    abbreviation: string;
    logo: string;
    record: string;
    standingSummary: string;
  };
  teamStats: Record<string, { value: string, rank: number | null }>;
  players: {
    id: string;
    name: string;
    headshot: string;
    position: string;
    gamesPlayed: string;
    avgMinutes: string;
    avgPoints: string;
    avgRebounds: string;
    avgAssists: string;
    avgSteals: string;
    avgBlocks: string;
    avgTurnovers: string;
    assistTurnoverRatio: string;
  }[];
}

interface LeaderStats {
  id: string;
  name: string;
  position: string;
  jersey: string;
  headshot: string;
  mainStat: string;
  additionalStats: Record<string, string>;
}

interface TeamLeaders {
  offense: {
    points: LeaderStats | null;
    assists: LeaderStats | null;
    fieldGoalPct: LeaderStats | null;
  };
  defense: {
    rebounds: LeaderStats | null;
    steals: LeaderStats | null;
    blocks: LeaderStats | null;
  };
}

export default function TeamDetailScreen() {
  const { id: teamAbbr } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'players'>('overview');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const tabIndicatorPos = useRef(new Animated.Value(0)).current;
  const tabContentAnim = useRef(new Animated.Value(0)).current;

  // Data Fetching
  const { data: overview, isLoading: isLoadingOverview } = useQuery<TeamOverview>({
    queryKey: ['teamOverview', teamAbbr],
    queryFn: () => fetchTeamOverview(teamAbbr),
  });

  const { data: leaders } = useQuery<TeamLeaders>({
    queryKey: ['teamLeaders', teamAbbr],
    queryFn: () => fetchTeamLeaders(teamAbbr),
    enabled: !!overview,
  });

  const { 
    data: scheduleData, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfiniteQuery({
    queryKey: ['teamSchedule', teamAbbr],
    queryFn: ({ pageParam = 1 }) => fetchTeamSchedule(teamAbbr, { page: pageParam }),
    getNextPageParam: (lastPage: any) => {
      const { pagination } = lastPage.meta;
      return pagination.page < pagination.pages ? pagination.page + 1 : undefined;
    },
    enabled: !!overview,
    initialPageParam: 1,
  });

  const { data: recentGames } = useQuery({
    queryKey: ['teamRecentGames', teamAbbr],
    queryFn: () => fetchTeamRecentGames(teamAbbr, { limit: 5 }),
    enabled: !!overview,
  });

  useEffect(() => {
    if (!isLoadingOverview && overview) {
      setIsDataLoaded(true);
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: MOTION.Fast,
        easing: MOTION.AppleEasing,
        useNativeDriver: false,
      }).start();
    }
  }, [isLoadingOverview, overview, headerOpacity]);

  const handleTabChange = (tab: 'overview' | 'schedule' | 'players') => {
    if (tab === activeTab) return;
    const targetPos = tab === 'overview' ? 0 : tab === 'schedule' ? 1 : 2;

    Animated.parallel([
      Animated.timing(tabIndicatorPos, {
        toValue: targetPos,
        duration: MOTION.Standard,
        easing: MOTION.AppleEasing,
        useNativeDriver: false,
      }),
      Animated.timing(tabContentAnim, {
        toValue: 1,
        duration: MOTION.Fast,
        easing: MOTION.AppleEasing,
        useNativeDriver: true,
      })
    ]).start(() => {
      setActiveTab(tab);
      tabContentAnim.setValue(0);
    });
  };

  // Header Animations
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [HEADER_EXPANDED_HEIGHT + insets.top, HEADER_COLLAPSED_HEIGHT + insets.top],
    extrapolate: 'clamp',
  });

  const expandedOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const collapsedOpacity = scrollY.interpolate({
    inputRange: [40, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  if (isLoadingOverview) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.textSecondary} />
      </View>
    );
  }

  if (!overview) return null;

  const { team, teamStats, players } = overview;

  // --- Render Helpers ---

  const renderStatsGrid = () => {
    const statsToDisplay = [
      { key: 'avgPoints', label: '得分' },
      { key: 'avgRebounds', label: '篮板' },
      { key: 'avgAssists', label: '助攻' },
      { key: 'avgSteals', label: '抢断' },
      { key: 'avgBlocks', label: '盖帽' },
      { key: 'fieldGoalPct', label: '命中率', suffix: '%' },
      { key: 'threePointPct', label: '三分率', suffix: '%' },
      { key: 'freeThrowPct', label: '罚球率', suffix: '%' },
      { key: 'avgTurnovers', label: '失误' },
    ];

    return (
      <View style={styles.statsGrid}>
        {statsToDisplay.map((stat, idx) => {
          const data = teamStats[stat.key];
          return (
            <View key={stat.key} style={styles.statBox}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{data?.value || '-'}{stat.suffix || ''}</Text>
              {data?.rank && (
                <Text style={styles.statRank}>#{data.rank} <Text style={{fontSize: 9}}>联盟</Text></Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderRoster = () => (
    <View style={styles.gridContainer}>
      <View style={styles.pinnedColumn}>
        <View style={styles.columnHeader}>
          <Text style={styles.columnLabelPlayer}>球员</Text>
        </View>
        {players.map((player) => (
          <TouchableOpacity 
            key={`name-${player.id}`} 
            style={styles.playerRow}
            onPress={() => router.push(`/player/${player.id}`)}
          >
            <View style={styles.playerPinnedColumn}>
              <Image 
                source={{ uri: player.headshot }}
                style={styles.playerAvatar} 
              />
              <View style={styles.playerNameContainer}>
                <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
                <Text style={styles.playerPosition}>{player.position}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.columnHeader}>
            <View style={styles.columnStatsLabels}>
              <Text style={styles.columnLabel}>场次</Text>
              <Text style={styles.columnLabel}>分钟</Text>
              <Text style={[styles.columnLabel, { fontWeight: '800' }]}>得分</Text>
              <Text style={styles.columnLabel}>篮板</Text>
              <Text style={styles.columnLabel}>助攻</Text>
              <Text style={styles.columnLabel}>抢断</Text>
              <Text style={styles.columnLabel}>盖帽</Text>
              <Text style={styles.columnLabel}>失误</Text>
              <Text style={styles.columnLabelWide}>助攻/失误</Text>
            </View>
          </View>

          {players.map((player) => (
            <View key={`stats-${player.id}`} style={styles.playerRow}>
              <View style={styles.playerStatsGrid}>
                <Text style={styles.statCell}>{player.gamesPlayed}</Text>
                <Text style={styles.statCell}>{player.avgMinutes}</Text>
                <Text style={[styles.statCell, styles.statCellBold]}>{player.avgPoints}</Text>
                <Text style={styles.statCell}>{player.avgRebounds}</Text>
                <Text style={styles.statCell}>{player.avgAssists}</Text>
                <Text style={styles.statCell}>{player.avgSteals}</Text>
                <Text style={styles.statCell}>{player.avgBlocks}</Text>
                <Text style={styles.statCell}>{player.avgTurnovers}</Text>
                <Text style={styles.statCellWide}>{player.assistTurnoverRatio}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderRecentGamesSection = () => {
    if (!recentGames) return null;
    // Backend returns { last5Games: [...], next3Games: [...] }
    const games = recentGames.last5Games || [];
    if (!games.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>最近比赛</Text>
        <View style={styles.recentGamesCard}>
          {games.map((game: any, idx: number) => {
            const isHome = game.homeTeam?.abbreviation?.toLowerCase() === teamAbbr?.toLowerCase();
            const opponent = isHome ? game.awayTeam : game.homeTeam;
            const resultText = game.won ? 'W' : 'L';
            const resultColor = game.won ? '#10b981' : '#ef4444';

            return (
              <TouchableOpacity 
                key={game.id || idx} 
                style={[styles.recentGameRow, idx < games.length - 1 && styles.seriesDivider]}
                onPress={() => game.id && router.push(`/game/${game.id}`)}
              >
                <Text style={styles.recentGameDate}>{game.dateFormatted?.date || game.date}</Text>
                <View style={styles.recentGameMatchup}>
                  <Image source={getTeamImage(opponent?.abbreviation)} style={styles.recentGameLogo} />
                  <Text style={styles.recentGameOpponent}>{isHome ? 'vs' : '@'} {opponent?.abbreviation}</Text>
                </View>
                <Text style={[styles.recentGameResult, { color: resultColor }]}>
                  {resultText} {game.awayTeam?.score}-{game.homeTeam?.score}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderNextGamesSection = () => {
    if (!recentGames?.next3Games) return null;
    const upcomingGames = recentGames.next3Games;
    if (!upcomingGames.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>接下来的比赛</Text>
        <View style={styles.recentGamesCard}>
          {upcomingGames.map((game: any, idx: number) => {
            const isHome = game.homeTeam?.abbreviation?.toLowerCase() === teamAbbr?.toLowerCase();
            const opponent = isHome ? game.awayTeam : game.homeTeam;

            return (
              <TouchableOpacity 
                key={game.id || idx} 
                style={[styles.recentGameRow, idx < upcomingGames.length - 1 && styles.seriesDivider]}
                onPress={() => game.id && router.push(`/game/${game.id}`)}
              >
                <Text style={styles.recentGameDate}>{game.dateFormatted?.date || game.date}</Text>
                <View style={styles.recentGameMatchup}>
                  <Image source={getTeamImage(opponent?.abbreviation)} style={styles.recentGameLogo} />
                  <Text style={styles.recentGameOpponent}>{isHome ? 'vs' : '@'} {opponent?.abbreviation}</Text>
                </View>
                <Text style={styles.recentGameTime}>
                  {game.date ? new Date(game.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '-'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderOverviewTab = () => {
    // Backend returns { offense: { points, assists, fieldGoalPct }, defense: { rebounds, steals, blocks } }
    const offenseCats = [
      { label: '得分王', data: leaders?.offense?.points },
      { label: '助攻王', data: leaders?.offense?.assists },
      { label: '命中率', data: leaders?.offense?.fieldGoalPct },
    ].filter(l => l.data);

    const defenseCats = [
      { label: '篮板王', data: leaders?.defense?.rebounds },
      { label: '抢断王', data: leaders?.defense?.steals },
      { label: '盖帽王', data: leaders?.defense?.blocks },
    ].filter(l => l.data);

    const renderLeaderGroup = (title: string, cats: any[]) => {
      if (cats.length === 0) return null;
      return (
        <View style={styles.leaderGroup}>
          <Text style={styles.leaderGroupTitle}>{title}</Text>
          <View style={{ gap: 12 }}>
            {cats.map((leader, idx) => (
              <View key={idx} style={styles.leaderSectionMini}>
                <View style={styles.leaderHeaderMini}>
                  <Text style={styles.leaderTitleMini}>{leader.label}</Text>
                </View>
                <View style={styles.leaderCardMini}>
                  <View style={styles.leaderRowMini}>
                    <Image source={{ uri: leader.data.headshot }} style={styles.leaderAvatarMini} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.leaderNameMini}>{leader.data.name}</Text>
                      <Text style={styles.leaderValueMini}>{leader.data.mainStat}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      );
    };

    return (
      <View style={styles.tabContent}>
        <AnimatedSection index={0} visible={isDataLoaded}>
          <View style={styles.section}>
            {renderStatsGrid()}
          </View>
        </AnimatedSection>

        <AnimatedSection index={1} visible={isDataLoaded}>
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>球队领袖</Text>
            {!leaders ? (
              <ActivityIndicator size="small" color={COLORS.textSecondary} />
            ) : (
              <View style={{ gap: 20 }}>
                {renderLeaderGroup('进攻', offenseCats)}
                {renderLeaderGroup('防守', defenseCats)}
              </View>
            )}
          </View>
        </AnimatedSection>

        <AnimatedSection index={2} visible={isDataLoaded}>
          {renderNextGamesSection()}
        </AnimatedSection>

        <AnimatedSection index={3} visible={isDataLoaded}>
          {renderRecentGamesSection()}
        </AnimatedSection>
      </View>
    );
  };

  const renderPlayersTab = () => (
    <View style={styles.tabContent}>
      <AnimatedSection index={0} visible={isDataLoaded}>
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>球员名单</Text>
          {renderRoster()}
        </View>
      </AnimatedSection>
    </View>
  );

  const renderScheduleTab = () => {
    if (!scheduleData) return <ActivityIndicator size="small" color={COLORS.textSecondary} style={{marginTop: 40}} />;
    
    // Combine all pages of events
    const allEvents = scheduleData.pages.flatMap(page => page.data.events || []);

    return (
      <View style={styles.tabContent}>
        {allEvents.map((event: any, idx: number) => {
          const competition = event.competitions?.[0];
          const status = competition?.status?.type;
          const homeTeam = competition?.competitors?.find((t: any) => t.homeAway === 'home');
          const awayTeam = competition?.competitors?.find((t: any) => t.homeAway === 'away');
          
          // Determine if the current team won/lost if game is finished
          let resultText = '';
          let resultColor = COLORS.textSecondary;
          
          if (status?.completed) {
            const teamId = overview.team.id;
            const currentTeamCompetitor = competition?.competitors?.find((t: any) => t.team.id === teamId);
            const otherTeamCompetitor = competition?.competitors?.find((t: any) => t.team.id !== teamId);
            
            if (currentTeamCompetitor && otherTeamCompetitor) {
              const currentScore = parseInt(String(currentTeamCompetitor.score?.displayValue || currentTeamCompetitor.score || '0'), 10);
              const otherScore = parseInt(String(otherTeamCompetitor.score?.displayValue || otherTeamCompetitor.score || '0'), 10);
              const won = currentScore > otherScore;
              resultText = won ? 'W' : 'L';
              resultColor = won ? '#10b981' : '#ef4444';
            }
          }

          return (
            <AnimatedSection key={event.id || idx} index={idx % 20} visible={isDataLoaded}>
              <TouchableOpacity 
                style={styles.scheduleCard}
                onPress={() => {
                  if (event.id) router.push(`/game/${event.id}`);
                }}
              >
                <View style={styles.scheduleDateCol}>
                  <Text style={styles.scheduleDate}>{event.date ? new Date(event.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) : '-'}</Text>
                  <Text style={styles.scheduleStatus}>{status?.description}</Text>
                </View>
                
                <View style={styles.scheduleMatchup}>
                  <View style={styles.scheduleTeamRow}>
                    <Image source={getTeamImage(awayTeam?.team?.abbreviation)} style={styles.scheduleLogo} />
                    <Text style={styles.seriesVs}>@</Text>
                    <Image source={getTeamImage(homeTeam?.team?.abbreviation)} style={styles.scheduleLogo} />
                  </View>
                </View>

                <View style={styles.scheduleResult}>
                  {status?.completed ? (
                    <Text style={[styles.scheduleScore, { color: resultColor }]}>
                      {resultText} {awayTeam?.score}-{homeTeam?.score}
                    </Text>
                  ) : (
                    <Text style={styles.scheduleTime}>{event.date ? new Date(event.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '-'}</Text>
                  )}
                </View>
              </TouchableOpacity>
            </AnimatedSection>
          );
        })}

        {/* Load More Button */}
        {hasNextPage && (
          <TouchableOpacity 
            style={styles.loadMoreButton} 
            onPress={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <ActivityIndicator size="small" color={COLORS.accent} />
            ) : (
              <Text style={styles.loadMoreText}>加载更多</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={[styles.header, { height: headerHeight, paddingTop: insets.top, opacity: headerOpacity }]}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
          </TouchableOpacity>
          
          <Animated.View style={[styles.compactHeader, { opacity: collapsedOpacity }]}>
            <Image source={getTeamImage(team.abbreviation)} style={styles.compactLogo} />
            <Text style={styles.compactTitle}>{team.nameZhCN || team.name}</Text>
          </Animated.View>
          
          <View style={styles.iconButton} />
        </View>

        {/* Expanded Content */}
        <Animated.View style={[styles.expandedContent, { opacity: expandedOpacity }]}>
          <View style={styles.headerTop}>
            <Image source={getTeamImage(team.abbreviation)} style={styles.mainLogo} />
            <View style={styles.headerInfo}>
              <Text style={styles.teamCity}>{team.cityZhCN || team.city}</Text>
              <Text style={styles.teamNameMain}>{team.nameZhCN || team.name}</Text>
              <Text style={styles.teamRecord}>{team.record} • {team.standingSummary}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabs}>
            <TouchableOpacity onPress={() => handleTabChange('overview')} style={styles.tab}>
              <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>概览</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleTabChange('schedule')} style={styles.tab}>
              <Text style={[styles.tabText, activeTab === 'schedule' && styles.tabTextActive]}>赛程</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleTabChange('players')} style={styles.tab}>
              <Text style={[styles.tabText, activeTab === 'players' && styles.tabTextActive]}>球员</Text>
            </TouchableOpacity>
          </View>
          <Animated.View style={[styles.tabIndicator, { 
            left: tabIndicatorPos.interpolate({
              inputRange: [0, 1, 2],
              outputRange: [0, width / 3, (width / 3) * 2]
            }) 
          }]} />
        </View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: HEADER_EXPANDED_HEIGHT + insets.top + 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{
          opacity: tabContentAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.95] }),
          transform: [{ translateX: tabContentAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 16] }) }]
        }}>
          {activeTab === 'overview' ? renderOverviewTab() : 
           activeTab === 'schedule' ? renderScheduleTab() : renderPlayersTab()}
        </Animated.View>
        <View style={{ height: insets.bottom + 100 }} />
      </Animated.ScrollView>
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
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: COLORS.header,
    overflow: 'hidden',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 44,
    zIndex: 110,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  compactLogo: {
    width: 24,
    height: 24,
  },
  compactTitle: {
    color: COLORS.textMain,
    fontSize: 16,
    fontWeight: '700',
  },
  expandedContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    height: 100,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  mainLogo: {
    width: 64,
    height: 64,
  },
  headerInfo: {
    flex: 1,
  },
  teamCity: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  teamNameMain: {
    color: COLORS.textMain,
    fontSize: 24,
    fontWeight: '800',
    marginVertical: 2,
  },
  teamRecord: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  tabsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: COLORS.header,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.divider,
  },
  tabs: {
    flexDirection: 'row',
    flex: 1,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.textMain,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: width / 3,
    height: 2,
    backgroundColor: COLORS.accent,
  },
  tabContent: {
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    color: COLORS.textMain,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    width: (width - 32 - 24) / 3,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    color: COLORS.textMain,
    fontSize: 18,
    fontWeight: '700',
  },
  statRank: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  gridContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  pinnedColumn: {
    width: 160,
    backgroundColor: COLORS.card,
    zIndex: 1,
  },
  columnHeader: {
    height: 40,
    justifyContent: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.divider,
    backgroundColor: '#1c1c1e',
  },
  columnLabelPlayer: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    paddingLeft: 12,
  },
  columnStatsLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    backgroundColor: '#1c1c1e',
  },
  columnLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    width: 45,
    textAlign: 'center',
  },
  columnLabelWide: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    width: 60,
    textAlign: 'center',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.divider,
  },
  playerPinnedColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 160,
    paddingLeft: 12,
  },
  playerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2c2c2e',
    marginRight: 8,
  },
  playerNameContainer: {
    flex: 1,
  },
  playerName: {
    color: COLORS.textMain,
    fontSize: 12,
    fontWeight: '600',
  },
  playerPosition: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '500',
  },
  playerStatsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCell: {
    color: COLORS.textMain,
    fontSize: 12,
    fontWeight: '500',
    width: 45,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statCellWide: {
    color: COLORS.textMain,
    fontSize: 12,
    fontWeight: '500',
    width: 60,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statCellBold: {
    fontWeight: '700',
    color: COLORS.textMain,
  },
  leaderSection: {
    marginBottom: 24,
  },
  leaderHeader: {
    marginBottom: 12,
  },
  leaderTitle: {
    color: COLORS.textMain,
    fontSize: 16,
    fontWeight: '600',
  },
  leaderCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 4,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  leaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leaderRank: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    width: 12,
  },
  leaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2c2c2e',
  },
  leaderName: {
    color: COLORS.textMain,
    fontSize: 14,
    fontWeight: '600',
  },
  leaderPos: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  leaderValue: {
    color: COLORS.textMain,
    fontSize: 16,
    fontWeight: '700',
  },
  seriesDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.divider,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  scheduleDateCol: {
    width: 70,
  },
  scheduleDate: {
    color: COLORS.textMain,
    fontSize: 13,
    fontWeight: '600',
  },
  scheduleStatus: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  scheduleMatchup: {
    flex: 1,
    justifyContent: 'center',
  },
  scheduleTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduleLogo: {
    width: 24,
    height: 24,
  },
  scheduleOpponent: {
    color: COLORS.textMain,
    fontSize: 14,
    fontWeight: '500',
  },
  seriesVs: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  scheduleResult: {
    width: 80,
    alignItems: 'flex-end',
  },
  scheduleScore: {
    fontSize: 14,
    fontWeight: '700',
  },
  scheduleTime: {
    color: COLORS.textMain,
    fontSize: 13,
    fontWeight: '600',
  },
  recentGamesCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  recentGameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  recentGameDate: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    width: 60,
  },
  recentGameMatchup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recentGameLogo: {
    width: 20,
    height: 20,
  },
  recentGameOpponent: {
    color: COLORS.textMain,
    fontSize: 14,
    fontWeight: '600',
  },
  recentGameResult: {
    fontSize: 14,
    fontWeight: '700',
    width: 80,
    textAlign: 'right',
  },
  recentGameTime: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    width: 80,
    textAlign: 'right',
  },
  // Mini Leader Styles for Overview
  leaderSectionMini: {
    marginBottom: 0,
  },
  leaderGroup: {
    marginBottom: 8,
  },
  leaderGroupTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  leaderHeaderMini: {
    marginBottom: 8,
  },
  leaderTitleMini: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  leaderCardMini: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
  },
  leaderRowMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leaderAvatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2c2c2e',
  },
  leaderNameMini: {
    color: COLORS.textMain,
    fontSize: 14,
    fontWeight: '600',
  },
  leaderValueMini: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  loadMoreButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  loadMoreText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});
