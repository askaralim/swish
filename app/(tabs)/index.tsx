import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchGames, fetchTodayTopPerformers, fetchSeasonLeaders, fetchAppConfig, formatDateForAPI, getChineseDate } from '../../src/services/api';
import { SEASON_TYPES } from '../../src/constants/season';
import { getTeamImage } from '../../src/utils/teamImages';
import { COLORS } from '../../src/constants/theme';
import { AnimatedSection } from '../../src/components/AnimatedSection';
import { Skeleton } from '../../src/components/Skeleton';
import { ErrorState } from '../../src/components/ErrorState';
import { HomePlayerCard, TopPerformer } from '../../src/components/HomePlayerCard';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Ionicons } from '@expo/vector-icons';
import { usePostHog } from 'posthog-react-native';
import type { SeasonMeta } from '../../src/types/player';

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
  gameClock?: string;
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


export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const posthog = usePostHog();
  const selectedDate = getChineseDate();
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [viewingPostseasonLeaders, setViewingPostseasonLeaders] = useState(false);
  const seasonLeadersMetaSticky = useRef<SeasonMeta | undefined>(undefined);

  const seasonLeadersSeasonType = viewingPostseasonLeaders
    ? SEASON_TYPES.POSTSEASON
    : SEASON_TYPES.REGULAR;

  // 1. Fetch Today's Top Performers
  const { data: topPerformersData, refetch: refetchPerformers, isRefetching: isRefetchingPerformers } = useQuery({
    queryKey: ['todayTopPerformers', formatDateForAPI(selectedDate)],
    queryFn: () => fetchTodayTopPerformers(selectedDate),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const { data: appConfig, refetch: refetchAppConfig } = useQuery({
    queryKey: ['appConfig'],
    queryFn: fetchAppConfig,
    staleTime: 30 * 60 * 1000,
  });
  const showPlayerHeadshots = appConfig?.showPlayerHeadshots === true;
  const leagueDisplay = appConfig?.leagueSeason?.displayName;

  // 2. Fetch Season Leaders (explicit seasontype in key + AbortSignal: cancel abandoned toggles, stable cache per type)
  const {
    data: seasonLeadersData,
    error: seasonLeadersError,
    refetch: refetchSeasonLeaders,
    isRefetching: isRefetchingSeasonLeaders,
    isPending: isSeasonLeadersPending,
    isFetching: isSeasonLeadersFetching,
  } = useQuery({
    queryKey: ['seasonLeaders', seasonLeadersSeasonType, appConfig?.leagueSeason?.year],
    queryFn: ({ signal }) => fetchSeasonLeaders(seasonLeadersSeasonType, signal),
    staleTime: 60 * 60 * 1000,
  });

  useEffect(() => {
    if (seasonLeadersData?.seasonMeta) {
      seasonLeadersMetaSticky.current = seasonLeadersData.seasonMeta;
    }
  }, [seasonLeadersData?.seasonMeta]);

  const seasonLeadersMeta = seasonLeadersData?.seasonMeta ?? seasonLeadersMetaSticky.current;
  const showSeasonLeadersPlayoffToggle = seasonLeadersMeta?.postseasonAvailable === true;

  const isColdStartSeasonLeaders =
    isSeasonLeadersPending && !seasonLeadersData && !seasonLeadersMetaSticky.current;
  const seasonLeadersSwitchBusy =
    isSeasonLeadersFetching && (isSeasonLeadersPending || !seasonLeadersData);

  useEffect(() => {
    if (!showSeasonLeadersPlayoffToggle && viewingPostseasonLeaders) {
      setViewingPostseasonLeaders(false);
    }
  }, [showSeasonLeadersPlayoffToggle, viewingPostseasonLeaders]);

  const seasonLeadersSectionTitle = leagueDisplay
    ? `${viewingPostseasonLeaders ? '季后赛' : '赛季'} TOP 3`
    : viewingPostseasonLeaders
      ? '季后赛 TOP 3'
      : '常规赛 TOP 3';

  // 3. Fetch Games (Featured)
  const { data: gamesResponse, error: gamesError, refetch: refetchGames, isRefetching: isRefetchingGames } = useQuery({
    queryKey: ['games', formatDateForAPI(selectedDate), 'featured'],
    queryFn: () => fetchGames(selectedDate, true),
    placeholderData: keepPreviousData,
    refetchInterval: (query) => {
      const data = query.state.data as any;
      const games = data?.games || [];
      const hasLiveGames = games.some((g: any) => g.gameStatus === 2);
      return hasLiveGames ? 60000 : false;
    },
  });

  const onManualRefresh = async () => {
    await Promise.all([
      refetchPerformers(),
      refetchGames(),
      refetchAppConfig(),
      refetchSeasonLeaders(),
    ]);
  };

  useEffect(() => {
    if (gamesResponse) {
      setIsDataLoaded(true);
    }
  }, [gamesResponse]);

  // Process Top Performers (GIS-based or legacy)
  const topPerformers = useMemo(() => {
    if (!topPerformersData) return { performers: [], isGis: false };

    if (topPerformersData.mode === 'gis' && Array.isArray(topPerformersData.performers)) {
      return {
        performers: topPerformersData.performers.slice(0, 5).map((p: any) => ({
          id: p.id,
          name: p.name,
          teamAbbreviation: p.teamAbbreviation || '',
          teamNameZhCN: p.teamNameZhCN,
          competitionId: p.competitionId || '',
          headshot: p.headshot || '',
          value: p.gis ?? 0,
          statType: 'gis' as const,
          gis: p.gis,
          stats: p.stats,
          insight: p.insight,
        })),
        isGis: true,
      };
    }

    const processCategory = (list: any[], type: TopPerformer['statType']) => {
      if (!list) return [];
      return list.slice(0, 5).map((p: any) => ({
        id: p.id,
        name: p.name,
        teamAbbreviation: p.teamAbbreviation,
        teamNameZhCN: p.teamNameZhCN,
        competitionId: p.competitionId,
        headshot: p.headshot,
        value: p.value,
        statType: type,
      }));
    };

    return {
      performers: [],
      points: processCategory(topPerformersData.points, 'points'),
      rebounds: processCategory(topPerformersData.rebounds, 'rebounds'),
      assists: processCategory(topPerformersData.assists, 'assists'),
      isGis: false,
    };
  }, [topPerformersData]);

  // Process Season Leaders
  const seasonLeaders = useMemo(() => {
    if (!seasonLeadersData) return { points: [], rebounds: [], assists: [] };

    const processCategory = (list: any[], type: TopPerformer['statType']) => {
      if (!list) return [];
      return list.slice(0, 5).map((p: any) => ({
        id: p.id,
        name: p.name,
        teamAbbreviation: p.teamAbbreviation,
        teamNameZhCN: p.teamNameZhCN,
        competitionId: p.competitionId,
        headshot: p.headshot,
        value: p.value,
        statType: type,
      }));
    };

    return {
      points: processCategory(seasonLeadersData.points, 'points'),
      rebounds: processCategory(seasonLeadersData.rebounds, 'rebounds'),
      assists: processCategory(seasonLeadersData.assists, 'assists'),
    };
  }, [seasonLeadersData]);

  const handleCompare = (playerId: string, statType: TopPerformer['statType']) => {
    let seasonLeaderId = null;
    const seasonKey =
      statType === 'points' || statType === 'rebounds' || statType === 'assists'
        ? statType
        : null;
    if (seasonLeadersData && seasonKey) {
      const leadersList = seasonLeadersData[seasonKey] as { id: string }[] | undefined;
      if (leadersList && leadersList.length > 0) {
        seasonLeaderId = leadersList[0].id;
      }
    }

    if (seasonLeaderId) {
      const listForAlt =
        seasonKey && seasonLeadersData
          ? (seasonLeadersData[seasonKey] as { id: string }[] | undefined)
          : undefined;
      if (
        seasonKey &&
        seasonLeaderId === playerId &&
        listForAlt &&
        listForAlt.length > 1
      ) {
        seasonLeaderId = listForAlt[1].id;
      }
      router.push(`/playerComparison/${playerId}/${seasonLeaderId}`);
    } else {
      router.push(`/player/${playerId}`);
    }
  };

  const formatFullChineseDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const daysOfWeek = ['日', '一', '二', '三', '四', '五', '六'];
    const dayOfWeek = daysOfWeek[date.getDay()];
    return `${year}年${month}月${day}日 星期${dayOfWeek}`;
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
      if (isScheduled) return '未开赛';
      return item.gameStatusText;
    };

    const awayLogo = getTeamImage(item.awayTeam.abbreviation);
    const homeLogo = getTeamImage(item.homeTeam.abbreviation);

    const awayWin = isFinished && (item.awayTeam.score ?? 0) > (item.homeTeam.score ?? 0);
    const homeWin = isFinished && (item.homeTeam.score ?? 0) > (item.awayTeam.score ?? 0);

    return (
      <AnimatedSection key={item.gameId} index={index} visible={isDataLoaded}>
        <TouchableOpacity
          style={[
            styles.gameCard,
            item.isMarquee && styles.marqueeCard
          ]}
          activeOpacity={0.6}
          onPress={() => {
            posthog.capture('game_tapped', {
              game_id: item.gameId,
              game_status: item.gameStatus,
              home_team: item.homeTeam.abbreviation,
              away_team: item.awayTeam.abbreviation,
              is_marquee: item.isMarquee ?? false,
              is_live: isLive,
            });
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
                    <Text style={styles.prematchText}>未开赛</Text>
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
                  {isLive && item.period && item.gameClock && (
                    <Text style={[styles.statusText, styles.liveText]}>
                      · {item.period > 4 ? `OT${item.period - 4}` : `Q${item.period}`} {item.gameClock}
                    </Text>
                  )}
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

  const getGameContext = (competitionId?: string) => {
    if (!competitionId || !gamesResponse) return undefined;
    const gamePool = [...(gamesResponse.games || []), ...(gamesResponse.featured || [])] as Game[];
    const game = gamePool.find((item) => item.gameId === competitionId);
    if (!game) return undefined;

    const awayName = game.awayTeam.nameZhCN || game.awayTeam.abbreviation;
    const homeName = game.homeTeam.nameZhCN || game.homeTeam.abbreviation;
    const statusText =
      game.gameStatus === 3
        ? '已结束'
        : game.gameStatus === 2
          ? game.period && game.gameClock
            ? `${game.period > 4 ? `OT${game.period - 4}` : `Q${game.period}`} ${game.gameClock}`
            : '直播中'
          : game.gameEtFormatted?.time || game.gameStatusText || '未开赛';

    if (game.awayTeam.score != null && game.homeTeam.score != null) {
      return `${awayName} ${game.awayTeam.score} - ${game.homeTeam.score} ${homeName} · ${statusText}`;
    }

    return `${awayName} vs ${homeName} · ${statusText}`;
  };

  const renderPerformerSection = (title: string, data: TopPerformer[], showCompare: boolean = true, useListLayout: boolean = false, variant: 'today' | 'season' = 'today') => {
    if (!data || data.length === 0) return null;
    const isSeasonSection = variant === 'season';
    const cardProps = (performer: TopPerformer, index: number) => ({
      performer,
      onCompare: handleCompare,
      showCompare,
      listLayout: useListLayout || isSeasonSection,
      variant,
      showPlayerHeadshots,
      rank: index + 1,
      gameContext: getGameContext(performer.competitionId),
      presentation:
        variant === 'today' && useListLayout
          ? index === 0
            ? 'lead' as const
            : 'supporting' as const
          : 'standard' as const,
      onPress: (_id: string) => {
        posthog.capture('top_performer_tapped', {
          player_id: performer.id,
          player_name: performer.name,
          stat_type: performer.statType,
          variant,
          navigates_to: showCompare && performer.competitionId ? 'game' : 'player',
        });
        if (showCompare && performer.competitionId) {
          router.push(`/game/${performer.competitionId}`);
        } else {
          router.push(`/player/${performer.id}`);
        }
      },
    });

    if (isSeasonSection) {
      return (
        <View style={styles.seasonLeaderGroup}>
          <Text style={styles.seasonLeaderGroupTitle}>{title}</Text>
          <View style={styles.seasonLeaderRows}>
            {data.map((performer, index) => (
              <View key={`${performer.id}-${index}`}>
                <HomePlayerCard {...cardProps(performer, index)} />
                {index < data.length - 1 ? <View style={styles.seasonLeaderDivider} /> : null}
              </View>
            ))}
          </View>
        </View>
      );
    }

    return (
      <View style={{ marginBottom: 24 }}>
        {title ? <Text style={styles.performerSectionTitle}>{title}</Text> : null}
        {useListLayout ? (
          <View style={styles.performerListVertical}>
            {data.map((performer, index) => (
              <HomePlayerCard key={performer.id} {...cardProps(performer, index)} />
            ))}
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.performerList}>
            {data.map((performer, index) => (
              <HomePlayerCard key={performer.id} {...cardProps(performer, index)} />
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  // Determine which games to show
  const allGames = gamesResponse?.games || [];
  const featuredGamesRaw = gamesResponse?.featured || [];
  // Fallback: If no featured games, show top 3 from all games
  const gamesToShow = featuredGamesRaw.length > 0 ? featuredGamesRaw : allGames.slice(0, 3);

  const totalGamesCount = gamesResponse?.totalGames || 0;
  const featuredCount = featuredGamesRaw.length;

  const renderGamesSection = () => (
    <View style={styles.homeSection}>
      <View style={[styles.sectionHeader, styles.sectionHeaderCompact]}>
        <View>
          <Text style={styles.sectionTitle}>今日比赛</Text>
          {gamesResponse && (
            <Text style={styles.gameCountText}>
              · {totalGamesCount} 场比赛 · {featuredCount > 0 ? `${featuredCount} 焦点` : ''}
            </Text>
          )}
        </View>
      </View>

      {!gamesResponse && !gamesError ? (
        <View style={styles.list}>
          {[1, 2].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <Skeleton width={'100%'} height={120} borderRadius={16} />
            </View>
          ))}
        </View>
      ) : gamesError ? (
        <ErrorState message="无法获取比赛数据" onRetry={refetchGames} />
      ) : (
        <View style={styles.list}>
          {gamesToShow.length > 0 ? (
            gamesToShow.map((game: Game, index: number) => renderGame({ item: game, index }))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无焦点赛事</Text>
            </View>
          )}

          <Link href="/fullgames" asChild>
            <TouchableOpacity
              style={styles.viewAllGamesButton}
              activeOpacity={0.7}
              onPress={() => posthog.capture('view_all_games_tapped', { total_games: totalGamesCount })}
            >
              <Text style={styles.viewAllGamesButtonText}>查看全部 {totalGamesCount} 场比赛</Text>
            </TouchableOpacity>
          </Link>
        </View>
      )}
    </View>
  );

  const hasTopPerformers = topPerformers.isGis
    ? topPerformers.performers.length > 0
    : ((topPerformers.points?.length ?? 0) > 0 || (topPerformers.rebounds?.length ?? 0) > 0 || (topPerformers.assists?.length ?? 0) > 0);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="唰数据"
        // subtitle={formatFullChineseDate(selectedDate)}
        insetsTop={insets.top}
        rightElement={
          <View style={styles.headerDateRow}>
            <Text style={styles.dateText}>{formatFullChineseDate(selectedDate)}</Text>
            <Link href="/fullgames" asChild>
              <TouchableOpacity style={styles.viewAllIcon} activeOpacity={0.7}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </Link>
          </View>
        }
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={
              isRefetchingGames || isRefetchingPerformers || isRefetchingSeasonLeaders
            }
            onRefresh={onManualRefresh}
            tintColor={COLORS.accent}
          />
        }
      >
        <View style={styles.homeSection}>
          {/* Top Performers Sections */}
          {!topPerformersData ? (
            <View style={{ padding: 16 }}>
               <Skeleton width={150} height={20} marginBottom={14} />
               <View style={{ flexDirection: 'row' }}>
                 <Skeleton width={160} height={140} borderRadius={16} marginRight={12} />
                 <Skeleton width={160} height={140} borderRadius={16} />
               </View>
            </View>
          ) : hasTopPerformers ? (
            <>
            <View style={styles.performerSection}>
              <View style={styles.performerHeaderRow}>
                <View>
                  <Text style={styles.performerSectionHeader}>今日影响力</Text>
                </View>
              </View>
            </View>
            {topPerformers.isGis ? (
              renderPerformerSection('', topPerformers.performers, true, true)
            ) : (
              <>
                {renderPerformerSection('得分', topPerformers.points ?? [])}
                {renderPerformerSection('篮板', topPerformers.rebounds ?? [])}
                {renderPerformerSection('助攻', topPerformers.assists ?? [])}
              </>
            )}
            </>
          ) : null}
        </View>

        {renderGamesSection()}

        <View style={styles.homeSection}>
          {/* Season Leaders Sections */}
          {seasonLeadersError ? (
            <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <ErrorState
              message={
                seasonLeadersError instanceof Error
                  ? seasonLeadersError.message
                  : '无法获取赛季榜单'
              }
              onRetry={() => refetchSeasonLeaders()}
            />
            </View>
          ) : isColdStartSeasonLeaders ? (
            <View style={{ padding: 16 }}>
            <Skeleton width={150} height={20} marginBottom={12} />
            <View style={{ flexDirection: 'row' }}>
              <Skeleton width={160} height={140} borderRadius={16} marginRight={12} />
              <Skeleton width={160} height={140} borderRadius={16} />
            </View>
            </View>
          ) : (
            <>
            {showSeasonLeadersPlayoffToggle && (
              <View style={[styles.seasonSegmentRow, seasonLeadersSwitchBusy && styles.seasonSegmentRowBusy]}>
                <TouchableOpacity
                  style={[
                    styles.seasonSegmentBtn,
                    !viewingPostseasonLeaders && styles.seasonSegmentBtnActive,
                  ]}
                  disabled={seasonLeadersSwitchBusy}
                  onPress={() => {
                    posthog.capture('season_type_toggled', { season_type: 'regular' });
                    setViewingPostseasonLeaders(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.seasonSegmentText,
                      !viewingPostseasonLeaders && styles.seasonSegmentTextActive,
                    ]}
                  >
                    常规赛
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.seasonSegmentBtn,
                    viewingPostseasonLeaders && styles.seasonSegmentBtnActive,
                  ]}
                  disabled={seasonLeadersSwitchBusy}
                  onPress={() => {
                    posthog.capture('season_type_toggled', { season_type: 'postseason' });
                    setViewingPostseasonLeaders(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.seasonSegmentText,
                      viewingPostseasonLeaders && styles.seasonSegmentTextActive,
                    ]}
                  >
                    季后赛
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              style={styles.sectionHeaderAction}
              onPress={() => router.push('/players')}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderActionTitleCol}>
                <Text style={styles.sectionHeaderActionTitle}>{seasonLeadersSectionTitle}</Text>
              </View>
              <Text style={styles.sectionHeaderActionLink}>查看赛季</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.accent} />
            </TouchableOpacity>
            {seasonLeadersSwitchBusy ? (
              <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                <Skeleton width="100%" height={88} borderRadius={16} marginBottom={12} />
                <Skeleton width="100%" height={88} borderRadius={16} marginBottom={12} />
                <Skeleton width="100%" height={88} borderRadius={16} />
              </View>
            ) : seasonLeadersData ? (
              <>
                <View style={styles.seasonLeaderGroups}>
                  {renderPerformerSection('得分', seasonLeaders.points, false, true, 'season')}
                  {renderPerformerSection('篮板', seasonLeaders.rebounds, false, true, 'season')}
                  {renderPerformerSection('助攻', seasonLeaders.assists, false, true, 'season')}
                </View>

                {!seasonLeaders.points.length &&
                  !seasonLeaders.rebounds.length &&
                  !seasonLeaders.assists.length && (
                    <View style={styles.emptyStateContainer}>
                      <Text style={styles.emptyStateText}>暂无赛季数据</Text>
                    </View>
                  )}
              </>
            ) : null}
            </>
          )}
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
  homeSection: {
    marginBottom: 24,
  },
  performerSection: {
    marginTop: 14,
  },
  sectionHeaderAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 0,
    marginBottom: 14,
    gap: 6,
  },
  sectionHeaderActionTitleCol: {
    flex: 1,
    minWidth: 0,
  },
  sectionHeaderActionTitle: {
    color: COLORS.textMain,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionHeaderActionHint: {
    marginTop: 2,
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  sectionHeaderActionLink: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  performerSectionHeader: {
    color: COLORS.textMain,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
  },
  performerHeaderRow: {
    paddingHorizontal: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  performerSectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 16,
    textTransform: 'uppercase',
  },
  performerList: {
    paddingHorizontal: 16,
  },
  performerListVertical: {
    paddingHorizontal: 16,
    gap: 2,
  },
  seasonLeaderGroups: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
  },
  seasonLeaderGroup: {
    backgroundColor: COLORS.cardMuted,
    borderRadius: 14,
    overflow: 'hidden',
  },
  seasonLeaderGroupTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 2,
  },
  seasonLeaderRows: {
    paddingBottom: 2,
  },
  seasonLeaderDivider: {
    height: 1,
    marginLeft: 90,
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  sectionHeader: {
    marginTop: 0,
    marginBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderCompact: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.textMain,
    fontSize: 20,
    fontWeight: '800',
  },
  gameCountText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
    fontWeight: '600',
  },
  viewAllIcon: {
    padding: 4,
  },
  headerDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  list: {
    paddingHorizontal: 16,
  },
  emptyStateContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  seasonSegmentRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 12,
    backgroundColor: COLORS.cardMuted,
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  seasonSegmentRowBusy: {
    opacity: 0.55,
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
  dateText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  // Game Card Styles (Reused)
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
    fontWeight: '600',
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
    marginBottom: 12,
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
  viewAllGamesButton: {
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 0,
    marginTop: 20,
    marginBottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllGamesButtonText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
});
