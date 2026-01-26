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
  ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchGames, formatDateForAPI, getChineseDate } from './services/api';
import { getTeamImage } from './utils/teamImages';

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

export default function GamesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState<Date>(getChineseDate());
  const dateScrollRef = useRef<ScrollView>(null);
  const [scrollViewWidth, setScrollViewWidth] = useState(0);
  const todayIndex = 2;

  const dateOptions = useMemo(() => {
    const dates: Date[] = [];
    const today = getChineseDate();
    
    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    dates.push(yesterdayDate);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    dates.push(yesterday);
    
    dates.push(today);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    dates.push(tomorrow);
    
    for (let i = 2; i <= 4; i++) {
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

  const games: Game[] = data?.games || [];

  const formatDateLabel = (date: Date, index: number): string => {
    const today = getChineseDate();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (index === 0) {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}/${day}`;
    }

    if (date.getTime() === today.getTime()) return '今天';
    if (date.getTime() === tomorrow.getTime()) return '明天';
    if (date.getTime() === yesterday.getTime()) return '昨天';
    
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };

  const renderGame = ({ item }: { item: Game }) => {
    const isLive = item.gameStatus === 2;
    const isFinished = item.gameStatus === 3;
    const isScheduled = item.gameStatus === 1;
    const isPostponed = item.gameStatus === 6;
    
    const awayLogo = getTeamImage(item.awayTeam.abbreviation);
    const homeLogo = getTeamImage(item.homeTeam.abbreviation);

    const awayWin = isFinished && (item.awayTeam.score ?? 0) > (item.homeTeam.score ?? 0);
    const homeWin = isFinished && (item.homeTeam.score ?? 0) > (item.awayTeam.score ?? 0);

    return (
      <TouchableOpacity
        style={styles.gameRow}
        activeOpacity={0.6}
        onPress={() => {
          router.push(`/game/${item.gameId}`);
        }}
      >
        <View style={styles.gameContent}>
          {/* Away Team */}
          <View style={styles.teamContainer}>
            <Image source={awayLogo} style={styles.teamLogoLarge} resizeMode="contain" />
            <Text style={styles.teamNameSub} numberOfLines={1}>
              {item.awayTeam.nameZhCN}
            </Text>
          </View>

          {/* Middle Info (Scores or Time) */}
          <View style={styles.middleContainer}>
            {isScheduled ? (
              <View style={styles.upcomingContainer}>
                <Text style={styles.upcomingTime}>{item.gameEtFormatted?.time || '待定'}</Text>
                <View style={styles.prematchBadge}>
                  <Text style={styles.prematchText}>赛前</Text>
                </View>
              </View>
            ) : (
              <View style={styles.scoreRow}>
                <Text style={[
                  styles.mainScore, 
                  awayWin && styles.winnerScore,
                  isLive && styles.liveScoreText
                ]}>
                  {item.awayTeam.score}
                </Text>
                <Text style={styles.scoreDivider}>—</Text>
                <Text style={[
                  styles.mainScore, 
                  homeWin && styles.winnerScore,
                  isLive && styles.liveScoreText
                ]}>
                  {item.homeTeam.score}
                </Text>
              </View>
            )}
            
            {!isScheduled && (
              <View style={[styles.statusBadge, isLive && styles.liveStatusBadge]}>
                <Text style={[styles.statusBadgeText, isLive && styles.liveStatusBadgeText]}>
                  {isFinished ? '已结束' : (isLive ? '直播中' : (isPostponed ? '延期' : item.gameStatusText))}
                </Text>
              </View>
            )}
          </View>

          {/* Home Team */}
          <View style={styles.teamContainer}>
            <Image source={homeLogo} style={styles.teamLogoLarge} resizeMode="contain" />
            <Text style={styles.teamNameSub} numberOfLines={1}>
              {item.homeTeam.nameZhCN}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSkeletonRow = () => (
    <View style={styles.gameRow}>
      <View style={styles.skeletonContent} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.dateNavContainer, { paddingTop: insets.top }]}>
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
                onPress={() => setSelectedDate(date)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dateButtonText,
                  isSelected && styles.dateButtonTextActive,
                  isTodayDate && !isSelected && styles.dateButtonTextToday
                ]}>
                  {formatDateLabel(date, index)}
                </Text>
                {isTodayDate && !isSelected && <View style={styles.todayIndicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading && !isRefetching ? (
        <FlatList
          data={[1, 2, 3, 4, 5]}
          renderItem={renderSkeletonRow}
          keyExtractor={(item) => `skeleton-${item}`}
          contentContainerStyle={styles.list}
        />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error instanceof Error ? error.message : '加载失败'}
          </Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>重试</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={games}
          renderItem={renderGame}
          keyExtractor={(item) => item.gameId}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#1d9bf0" />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  dateNavContainer: {
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#16181c',
  },
  dateScrollView: {
    flexGrow: 0,
  },
  dateScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  dateButtonActive: {
    backgroundColor: '#1d9bf0',
  },
  dateButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#71767a',
  },
  dateButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  dateButtonTextToday: {
    color: '#1d9bf0',
  },
  todayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1d9bf0',
    marginTop: 4,
  },
  list: {
    paddingVertical: 8,
  },
  gameRow: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    minHeight: 140,
    justifyContent: 'center',
  },
  gameContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamLogoLarge: {
    width: 56,
    height: 56,
    marginBottom: 8,
  },
  teamNameSub: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
  },
  middleContainer: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  mainScore: {
    fontSize: 32,
    fontWeight: '700',
    color: '#71767a', // Non-winners are grayed out
    width: 60,
    textAlign: 'center',
  },
  winnerScore: {
    color: '#ffffff', // Winner/Active is white
  },
  liveScoreText: {
    color: '#1d9bf0', // Live scores in blue
  },
  scoreDivider: {
    fontSize: 20,
    color: '#2f3336',
    marginHorizontal: 4,
  },
  statusBadge: {
    backgroundColor: '#16181c',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71767a',
  },
  liveStatusBadge: {
    backgroundColor: '#1d9bf020',
    borderColor: '#1d9bf0',
    borderWidth: 1,
  },
  liveStatusBadgeText: {
    color: '#1d9bf0',
  },
  upcomingContainer: {
    alignItems: 'center',
  },
  upcomingTime: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  prematchBadge: {
    backgroundColor: '#16181c',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2f3336',
  },
  prematchText: {
    fontSize: 12,
    color: '#71767a',
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#16181c',
    marginHorizontal: 16,
  },
  skeletonContent: {
    height: 100,
    backgroundColor: '#16181c',
    borderRadius: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#1d9bf0',
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
