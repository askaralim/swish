import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useRef, useMemo } from 'react';
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
  fetchGameDetail, 
  fetchGameSummary, 
  fetchTeamStats, 
} from '../services/api';
import { getTeamImage } from '../utils/teamImages';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const HEADER_EXPANDED_HEIGHT = 220;
const HEADER_COLLAPSED_HEIGHT = 100;

// --- Types ---
interface Period {
  period: number;
  score: number;
  periodType: string;
}

interface Team {
  id: string;
  name: string;
  nameZhCN?: string;
  city: string;
  cityZhCN?: string;
  abbreviation: string;
  logo: string;
  wins: number;
  losses: number;
  score: number;
  periods: Period[];
  topPerformers?: {
    points: any[];
    rebounds: any[];
    assists: any[];
    plusMinus: any[];
  };
}

interface GameDetail {
  gameId: string;
  gameStatusText: string;
  gameStatus: number;
  period: number;
  gameClock: string;
  homeTeam: Team;
  awayTeam: Team;
  seasonSeries: {
    games: Array<any>;
  };
  boxscore?: {
    teamStatistics?: {
      team1: any;
      team2: any;
    };
    teams: any[];
    gameMVP?: any;
  };
}

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'game' | 'away' | 'home'>('game');
  
  const scrollY = useRef(new Animated.Value(0)).current;

  // Data Fetching
  const { data: game, isLoading: isLoadingDetail, error: detailError } = useQuery<GameDetail>({
    queryKey: ['gameDetail', id],
    queryFn: () => fetchGameDetail(id),
  });

  const { data: summaryData } = useQuery({
    queryKey: ['gameSummary', id],
    queryFn: () => fetchGameSummary(id),
    enabled: !!game && game.gameStatus === 3,
  });

  // Animations logic
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_EXPANDED_HEIGHT - HEADER_COLLAPSED_HEIGHT],
    outputRange: [HEADER_EXPANDED_HEIGHT + insets.top, HEADER_COLLAPSED_HEIGHT + insets.top],
    extrapolate: 'clamp',
  });

  const scoreboardTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_EXPANDED_HEIGHT - HEADER_COLLAPSED_HEIGHT],
    outputRange: [0, -60],
    extrapolate: 'clamp',
  });

  const scoreboardOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const compactScoreOpacity = scrollY.interpolate({
    inputRange: [100, 140],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const logoScale = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0.7],
    extrapolate: 'clamp',
  });

  if (isLoadingDetail) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1d9bf0" />
      </View>
    );
  }

  if (detailError || !game) return null;

  const { homeTeam, awayTeam } = game;
  const isScheduled = game.gameStatus === 1;
  const isFinished = game.gameStatus === 3;

  const renderStatRow = (label: string, awayVal: string | number, homeVal: string | number, awayPct: number, homePct: number, awayDisplay?: string, homeDisplay?: string) => (
    <View style={styles.statRow} key={label}>
      <View style={styles.statLabelRow}>
        <View style={styles.statValueContainer}>
          <Text style={styles.statMainValue}>{awayVal}</Text>
          {awayDisplay && <Text style={styles.statSubValue}>{awayDisplay}</Text>}
        </View>
        <Text style={styles.statLabelText}>{label}</Text>
        <View style={[styles.statValueContainer, { alignItems: 'flex-end' }]}>
          <Text style={styles.statMainValue}>{homeVal}</Text>
          {homeDisplay && <Text style={styles.statSubValue}>{homeDisplay}</Text>}
        </View>
      </View>
      <View style={styles.statBarContainer}>
        <View style={styles.statBarBg}>
          <View style={[styles.statBarFill, { width: `${awayPct}%`, backgroundColor: '#71767a', left: 0 }]} />
          <View style={[styles.statBarFill, { width: `${homePct}%`, backgroundColor: '#1d9bf0', right: 0 }]} />
        </View>
      </View>
    </View>
  );

  const renderTopPerformersComparison = () => {
    if (isScheduled || !game.boxscore?.teams) return null;
    const awayP = game.boxscore.teams.find(t => t.homeAway === 'away')?.topPerformers;
    const homeP = game.boxscore.teams.find(t => t.homeAway === 'home')?.topPerformers;

    if (!awayP || !homeP) return null;

    const renderPerformerRow = (label: string, awayPerf: any, homePerf: any, statKey: string) => (
      <View style={styles.perfRow} key={label}>
        <View style={styles.perfPlayer}>
          <View style={styles.perfPlayerInfo}>
            <Text style={styles.perfName} numberOfLines={1}>{awayPerf.shortName || awayPerf.name}</Text>
            <Text style={styles.perfStat}>{awayPerf.stats[statKey]}</Text>
          </View>
          <Image source={{ uri: awayPerf.headshot }} style={styles.perfHeadshot} />
        </View>
        
        <Text style={styles.perfLabel}>{label}</Text>
        
        <View style={styles.perfPlayer}>
          <Image source={{ uri: homePerf.headshot }} style={[styles.perfHeadshot, { marginLeft: 0, marginRight: 8 }]} />
          <View style={[styles.perfPlayerInfo, { alignItems: 'flex-start' }]}>
            <Text style={styles.perfName} numberOfLines={1}>{homePerf.shortName || homePerf.name}</Text>
            <Text style={styles.perfStat}>{homePerf.stats[statKey]}</Text>
          </View>
        </View>
      </View>
    );

    return (
      <View style={styles.infoSection}>
        <Text style={styles.sectionHeader}>最佳表现</Text>
        <View style={styles.perfCard}>
          {renderPerformerRow('得分', awayP.points[0], homeP.points[0], 'points')}
          <View style={styles.perfDivider} />
          {renderPerformerRow('篮板', awayP.rebounds[0], homeP.rebounds[0], 'rebounds')}
          <View style={styles.perfDivider} />
          {renderPerformerRow('助攻', awayP.assists[0], homeP.assists[0], 'assists')}
        </View>
      </View>
    );
  };

  const renderDetailedTeamStats = () => {
    if (isScheduled || !game.boxscore?.teamStatistics) return null;
    const t1 = game.boxscore.teamStatistics.team1; // Away
    const t2 = game.boxscore.teamStatistics.team2; // Home

    const renderStatRow = (label: string, awayVal: string | number, homeVal: string | number, awayPct: number, homePct: number, awayDisplay?: string, homeDisplay?: string) => (
      <View style={styles.statRow} key={label}>
        <View style={styles.statLabelRow}>
          <View style={styles.statValueContainer}>
            <Text style={styles.statMainValue}>{awayVal}</Text>
            {awayDisplay && <Text style={styles.statSubValue}>{awayDisplay}</Text>}
          </View>
          <Text style={styles.statLabelText}>{label}</Text>
          <View style={[styles.statValueContainer, { alignItems: 'flex-end' }]}>
            <Text style={styles.statMainValue}>{homeVal}</Text>
            {homeDisplay && <Text style={styles.statSubValue}>{homeDisplay}</Text>}
          </View>
        </View>
        <View style={styles.statBarContainer}>
          <View style={styles.statBarBg}>
            <View style={[styles.statBarFill, { width: `${awayPct}%`, backgroundColor: '#71767a', left: 0 }]} />
            <View style={[styles.statBarFill, { width: `${homePct}%`, backgroundColor: '#1d9bf0', right: 0 }]} />
          </View>
        </View>
      </View>
    );

    const calcPct = (v1: any, v2: any) => {
      const val1 = parseFloat(v1) || 0;
      const val2 = parseFloat(v2) || 0;
      if (val1 + val2 === 0) return 0;
      return (val1 / (val1 + val2)) * 100;
    };

    return (
      <View style={styles.infoSection}>
        <Text style={styles.sectionHeader}>球队统计</Text>
        <View style={styles.detailedStatsCard}>
          <View style={styles.statsHeader}>
            <Image source={getTeamImage(awayTeam.abbreviation)} style={styles.miniLogo} />
            <Text style={styles.statsTitle}>数据对比</Text>
            <Image source={getTeamImage(homeTeam.abbreviation)} style={styles.miniLogo} />
          </View>

          {/* Group 1: Efficiency */}
          <View style={styles.statsGroup}>
            {renderStatRow('投篮 (FG)', t1.fieldGoals, t2.fieldGoals, calcPct(t1.fieldGoalPercent, t2.fieldGoalPercent), calcPct(t2.fieldGoalPercent, t1.fieldGoalPercent), `${t1.fieldGoalPercent}%`, `${t2.fieldGoalPercent}%`)}
            {renderStatRow('三分 (3FG)', t1.threePointers, t2.threePointers, calcPct(t1.threePointPercent, t2.threePointPercent), calcPct(t2.threePointPercent, t1.threePointPercent), `${t1.threePointPercent}%`, `${t2.threePointPercent}%`)}
            {renderStatRow('罚球 (FT)', t1.freeThrows, t2.freeThrows, calcPct(t1.freeThrowPercent, t2.freeThrowPercent), calcPct(t2.freeThrowPercent, t1.freeThrowPercent), `${t1.freeThrowPercent}%`, `${t2.freeThrowPercent}%`)}
          </View>

          <View style={styles.statsDivider} />

          {/* Group 2: Possession */}
          <View style={styles.statsGroup}>
            {renderStatRow('篮板', t1.rebounds, t2.rebounds, calcPct(t1.rebounds, t2.rebounds), calcPct(t2.rebounds, t1.rebounds))}
            {renderStatRow('助攻', t1.assists, t2.assists, calcPct(t1.assists, t2.assists), calcPct(t2.assists, t1.assists))}
            {renderStatRow('抢断', t1.steals, t2.steals, calcPct(t1.steals, t2.steals), calcPct(t2.steals, t1.steals))}
            {renderStatRow('盖帽', t1.blocks, t2.blocks, calcPct(t1.blocks, t2.blocks), calcPct(t2.blocks, t1.blocks))}
            {renderStatRow('失误', t1.turnovers, t2.turnovers, calcPct(t2.turnovers, t1.turnovers), calcPct(t1.turnovers, t2.turnovers))}
          </View>

          <View style={styles.statsDivider} />

          {/* Group 3: Specialty */}
          <View style={styles.statsGroup}>
            {renderStatRow('禁区得分', t1.pointsInPaint, t2.pointsInPaint, calcPct(t1.pointsInPaint, t2.pointsInPaint), calcPct(t2.pointsInPaint, t1.pointsInPaint))}
            {renderStatRow('快攻得分', t1.fastBreakPoints, t2.fastBreakPoints, calcPct(t1.fastBreakPoints, t2.fastBreakPoints), calcPct(t2.fastBreakPoints, t1.fastBreakPoints))}
            {renderStatRow('失误得分', t1.turnoverPoints, t2.turnoverPoints, calcPct(t1.turnoverPoints, t2.turnoverPoints), calcPct(t2.turnoverPoints, t1.turnoverPoints))}
          </View>

          <View style={styles.statsDivider} />

          {/* Group 4: Extras */}
          <View style={styles.statsGroup}>
            {renderStatRow('最大领先', t1.largestLead, t2.largestLead, calcPct(t1.largestLead, t2.largestLead), calcPct(t2.largestLead, t1.largestLead))}
            {renderStatRow('犯规', t1.fouls, t2.fouls, calcPct(t2.fouls, t1.fouls), calcPct(t1.fouls, t2.fouls))}
          </View>
        </View>
      </View>
    );
  };

  const renderGameTab = () => (
    <View style={styles.tabContent}>
      {/* AI Summary Highlight */}
      {isFinished && summaryData?.summary && (
        <View style={styles.highlightSection}>
          <LinearGradient
            colors={['#1d9bf015', '#000000']}
            style={styles.aiSummaryCard}
          >
            <View style={styles.aiHeader}>
              <Ionicons name="sparkles" size={16} color="#1d9bf0" />
              <Text style={styles.aiTitle}>AI 比赛总结</Text>
            </View>
            <Text style={styles.aiText}>{summaryData.summary}</Text>
          </LinearGradient>
        </View>
      )}

      {/* MVP Section */}
      {game.boxscore?.gameMVP && !isScheduled && (
        <View style={styles.heroSection}>
          <Text style={styles.sectionHeader}>主宰比赛</Text>
          <View style={styles.mvpCompactCard}>
            <Image source={{ uri: game.boxscore.gameMVP.headshot }} style={styles.mvpHeadshot} />
            <View style={styles.mvpInfo}>
              <Text style={styles.mvpName}>{game.boxscore.gameMVP.name}</Text>
              <View style={styles.mvpStatsRow}>
                <Text style={styles.mvpStatItem}><Text style={styles.white}>{game.boxscore.gameMVP.stats.points}</Text> 得分</Text>
                <Text style={styles.mvpStatItem}><Text style={styles.white}>{game.boxscore.gameMVP.stats.rebounds}</Text> 篮板</Text>
                <Text style={styles.mvpStatItem}><Text style={styles.white}>{game.boxscore.gameMVP.stats.assists}</Text> 助攻</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Best Performers Section */}
      {renderTopPerformersComparison()}

      {/* Detailed Team Stats */}
      {renderDetailedTeamStats()}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Animated Sticky Header */}
      <Animated.View style={[styles.header, { height: headerHeight, paddingTop: insets.top }]}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={28} color="#ffffff" />
          </TouchableOpacity>
          <Animated.View style={[styles.compactScore, { opacity: compactScoreOpacity }]}>
            <Text style={styles.compactScoreText}>{awayTeam.abbreviation} {awayTeam.score} - {homeTeam.score} {homeTeam.abbreviation}</Text>
          </Animated.View>
          <View style={styles.iconButton} />
        </View>

        {/* Expanded Content Area (Absolute positioned within shrinking header) */}
        <Animated.View style={[
          styles.scoreboard, 
          { 
            opacity: scoreboardOpacity,
            transform: [{ translateY: scoreboardTranslateY }]
          }
        ]}>
          <View style={styles.teamContainer}>
            <Animated.Image 
              source={getTeamImage(awayTeam.abbreviation)} 
              style={[styles.logo, { transform: [{ scale: logoScale }] }]} 
            />
            <Text style={styles.teamName}>{awayTeam.nameZhCN || awayTeam.name}</Text>
          </View>
          
          <View style={styles.scoreContainer}>
            <Text style={styles.gameStatusText}>{game.gameStatusText}</Text>
            <Text style={styles.mainScore}>{awayTeam.score} - {homeTeam.score}</Text>
            {game.gameStatus === 2 && <View style={styles.liveIndicator}><Text style={styles.liveText}>LIVE</Text></View>}
          </View>

          <View style={styles.teamContainer}>
            <Animated.Image 
              source={getTeamImage(homeTeam.abbreviation)} 
              style={[styles.logo, { transform: [{ scale: logoScale }] }]} 
            />
            <Text style={styles.teamName}>{homeTeam.nameZhCN || homeTeam.name}</Text>
          </View>
        </Animated.View>

        {/* Tabs - Anchored to the bottom of the header */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabs}>
            <TouchableOpacity onPress={() => setActiveTab('game')} style={[styles.tab, activeTab === 'game' && styles.activeTab]}>
              <Text style={[styles.tabText, activeTab === 'game' && styles.activeTabText]}>比赛</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('away')} style={[styles.tab, activeTab === 'away' && styles.activeTab]}>
              <Text style={[styles.tabText, activeTab === 'away' && styles.activeTabText, { opacity: activeTab === 'away' ? 1 : 0.5 }]}>{awayTeam.nameZhCN}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('home')} style={[styles.tab, activeTab === 'home' && styles.activeTab]}>
              <Text style={[styles.tabText, activeTab === 'home' && styles.activeTabText, { opacity: activeTab === 'home' ? 1 : 0.5 }]}>{homeTeam.nameZhCN}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: HEADER_EXPANDED_HEIGHT + insets.top + 20 }}
      >
        {activeTab === 'game' ? renderGameTab() : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>球员数据模块开发中</Text>
          </View>
        )}
        <View style={{ height: insets.bottom + 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  // Header Styles
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  compactScore: {
    flex: 1,
    alignItems: 'center',
  },
  compactScoreText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scoreboard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    height: 120,
  },
  teamContainer: {
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 8,
  },
  teamName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  scoreContainer: {
    alignItems: 'center',
    flex: 1.2,
  },
  mainScore: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '800',
    marginVertical: 4,
  },
  gameStatusText: {
    color: '#71767a',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  liveIndicator: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  // Tabs
  tabsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    borderTopWidth: 0.5,
    borderTopColor: '#1c1c1e',
    borderBottomWidth: 0.5,
    borderBottomColor: '#1c1c1e',
  },
  tabs: {
    flexDirection: 'row',
    height: 50,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#1d9bf0',
  },
  activeTabText: {
    color: '#ffffff',
  },
  // Content Sections
  tabContent: {
    paddingHorizontal: 16,
  },
  highlightSection: {
    marginBottom: 24,
  },
  aiSummaryCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1d9bf030',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  aiTitle: {
    color: '#1d9bf0',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  aiText: {
    color: '#e7e9ea',
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '400',
  },
  heroSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  mvpCompactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 12,
  },
  mvpHeadshot: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2c2c2e',
    marginRight: 16,
  },
  mvpInfo: {
    flex: 1,
  },
  mvpName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  mvpStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mvpStatItem: {
    color: '#71767a',
    fontSize: 13,
  },
  // Best Performers Styles
  perfCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    paddingVertical: 8,
  },
  perfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  perfPlayer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  perfPlayerInfo: {
    alignItems: 'flex-end',
    flex: 1,
  },
  perfName: {
    color: '#71767a',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  perfStat: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  perfHeadshot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2c2c2e',
    marginLeft: 8,
  },
  perfLabel: {
    width: 60,
    textAlign: 'center',
    color: '#71767a',
    fontSize: 12,
    fontWeight: '600',
  },
  perfDivider: {
    height: 0.5,
    backgroundColor: '#2c2c2e',
    marginHorizontal: 16,
  },
  white: {
    color: '#ffffff',
    fontWeight: '700',
  },
  infoSection: {
    marginBottom: 32,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  statsTitle: {
    color: '#71767a',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  miniLogo: {
    width: 24,
    height: 24,
  },
  statsList: {
    gap: 20,
  },
  statsGroup: {
    gap: 16,
  },
  statsDivider: {
    height: 0.5,
    backgroundColor: '#1c1c1e',
    marginVertical: 20,
  },
  statRow: {
    marginBottom: 4,
  },
  statLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValueContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statMainValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  statSubValue: {
    color: '#71767a',
    fontSize: 12,
  },
  statLabelText: {
    color: '#71767a',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  statBarContainer: {
    height: 3,
    width: '100%',
  },
  statBarBg: {
    height: '100%',
    backgroundColor: '#1c1c1e',
    borderRadius: 2,
    overflow: 'hidden',
  },
  statBarFill: {
    position: 'absolute',
    height: '100%',
    borderRadius: 2,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#71767a',
    fontSize: 16,
  },
});
