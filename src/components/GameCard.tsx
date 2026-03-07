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
  homeTeam: {
    teamId: string;
    teamName: string;
    teamCity: string;
    teamTricode: string;
    score: number;
    wins: number;
    losses: number;
  };
  awayTeam: {
    teamId: string;
    teamName: string;
    teamCity: string;
    teamTricode: string;
    score: number;
    wins: number;
    losses: number;
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
        <View style={styles.teamContainer}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <View style={styles.teamInfo}>
            <Skeleton width={50} height={14} marginBottom={4} />
            <Skeleton width={30} height={12} />
          </View>
          <Skeleton width={30} height={24} />
        </View>
        <View style={styles.divider} />
        <View style={styles.teamContainer}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <View style={styles.teamInfo}>
            <Skeleton width={50} height={14} marginBottom={4} />
            <Skeleton width={30} height={12} />
          </View>
          <Skeleton width={30} height={24} />
        </View>
        <View style={styles.footer}>
          <Skeleton width={60} height={12} />
        </View>
      </View>
    );
  }

  // Determine status text color
  let statusColor = COLORS.textSecondary;
  if (item.gameStatus === 2) {
    statusColor = COLORS.live; // Live red
  } else if (item.gameStatus === 3) {
    statusColor = COLORS.textSecondary; // Finished
  }

  // Format status text
  let statusText = item.gameStatusText;
  if (item.gameStatus === 2) {
    // Live game logic
    statusText = `Q${item.period} ${item.gameClock}`;
    if (item.gameClock === '') {
      statusText = `Q${item.period} End`;
    }
  } else if (item.gameStatus === 1) {
    // Scheduled: Show time (e.g., 7:30 PM ET)
    // You might want to convert this to local time if possible, 
    // but for now displaying the API provided ET time or a localized version is fine.
    // The API might provide gameEt like "2026-03-05T19:30:00Z" or similar, 
    // but often it's "7:30 pm ET". Assuming simple string for now.
    statusText = item.gameStatusText; 
  }

  // Determine winner for bold styling (if finished)
  const isFinished = item.gameStatus === 3;
  const homeWin = isFinished && item.homeTeam.score > item.awayTeam.score;
  const awayWin = isFinished && item.awayTeam.score > item.homeTeam.score;

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Away Team */}
      <View style={styles.teamRow}>
        <View style={styles.teamLeft}>
          <Image 
            source={getTeamImage(item.awayTeam.teamTricode)} 
            style={styles.teamLogo} 
            resizeMode="contain"
          />
          <View style={styles.teamNameContainer}>
            <Text style={styles.teamName}>{item.awayTeam.teamTricode}</Text>
            <Text style={styles.teamRecord}>
              {item.awayTeam.wins}-{item.awayTeam.losses}
            </Text>
          </View>
        </View>
        <Text style={[
          styles.score, 
          awayWin && styles.winnerScore,
          !isFinished && item.gameStatus !== 2 && styles.scheduledScore // Hide score if scheduled? Usually 0-0 or empty
        ]}>
          {item.gameStatus === 1 ? '' : item.awayTeam.score}
        </Text>
      </View>

      {/* Home Team */}
      <View style={[styles.teamRow, { marginTop: 12 }]}>
        <View style={styles.teamLeft}>
          <Image 
            source={getTeamImage(item.homeTeam.teamTricode)} 
            style={styles.teamLogo} 
            resizeMode="contain"
          />
          <View style={styles.teamNameContainer}>
            <Text style={styles.teamName}>{item.homeTeam.teamTricode}</Text>
            <Text style={styles.teamRecord}>
              {item.homeTeam.wins}-{item.homeTeam.losses}
            </Text>
          </View>
        </View>
        <Text style={[
          styles.score, 
          homeWin && styles.winnerScore,
          !isFinished && item.gameStatus !== 2 && styles.scheduledScore
        ]}>
          {item.gameStatus === 1 ? '' : item.homeTeam.score}
        </Text>
      </View>

      {/* Game Status Footer */}
      <View style={styles.statusFooter}>
        <Text style={[styles.statusText, { color: statusColor }]}>
          {statusText}
        </Text>
        {item.isClosest && item.gameStatus === 3 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>焦灼</Text>
          </View>
        )}
        {item.isOvertime && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>加时</Text>
          </View>
        )}
         {item.isMarquee && (
          <View style={[styles.badge, styles.marqueeBadge]}>
            <Text style={[styles.badgeText, styles.marqueeText]}>热门</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  teamNameContainer: {
    justifyContent: 'center',
  },
  teamName: {
    color: COLORS.textMain,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  teamRecord: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  score: {
    color: COLORS.textMain,
    fontSize: 20,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  winnerScore: {
    color: COLORS.textMain, // Could be accent or just kept white/bright
    fontWeight: '800',
  },
  scheduledScore: {
    display: 'none',
  },
  statusFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Changed to space-between to push badges to right if needed, or flex-start
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Skeleton styles
  teamContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamInfo: {
    marginLeft: 12,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 12,
  },
  footer: {
    marginTop: 8,
  },
  badge: {
    backgroundColor: COLORS.cardSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  badgeText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  marqueeBadge: {
    backgroundColor: COLORS.accent,
  },
  marqueeText: {
    color: COLORS.textMain,
  }
});
