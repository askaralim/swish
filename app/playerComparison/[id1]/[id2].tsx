import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { fetchPlayerDetails, fetchPlayerBasicStats, fetchTeams, fetchPlayersByTeam } from '../../../src/services/api';
import { COLORS } from '../../../src/constants/theme';
import { Skeleton } from '../../../src/components/Skeleton';
import { ErrorState } from '../../../src/components/ErrorState';
import { getTeamImage } from '../../../src/utils/teamImages';

import { Ionicons } from '@expo/vector-icons';

const { width: windowWidth } = Dimensions.get('window');

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
  const p1Val = typeof player1Value === 'number' && isPercentage ? player1Value + '%' : player1Value;
  const p2Val = typeof player2Value === 'number' && isPercentage ? player2Value + '%' : player2Value;

  const isPlayer1Higher = highlightHigher && typeof player1Value === 'number' && typeof player2Value === 'number' && player1Value > player2Value;
  const isPlayer2Higher = highlightHigher && typeof player1Value === 'number' && typeof player2Value === 'number' && player2Value > player1Value;

  return (
    <View style={comparisonStyles.statRow}>
      <Text style={[comparisonStyles.statValue, isPlayer1Higher && comparisonStyles.highlightValue]}>
        {p1Val ?? '--'}
      </Text>
      <Text style={comparisonStyles.statLabel}>{label}</Text>
      <Text style={[comparisonStyles.statValue, isPlayer2Higher && comparisonStyles.highlightValue]}>
        {p2Val ?? '--'}
      </Text>
    </View>
  );
};

export default function PlayerComparisonScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id1, id2 } = useLocalSearchParams<{ id1: string; id2: string }>();

  const [player1Id, setPlayer1Id] = useState<string | null>(id1 || null);
  const [player2Id, setPlayer2Id] = useState<string | null>(id2 || null);
  const [showPlayerSelectionModal, setShowPlayerSelectionModal] = useState(false);
  const [selectingPlayerSlot, setSelectingPlayerSlot] = useState<1 | 2>(1);

  // Update state when params change
  useEffect(() => {
    if (id1) setPlayer1Id(id1);
    if (id2) setPlayer2Id(id2);
  }, [id1, id2]);

  // Fetch Player 1 Details
  const { data: player1Details, isLoading: isLoadingP1Details, error: errorP1Details } = useQuery({
    queryKey: ['playerDetails', player1Id],
    queryFn: () => fetchPlayerDetails(player1Id!),
    enabled: !!player1Id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch Player 1 Basic Stats
  const { data: player1BasicStats, isLoading: isLoadingP1Stats, error: errorP1Stats } = useQuery({
    queryKey: ['playerBasicStats', player1Id],
    queryFn: () => fetchPlayerBasicStats(player1Id!),
    enabled: !!player1Id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch Player 2 Details
  const { data: player2Details, isLoading: isLoadingP2Details, error: errorP2Details } = useQuery({
    queryKey: ['playerDetails', player2Id],
    queryFn: () => fetchPlayerDetails(player2Id!),
    enabled: !!player2Id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch Player 2 Basic Stats
  const { data: player2BasicStats, isLoading: isLoadingP2Stats, error: errorP2Stats } = useQuery({
    queryKey: ['playerBasicStats', player2Id],
    queryFn: () => fetchPlayerBasicStats(player2Id!),
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
    if (selectingPlayerSlot === 1) {
      setPlayer1Id(playerId);
    } else {
      setPlayer2Id(playerId);
    }
    setShowPlayerSelectionModal(false);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>球员对比</Text>
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
              onPress={() => {setSelectingPlayerSlot(1); setShowPlayerSelectionModal(true);}}
              activeOpacity={0.7}
            >
              {isLoadingP1Details || isLoadingP1Stats ? (
                <PlayerCardSkeleton />
              ) : player1Data ? (
                <PlayerCardContent player={player1Data} />
              ) : (
                <EmptyPlayerCard onAddPlayer={() => {setSelectingPlayerSlot(1); setShowPlayerSelectionModal(true);}} />
              )}
            </TouchableOpacity>

            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
            </View>

            {/* Player 2 Card */}
            <TouchableOpacity 
              style={styles.playerCard} 
              onPress={() => {setSelectingPlayerSlot(2); setShowPlayerSelectionModal(true);}}
              activeOpacity={0.7}
            >
              {isLoadingP2Details || isLoadingP2Stats ? (
                <PlayerCardSkeleton />
              ) : player2Data ? (
                <PlayerCardContent player={player2Data} />
              ) : (
                <EmptyPlayerCard onAddPlayer={() => {setSelectingPlayerSlot(2); setShowPlayerSelectionModal(true);}} />
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
      <PlayerSelectionModal
        visible={showPlayerSelectionModal}
        onClose={() => setShowPlayerSelectionModal(false)}
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

interface PlayerCardSkeletonProps {}

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

interface PlayerSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPlayer: (playerId: string) => void;
  selectedPlayer1Id: string | null;
  selectedPlayer2Id: string | null;
}

const PlayerSelectionModal: React.FC<PlayerSelectionModalProps> = ({
  visible,
  onClose,
  onSelectPlayer,
  selectedPlayer1Id,
  selectedPlayer2Id,
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const { data: teamsData, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
    staleTime: Infinity,
  });

  const teams = useMemo(() => teamsData?.teams || [], [teamsData]);

  const { data: playersData, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ['playersByTeam', selectedTeam],
    queryFn: () => fetchPlayersByTeam(selectedTeam!),
    enabled: !!selectedTeam,
    staleTime: Infinity,
  });

  const players = useMemo(() => {
    if (!playersData?.players) return [];
    return playersData.players.filter((player: any) => 
      player.fullName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      player.id !== selectedPlayer1Id &&
      player.id !== selectedPlayer2Id
    );
  }, [playersData, searchQuery, selectedPlayer1Id, selectedPlayer2Id]);

  return (
    <View /* Using View instead of Modal for now to avoid complexity, will use Modal later */ style={[
      modalStyles.modalContainer, 
      { paddingTop: insets.top, paddingBottom: insets.bottom, display: visible ? 'flex' : 'none' }
    ]}>
      <View style={modalStyles.modalHeader}>
        <Text style={modalStyles.modalTitle}>选择球员</Text>
        <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
          <Text style={modalStyles.closeButtonText}>关闭</Text>
        </TouchableOpacity>
      </View>
      <View style={modalStyles.searchBar}>
        <Text style={modalStyles.searchIcon}>🔍</Text>
        <TextInput
          style={modalStyles.searchInput}
          placeholder="搜索球员..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={modalStyles.teamFilterContainer}>
        <TouchableOpacity 
          style={[modalStyles.teamFilterButton, !selectedTeam && modalStyles.teamFilterButtonActive]}
          onPress={() => setSelectedTeam(null)}
        >
          <Text style={[modalStyles.teamFilterButtonText, !selectedTeam && modalStyles.teamFilterButtonTextActive]}>所有球队</Text>
        </TouchableOpacity>
        {isLoadingTeams ? (
          [1,2,3].map(i => <Skeleton key={i} width={80} height={30} borderRadius={15} style={{ marginRight: 8 }} />)
        ) : (
          teams.map((team: any) => (
            <TouchableOpacity 
              key={team.abbreviation}
              style={[modalStyles.teamFilterButton, selectedTeam === team.abbreviation && modalStyles.teamFilterButtonActive]}
              onPress={() => setSelectedTeam(team.abbreviation)}
            >
              <Text style={[modalStyles.teamFilterButtonText, selectedTeam === team.abbreviation && modalStyles.teamFilterButtonTextActive]}>
                {team.nameZhCN || team.abbreviation}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      <ScrollView style={modalStyles.playerList}>
        {isLoadingPlayers && selectedTeam ? (
          [1,2,3,4,5].map(i => (
            <View key={i} style={modalStyles.playerListItemSkeleton}>
              <Skeleton width={40} height={40} borderRadius={20} marginRight={12} />
              <Skeleton width={150} height={18} />
            </View>
          ))
        ) : players.length > 0 ? (
          players.map((player: any) => (
            <TouchableOpacity 
              key={player.id} 
              style={modalStyles.playerListItem}
              onPress={() => onSelectPlayer(player.id)}
            >
              <Image source={{ uri: player.headshot }} style={modalStyles.playerHeadshot} />
              <View>
                <Text style={modalStyles.playerName}>{player.fullName}</Text>
                <Text style={modalStyles.playerTeam}>{player.teamNameZhCN || player.teamAbbreviation} | {player.position}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={modalStyles.emptyState}>
            <Text style={modalStyles.emptyText}>没有找到相关球员</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

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
  title: {
    color: COLORS.textMain,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  comparisonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 30,
  },
  playerCard: {
    width: (windowWidth - 32 - 60) / 2, // 32 for horizontal padding, 60 for VS section
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200, // Ensure consistent height
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
  playerName: {
    color: COLORS.textMain,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  playerInfo: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 8,
  },
  playerTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerTeamLogo: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  playerTeamName: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  vsContainer: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    color: COLORS.textSecondary,
    fontSize: 22,
    fontWeight: '800',
  },
  emptyPlayerCard: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPlayerText: {
    color: COLORS.accent,
    fontSize: 16,
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
  },
  headerTitle: {
    color: COLORS.textMain,
    fontSize: 18,
    fontWeight: '700',
  },
  headerRight: {
    width: 40, // Balance the back button width
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
    marginBottom: 15,
    textAlign: 'center',
  },
  statsContainer: {
    // Grid or stacked layout for stats
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 15,
    flex: 1,
    textAlign: 'center',
  },
  statValue: {
    color: COLORS.textMain,
    fontSize: 16,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'center',
  },
  highlightValue: {
    color: COLORS.accent,
    fontWeight: '800',
  },
});

// Temporary modal styles - will be replaced with a proper Modal component
const modalStyles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.bg,
    zIndex: 1000,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  modalTitle: {
    color: COLORS.textMain,
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: COLORS.accent,
    fontSize: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textMain,
    fontSize: 16,
  },
  teamFilterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  teamFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.cardSecondary,
    marginRight: 8,
  },
  teamFilterButtonActive: {
    backgroundColor: COLORS.accent,
  },
  teamFilterButtonText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  teamFilterButtonTextActive: {
    color: COLORS.textMain,
  },
  playerList: {
    flex: 1,
    marginHorizontal: 16,
  },
  playerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  playerListItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  playerHeadshot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: COLORS.divider,
  },
  playerName: {
    color: COLORS.textMain,
    fontSize: 16,
    fontWeight: '600',
  },
  playerTeam: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
