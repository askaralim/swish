import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator, 
  RefreshControl, 
  TouchableOpacity, 
  Image, 
  Animated, 
  Dimensions,
  Platform
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { fetchStandings } from '../src/services/api';
import { getTeamImage } from '../src/utils/teamImages';
import { COLORS, MOTION } from '../src/constants/theme';
import { AnimatedSection } from '../src/components/AnimatedSection';
import { Skeleton } from '../src/components/Skeleton';
import { ErrorState } from '../src/components/ErrorState';

const { width } = Dimensions.get('window');

interface Team {
  id: string;
  uid: string;
  name: string;
  shortName: string;
  abbreviation: string;
  location: string;
  logo: string;
  wins: number;
  losses: number;
  winPercent: number;
  winPercentDisplay: string;
  playoffSeed: number;
  gamesBehind: number;
  gamesBehindDisplay: string;
  streak: number;
  streakType: string;
}

interface Conference {
  name: string;
  teams: Team[];
}

interface StandingsData {
  season: number;
  seasonType: number;
  seasonDisplayName: string;
  conferences: {
    East: Conference;
    West: Conference;
  };
}

export default function TeamsScreen() {
  const router = useRouter();
  const [selectedConference, setSelectedConference] = useState<'East' | 'West'>('East');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const tabIndicatorPos = useRef(new Animated.Value(0)).current;
  
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['standings'],
    queryFn: () => fetchStandings(),
  });

  useEffect(() => {
    if (!isLoading && data) {
      setIsDataLoaded(true);
    } else {
      setIsDataLoaded(false);
    }
  }, [isLoading, data, selectedConference]);

  const handleConferenceChange = (conf: 'East' | 'West') => {
    if (conf === selectedConference) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(tabIndicatorPos, {
      toValue: conf === 'East' ? 0 : 1,
      duration: MOTION.Fast,
      easing: MOTION.AppleEasing,
      useNativeDriver: false,
    }).start(() => {
      setSelectedConference(conf);
    });
  };

  const standings: StandingsData | null = data || null;
  const eastTeams = standings?.conferences?.East?.teams || [];
  const westTeams = standings?.conferences?.West?.teams || [];
  const currentTeams = selectedConference === 'East' ? eastTeams : westTeams;

  const renderTeam = (team: Team, index: number) => {
    const isPlayoffTeam = team.playoffSeed <= 8;
    const logoSource = getTeamImage(team.abbreviation);
    const streakDisplay = team.streakType || '';
    const rankNumber = team.playoffSeed || index + 1;
    
    return (
      <AnimatedSection key={team.id} index={index} visible={isDataLoaded}>
        <TouchableOpacity
          style={styles.teamCard}
          activeOpacity={0.7}
          onPress={() => router.push(`/team/${team.abbreviation}`)}
        >
          <View style={styles.rankSide}>
            <View style={[styles.rankBadge, isPlayoffTeam && styles.playoffBadge]}>
              <Text style={[styles.rankText, isPlayoffTeam && styles.playoffRankText]}>
                {rankNumber}
              </Text>
            </View>
          </View>

          <Image source={logoSource} style={styles.teamLogo} resizeMode="contain" />

          <View style={styles.teamInfo}>
            <Text style={styles.teamName} numberOfLines={1}>{team.shortName || team.name}</Text>
            <View style={styles.recordRow}>
              <Text style={styles.winsLosses}>{team.wins}-{team.losses}</Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.winPercent}>{team.winPercentDisplay}</Text>
            </View>
          </View>

          <View style={styles.statsSide}>
            {team.gamesBehindDisplay && team.gamesBehindDisplay !== '-' && (
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>落后</Text>
                <Text style={styles.statValue}>{team.gamesBehindDisplay}</Text>
              </View>
            )}
            {streakDisplay && (
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>连胜</Text>
                <Text style={[
                  styles.streakValue,
                  streakDisplay.startsWith('W') && styles.winStreak,
                  streakDisplay.startsWith('L') && styles.lossStreak
                ]}>
                  {streakDisplay}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </AnimatedSection>
    );
  };

  if (isLoading || (isRefetching && !data)) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Skeleton width={120} height={32} />
          <Skeleton width={80} height={16} style={{ marginTop: 8 }} />
        </View>
        <View style={styles.scrollContent}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton width={24} height={24} borderRadius={4} />
              <Skeleton width={32} height={32} borderRadius={16} style={{ marginLeft: 12 }} />
              <Skeleton width={100} height={16} style={{ marginLeft: 12 }} />
              <View style={{ flex: 1 }} />
              <Skeleton width={40} height={16} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (error && !isRefetching) {
    return (
      <ErrorState 
        message={error instanceof Error ? error.message : '无法获取联盟排名'} 
        onRetry={refetch} 
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>联盟排名</Text>
          <Text style={styles.subtitle}>{standings?.seasonDisplayName || '2025-26 赛季'}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabWrapper}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleConferenceChange('East')}
          >
            <Text style={[styles.tabText, selectedConference === 'East' && styles.tabTextActive]}>东部联盟</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleConferenceChange('West')}
          >
            <Text style={[styles.tabText, selectedConference === 'West' && styles.tabTextActive]}>西部联盟</Text>
          </TouchableOpacity>
        </View>
        <Animated.View style={[styles.tabIndicator, { 
          left: tabIndicatorPos.interpolate({
            inputRange: [0, 1],
            outputRange: [16, width / 2 + 8]
          }) 
        }]} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={COLORS.accent}
          />
        }
      >
        {currentTeams.length > 0 ? (
          <View style={styles.teamsList}>
            {currentTeams.map((team, index) => renderTeam(team, index))}
          </View>
        ) : (
          <View style={styles.center}>
            <Text style={styles.emptyText}>暂无排名数据</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 64,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.header,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textMain,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tabWrapper: {
    backgroundColor: COLORS.header,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.divider,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.textMain,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: width / 2 - 24,
    height: 3,
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  teamsList: {
    gap: 8,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    minHeight: 76,
  },
  rankSide: {
    width: 32,
    alignItems: 'center',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff08',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playoffBadge: {
    backgroundColor: COLORS.accent,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  playoffRankText: {
    color: COLORS.textMain,
  },
  teamLogo: {
    width: 40,
    height: 40,
    marginHorizontal: 12,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMain,
    marginBottom: 2,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  winsLosses: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMain,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  dot: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginHorizontal: 4,
  },
  winPercent: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  statsSide: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'flex-end',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMain,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  streakValue: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  winStreak: {
    color: COLORS.win,
  },
  lossStreak: {
    color: COLORS.loss,
  },
  errorText: {
    color: COLORS.loss,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
  },
  retryButtonText: {
    color: COLORS.textMain,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.divider,
  },
});
