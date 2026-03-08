import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/theme';
import { getTeamImage } from '../utils/teamImages';
import { Skeleton } from './Skeleton';

export interface Game {
  gameId: string;
  gameStatus: number; // 1=scheduled, 2=live, 3=finished, 6=postponed
  gameStatusText: string;
  gameEt: string; // Eastern Time string
  gameEtFormatted: {
    time: string;
  }
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
  period: number;
  gameClock: string;
  isMarquee: boolean;
  isOvertime: boolean;
  isClosest: boolean;
}

interface GameCardProps {
  item: Game;
  index: number;
  isDataLoaded: boolean;
}

export const GameCard: React.FC<GameCardProps> = ({ item, index, isDataLoaded }) => {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/game/${item.gameId}`);
  };

  if (!isDataLoaded) {
    return (
      <View style={styles.card}>
        <View style={styles.skeletonRow}>
          <View style={styles.skeletonSide}>
            <Skeleton width={50} height={50} borderRadius={25} />
            <Skeleton width={60} height={14} style={{ marginTop: 8 }} />
            <Skeleton width={40} height={12} style={{ marginTop: 4 }} />
          </View>
          <View style={styles.skeletonCenter}>
             <Skeleton width={80} height={30} borderRadius={4} />
             <Skeleton width={50} height={16} style={{ marginTop: 8 }} />
          </View>
          <View style={styles.skeletonSide}>
            <Skeleton width={50} height={50} borderRadius={25} />
            <Skeleton width={60} height={14} style={{ marginTop: 8 }} />
            <Skeleton width={40} height={12} style={{ marginTop: 4 }} />
          </View>
        </View>
      </View>
    );
  }

  // Determine status text color
  let statusColor = COLORS.textSecondary;
  let statusBg = COLORS.cardSecondary;
  
  if (item.gameStatus === 2) {
    statusColor = '#FFFFFF'; // White text on red bg
    statusBg = COLORS.live; // Live red
  } else if (item.gameStatus === 3) {
    statusColor = COLORS.textSecondary; // Finished
    statusBg = COLORS.cardSecondary;
  }

  // Format status text
  let statusText = item.gameStatusText;
  if (item.gameStatus === 2) {
    // Live game logic
    if (item.period > 4) {
      statusText = `加时${item.period - 4}节`;
    } else {
      statusText = `第${item.period}节`;
    }
  } else if (item.gameStatus === 1) {
    // Scheduled
    statusText = '未开赛'; 
  } else if (item.gameStatus === 3) {
    statusText = '已结束';
  }

  // Determine winner for bold styling (if finished)
  const isFinished = item.gameStatus === 3;
  const homeScore = item.homeTeam.score || 0;
  const awayScore = item.awayTeam.score || 0;
  const homeWin = isFinished && homeScore > awayScore;
  const awayWin = isFinished && awayScore > homeScore;

  // Use Chinese name if available, otherwise Tricode or Name
  const homeName = item.homeTeam.nameZhCN || item.homeTeam.name;
  const awayName = item.awayTeam.nameZhCN || item.awayTeam.name;

  // Determine highlight border color
  let borderColor = 'transparent';
  let borderWidth = 0;
  
  if (item.isMarquee) {
    borderColor = COLORS.accent;
    borderWidth = 1;
  } else if (item.isOvertime) {
    borderColor = COLORS.textSecondary; // Subtle highlight for overtime
    borderWidth = 0.5;
  } else if (item.isClosest && isFinished) {
    borderColor = COLORS.textSecondary; // Subtle highlight for close games
    borderWidth = 0.5;
  }

  // Determine top-right label
  let cornerLabel = null;
  let cornerLabelColor = COLORS.textSecondary;
  let cornerLabelBg = COLORS.cardSecondary;

  if (item.isMarquee) {
    cornerLabel = '热门';
    cornerLabelColor = '#FFFFFF';
    cornerLabelBg = COLORS.accent;
  } else if (item.isOvertime) {
    cornerLabel = '加时';
    cornerLabelColor = COLORS.textMain;
    cornerLabelBg = COLORS.cardSecondary;
  } else if (item.isClosest && isFinished) {
    cornerLabel = '焦灼';
    cornerLabelColor = COLORS.textMain;
    cornerLabelBg = COLORS.cardSecondary;
  }

  return (
    <TouchableOpacity 
      style={[styles.card, { borderColor, borderWidth }]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Top Right Corner Label */}
      {cornerLabel && (
        <View style={[styles.cornerLabel, { backgroundColor: cornerLabelBg }]}>
          <Text style={[styles.cornerLabelText, { color: cornerLabelColor }]}>{cornerLabel}</Text>
        </View>
      )}

      <View style={styles.container}>
        {/* Left Team (Away) */}
        <View style={styles.teamColumn}>
          <Image 
            source={getTeamImage(item.awayTeam.abbreviation)} 
            style={styles.teamLogo} 
            resizeMode="contain"
          />
          <Text style={styles.teamName} numberOfLines={1}>{awayName}</Text>
          <Text style={styles.teamRecord}>
            {item.awayTeam.wins}-{item.awayTeam.losses}
          </Text>
        </View>

        {/* Center Score & Status */}
        <View style={styles.centerColumn}>
          <View style={styles.scoreRow}>
            <Text style={[
              styles.score, 
              awayWin && styles.winnerScore,
              !isFinished && item.gameStatus !== 2 && styles.scheduledScore
            ]}>
              {item.gameStatus === 1 ? '' : awayScore}
            </Text>
            <Text style={[
              styles.scoreDivider,
              !isFinished && item.gameStatus !== 2 && styles.scheduledScore
            ]}> - </Text>
            <Text style={[
              styles.score, 
              homeWin && styles.winnerScore,
              !isFinished && item.gameStatus !== 2 && styles.scheduledScore
            ]}>
              {item.gameStatus === 1 ? '' : homeScore}
            </Text>
          </View>
          {item.gameStatus === 1 && (
            <View style={styles.statusPill}>
              <Text style={styles.timeText}>
                {item.gameEtFormatted?.time || '待定'}
              </Text>
            </View>
          )}
          <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>

          {/* Badges Row - Removed as we are using corner label now */}
        </View>

        {/* Right Team (Home) */}
        <View style={styles.teamColumn}>
          <Image 
            source={getTeamImage(item.homeTeam.abbreviation)} 
            style={styles.teamLogo} 
            resizeMode="contain"
          />
          <Text style={styles.teamName} numberOfLines={1}>{homeName}</Text>
          <Text style={styles.teamRecord}>
            {item.homeTeam.wins}-{item.homeTeam.losses}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  cornerLabel: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 1,
  },
  cornerLabelText: {
    fontSize: 10,
    fontWeight: '700',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8, // Add some padding to avoid overlap with label if needed, or rely on layout
  },
  teamColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerColumn: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamLogo: {
    width: 50,
    height: 50,
    marginBottom: 8,
  },
  teamName: {
    color: COLORS.textMain,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  teamRecord: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  score: {
    color: COLORS.textMain,
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  winnerScore: {
    color: COLORS.textMain,
  },
  scheduledScore: {
    display: 'none',
  },
  timeText: {
    color: COLORS.textMain,
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  scoreDivider: {
    color: COLORS.textSecondary,
    fontSize: 24,
    fontWeight: '400',
    marginHorizontal: 8,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Skeleton styles
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonSide: {
    alignItems: 'center',
    flex: 1,
  },
  skeletonCenter: {
    alignItems: 'center',
    flex: 1.2,
  },
});
