import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { fetchStandings } from './services/api';
import { getTeamImage } from './utils/teamImages';

interface Team {
  id: string;
  uid: string;
  name: string;
  shortName: string;
  abbreviation: string;
  location: string;
  logo: string;
  wins: number;
  losses: number;
  winPercent: number;
  winPercentDisplay: string;
  playoffSeed: number;
  gamesBehind: number;
  gamesBehindDisplay: string;
  streak: number;
  streakType: string;
}

interface Conference {
  name: string;
  teams: Team[];
}

interface StandingsData {
  season: number;
  seasonType: number;
  seasonDisplayName: string;
  conferences: {
    East: Conference;
    West: Conference;
  };
}

export default function TeamsScreen() {
  const [selectedConference, setSelectedConference] = useState<'East' | 'West'>('East');
  
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['standings'],
    queryFn: () => fetchStandings(),
  });

  const standings: StandingsData | null = data || null;
  const eastTeams = standings?.conferences?.East?.teams || [];
  const westTeams = standings?.conferences?.West?.teams || [];
  const currentTeams = selectedConference === 'East' ? eastTeams : westTeams;

  const renderTeam = (team: Team, index: number) => {
    const isPlayoffTeam = team.playoffSeed <= 8;
    const logoSource = getTeamImage(team.abbreviation);
    
    // Format streak type for display
    const streakDisplay = team.streakType || '';
    
    // Get rank number (playoff seed if available, otherwise index + 1)
    const rankNumber = team.playoffSeed || index + 1;
    
    return (
      <TouchableOpacity
        key={team.id}
        style={styles.teamRow}
        activeOpacity={0.7}
      >
        {/* Rank Badge (for all teams, styled differently for playoff teams) */}
        <View style={styles.rankContainer}>
          <View style={[
            styles.rankBadge,
            isPlayoffTeam && styles.playoffBadge
          ]}>
            <Text style={[
              styles.rankText,
              isPlayoffTeam && styles.playoffRankText
            ]}>
              {rankNumber}
            </Text>
          </View>
        </View>

        {/* Team Logo */}
        {logoSource && (
          <View style={styles.logoContainer}>
            <Image
              source={logoSource}
              style={styles.teamLogo}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Team Info */}
        <View style={styles.teamInfo}>
          <Text style={styles.teamName}>{team.shortName || team.name}</Text>
          <View style={styles.statsRow}>
            <Text style={styles.winsLosses}>
              {team.wins}-{team.losses}
            </Text>
            <Text style={styles.separator}>·</Text>
            <Text style={styles.winPercent}>
              {team.winPercentDisplay || (team.winPercent ? (team.winPercent * 100).toFixed(1) + '%' : '0.0%')}
            </Text>
          </View>
        </View>

        {/* Right Side Stats */}
        <View style={styles.rightStats}>
          {team.gamesBehindDisplay && team.gamesBehindDisplay !== '-' && (
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>落后</Text>
              <Text style={styles.statValue}>{team.gamesBehindDisplay}</Text>
            </View>
          )}
          {streakDisplay && (
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>连胜</Text>
              <Text style={[
                styles.streakValue,
                streakDisplay.startsWith('W') && styles.winStreak,
                streakDisplay.startsWith('L') && styles.lossStreak
              ]}>
                {streakDisplay}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1d9bf0" />
        <Text style={styles.loadingText}>加载排名中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : '加载失败'}
        </Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>排名</Text>
        {standings?.seasonDisplayName && (
          <Text style={styles.subtitle}>{standings.seasonDisplayName}</Text>
        )}
      </View>

      {/* Conference Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedConference === 'East' && styles.tabActive
          ]}
          onPress={() => setSelectedConference('East')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText,
            selectedConference === 'East' && styles.tabTextActive
          ]}>
            东部
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            selectedConference === 'West' && styles.tabActive
          ]}
          onPress={() => setSelectedConference('West')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText,
            selectedConference === 'West' && styles.tabTextActive
          ]}>
            西部
          </Text>
        </TouchableOpacity>
      </View>

      {/* Teams List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#1d9bf0"
          />
        }
      >
        {currentTeams.length > 0 ? (
          <View style={styles.teamsList}>
            {currentTeams.map((team, index) => renderTeam(team, index))}
          </View>
        ) : (
          <View style={styles.center}>
            <Text style={styles.emptyText}>暂无排名数据</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#71767a',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2f3336',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 8,
  },
  tabActive: {
    borderBottomColor: '#1d9bf0',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#71767a',
  },
  tabTextActive: {
    color: '#1d9bf0',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  teamsList: {
    paddingHorizontal: 16,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#16181c',
    minHeight: 72, // Large tap target
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#16181c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playoffBadge: {
    backgroundColor: '#1d9bf0',
  },
  rankText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#71767a',
  },
  playoffRankText: {
    color: '#ffffff',
  },
  logoContainer: {
    width: 48,
    height: 48,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamLogo: {
    width: 48,
    height: 48,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  winsLosses: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
  },
  separator: {
    fontSize: 15,
    color: '#71767a',
    marginHorizontal: 6,
  },
  winPercent: {
    fontSize: 15,
    color: '#71767a',
  },
  rightStats: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  statItem: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#71767a',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  streakValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  winStreak: {
    color: '#10b981', // Green for wins
  },
  lossStreak: {
    color: '#ef4444', // Red for losses
  },
  loadingText: {
    color: '#71767a',
    marginTop: 12,
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
    minHeight: 44, // Large tap target
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    color: '#71767a',
    fontSize: 16,
  },
});
