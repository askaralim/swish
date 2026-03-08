import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Dimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { fetchTeams, fetchPlayersByTeam } from '../services/api';
import { COLORS } from '../constants/theme';
import { Skeleton } from './Skeleton';
import { getTeamImage } from '../utils/teamImages';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 4;
const GRID_GAP = 8;
const H_PADDING = 16;
const TEAM_GRID_MAX_HEIGHT = 200;
const TEAM_CELL_SIZE = (SCREEN_WIDTH - H_PADDING * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

interface PlayerPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPlayer: (playerId: string) => void;
  selectedPlayer1Id: string | null;
  selectedPlayer2Id: string | null;
}

export const PlayerPickerModal: React.FC<PlayerPickerModalProps> = ({
  visible,
  onClose,
  onSelectPlayer,
  selectedPlayer1Id,
  selectedPlayer2Id,
}) => {
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
    const roster = playersData?.roster || [];
    const teamAbbr = playersData?.team?.abbreviation || '';
    return roster
      .filter((player: any) => 
        player.id !== selectedPlayer1Id &&
        player.id !== selectedPlayer2Id
      )
      .map((player: any) => ({
        ...player,
        fullName: player.name || player.fullName || '',
        teamAbbreviation: player.teamAbbreviation || teamAbbr,
      }));
  }, [playersData, selectedPlayer1Id, selectedPlayer2Id]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: COLORS.bg }]}>
        <View style={styles.header}>
          <Text style={styles.title}>选择球员</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close-circle" size={28} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.teamSection}>
          <Text style={styles.teamSectionTitle}>选择球队</Text>
          <ScrollView
            style={styles.teamGridScroll}
            contentContainerStyle={styles.teamGridScrollContent}
            showsVerticalScrollIndicator={true}
          >
            {isLoadingTeams ? (
              <View style={styles.teamGrid}>
                {[1,2,3,4,5,6,7,8].map((i) => {
                  const isLastInRow = (i - 1) % NUM_COLUMNS === NUM_COLUMNS - 1;
                  return (
                    <View key={i} style={[styles.teamCell, { width: TEAM_CELL_SIZE, marginRight: isLastInRow ? 0 : GRID_GAP }]}>
                      <Skeleton width={TEAM_CELL_SIZE - 16} height={TEAM_CELL_SIZE - 16} borderRadius={8} />
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.teamGrid}>
                {teams.map((team: any, index: number) => {
                  const isSelected = selectedTeam === team.abbreviation;
                  const logo = getTeamImage(team.abbreviation);
                  const isLastInRow = index % NUM_COLUMNS === NUM_COLUMNS - 1;
                  return (
                    <TouchableOpacity
                      key={team.abbreviation}
                      style={[
                        styles.teamCell,
                        { width: TEAM_CELL_SIZE, marginRight: isLastInRow ? 0 : GRID_GAP },
                        isSelected && styles.teamCellActive,
                      ]}
                      onPress={() => setSelectedTeam(team.abbreviation)}
                    >
                      {logo ? (
                        <Image source={logo} style={styles.teamLogo} resizeMode="contain" />
                      ) : (
                        <View style={styles.teamLogoPlaceholder}>
                          <Text style={styles.teamAbbr}>{team.abbreviation}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>
          {selectedTeam && (
            <TouchableOpacity style={styles.clearTeamButton} onPress={() => setSelectedTeam(null)}>
              <Ionicons name="close-circle-outline" size={18} color={COLORS.accent} />
              <Text style={styles.clearTeamText}>更换球队</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={styles.playerListScroll}
          contentContainerStyle={styles.playerListContent}
          showsVerticalScrollIndicator={true}
        >
          {!selectedTeam ? (
            <View style={styles.emptyState}>
              <Ionicons name="basketball-outline" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>选择上方球队查看球员</Text>
            </View>
          ) : isLoadingPlayers ? (
            [1,2,3,4,5,6].map(i => (
              <View key={i} style={styles.skeletonRow}>
                <Skeleton width={40} height={40} borderRadius={20} marginRight={12} />
                <View>
                  <Skeleton width={120} height={16} marginBottom={4} />
                  <Skeleton width={60} height={12} />
                </View>
              </View>
            ))
          ) : players.length > 0 ? (
            players.map((player: any) => (
              <TouchableOpacity 
                key={player.id} 
                style={styles.playerRow}
                onPress={() => onSelectPlayer(player.id)}
              >
                <Image source={{ uri: player.headshot }} style={styles.avatar} />
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{player.fullName}</Text>
                  <Text style={styles.playerTeam}>{player.teamAbbreviation} • {player.position}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>没有找到相关球员</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  closeButton: {
    padding: 4,
  },
  teamSection: {
    paddingHorizontal: H_PADDING,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  teamSectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  teamGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  teamCell: {
    marginBottom: GRID_GAP,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 12,
    padding: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  teamCellActive: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(29, 155, 240, 0.1)',
  },
  teamLogo: {
    width: TEAM_CELL_SIZE - 24,
    height: TEAM_CELL_SIZE - 24,
    marginBottom: 4,
  },
  teamLogoPlaceholder: {
    width: TEAM_CELL_SIZE - 24,
    height: TEAM_CELL_SIZE - 24,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  teamAbbr: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  teamCellLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  teamCellLabelActive: {
    color: COLORS.accent,
  },
  clearTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  clearTeamText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  teamGridScroll: {
    height: TEAM_GRID_MAX_HEIGHT,
  },
  teamGridScrollContent: {
    paddingBottom: 8,
  },
  playerListScroll: {
    flex: 1,
  },
  playerListContent: {
    paddingHorizontal: H_PADDING,
    paddingTop: 16,
    paddingBottom: 24,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardSecondary,
    marginRight: 12,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: COLORS.textMain,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  playerTeam: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginTop: 12,
  },
});
