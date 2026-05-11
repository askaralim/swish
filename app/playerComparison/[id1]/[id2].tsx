import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { fetchPlayerDetails, fetchPlayerCurrentStats } from '../../../src/services/api';
import { COLORS } from '../../../src/constants/theme';
import { Skeleton } from '../../../src/components/Skeleton';
import { ErrorState } from '../../../src/components/ErrorState';
import { getTeamImage } from '../../../src/utils/teamImages';
import { PlayerPickerModal } from '../../../src/components/PlayerPickerModal';
import { Ionicons } from '@expo/vector-icons';
import { usePostHog } from 'posthog-react-native';
import { goBackOrReplace } from '../../../src/utils/navigation';


interface PlayerData {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  jersey: string;
  position: string;
  teamAbbreviation: string;
  teamName: string;
  teamNameZhCN: string;
  headshot: string;
  height: string;
  weight: string;
  country: string;
  dateOfBirth: string;
  age: number;
  experience: string;
  draft: string;
  college: string;
  stats: {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    fieldGoalPct: number;
    threePointPct: number;
    freeThrowPct: number;
    gamesPlayed: number;
  };
}

interface ComparisonStatProps {
  label: string;
  player1Value: string | number | null | undefined;
  player2Value: string | number | null | undefined;
  highlightHigher?: boolean;
  isPercentage?: boolean;
}

const ComparisonStat: React.FC<ComparisonStatProps> = ({ label, player1Value, player2Value, highlightHigher, isPercentage }) => {
  const val1 = typeof player1Value === 'number' ? player1Value : 0;
  const val2 = typeof player2Value === 'number' ? player2Value : 0;
  
  const p1Text = typeof player1Value === 'number' ? (isPercentage ? player1Value + '%' : player1Value) : '--';
  const p2Text = typeof player2Value === 'number' ? (isPercentage ? player2Value + '%' : player2Value) : '--';

  const maxVal = Math.max(val1, val2) || 1; 
  
  const p1BarWidth = Math.min((val1 / maxVal) * 100, 100);
  const p2BarWidth = Math.min((val2 / maxVal) * 100, 100);

  const isP1Higher = highlightHigher && val1 > val2;
  const isP2Higher = highlightHigher && val2 > val1;

  return (
    <View style={comparisonStyles.statContainer}>
      <Text style={comparisonStyles.statLabel}>{label}</Text>
      <View style={comparisonStyles.statRow}>
        <Text style={[comparisonStyles.statValue, comparisonStyles.statValueLeft, isP1Higher && comparisonStyles.highlightValue]}>
          {p1Text}
        </Text>
        
        <View style={comparisonStyles.barsArea}>
          <View style={comparisonStyles.barWrapperLeft}>
            <View style={[
              comparisonStyles.bar, 
              { 
                width: `${p1BarWidth}%`, 
                backgroundColor: isP1Higher ? COLORS.accent : COLORS.cardSecondary,
                opacity: isP1Higher ? 1 : 0.5
              }
            ]} />
          </View>
          
          <View style={comparisonStyles.barDivider} />

          <View style={comparisonStyles.barWrapperRight}>
             <View style={[
              comparisonStyles.bar, 
              { 
                width: `${p2BarWidth}%`, 
                backgroundColor: isP2Higher ? COLORS.accent : COLORS.cardSecondary,
                opacity: isP2Higher ? 1 : 0.5
              }
            ]} />
          </View>
        </View>

        <Text style={[comparisonStyles.statValue, comparisonStyles.statValueRight, isP2Higher && comparisonStyles.highlightValue]}>
          {p2Text}
        </Text>
      </View>
    </View>
  );
};

export default function PlayerComparisonScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const posthog = usePostHog();
  const { id1, id2 } = useLocalSearchParams<{ id1: string; id2: string }>();

  const [player1Id, setPlayer1Id] = useState<string | null>(id1 || null);
  const [player2Id, setPlayer2Id] = useState<string | null>(id2 || null);
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [selectingPlayerSlot, setSelectingPlayerSlot] = useState<1 | 2>(1);
  const [pickerModalKey, setPickerModalKey] = useState(0);

  useEffect(() => {
    posthog.capture('player_comparison_viewed', {
      player1_id: id1 ?? null,
      player2_id: id2 ?? null,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setShowPlayerPicker(false);
        setPickerModalKey((k) => k + 1);
      };
    }, [])
  );

  useEffect(() => {
    if (id1) setPlayer1Id(id1);
    if (id2) setPlayer2Id(id2);
  }, [id1, id2]);

  const { data: player1Details, isLoading: isLoadingP1Details, error: errorP1Details } = useQuery({
    queryKey: ['playerDetails', player1Id],
    queryFn: () => fetchPlayerDetails(player1Id!),
    enabled: !!player1Id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: player1BasicStats, isLoading: isLoadingP1Stats, error: errorP1Stats } = useQuery({
    queryKey: ['playerBasicStats', player1Id],
    queryFn: () => fetchPlayerCurrentStats(player1Id!),
    enabled: !!player1Id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: player2Details, isLoading: isLoadingP2Details, error: errorP2Details } = useQuery({
    queryKey: ['playerDetails', player2Id],
    queryFn: () => fetchPlayerDetails(player2Id!),
    enabled: !!player2Id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: player2BasicStats, isLoading: isLoadingP2Stats, error: errorP2Stats } = useQuery({
    queryKey: ['playerBasicStats', player2Id],
    queryFn: () => fetchPlayerCurrentStats(player2Id!),
    enabled: !!player2Id,
    staleTime: 5 * 60 * 1000,
  });

  const player1Data: PlayerData | null = useMemo(() => {
    if (player1Details && player1BasicStats?.stats) {
      const stats = player1BasicStats.stats;
      const team = player1Details.team || {};
      return {
        id: player1Details.id,
        firstName: player1Details.firstName,
        lastName: player1Details.lastName,
        name: player1Details.name,
        jersey: player1Details.jersey,
        position: player1Details.position,
        teamAbbreviation: team.abbreviation,
        teamName: team.name,
        teamNameZhCN: team.nameZhCN,
        headshot: player1Details.photo || player1Details.headshot,
        height: player1Details.height,
        weight: player1Details.weight,
        country: player1Details.country,
        dateOfBirth: player1Details.dob || player1Details.dateOfBirth,
        age: player1Details.age,
        experience: player1Details.experience,
        draft: player1Details.draft,
        college: player1Details.college,
        stats: {
          points: parseFloat(stats.avgPoints || '0'),
          rebounds: parseFloat(stats.avgRebounds || '0'),
          assists: parseFloat(stats.avgAssists || '0'),
          steals: parseFloat(stats.avgSteals || '0'),
          blocks: parseFloat(stats.avgBlocks || '0'),
          fieldGoalPct: parseFloat(stats.fieldGoalPct || '0'),
          threePointPct: parseFloat(stats.threePointFieldGoalPct || '0'),
          freeThrowPct: parseFloat(stats.freeThrowPct || '0'),
          gamesPlayed: parseInt(stats.gamesPlayed || '0', 10),
        },
      };
    }
    return null;
  }, [player1Details, player1BasicStats]);

  const player2Data: PlayerData | null = useMemo(() => {
    if (player2Details && player2BasicStats?.stats) {
      const stats = player2BasicStats.stats;
      const team = player2Details.team || {};
      return {
        id: player2Details.id,
        name: player2Details.name,
        firstName: player2Details.firstName,
        lastName: player2Details.lastName,
        jersey: player2Details.jersey,
        position: player2Details.position,
        teamAbbreviation: team.abbreviation,
        teamName: team.name,
        teamNameZhCN: team.nameZhCN,
        headshot: player2Details.photo || player2Details.headshot,
        height: player2Details.height,
        weight: player2Details.weight,
        country: player2Details.country,
        dateOfBirth: player2Details.dob || player2Details.dateOfBirth,
        age: player2Details.age,
        experience: player2Details.experience,
        draft: player2Details.draft,
        college: player2Details.college,
        stats: {
          points: parseFloat(stats.avgPoints || '0'),
          rebounds: parseFloat(stats.avgRebounds || '0'),
          assists: parseFloat(stats.avgAssists || '0'),
          steals: parseFloat(stats.avgSteals || '0'),
          blocks: parseFloat(stats.avgBlocks || '0'),
          fieldGoalPct: parseFloat(stats.fieldGoalPct || '0'),
          threePointPct: parseFloat(stats.threePointFieldGoalPct || '0'),
          freeThrowPct: parseFloat(stats.freeThrowPct || '0'),
          gamesPlayed: parseInt(stats.gamesPlayed || '0', 10),
        },
      };
    }
    return null;
  }, [player2Details, player2BasicStats]);

  const isLoading = isLoadingP1Details || isLoadingP1Stats || isLoadingP2Details || isLoadingP2Stats;
  const error = errorP1Details || errorP1Stats || errorP2Details || errorP2Stats;

  const handleSelectPlayer = (playerId: string) => {
    posthog.capture('player_selected_for_comparison', {
      player_id: playerId,
      slot: selectingPlayerSlot,
    });
    if (selectingPlayerSlot === 1) {
      setPlayer1Id(playerId);
    } else {
      setPlayer2Id(playerId);
    }
    setShowPlayerPicker(false);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header with Player Selectors */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => goBackOrReplace(router, '/players')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textMain} />
        </TouchableOpacity>
        
        <View style={styles.headerSelectors}>
          <TouchableOpacity 
            style={styles.selectorButton}
            onPress={() => {setSelectingPlayerSlot(1); setShowPlayerPicker(true);}}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.selectorName} numberOfLines={1}>
                {player1Data ? player1Data.name : '选择球员'}
              </Text>
              <View style={styles.selectorRow}>
                <Text style={styles.selectorTeam}>
                  {player1Data ? player1Data.teamNameZhCN : '--'}
                </Text>
                <Ionicons name="caret-down" size={10} color={COLORS.textSecondary} style={{ marginLeft: 4 }} />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.vsContainerHeader}>
            <Text style={styles.vsTextHeader}>VS</Text>
          </View>

          <TouchableOpacity 
            style={styles.selectorButton}
            onPress={() => {setSelectingPlayerSlot(2); setShowPlayerPicker(true);}}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.selectorName} numberOfLines={1}>
                {player2Data ? player2Data.name : '选择球员'}
              </Text>
              <View style={styles.selectorRow}>
                <Text style={styles.selectorTeam}>
                  {player2Data ? player2Data.teamNameZhCN : '--'}
                </Text>
                <Ionicons name="caret-down" size={10} color={COLORS.textSecondary} style={{ marginLeft: 4 }} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollViewContent, { paddingTop: 20 }]} showsVerticalScrollIndicator={false}>
        {error ? (
          <ErrorState
            message={error instanceof Error ? error.message : '无法获取球员数据'}
            onRetry={() => { /* Refetch logic here if needed */ }}
          />
        ) : (
          <View style={styles.comparisonContainer}>
            {/* Player 1 Card */}
            <TouchableOpacity 
              style={styles.playerCard} 
              onPress={() => {setSelectingPlayerSlot(1); setShowPlayerPicker(true);}}
              activeOpacity={0.7}
            >
              {isLoadingP1Details || isLoadingP1Stats ? (
                <PlayerCardSkeleton />
              ) : player1Data ? (
                <PlayerCardContent player={player1Data} />
              ) : (
                <EmptyPlayerCard onAddPlayer={() => {setSelectingPlayerSlot(1); setShowPlayerPicker(true);}} />
              )}
            </TouchableOpacity>

            {/* Player 2 Card */}
            <TouchableOpacity 
              style={styles.playerCard} 
              onPress={() => {setSelectingPlayerSlot(2); setShowPlayerPicker(true);}}
              activeOpacity={0.7}
            >
              {isLoadingP2Details || isLoadingP2Stats ? (
                <PlayerCardSkeleton />
              ) : player2Data ? (
                <PlayerCardContent player={player2Data} />
              ) : (
                <EmptyPlayerCard onAddPlayer={() => {setSelectingPlayerSlot(2); setShowPlayerPicker(true);}} />
              )}
            </TouchableOpacity>
          </View>
        )}

        {player1Data && player2Data && !isLoading && (
          <View style={comparisonStyles.statsSection}>
            <Text style={comparisonStyles.sectionTitle}>赛季数据对比</Text>
            <View style={comparisonStyles.statsContainer}>
              <ComparisonStat label="出场" player1Value={player1Data.stats.gamesPlayed} player2Value={player2Data.stats.gamesPlayed} highlightHigher={true} />
              <ComparisonStat label="得分" player1Value={player1Data.stats.points} player2Value={player2Data.stats.points} highlightHigher={true} />
              <ComparisonStat label="篮板" player1Value={player1Data.stats.rebounds} player2Value={player2Data.stats.rebounds} highlightHigher={true} />
              <ComparisonStat label="助攻" player1Value={player1Data.stats.assists} player2Value={player2Data.stats.assists} highlightHigher={true} />
              <ComparisonStat label="抢断" player1Value={player1Data.stats.steals} player2Value={player2Data.stats.steals} highlightHigher={true} />
              <ComparisonStat label="盖帽" player1Value={player1Data.stats.blocks} player2Value={player2Data.stats.blocks} highlightHigher={true} />
              <ComparisonStat label="投篮命中率" player1Value={player1Data.stats.fieldGoalPct} player2Value={player2Data.stats.fieldGoalPct} highlightHigher={true} isPercentage={true} />
              <ComparisonStat label="三分命中率" player1Value={player1Data.stats.threePointPct} player2Value={player2Data.stats.threePointPct} highlightHigher={true} isPercentage={true} />
              <ComparisonStat label="罚球命中率" player1Value={player1Data.stats.freeThrowPct} player2Value={player2Data.stats.freeThrowPct} highlightHigher={true} isPercentage={true} />
            </View>
          </View>
        )}
      </ScrollView>
      
      <PlayerPickerModal
        key={pickerModalKey}
        visible={showPlayerPicker}
        onClose={() => setShowPlayerPicker(false)}
        onSelectPlayer={handleSelectPlayer}
        selectedPlayer1Id={player1Id}
        selectedPlayer2Id={player2Id}
      />
    </View>
  );
}

interface PlayerCardContentProps {
  player: PlayerData;
}

const PlayerCardContent: React.FC<PlayerCardContentProps> = ({ player }) => (
  <View style={styles.playerCardContent}>
    <Image source={{ uri: player.headshot }} style={styles.playerHeadshot} />

    <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
    <Text style={styles.playerInfo}>{player.position} | {player.jersey}</Text>
    <View style={styles.playerTeamRow}>
      <Image source={getTeamImage(player.teamAbbreviation)} style={styles.playerTeamLogo} />
      <Text style={styles.playerTeamName} numberOfLines={1}>{player.teamNameZhCN}</Text>
    </View>
  </View>
);

interface PlayerCardSkeletonProps {
  // Intentionally empty for skeleton component
}

const PlayerCardSkeleton: React.FC<PlayerCardSkeletonProps> = () => (
  <View style={styles.playerCardContent}>
    <Skeleton width={80} height={80} borderRadius={40} marginBottom={8} />
    <Skeleton width={120} height={18} marginBottom={4} />
    <Skeleton width={80} height={14} marginBottom={8} />
    <View style={styles.playerTeamRow}>
      <Skeleton width={24} height={24} borderRadius={12} />
      <Skeleton width={100} height={16} marginLeft={8} />
    </View>
  </View>
);

interface EmptyPlayerCardProps {
  onAddPlayer: () => void;
}

const EmptyPlayerCard: React.FC<EmptyPlayerCardProps> = ({ onAddPlayer }) => (
  <TouchableOpacity style={styles.emptyPlayerCard} onPress={onAddPlayer}>
    <Text style={styles.addPlayerText}>添加球员</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  comparisonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Changed from space-around to better fit
    alignItems: 'center',
    marginBottom: 30,
    gap: 12, // Add gap between cards
  },
  playerCard: {
    flex: 1, // Use flex to share width
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  playerCardContent: {
    alignItems: 'center',
  },
  playerHeadshot: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
    backgroundColor: COLORS.divider,
  },
  initialsHero: {
    width: 60,
    height: 60,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsHeroText: {
    color: COLORS.textSecondary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
  },
  playerName: {
    color: COLORS.textMain,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  playerInfo: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 8,
  },
  playerTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerTeamLogo: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  playerTeamName: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  emptyPlayerCard: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPlayerText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.bg,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    width: 40,
  },
  headerSelectors: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  selectorButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  selectorName: {
    color: COLORS.textMain,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  selectorTeam: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  vsContainerHeader: {
    paddingHorizontal: 12,
  },
  vsTextHeader: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    opacity: 0.5,
  },
  headerRight: {
    width: 40,
  },
});

const comparisonStyles = StyleSheet.create({
  statsSection: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: COLORS.textMain,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsContainer: {
    // Grid or stacked layout for stats
  },
  statContainer: {
    marginBottom: 20,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    color: COLORS.textMain,
    fontSize: 16,
    fontWeight: '600',
    width: 60,
    fontVariant: ['tabular-nums'],
  },
  statValueLeft: {
    textAlign: 'right',
    marginRight: 12,
  },
  statValueRight: {
    textAlign: 'left',
    marginLeft: 12,
  },
  highlightValue: {
    color: COLORS.accent,
    fontWeight: '800',
  },
  barsArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.divider, // Use divider color for the track background
    overflow: 'hidden',
  },
  barWrapperLeft: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    height: '100%',
    backgroundColor: 'transparent',
  },
  barWrapperRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    height: '100%',
    backgroundColor: 'transparent',
  },
  bar: {
    height: '100%',
    borderRadius: 3,
  },
  barDivider: {
    width: 2,
    height: '100%',
    backgroundColor: COLORS.card, // Match card background to create a gap
  },
});
