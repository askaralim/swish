import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useState, useMemo, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  RefreshControl, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { fetchGames, formatDateForAPI, getChineseDate } from '../src/services/api';
import { COLORS } from '../src/constants/theme';
import { GameCard, Game } from '../src/components/GameCard';
import { Skeleton } from '../src/components/Skeleton';
import { ErrorState } from '../src/components/ErrorState';
import { Ionicons } from '@expo/vector-icons';

const { width: windowWidth } = Dimensions.get('window');

const formatFullChineseDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const daysOfWeek = ['日', '一', '二', '三', '四', '五', '六'];
  const dayOfWeek = daysOfWeek[date.getDay()];
  return `${year}年${month}月${day}日星期${dayOfWeek}`;
};

export default function FullGamesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState<Date>(getChineseDate());
  const [selectedFilter, setSelectedFilter] = useState<'isClosest' | 'isOvertime' | 'isMarquee' | null>(null);
  const dateScrollRef = useRef<ScrollView>(null);
  const [scrollViewWidth, setScrollViewWidth] = useState(0);
  const todayIndex = 2;

  const dateOptions = useMemo(() => {
    const dates: Date[] = [];
    const today = getChineseDate();
    
    // Yesterday and another yesterday (total 2 days before today)
    for (let i = 2; i >= 1; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date);
    }
    
    // Today
    dates.push(today);
    
    // Tomorrow + Next 3 days (total 4 days after today)
    for (let i = 1; i <= 4; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []);

  useEffect(() => {
    if (scrollViewWidth > 0 && dateScrollRef.current) {
      const buttonWidth = 70; // Approximate button width
      const scrollPosition = (todayIndex * buttonWidth) - (scrollViewWidth / 2) + (buttonWidth / 2);
      
      dateScrollRef.current.scrollTo({
        x: Math.max(0, scrollPosition),
        animated: false,
      });
    }
  }, [scrollViewWidth]);

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['fullGames', formatDateForAPI(selectedDate)],
    queryFn: () => fetchGames(selectedDate),
    refetchInterval: (query) => {
      const games = query.state.data?.games || [];
      const hasLiveGames = games.some((g: any) => g.gameStatus === 2);
      return hasLiveGames ? 45000 : false;
    },
    staleTime: (query) => {
      const games = query.state.data?.games || [];
      const hasLiveGames = games.some((g: any) => g.gameStatus === 2);
      return hasLiveGames ? 0 : 5000;
    },
    placeholderData: keepPreviousData,
  });

  const onManualRefresh = async () => {
    setIsManualRefreshing(true);
    await refetch();
    setIsManualRefreshing(false);
  };

  const sortedAndFilteredGames = useMemo(() => {
    const rawGames: any[] = data?.games || [];
    
    let filtered = rawGames;

    if (selectedFilter) {
      filtered = rawGames.filter(game => game[selectedFilter] === true);
    }

    return [...filtered].sort((a, b) => {
      const getPriority = (g: any) => {
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
  }, [data, selectedFilter]);

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

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        {/* Nav Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.navButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textMain} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>全部比赛</Text>
          <View style={styles.navButton} />
        </View>

        {/* Date Selector */}
        <View style={styles.dateSelectorContainer}>
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
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.dateButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedDate(date);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dateButtonText,
                    isSelected && styles.dateButtonTextActive
                  ]}>
                    {formatDateLabel(date, index)}
                  </Text>
                  {isSelected && <View style={styles.activeDot} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* <Text style={styles.fullDateText}>{formatFullChineseDate(selectedDate)}</Text> */}
        
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>筛选:</Text>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'isClosest' && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(prev => (prev === 'isClosest' ? null : 'isClosest'))}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === 'isClosest' && styles.filterButtonTextActive,
            ]}>
              焦灼
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'isOvertime' && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(prev => (prev === 'isOvertime' ? null : 'isOvertime'))}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === 'isOvertime' && styles.filterButtonTextActive,
            ]}>
              加时
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'isMarquee' && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(prev => (prev === 'isMarquee' ? null : 'isMarquee'))}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === 'isMarquee' && styles.filterButtonTextActive,
            ]}>
              热门
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {(isLoading || (isRefetching && !data)) ? (
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
      ) : error && !isRefetching ? (
        <ErrorState 
          message={error instanceof Error ? error.message : '无法获取比赛数据'} 
          onRetry={refetch} 
        />
      ) : (
        <FlatList
          data={sortedAndFilteredGames}
          renderItem={({ item, index }) => (
            <GameCard item={item} index={index} isDataLoaded={true} />
          )}
          keyExtractor={(item) => item.gameId}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={isManualRefreshing} 
              onRefresh={onManualRefresh} 
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
    paddingBottom: 12,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    height: 44,
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  navTitle: {
    color: COLORS.textMain,
    fontSize: 17,
    fontWeight: '600',
  },
  dateSelectorContainer: {
    height: 44,
    justifyContent: 'center',
  },
  dateScrollView: {
    flexGrow: 0,
  },
  dateScrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  dateButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 4,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  dateButtonTextActive: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  activeDot: {
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
    marginTop: 4,
  },
  fullDateText: {
    color: COLORS.textMain,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  filterLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginRight: 10,
    alignSelf: 'center',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.cardSecondary,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: COLORS.cardSecondary,
    borderColor: COLORS.accent,
  },
  filterButtonText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    paddingTop: 12,
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
  emptyContainer: {
    paddingTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
});
