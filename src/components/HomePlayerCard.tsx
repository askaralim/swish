import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export interface TopPerformer {
  id: string;
  name: string;
  teamNameZhCN: string;
  teamAbbreviation: string;
  competitionId: string;
  headshot: string;
  value: number;
  statType: 'points' | 'rebounds' | 'assists';
}

interface HomePlayerCardProps {
  performer: TopPerformer;
  onCompare: (playerId: string, statType: TopPerformer['statType']) => void;
  onPress?: (playerId: string) => void;
  showCompare?: boolean;
}

export const HomePlayerCard: React.FC<HomePlayerCardProps> = ({ performer, onCompare, onPress, showCompare = true }) => {
  const statLabel = () => {
    switch (performer.statType) {
      case 'points': return 'PTS';
      case 'rebounds': return 'REB';
      case 'assists': return 'AST';
      default: return '';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.7}
      onPress={() => onPress && onPress(performer.id)}
    >
      <View style={styles.topRow}>
        <Image source={{ uri: performer.headshot }} style={styles.avatar} />
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={1}>{performer.name}</Text>
          <Text style={styles.team}>{performer.teamNameZhCN}</Text>
        </View>
      </View>

      <View style={styles.statRow}>
        <Text style={styles.statValue}>{performer.value}</Text>
        <Text style={styles.statLabel}>{statLabel()}</Text>
      </View>

      {showCompare && (
        <TouchableOpacity 
          style={styles.compareButton}
          activeOpacity={0.6}
          onPress={() => onCompare(performer.id, performer.statType)}
        >
          <Ionicons name="git-compare-outline" size={16} color={COLORS.textMain} style={styles.compareIcon} />
          <Text style={styles.compareText}>比较</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    width: 160, // Fixed width for horizontal scrolling
    marginRight: 12,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.header,
    marginRight: 10,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    color: COLORS.textMain,
    fontSize: 14,
    fontWeight: '600',
  },
  team: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  statValue: {
    color: COLORS.textMain,
    fontSize: 24,
    fontWeight: '800',
    marginRight: 4,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.header,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  compareIcon: {
    marginRight: 6,
  },
  compareText: {
    color: COLORS.textMain,
    fontSize: 12,
    fontWeight: '600',
  },
});
