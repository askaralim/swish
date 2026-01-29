import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
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
  fetchTeamOverview,
} from '../../src/services/api';
import { getTeamImage } from '../../src/utils/teamImages';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, MOTION } from '../../src/constants/theme';
import { AnimatedSection } from '../../src/components/AnimatedSection';

const { width } = Dimensions.get('window');

const HEADER_EXPANDED_HEIGHT = 180;
const HEADER_COLLAPSED_HEIGHT = 100;

const AnimatedStatBar = ({ awayPct, homePct, visible }: { awayPct: number, homePct: number, visible: boolean }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(widthAnim, {
        toValue: 1,
        duration: MOTION.Emphasis,
        delay: 80,
        easing: MOTION.AppleEasing,
        useNativeDriver: false,
      }).start();
    }
  }, [visible, widthAnim]);

  return (
    <View style={styles.statBarContainer}>
      <View style={styles.statBarBg}>
        <Animated.View style={[styles.statBarFill, { 
          width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${awayPct}%`] }), 
          backgroundColor: COLORS.textSecondary, left: 0 
        }]} />
        <Animated.View style={[styles.statBarFill, { 
          width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${homePct}%`] }), 
          backgroundColor: COLORS.accent, right: 0 
        }]} />
      </View>
    </View>
  );
};

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

interface Athlete {
  athleteId: string;
  name: string;
  shortName: string;
  headshot: string;
  position: string;
  starter: boolean;
  didNotPlay: boolean;
  reason?: string;
  stats: {
    minutes: string;
    points: string;
    rebounds: string;
    assists: string;
    plusMinus: string;
    [key: string]: string;
  };
}

interface TeamStatItem {
  name: string;
  displayValue: string;
  label: string;
  abbreviation?: string;
}

interface TeamStats {
  id: string;
  name: string;
  nameZhCN?: string;
  abbreviation: string;
  logo: string;
  homeAway: 'home' | 'away';
  statistics: TeamStatItem[];
  starters: Athlete[];
  bench: Athlete[];
  didNotPlay: Athlete[];
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
    games: any[];
  };
  boxscore?: {
    teamStatistics?: {
      team1: any;
      team2: any;
    };
    teams: TeamStats[];
    gameMVP?: any;
  };
}

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'game' | 'away' | 'home'>('game');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const tabIndicatorPos = useRef(new Animated.Value(0)).current;
  const tabContentAnim = useRef(new Animated.Value(0)).current;

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

  const { data: teamStatsAway, isLoading: isLoadingAway, isError: isErrorAway } = useQuery({
    queryKey: ['teamOverview', game?.awayTeam?.abbreviation],
    queryFn: () => fetchTeamOverview(game?.awayTeam?.abbreviation || ''),
    enabled: !!game?.awayTeam && (Number(game?.gameStatus) === 1 || Number(game?.gameStatus) === 6),
  });

  const { data: teamStatsHome, isLoading: isLoadingHome, isError: isErrorHome } = useQuery({
    queryKey: ['teamOverview', game?.homeTeam?.abbreviation],
    queryFn: () => fetchTeamOverview(game?.homeTeam?.abbreviation || ''),
    enabled: !!game?.homeTeam && (Number(game?.gameStatus) === 1 || Number(game?.gameStatus) === 6),
  });

  useEffect(() => {
    if (!isLoadingDetail && game) {
      setIsDataLoaded(true);
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: MOTION.Fast,
        easing: MOTION.AppleEasing,
        useNativeDriver: false,
      }).start();
    }
  }, [isLoadingDetail, game, headerOpacity]);

  const handleTabChange = (tab: 'game' | 'away' | 'home') => {
    if (tab === activeTab) return;
    
    const targetPos = tab === 'game' ? 0 : tab === 'away' ? 1 : 2;

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
    inputRange: [0, 120],
    outputRange: [HEADER_EXPANDED_HEIGHT + insets.top, HEADER_COLLAPSED_HEIGHT + insets.top],
    extrapolate: 'clamp',
  });

  const expandedOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const expandedTranslateY = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, -20],
    extrapolate: 'clamp',
  });

  const expandedScale = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const collapsedOpacity = scrollY.interpolate({
    inputRange: [80, 120],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const collapsedTranslateY = scrollY.interpolate({
    inputRange: [80, 120],
    outputRange: [10, 0],
    extrapolate: 'clamp',
  });

  if (isLoadingDetail) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.textSecondary} />
      </View>
    );
  }

  if (detailError || !game) return null;

  const { homeTeam, awayTeam } = game;
  const isScheduled = Number(game.gameStatus) === 1 || Number(game.gameStatus) === 6;
  const isFinished = Number(game.gameStatus) === 3;

  const navigateToPlayer = (playerId: string) => {
    if (game.gameStatus === 2 || game.gameStatus === 3) {
      router.push(`/game/${id}/player/${playerId}`);
    } else {
      router.push(`/player/${playerId}`);
    }
  };

  // --- Render Helpers ---

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
      <AnimatedStatBar awayPct={awayPct} homePct={homePct} visible={isDataLoaded} />
    </View>
  );

  const calcPct = (v1: any, v2: any) => {
    const val1 = parseFloat(v1) || 0;
    const val2 = parseFloat(v2) || 0;
    if (val1 + val2 === 0) return 0;
    return (val1 / (val1 + val2)) * 100;
  };

  const renderTopPerformersComparison = () => {
    if (isScheduled || !game.boxscore?.teams) return null;
    const awayP = game.boxscore.teams.find(t => t.homeAway === 'away')?.topPerformers;
    const homeP = game.boxscore.teams.find(t => t.homeAway === 'home')?.topPerformers;

    if (!awayP || !homeP) return null;

    const renderPerformerRow = (label: string, awayPerf: any, homePerf: any, statKey: string) => (
      <View style={styles.perfRow} key={label}>
        <TouchableOpacity 
          style={styles.perfPlayerSide}
          onPress={() => awayPerf.athleteId && navigateToPlayer(awayPerf.athleteId)}
        >
          <View style={styles.perfPlayerInfo}>
            <Text style={styles.perfName} numberOfLines={1}>{awayPerf.shortName}</Text>
            <Text style={styles.perfStat}>{awayPerf.stats[statKey]}</Text>
          </View>
          <Image source={{ uri: awayPerf.headshot }} style={styles.perfHeadshot} />
        </TouchableOpacity>
        
        <Text style={styles.perfLabel}>{label}</Text>
        
        <TouchableOpacity 
          style={styles.perfPlayerSide}
          onPress={() => homePerf.athleteId && navigateToPlayer(homePerf.athleteId)}
        >
          <Image source={{ uri: homePerf.headshot }} style={[styles.perfHeadshot, { marginLeft: 0, marginRight: 8 }]} />
          <View style={[styles.perfPlayerInfo, { alignItems: 'flex-start' }]}>
            <Text style={styles.perfName} numberOfLines={1}>{homePerf.shortName}</Text>
            <Text style={styles.perfStat}>{homePerf.stats[statKey]}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );

    return (
      <AnimatedSection index={2} visible={isDataLoaded}>
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>关键数据</Text>
          <View style={styles.perfCard}>
            {renderPerformerRow('得分', awayP.points[0], homeP.points[0], 'points')}
            {renderPerformerRow('篮板', awayP.rebounds[0], homeP.rebounds[0], 'rebounds')}
            {renderPerformerRow('助攻', awayP.assists[0], homeP.assists[0], 'assists')}
            {renderPerformerRow('+/-', awayP.plusMinus[0], homeP.plusMinus[0], 'plusMinus')}
          </View>
        </View>
      </AnimatedSection>
    );
  };

  const renderDetailedTeamStats = () => {
    if (!isScheduled && game.boxscore?.teamStatistics) {
      const t1 = game.boxscore.teamStatistics.team1;
      const t2 = game.boxscore.teamStatistics.team2;

      return (
        <AnimatedSection index={3} visible={isDataLoaded}>
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>数据对比</Text>
            <View style={styles.detailedStatsCard}>
              <View style={styles.statsGroup}>
                {renderStatRow('投篮 (FG)', t1.fieldGoals, t2.fieldGoals, calcPct(t1.fieldGoalPercent, t2.fieldGoalPercent), calcPct(t2.fieldGoalPercent, t1.fieldGoalPercent), `${t1.fieldGoalPercent}%`, `${t2.fieldGoalPercent}%`)}
                {renderStatRow('三分 (3FG)', t1.threePointers, t2.threePointers, calcPct(t1.threePointPercent, t2.threePointPercent), calcPct(t2.threePointPercent, t1.threePointPercent), `${t1.threePointPercent}%`, `${t2.threePointPercent}%`)}
                {renderStatRow('罚球 (FT)', t1.freeThrows, t2.freeThrows, calcPct(t1.freeThrowPercent, t2.freeThrowPercent), calcPct(t2.freeThrowPercent, t1.freeThrowPercent), `${t1.freeThrowPercent}%`, `${t2.freeThrowPercent}%`)}
              </View>
              <View style={styles.statsDivider} />
              <View style={styles.statsGroup}>
                {renderStatRow('总篮板', t1.rebounds, t2.rebounds, calcPct(t1.rebounds, t2.rebounds), calcPct(t2.rebounds, t1.rebounds))}
                {renderStatRow('助攻', t1.assists, t2.assists, calcPct(t1.assists, t2.assists), calcPct(t2.assists, t1.assists))}
                {renderStatRow('抢断', t1.steals, t2.steals, calcPct(t1.steals, t2.steals), calcPct(t2.steals, t1.steals))}
                {renderStatRow('盖帽', t1.blocks, t2.blocks, calcPct(t1.blocks, t2.blocks), calcPct(t2.blocks, t1.blocks))}
                {renderStatRow('失误', t1.turnovers, t2.turnovers, calcPct(t2.turnovers, t1.turnovers), calcPct(t1.turnovers, t2.turnovers))}
              </View>
              <View style={styles.statsDivider} />
              <View style={styles.statsGroup}>
                {renderStatRow('禁区得分', t1.pointsInPaint, t2.pointsInPaint, calcPct(t1.pointsInPaint, t2.pointsInPaint), calcPct(t2.pointsInPaint, t1.pointsInPaint))}
                {renderStatRow('快攻得分', t1.fastBreakPoints, t2.fastBreakPoints, calcPct(t1.fastBreakPoints, t2.fastBreakPoints), calcPct(t2.fastBreakPoints, t1.fastBreakPoints))}
                {renderStatRow('失误得分', t1.turnoverPoints, t2.turnoverPoints, calcPct(t1.turnoverPoints, t2.turnoverPoints), calcPct(t2.turnoverPoints, t1.turnoverPoints))}
              </View>
              <View style={styles.statsDivider} />
              <View style={styles.statsGroup}>
                {renderStatRow('最大领先', t1.largestLead, t2.largestLead, calcPct(t1.largestLead, t2.largestLead), calcPct(t2.largestLead, t1.largestLead))}
                {renderStatRow('犯规', t1.fouls, t2.fouls, calcPct(t2.fouls, t1.fouls), calcPct(t1.fouls, t2.fouls))}
              </View>
            </View>
          </View>
        </AnimatedSection>
      );
    }

    if (isScheduled && game.boxscore?.teams) {
      const away = game.boxscore.teams.find(t => t.homeAway === 'away');
      const home = game.boxscore.teams.find(t => t.homeAway === 'home');
      
      if (!away?.statistics || !home?.statistics) return null;

      const getVal = (stats: TeamStatItem[], name: string) => 
        stats.find(s => s.name === name || s.label === name)?.displayValue || '0';

      const renderInfoRow = (label: string, awayVal: string, homeVal: string) => (
        <View style={styles.statRow} key={label}>
          <View style={styles.statLabelRow}>
            <Text style={styles.statMainValue}>{awayVal}</Text>
            <Text style={styles.statLabelText}>{label}</Text>
            <Text style={[styles.statMainValue, { textAlign: 'right' }]}>{homeVal}</Text>
          </View>
          <View style={[styles.statBarContainer, { height: 1, backgroundColor: COLORS.divider, marginTop: 8 }]} />
        </View>
      );

      return (
        <AnimatedSection index={3} visible={isDataLoaded}>
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>赛季场均对比</Text>
            <View style={styles.detailedStatsCard}>
              {/* Group 1: Form & Efficiency */}
              <View style={styles.statsGroup}>
                {renderInfoRow('近期战绩', getVal(away.statistics, 'Last Ten Games'), getVal(home.statistics, 'Last Ten Games'))}
                {renderInfoRow('连胜/连败', getVal(away.statistics, 'streak'), getVal(home.statistics, 'streak'))}
              </View>

              <View style={styles.statsDivider} />

              {/* Group 2: Scoring */}
              <View style={styles.statsGroup}>
                {renderStatRow('场均得分', getVal(away.statistics, 'avgPoints'), getVal(home.statistics, 'avgPoints'), calcPct(getVal(away.statistics, 'avgPoints'), getVal(home.statistics, 'avgPoints')), calcPct(getVal(home.statistics, 'avgPoints'), getVal(away.statistics, 'avgPoints')))}
                {renderStatRow('场均失分', getVal(away.statistics, 'avgPointsAgainst'), getVal(home.statistics, 'avgPointsAgainst'), calcPct(getVal(home.statistics, 'avgPointsAgainst'), getVal(away.statistics, 'avgPointsAgainst')), calcPct(getVal(away.statistics, 'avgPointsAgainst'), getVal(home.statistics, 'avgPointsAgainst')))}
                {renderStatRow('投篮命中率', `${getVal(away.statistics, 'fieldGoalPct')}%`, `${getVal(home.statistics, 'fieldGoalPct')}%`, calcPct(getVal(away.statistics, 'fieldGoalPct'), getVal(home.statistics, 'fieldGoalPct')), calcPct(getVal(home.statistics, 'fieldGoalPct'), getVal(away.statistics, 'fieldGoalPct')))}
                {renderStatRow('三分命中率', `${getVal(away.statistics, 'threePointFieldGoalPct')}%`, `${getVal(home.statistics, 'threePointFieldGoalPct')}%`, calcPct(getVal(away.statistics, 'threePointFieldGoalPct'), getVal(home.statistics, 'threePointFieldGoalPct')), calcPct(getVal(home.statistics, 'threePointFieldGoalPct'), getVal(away.statistics, 'threePointFieldGoalPct')))}
              </View>

              <View style={styles.statsDivider} />

              {/* Group 3: Activity */}
              <View style={styles.statsGroup}>
                {renderStatRow('场均篮板', getVal(away.statistics, 'avgRebounds'), getVal(home.statistics, 'avgRebounds'), calcPct(getVal(away.statistics, 'avgRebounds'), getVal(home.statistics, 'avgRebounds')), calcPct(getVal(home.statistics, 'avgRebounds'), getVal(away.statistics, 'avgRebounds')))}
                {renderStatRow('场均助攻', getVal(away.statistics, 'avgAssists'), getVal(home.statistics, 'avgAssists'), calcPct(getVal(away.statistics, 'avgAssists'), getVal(home.statistics, 'avgAssists')), calcPct(getVal(home.statistics, 'avgAssists'), getVal(away.statistics, 'avgAssists')))}
                {renderStatRow('场均抢断', getVal(away.statistics, 'avgSteals'), getVal(home.statistics, 'avgSteals'), calcPct(getVal(away.statistics, 'avgSteals'), getVal(home.statistics, 'avgSteals')), calcPct(getVal(home.statistics, 'avgSteals'), getVal(away.statistics, 'avgSteals')))}
                {renderStatRow('场均盖帽', getVal(away.statistics, 'avgBlocks'), getVal(home.statistics, 'avgBlocks'), calcPct(getVal(away.statistics, 'avgBlocks'), getVal(home.statistics, 'avgBlocks')), calcPct(getVal(home.statistics, 'avgBlocks'), getVal(away.statistics, 'avgBlocks')))}
                {renderStatRow('场均失误', getVal(away.statistics, 'avgTotalTurnovers'), getVal(home.statistics, 'avgTotalTurnovers'), calcPct(getVal(home.statistics, 'avgTotalTurnovers'), getVal(away.statistics, 'avgTotalTurnovers')), calcPct(getVal(away.statistics, 'avgTotalTurnovers'), getVal(home.statistics, 'avgTotalTurnovers')))}
              </View>
            </View>
          </View>
        </AnimatedSection>
      );
    }

    return null;
  };

  const renderSeasonSeries = () => {
    if (!game.seasonSeries?.games?.length) return null;

    return (
      <AnimatedSection index={1} visible={isDataLoaded}>
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>赛季交锋</Text>
          <View style={styles.seriesCard}>
            {game.seasonSeries.games.map((g: any, idx: number) => (
              <View key={idx} style={[styles.seriesRow, idx < game.seasonSeries.games.length - 1 && styles.seriesDivider]}>
                <Text style={styles.seriesDate}>{g.dateFormatted.date}</Text>
                <View style={styles.seriesContent}>
                  <Text style={[styles.seriesTeam, g.awayTeam.winner && styles.boldText]}>
                    {g.awayTeam.abbreviation} {g.awayTeam.score}
                  </Text>
                  <Text style={styles.seriesVs}>@</Text>
                  <Text style={[styles.seriesTeam, g.homeTeam.winner && styles.boldText]}>
                    {g.homeTeam.abbreviation} {g.homeTeam.score}
                  </Text>
                </View>
                <Text style={styles.seriesStatus}>{g.status === 3 ? '已结束' : '未开始'}</Text>
              </View>
            ))}
          </View>
        </View>
      </AnimatedSection>
    );
  };

  const renderGameTab = () => (
    <View style={styles.tabContent}>
      {/* 1. Both Teams Basic Data (for scheduled) */}
      {isScheduled && (
        <AnimatedSection index={0} visible={isDataLoaded}>
          <View style={styles.pregameInfoCard}>
            <View style={styles.pregameTeam}>
              <Image source={getTeamImage(awayTeam.abbreviation)} style={styles.teamHeaderLogo} />
              <Text style={styles.pregameRecord}>{awayTeam.wins}-{awayTeam.losses}</Text>
              <Text style={styles.pregameLabel}>战绩</Text>
            </View>
            <View style={styles.pregameDivider} />
            <View style={styles.pregameTeam}>
              <Image source={getTeamImage(homeTeam.abbreviation)} style={styles.teamHeaderLogo} />
              <Text style={styles.pregameRecord}>{homeTeam.wins}-{homeTeam.losses}</Text>
              <Text style={styles.pregameLabel}>战绩</Text>
            </View>
          </View>
        </AnimatedSection>
      )}

      {/* 2. Impact (Period Scores) */}
      {!isScheduled && (
        <AnimatedSection index={0} visible={isDataLoaded}>
          <View style={styles.periodScoresCard}>
            {/* Header Row */}
            <View style={styles.periodRow}>
              <View style={styles.periodTeamInfo} />
              <View style={styles.periodValues}>
                {[1, 2, 3, 4].map((p) => (
                  <View key={p} style={styles.periodValueBox}>
                    <Text style={styles.periodLabel}>Q{p}</Text>
                  </View>
                ))}
                {awayTeam.periods?.some(p => p.period > 4) && (
                  <View style={styles.periodValueBox}>
                    <Text style={styles.periodLabel}>OT</Text>
                  </View>
                )}
                <View style={styles.periodValueBox}>
                  <Text style={styles.periodLabel}>总分</Text>
                </View>
              </View>
            </View>

            {/* Away Team Row */}
            <View style={styles.periodRow}>
              <View style={styles.periodTeamInfo}>
                <Text style={styles.periodTeamName}>{awayTeam.nameZhCN || awayTeam.abbreviation}</Text>
              </View>
              <View style={styles.periodValues}>
                {[1, 2, 3, 4].map((p) => (
                  <View key={p} style={styles.periodValueBox}>
                    <Text style={styles.periodScore}>
                      {awayTeam.periods?.find(per => per.period === p)?.score ?? '-'}
                    </Text>
                  </View>
                ))}
                {awayTeam.periods?.some(p => p.period > 4) && (
                  <View style={styles.periodValueBox}>
                    <Text style={styles.periodScore}>
                      {awayTeam.periods.filter(p => p.period > 4).reduce((sum, p) => sum + p.score, 0)}
                    </Text>
                  </View>
                )}
                <View style={styles.periodValueBox}>
                  <Text style={[styles.periodScore, styles.periodTotalScore]}>{awayTeam.score}</Text>
                </View>
              </View>
            </View>

            {/* Home Team Row */}
            <View style={styles.periodRow}>
              <View style={styles.periodTeamInfo}>
                <Text style={styles.periodTeamName}>{homeTeam.nameZhCN || homeTeam.abbreviation}</Text>
              </View>
              <View style={styles.periodValues}>
                {[1, 2, 3, 4].map((p) => (
                  <View key={p} style={styles.periodValueBox}>
                    <Text style={styles.periodScore}>
                      {homeTeam.periods?.find(per => per.period === p)?.score ?? '-'}
                    </Text>
                  </View>
                ))}
                {homeTeam.periods?.some(p => p.period > 4) && (
                  <View style={styles.periodValueBox}>
                    <Text style={styles.periodScore}>
                      {homeTeam.periods.filter(p => p.period > 4).reduce((sum, p) => sum + p.score, 0)}
                    </Text>
                  </View>
                )}
                <View style={styles.periodValueBox}>
                  <Text style={[styles.periodScore, styles.periodTotalScore]}>{homeTeam.score}</Text>
                </View>
              </View>
            </View>
          </View>
        </AnimatedSection>
      )}

      {/* 3. Season Series (for scheduled) */}
      {isScheduled && renderSeasonSeries()}

      {/* 2. Understanding (AI Summary) */}
      {isFinished && summaryData?.summary && (
        <AnimatedSection index={1} visible={isDataLoaded}>
          <View style={styles.highlightSection}>
            <LinearGradient
              colors={['#1d9bf010', COLORS.card]}
              style={styles.aiSummaryCard}
            >
              <View style={styles.aiHeader}>
                <Ionicons name="sparkles" size={14} color={COLORS.accent} />
                <Text style={styles.aiTitle}>AI INSIGHTS</Text>
              </View>
              <Text style={styles.aiText}>{summaryData.summary}</Text>
            </LinearGradient>
          </View>
        </AnimatedSection>
      )}

      {/* 3. Human Story (MVP & Top Performers) */}
      {game.boxscore?.gameMVP && !isScheduled && (
        <AnimatedSection index={2} visible={isDataLoaded}>
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>主宰比赛</Text>
            <TouchableOpacity 
              style={styles.mvpCompactCard}
              onPress={() => game.boxscore?.gameMVP?.athleteId && navigateToPlayer(game.boxscore.gameMVP.athleteId)}
            >
              <Image source={{ uri: game.boxscore.gameMVP.headshot }} style={styles.mvpHeadshot} />
              <View style={styles.mvpInfo}>
                <Text style={styles.mvpName}>{game.boxscore.gameMVP.name}</Text>
                <View style={styles.mvpStatsRow}>
                  <Text style={styles.mvpStatItem}><Text style={styles.white}>{game.boxscore.gameMVP.stats.points}</Text> 得分</Text>
                  <Text style={styles.mvpStatItem}><Text style={styles.white}>{game.boxscore.gameMVP.stats.rebounds}</Text> 篮板</Text>
                  <Text style={styles.mvpStatItem}><Text style={styles.white}>{game.boxscore.gameMVP.stats.assists}</Text> 助攻</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </AnimatedSection>
      )}

      {renderTopPerformersComparison()}

      {/* 4. Evidence (Stats) */}
      {renderDetailedTeamStats()}
    </View>
  );

  const TeamPlayerStatsView = ({ 
    team, 
    boxscoreTeam, 
    seasonStats, 
    isLoading, 
    isError 
  }: { 
    team: Team, 
    boxscoreTeam?: TeamStats, 
    seasonStats?: any,
    isLoading?: boolean,
    isError?: boolean
  }) => {
    if (isScheduled) {
      if (isLoading) {
        return (
          <View style={[styles.loadingContainer, { height: 400 }]}>
            <ActivityIndicator size="small" color={COLORS.textSecondary} />
          </View>
        );
      }

      if (isError || !seasonStats?.players) {
        return (
          <View style={[styles.emptyContainer, { height: 400 }]}>
            <Text style={styles.emptyText}>暂时无法获取球队赛季数据</Text>
          </View>
        );
      }

      const roster = seasonStats.players;
      const teamTotals = seasonStats.teamStats;
      
      return (
        <View style={styles.tabContent}>
          <TouchableOpacity 
            style={styles.teamHeaderCard}
            onPress={() => router.push(`/team/${team.abbreviation}`)}
          >
            <Image source={getTeamImage(team.abbreviation)} style={styles.teamHeaderLogo} />
            <View>
              <Text style={styles.teamHeaderName}>{team.nameZhCN || team.name}</Text>
              <Text style={styles.teamHeaderRecord}>{seasonStats.team?.record || `${team.wins}-${team.losses}`}</Text>
            </View>
          </TouchableOpacity>

          {/* Totals card for season average */}
          {teamTotals && (
            <View style={styles.teamTotalsCard}>
              <View style={styles.totalsHeader}>
                <Text style={styles.totalsTitle}>赛季场均数据</Text>
              </View>
              <View style={styles.totalsGrid}>
                <View style={styles.totalItem}>
                  <Text style={styles.totalLabel}>得分</Text>
                  <Text style={styles.totalValue}>{teamTotals.avgPoints?.value || '-'}</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalLabel}>篮板</Text>
                  <Text style={styles.totalValue}>{teamTotals.avgRebounds?.value || '-'}</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalLabel}>助攻</Text>
                  <Text style={styles.totalValue}>{teamTotals.avgAssists?.value || '-'}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Column Header */}
          <View style={styles.gridContainer}>
            <View style={styles.pinnedColumn}>
              <View style={styles.columnHeader}>
                <Text style={styles.columnLabelPlayer}>球员</Text>
              </View>
      {roster.map((player: any) => (
        <View key={`name-${player.id}`} style={styles.playerRow}>
          <TouchableOpacity 
            style={styles.playerPinnedColumn}
            onPress={() => navigateToPlayer(player.id)}
          >
            <Image source={{ uri: `https://a.espncdn.com/i/headshots/nba/600/${player.id}.png` }} style={styles.playerAvatar} />
            <View style={styles.playerNameContainer}>
              <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
              <Text style={styles.playerPosition}>{player.position}</Text>
            </View>
          </TouchableOpacity>
        </View>
      ))}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <View style={styles.columnHeader}>
                  <View style={styles.columnStatsLabels}>
                    <Text style={styles.columnLabel}>场次</Text>
                    <Text style={styles.columnLabel}>分钟</Text>
                    <Text style={styles.columnLabel}>得分</Text>
                    <Text style={styles.columnLabel}>篮板</Text>
                    <Text style={styles.columnLabel}>助攻</Text>
                    <Text style={styles.columnLabel}>抢断</Text>
                    <Text style={styles.columnLabel}>盖帽</Text>
                    <Text style={styles.columnLabel}>失误</Text>
                    <Text style={styles.columnLabel}>犯规</Text>
                    <Text style={styles.columnLabelWide}>助攻/失误</Text>
                  </View>
                </View>

                {roster.map((player: any) => (
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
                      <Text style={styles.statCell}>{player.avgFouls}</Text>
                      <Text style={styles.statCellWide}>{player.assistTurnoverRatio}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      );
    }

    if (!boxscoreTeam || isScheduled) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>比赛开始后将显示球员数据</Text>
        </View>
      );
    }

    const renderPlayerNameColumn = (player: Athlete) => (
      <View key={`name-${player.athleteId}`} style={[styles.playerRow, player.didNotPlay && { opacity: 0.5 }]}>
        <TouchableOpacity 
          style={styles.playerPinnedColumn}
          onPress={() => navigateToPlayer(player.athleteId)}
        >
          <Image source={{ uri: player.headshot }} style={styles.playerAvatar} />
          <View style={styles.playerNameContainer}>
            <Text style={styles.playerName} numberOfLines={1}>{player.shortName}</Text>
            <Text style={styles.playerPosition}>{player.position}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );

    const renderPlayerStatsColumn = (player: Athlete) => (
      <View key={`stats-${player.athleteId}`} style={[styles.playerRow, player.didNotPlay && { opacity: 0.5 }]}>
        <View style={styles.playerStatsGrid}>
          {player.didNotPlay ? (
            <View style={styles.dnpContainer}>
              <Text style={styles.dnpText}>{player.reason || 'DNP'}</Text>
            </View>
          ) : (
            <>
              <Text style={styles.statCell}>{player.stats.minutes}</Text>
              <Text style={[styles.statCell, styles.statCellBold]}>{player.stats.points}</Text>
              <Text style={styles.statCellWide}>{player.stats.fieldGoals}</Text>
              <Text style={styles.statCellWide}>{player.stats.threePointers}</Text>
              <Text style={styles.statCellWide}>{player.stats.freeThrows}</Text>
              <Text style={styles.statCell}>{player.stats.rebounds}</Text>
              <Text style={styles.statCell}>{player.stats.assists}</Text>
              <Text style={styles.statCell}>{player.stats.steals}</Text>
              <Text style={styles.statCell}>{player.stats.blocks}</Text>
              <Text style={styles.statCell}>{player.stats.turnovers}</Text>
              <Text style={styles.statCell}>{player.stats.fouls}</Text>
              <Text style={styles.statCellWide}>{player.stats.fieldGoals}</Text>
              <Text style={styles.statCellWide}>{player.stats.threePointers}</Text>
              <Text style={styles.statCellWide}>{player.stats.freeThrows}</Text>
              <Text style={[
                styles.statCell, 
                parseFloat(player.stats.plusMinus) > 0 ? { color: '#10b981' } : 
                parseFloat(player.stats.plusMinus) < 0 ? { color: '#ef4444' } : null
              ]}>
                {parseFloat(player.stats.plusMinus) > 0 ? `${player.stats.plusMinus}` : player.stats.plusMinus}
              </Text>
            </>
          )}
        </View>
      </View>
    );

    const renderTeamTotals = () => {
      const stats = boxscoreTeam.statistics;
      if (!stats) return null;

      const getStatValue = (label: string) => stats.find(s => s.label === label || s.name === label || s.abbreviation === label)?.displayValue || '-';

      return (
        <View style={styles.teamTotalsCard}>
          <View style={styles.totalsGrid}>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>投篮 (FG)</Text>
              <Text style={styles.totalValue}>{getStatValue('FG')}</Text>
              <Text style={styles.totalSubValue}>{getStatValue('fieldGoalPct')}%</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>三分 (3PT)</Text>
              <Text style={styles.totalValue}>{getStatValue('3PT')}</Text>
              <Text style={styles.totalSubValue}>{getStatValue('threePointFieldGoalPct')}%</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>罚球 (FT)</Text>
              <Text style={styles.totalValue}>{getStatValue('FT')}</Text>
              <Text style={styles.totalSubValue}>{getStatValue('freeThrowPct')}%</Text>
            </View>
          </View>
          
          <View style={[styles.totalsGrid, { marginTop: 16, borderTopWidth: 0.5, borderTopColor: COLORS.divider, paddingTop: 16 }]}>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>篮板</Text>
              <Text style={styles.totalValue}>{getStatValue('REB')}</Text>
              <Text style={styles.totalSubValue}>{getStatValue('OR')}前 / {getStatValue('DR')}后</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>助攻</Text>
              <Text style={styles.totalValue}>{getStatValue('AST')}</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>抢断/盖帽</Text>
              <Text style={styles.totalValue}>{getStatValue('STL')} / {getStatValue('BLK')}</Text>
            </View>
          </View>

          <View style={[styles.totalsGrid, { marginTop: 16, borderTopWidth: 0.5, borderTopColor: COLORS.divider, paddingTop: 16 }]}>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>失误</Text>
              <Text style={styles.totalValue}>{getStatValue('ToTO')}</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>犯规</Text>
              <Text style={styles.totalValue}>{getStatValue('PF')}</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>最大领先</Text>
              <Text style={styles.totalValue}>{getStatValue('LL')}</Text>
            </View>
          </View>
        </View>
      );
    };

    return (
      <View style={styles.tabContent}>

        {renderTeamTotals()}

        {/* Sync'd Grid Layout */}
        <View style={styles.gridContainer}>
          {/* Pinned Left Column */}
          <View style={styles.pinnedColumn}>
            <View style={styles.columnHeader}>
              <Text style={styles.columnLabelPlayer}>球员</Text>
            </View>
            
            <Text style={styles.playerGroupHeader}>首发</Text>
            {boxscoreTeam.starters.map(renderPlayerNameColumn)}
            
            <Text style={[styles.playerGroupHeader, { marginTop: 16 }]}>替补</Text>
            {boxscoreTeam.bench.map(renderPlayerNameColumn)}

            {boxscoreTeam.didNotPlay && boxscoreTeam.didNotPlay.length > 0 && (
              <>
                <Text style={[styles.playerGroupHeader, { marginTop: 16 }]}>未上场</Text>
                {boxscoreTeam.didNotPlay.map(renderPlayerNameColumn)}
              </>
            )}
          </View>

          {/* Scrollable Right Stats */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={styles.columnHeader}>
                <View style={styles.columnStatsLabels}>
                  <Text style={styles.columnLabel}>时间</Text>
                  <Text style={styles.columnLabel}>得分</Text>
                  <Text style={styles.columnLabelWide}>投篮</Text>
                  <Text style={styles.columnLabelWide}>三分</Text>
                  <Text style={styles.columnLabelWide}>罚球</Text>
                  <Text style={styles.columnLabel}>篮板</Text>
                  <Text style={styles.columnLabel}>助攻</Text>
                  <Text style={styles.columnLabel}>抢断</Text>
                  <Text style={styles.columnLabel}>盖帽</Text>
                  <Text style={styles.columnLabel}>失误</Text>
                  <Text style={styles.columnLabel}>犯规</Text>
                  <Text style={styles.columnLabel}>+/-</Text>
                </View>
              </View>

              <View style={styles.groupSpacer} />
              {boxscoreTeam.starters.map(renderPlayerStatsColumn)}
              
              <View style={[styles.groupSpacer, { marginTop: 16 }]} />
              {boxscoreTeam.bench.map(renderPlayerStatsColumn)}

              {boxscoreTeam.didNotPlay && boxscoreTeam.didNotPlay.length > 0 && (
                <>
                  <View style={[styles.groupSpacer, { marginTop: 16 }]} />
                  {boxscoreTeam.didNotPlay.map(renderPlayerStatsColumn)}
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Animated Sticky Header */}
      <Animated.View style={[styles.header, { height: headerHeight, paddingTop: insets.top, opacity: headerOpacity }]}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
          </TouchableOpacity>
          
          <Animated.View style={[styles.compactScore, { opacity: collapsedOpacity, transform: [{ translateY: collapsedTranslateY }] }]}>
            <Text style={styles.compactScoreText}>
              {awayTeam.abbreviation} {awayTeam.score} - {homeTeam.score} {homeTeam.abbreviation}
            </Text>
            <Text style={styles.compactStatus}>
              {game.gameStatus === 3 ? '已结束' : 
               game.gameStatus === 2 ? '直播中' : 
               game.gameStatus === 6 ? '延期' : 
               game.gameStatus === 1 ? '未开始' : 
               game.gameStatusText.toUpperCase()}
            </Text>
          </Animated.View>
          
          <View style={styles.iconButton} />
        </View>

        {/* Expanded Content */}
        <Animated.View style={[styles.scoreboard, { 
          opacity: expandedOpacity, 
          transform: [
            { scale: expandedScale },
            { translateY: expandedTranslateY }
          ] 
        }]}>
          <TouchableOpacity 
            style={styles.teamContainer}
            onPress={() => router.push(`/team/${awayTeam.abbreviation}`)}
          >
            <Image source={getTeamImage(awayTeam.abbreviation)} style={styles.logo} />
            <Text style={styles.teamName}>{awayTeam.nameZhCN || awayTeam.name}</Text>
          </TouchableOpacity>
          
          <View style={styles.scoreContainer}>
            <Text style={styles.mainScore}>{awayTeam.score} - {homeTeam.score}</Text>
            <Text style={styles.gameStatusText}>
              {game.gameStatus === 3 ? '已结束' : 
               game.gameStatus === 2 ? '直播中' : 
               game.gameStatus === 6 ? '延期' : 
               game.gameStatus === 1 ? '未开始' : 
               game.gameStatusText.toUpperCase()}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.teamContainer}
            onPress={() => router.push(`/team/${homeTeam.abbreviation}`)}
          >
            <Image source={getTeamImage(homeTeam.abbreviation)} style={styles.logo} />
            <Text style={styles.teamName}>{homeTeam.nameZhCN || homeTeam.name}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabs}>
            <TouchableOpacity onPress={() => handleTabChange('game')} style={styles.tab}>
              <Text style={[styles.tabText, activeTab === 'game' && styles.tabTextActive]}>比赛</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleTabChange('away')} style={styles.tab}>
              <Text style={[styles.tabText, activeTab === 'away' && styles.tabTextActive]}>{awayTeam.nameZhCN || awayTeam.abbreviation}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleTabChange('home')} style={styles.tab}>
              <Text style={[styles.tabText, activeTab === 'home' && styles.tabTextActive]}>{homeTeam.nameZhCN || homeTeam.abbreviation}</Text>
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
          {activeTab === 'game' ? renderGameTab() : 
           activeTab === 'away' ? <TeamPlayerStatsView team={awayTeam} boxscoreTeam={game.boxscore?.teams?.find(t => t.homeAway === 'away')} seasonStats={teamStatsAway} isLoading={isLoadingAway} isError={isErrorAway} /> :
           <TeamPlayerStatsView team={homeTeam} boxscoreTeam={game.boxscore?.teams?.find(t => t.homeAway === 'home')} seasonStats={teamStatsHome} isLoading={isLoadingHome} isError={isErrorHome} />}
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
  // Header Styles
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
  compactScore: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactScoreText: {
    color: COLORS.textMain,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  compactStatus: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  scoreboard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 48, // Added space above tabs
    height: 120,
  },
  teamContainer: {
    alignItems: 'center',
    width: 100,
  },
  logo: {
    width: 44,
    height: 44,
    marginBottom: 8,
  },
  teamName: {
    color: COLORS.textMain,
    fontSize: 13,
    fontWeight: '500',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  mainScore: {
    color: COLORS.textMain,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  gameStatusText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  // Tabs
  tabsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: COLORS.header,
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
  // Sections
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
  highlightSection: {
    marginBottom: 32,
  },
  aiSummaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  aiTitle: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  aiText: {
    color: '#e7e9ea',
    fontSize: 16,
    lineHeight: 26,
  },
  mvpCompactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
  },
  mvpHeadshot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2c2c2e',
    marginRight: 16,
  },
  mvpInfo: {
    flex: 1,
  },
  mvpName: {
    color: COLORS.textMain,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  mvpStatsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  mvpStatItem: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  perfCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 12,
  },
  perfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  perfPlayerSide: {
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
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 2,
  },
  perfStat: {
    color: COLORS.textMain,
    fontSize: 18,
    fontWeight: '700',
  },
  perfHeadshot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2c2c2e',
    marginLeft: 8,
  },
  perfLabel: {
    width: 60,
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  detailedStatsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
  },
  statsGroup: {
    gap: 16,
  },
  statsDivider: {
    height: 1,
    backgroundColor: '#1c1c1e',
    marginVertical: 20,
    opacity: 0.5,
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
    color: COLORS.textMain,
    fontSize: 15,
    fontWeight: '600',
  },
  statSubValue: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  statLabelText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
  statBarContainer: {
    height: 2,
    width: '100%',
  },
  statBarBg: {
    height: '100%',
    backgroundColor: '#2c2c2e',
    borderRadius: 1,
    overflow: 'hidden',
  },
  statBarFill: {
    position: 'absolute',
    height: '100%',
  },
  white: {
    color: COLORS.textMain,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  // Period Scores Styles
  periodScoresCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  periodTeamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  periodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  periodTeamName: {
    color: COLORS.textMain,
    fontSize: 15,
    fontWeight: '700',
  },
  periodValues: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
  },
  periodValueBox: {
    alignItems: 'center',
    width: 36,
  },
  periodLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  periodScore: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  periodTotalScore: {
    color: COLORS.textMain,
    fontSize: 16,
    fontWeight: '800',
  },
  periodDivider: {
    height: 0.5,
    backgroundColor: COLORS.divider,
    marginVertical: 4,
  },
  // Pregame Info Styles
  pregameInfoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  pregameTeam: {
    flex: 1,
    alignItems: 'center',
  },
  pregameRecord: {
    color: COLORS.textMain,
    fontSize: 20,
    fontWeight: '800',
  },
  pregameLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  pregameDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.divider,
  },
  // Series Styles
  seriesCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 4,
  },
  seriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  seriesDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.divider,
  },
  seriesDate: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    width: 60,
  },
  seriesContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  seriesTeam: {
    color: COLORS.textMain,
    fontSize: 15,
    fontWeight: '600',
    width: 60,
    textAlign: 'center',
  },
  seriesVs: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  seriesStatus: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    width: 60,
    textAlign: 'right',
  },
  boldText: {
    fontWeight: '800',
    color: COLORS.textMain,
  },
  // Team Player Stats Styles
  teamHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  teamHeaderLogo: {
    width: 36,
    height: 36,
    marginRight: 12,
  },
  teamHeaderName: {
    color: COLORS.textMain,
    fontSize: 17,
    fontWeight: '700',
  },
  teamHeaderRecord: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  teamTotalsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  totalsHeader: {
    marginBottom: 12,
  },
  totalsTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalItem: {
    flex: 1,
  },
  totalLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  totalValue: {
    color: COLORS.textMain,
    fontSize: 16,
    fontWeight: '700',
  },
  totalSubValue: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: 'row',
  },
  pinnedColumn: {
    width: 160,
    backgroundColor: COLORS.bg,
    zIndex: 1,
  },
  columnHeader: {
    height: 40,
    justifyContent: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.bg,
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
  groupSpacer: {
    height: 24, // Matches playerGroupHeader height
    justifyContent: 'center',
  },
  playerList: {
    paddingTop: 8,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
  },
  playerPinnedColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 160,
    backgroundColor: COLORS.bg,
    paddingLeft: 12,
  },
  playerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2c2c2e',
    marginRight: 8,
  },
  playerNameContainer: {
    flex: 1,
  },
  playerName: {
    color: COLORS.textMain,
    fontSize: 13,
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
    fontSize: 13,
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
  dnpContainer: {
    paddingLeft: 12,
    height: 56,
    justifyContent: 'center',
  },
  dnpText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  playerGroupHeader: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    height: 24,
    lineHeight: 24,
    marginTop: 8,
    paddingHorizontal: 4,
  },
});
