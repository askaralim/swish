import { useQuery } from '@tanstack/react-query';
import { useState, useMemo, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  RefreshControl, 
  TouchableOpacity, 
  Image,
  ScrollView, 
  Dimensions,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { fetchGames, formatDateForAPI, getChineseDate } from '../src/services/api';
import { getTeamImage } from '../src/utils/teamImages';
import { COLORS } from '../src/constants/theme';
import { AnimatedSection } from '../src/components/AnimatedSection';
import { Skeleton } from '../src/components/Skeleton';
import { ErrorState } from '../src/components/ErrorState';

interface Game {
  gameId: string;
  gameStatus: number; // 1=scheduled, 2=live, 3=finished, 6 = postponed
  gameStatusText?: string;
  gameEt?: string;
  gameEtFormatted?: {
    dateTime?: string;
    time?: string;
    relative?: string;
  };
  period?: number;
  isOvertime?: boolean;
  isClosest?: boolean;
  isMarquee?: boolean;
  homeTeam: {
    id: string;
    name: string;
    nameZhCN: string;
    city: string;
    cityZhCN: string;
    abbreviation: string;
    logo: string;
    wins: number;
    losses: number;
    score: number | null;
  };
  awayTeam: {
    id: string;
    name: string;
    nameZhCN: string;
    city: string;
    cityZhCN: string;
    abbreviation: string;
    logo: string;
    wins: number;
    losses: number;
    score: number | null;
  };
}

// --- Games Screen ---

export default function GamesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState<Date>(getChineseDate());
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const dateScrollRef = useRef<ScrollView>(null);
  const [scrollViewWidth, setScrollViewWidth] = useState(0);
  const todayIndex = 2;

  const dateOptions = useMemo(() => {
    const dates: Date[] = [];
    const today = getChineseDate();
    
    // Yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 2);
    dates.push(yesterday);
    
    // Another Yesterday (as requested in history)
    const yesterday2 = new Date(today);
    yesterday2.setDate(yesterday2.getDate() - 1);
    dates.push(yesterday2);
    
    // Today
    dates.push(today);
    
    // Tomorrow + Next 3 days
    for (let i = 1; i <= 4; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []);

  useEffect(() => {
    if (scrollViewWidth > 0 && dateScrollRef.current) {
      const buttonWidth = 76;
      const scrollPosition = (todayIndex * buttonWidth) - (scrollViewWidth / 2) + (buttonWidth / 2);
      
      dateScrollRef.current.scrollTo({
        x: Math.max(0, scrollPosition),
        animated: false,
      });
    }
  }, [scrollViewWidth]);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['games', formatDateForAPI(selectedDate)],
    queryFn: () => fetchGames(selectedDate),
  });

  useEffect(() => {
    if (!isLoading && data) {
      setIsDataLoaded(true);
    } else {
      setIsDataLoaded(false);
    }
  }, [isLoading, data, selectedDate]);

  const sortedGames = useMemo(() => {
    const rawGames: Game[] = data?.games || [];
    
    return [...rawGames].sort((a, b) => {
      const getPriority = (g: Game) => {
        if (g.isMarquee) return 100;
        if (g.isOvertime) return 90;
        if (g.isClosest) return 80;
        
        // Live games
        if (g.gameStatus === 2) return 70;
        
        // Scheduled games
        if (g.gameStatus === 1) return 60;
        
        // Postponed
        if (g.gameStatus === 6) return 50;
        
        // Finished
        if (g.gameStatus === 3) return 40;
        
        return 0;
      };

      const priorityA = getPriority(a);
      const priorityB = getPriority(b);

      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }

      // If priorities are equal, sort by time if possible
      return a.gameId.localeCompare(b.gameId);
    });
  }, [data]);

  const formatDateLabel = (date: Date, index: number): string => {
    const today = getChineseDate();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.getTime() === today.getTime()) return '今天';
    if (date.getTime() === tomorrow.getTime()) return '明天';
    if (date.getTime() === yesterday.getTime()) return '昨天';
    
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };

  const renderGame = ({ item, index }: { item: Game, index: number }) => {
    const isLive = item.gameStatus === 2;
    const isFinished = item.gameStatus === 3;
    const isScheduled = item.gameStatus === 1;
    const isPostponed = item.gameStatus === 6;
    
    const getStatusText = () => {
      if (isFinished) return '已结束';
      if (isLive) return '直播中';
      if (isPostponed) return '延期';
      if (isScheduled) return '未开始';
      return item.gameStatusText;
    };

    const awayLogo = getTeamImage(item.awayTeam.abbreviation);
    const homeLogo = getTeamImage(item.homeTeam.abbreviation);

    const awayWin = isFinished && (item.awayTeam.score ?? 0) > (item.homeTeam.score ?? 0);
    const homeWin = isFinished && (item.homeTeam.score ?? 0) > (item.awayTeam.score ?? 0);

    return (
      <AnimatedSection index={index} visible={isDataLoaded}>
        <TouchableOpacity
          style={[
            styles.gameCard, 
            item.isMarquee && styles.marqueeCard
          ]}
          activeOpacity={0.6}
          onPress={() => {
            router.push(`/game/${item.gameId}`);
          }}
        >
          {item.isMarquee && (
            <View style={styles.marqueeBadge}>
              <Text style={styles.marqueeBadgeText}>焦点战</Text>
            </View>
          )}
          <View style={styles.gameContent}>
            {/* Away Team */}
            <View style={styles.teamSide}>
              <Image source={awayLogo} style={styles.teamLogo} resizeMode="contain" />
              <Text style={[styles.teamName, awayWin && styles.boldText]} numberOfLines={1}>
                {item.awayTeam.nameZhCN || item.awayTeam.abbreviation}
              </Text>
              <Text style={styles.recordText}>{item.awayTeam.wins}-{item.awayTeam.losses}</Text>
            </View>

            {/* Middle: Scores or Time */}
            <View style={styles.middleContainer}>
              {isScheduled ? (
                <View style={styles.upcomingBox}>
                  <Text style={styles.upcomingTime}>{item.gameEtFormatted?.time || '待定'}</Text>
                  <View style={styles.prematchBadge}>
                    <Text style={styles.prematchText}>赛前</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.scoreRow}>
                  <Text style={[
                    styles.scoreText, 
                    awayWin && styles.boldText,
                    !awayWin && isFinished && styles.dimmedText,
                    isLive && styles.liveScore
                  ]}>
                    {item.awayTeam.score}
                  </Text>
                  <Text style={styles.scoreDivider}>—</Text>
                  <Text style={[
                    styles.scoreText, 
                    homeWin && styles.boldText,
                    !homeWin && isFinished && styles.dimmedText,
                    isLive && styles.liveScore
                  ]}>
                    {item.homeTeam.score}
                  </Text>
                </View>
              )}
              
              {!isScheduled && (
                <View style={[
                  styles.statusBadge, 
                  isLive && styles.liveBadge,
                  item.isOvertime && styles.otBadge
                ]}>
                  {isLive && <View style={styles.liveDot} />}
                  <Text style={[
                    styles.statusText, 
                    isLive && styles.liveText,
                    item.isOvertime && styles.otText
                  ]}>
                    {item.isOvertime ? '加时赛' : getStatusText()}
                  </Text>
                </View>
              )}

              {item.isClosest && !isFinished && (
                <View style={styles.closestBadge}>
                  <Text style={styles.closestText}>焦灼</Text>
                </View>
              )}
            </View>

            {/* Home Team */}
            <View style={styles.teamSide}>
              <Image source={homeLogo} style={styles.teamLogo} resizeMode="contain" />
              <Text style={[styles.teamName, homeWin && styles.boldText]} numberOfLines={1}>
                {item.homeTeam.nameZhCN || item.homeTeam.abbreviation}
              </Text>
              <Text style={styles.recordText}>{item.homeTeam.wins}-{item.homeTeam.losses}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </AnimatedSection>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <ScrollView
          ref={dateScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dateScrollView}
          contentContainerStyle={styles.dateScrollContent}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            if (width > 0) setScrollViewWidth(width);
          }}
        >
          {dateOptions.map((date, index) => {
            const isSelected = date.getTime() === selectedDate.getTime();
            const isTodayDate = date.getTime() === getChineseDate().getTime();
            return (
              <TouchableOpacity
                key={index}
                style={[styles.dateButton, isSelected && styles.dateButtonActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedDate(date);
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dateButtonText,
                  isSelected && styles.dateButtonTextActive,
                  isTodayDate && !isSelected && styles.dateButtonTextToday
                ]}>
                  {formatDateLabel(date, index)}
                </Text>
                {isSelected && <View style={styles.activeDot} />}
                {isTodayDate && !isSelected && <View style={styles.todayIndicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading && !isRefetching ? (
        <View style={styles.list}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={styles.skeletonSide}>
                <Skeleton width={44} height={44} borderRadius={22} />
                <Skeleton width={60} height={12} style={{ marginTop: 8 }} />
              </View>
              <View style={styles.skeletonMiddle}>
                <Skeleton width={80} height={24} borderRadius={12} />
                <Skeleton width={40} height={10} style={{ marginTop: 8 }} />
              </View>
              <View style={styles.skeletonSide}>
                <Skeleton width={44} height={44} borderRadius={22} />
                <Skeleton width={60} height={12} style={{ marginTop: 8 }} />
              </View>
            </View>
          ))}
        </View>
      ) : error ? (
        <ErrorState 
          message={error instanceof Error ? error.message : '无法获取比赛数据'} 
          onRetry={refetch} 
        />
      ) : (
        <FlatList
          data={sortedGames}
          renderItem={renderGame}
          keyExtractor={(item) => item.gameId}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={isRefetching} 
              onRefresh={refetch} 
              tintColor={COLORS.accent} 
              progressViewOffset={insets.top + 60}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>今天没有比赛安排</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    backgroundColor: COLORS.header,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.divider,
  },
  dateScrollView: {
    flexGrow: 0,
  },
  dateScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButtonActive: {
    backgroundColor: COLORS.card,
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  dateButtonTextActive: {
    color: COLORS.textMain,
    fontWeight: '700',
  },
  dateButtonTextToday: {
    color: COLORS.accent,
  },
  activeDot: {
    position: 'absolute',
    bottom: 4,
    width: 12,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },
  todayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
    marginTop: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  gameCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  marqueeCard: {
    borderColor: COLORS.accent + '40',
    backgroundColor: COLORS.card,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  marqueeBadge: {
    position: 'absolute',
    top: 0,
    right: 20,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  marqueeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  otBadge: {
    backgroundColor: '#ff950020',
  },
  otText: {
    color: '#ff9500',
  },
  closestBadge: {
    marginTop: 4,
    backgroundColor: '#ff3b3015',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  closestText: {
    color: '#ff3b30',
    fontSize: 9,
    fontWeight: '800',
  },
  gameContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamSide: {
    flex: 1,
    alignItems: 'center',
  },
  teamLogo: {
    width: 44,
    height: 44,
    marginBottom: 8,
  },
  teamName: {
    fontSize: 14,
    color: COLORS.textMain,
    textAlign: 'center',
    marginBottom: 2,
  },
  recordText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  middleContainer: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  scoreText: {
    fontSize: 28,
    fontWeight: '600',
    color: COLORS.textMain,
    width: 50,
    textAlign: 'center',
  },
  dimmedText: {
    color: COLORS.textSecondary,
  },
  skeletonCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skeletonSide: {
    alignItems: 'center',
    flex: 1,
  },
  skeletonMiddle: {
    alignItems: 'center',
    flex: 1.2,
  },
  boldText: {
    fontWeight: '800',
  },
  liveScore: {
    color: COLORS.accent,
  },
  scoreDivider: {
    fontSize: 16,
    color: COLORS.divider,
    marginHorizontal: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff08',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  liveBadge: {
    backgroundColor: '#ef444415',
  },
  liveText: {
    color: COLORS.live,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.live,
    marginRight: 6,
  },
  upcomingBox: {
    alignItems: 'center',
  },
  upcomingTime: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textMain,
    marginBottom: 6,
  },
  prematchBadge: {
    backgroundColor: '#ffffff08',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  prematchText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  errorText: {
    color: COLORS.live,
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
  retryText: {
    color: COLORS.textMain,
    fontSize: 16,
    fontWeight: '600',
  },
});
