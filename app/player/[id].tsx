import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions, 
  Animated, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { 
  fetchPlayerDetails, 
  fetchPlayerBio, 
  fetchPlayerCurrentStats, 
  fetchPlayerRegularStats, 
  fetchPlayerGameLog 
} from '../../src/services/api';
import { getTeamImage } from '../../src/utils/teamImages';
import { COLORS, MOTION } from '../../src/constants/theme';
import { AnimatedSection } from '../../src/components/AnimatedSection';

const { width } = Dimensions.get('window');
const HEADER_EXPANDED_HEIGHT = 220;
const HEADER_COLLAPSED_HEIGHT = 100;

export default function PlayerDetailScreen() {
  const { id: playerId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'log'>('overview');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const tabIndicatorPos = useRef(new Animated.Value(0)).current;
  const tabContentAnim = useRef(new Animated.Value(0)).current;

  const { data: details, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['playerDetails', playerId],
    queryFn: () => fetchPlayerDetails(playerId),
  });

  const { data: bio, isLoading: isLoadingBio } = useQuery({
    queryKey: ['playerBio', playerId],
    queryFn: () => fetchPlayerBio(playerId),
    enabled: !!details,
  });

  const { data: currentStats, isLoading: isLoadingCurrentStats } = useQuery({
    queryKey: ['playerCurrentStats', playerId],
    queryFn: () => fetchPlayerCurrentStats(playerId),
    enabled: !!details,
  });

  const { data: regularStats } = useQuery({
    queryKey: ['playerRegularStats', playerId],
    queryFn: () => fetchPlayerRegularStats(playerId),
    enabled: !!details,
  });

  const { data: gameLog } = useQuery({
    queryKey: ['playerGameLog', playerId],
    queryFn: () => fetchPlayerGameLog(playerId),
    enabled: !!details,
  });

  const kpis = useMemo(() => {
    if (!currentStats?.stats) return [];
    const s = currentStats.stats;
    return [
      { label: '得分', value: s.avgPoints || '0.0' },
      { label: '篮板', value: s.avgRebounds || '0.0' },
      { label: '助攻', value: s.avgAssists || '0.0' },
      { label: '命中率', value: s.fieldGoalPct ? `${s.fieldGoalPct}%` : '0.0%' },
      { label: '抢断', value: s.avgSteals || '0.0' },
      { label: '盖帽', value: s.avgBlocks || '0.0' },
      { label: '三分率', value: s.threePointFieldGoalPct ? `${s.threePointFieldGoalPct}%` : '0.0%' },
      { label: '罚球率', value: s.freeThrowPct ? `${s.freeThrowPct}%` : '0.0%' },
    ];
  }, [currentStats]);

  useEffect(() => {
    if (!isLoadingDetails && details && !isLoadingBio && !isLoadingCurrentStats) {
      setIsDataLoaded(true);
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: MOTION.Fast,
        easing: MOTION.AppleEasing,
        useNativeDriver: false,
      }).start();
    }
  }, [isLoadingDetails, details, isLoadingBio, isLoadingCurrentStats, headerOpacity]);

  const handleTabChange = (tab: 'overview' | 'stats' | 'log') => {
    if (tab === activeTab) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const targetPos = tab === 'overview' ? 0 : tab === 'stats' ? 1 : 2;

    Animated.parallel([
      Animated.timing(tabIndicatorPos, {
        toValue: targetPos,
        duration: MOTION.Standard,
        easing: MOTION.AppleEasing,
        useNativeDriver: false,
      }),
      Animated.timing(tabContentAnim, {
        toValue: 1,
        duration: MOTION.Fast,
        easing: MOTION.AppleEasing,
        useNativeDriver: false,
      })
    ]).start(() => {
      setActiveTab(tab);
      tabContentAnim.setValue(0);
    });
  };

  if (isLoadingDetails) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.textSecondary} />
      </View>
    );
  }

  if (!details) return null;

  // Animations
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [HEADER_EXPANDED_HEIGHT + insets.top, HEADER_COLLAPSED_HEIGHT + insets.top],
    extrapolate: 'clamp',
  });

  const expandedOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const collapsedOpacity = scrollY.interpolate({
    inputRange: [80, 120],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // --- Render Helpers ---

  const renderKPIStats = () => {
    if (isLoadingCurrentStats) {
      return (
        <View style={[styles.kpiContainer, { height: 160, justifyContent: 'center' }]}>
          <ActivityIndicator size="small" color={COLORS.textSecondary} />
        </View>
      );
    }
    
    if (kpis.length === 0) return null;

    return (
      <View style={styles.kpiContainer}>
        {kpis.map((kpi, idx) => (
          <View 
            key={idx} 
            style={[
              styles.kpiBox, 
              idx >= 4 && { marginTop: 16, borderTopWidth: 0.5, borderTopColor: COLORS.divider, paddingTop: 16 },
              (idx === 3 || idx === 7) && { borderRightWidth: 0 }
            ]}
          >
            <Text style={styles.kpiValue}>{kpi.value}</Text>
            <Text style={styles.kpiLabel}>{kpi.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      <AnimatedSection index={0} visible={isDataLoaded}>
        {renderKPIStats()}
      </AnimatedSection>

      <AnimatedSection index={1} visible={isDataLoaded}>
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>资料</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>身高</Text>
                <Text style={styles.infoValue}>{details.height || '-'}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>体重</Text>
                <Text style={styles.infoValue}>{details.weight || '-'}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>年龄</Text>
                <Text style={styles.infoValue}>{details.age || '-'}</Text>
              </View>
            </View>
            <View style={[styles.infoRow, { marginTop: 16, borderTopWidth: 0.5, borderTopColor: COLORS.divider, paddingTop: 16 }]}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>大学</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{details.college || '-'}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>选秀</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{details.draft || '-'}</Text>
              </View>
            </View>
            <View style={[styles.infoRow, { marginTop: 16, borderTopWidth: 0.5, borderTopColor: COLORS.divider, paddingTop: 16 }]}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>球龄</Text>
                <Text style={styles.infoValue}>{details.experience || '-'}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>生日</Text>
                <Text style={styles.infoValue}>{details.dob || '-'}</Text>
              </View>
            </View>
          </View>
        </View>
      </AnimatedSection>

      {bio?.awards && bio.awards.length > 0 && (
        <AnimatedSection index={2} visible={isDataLoaded}>
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>荣誉</Text>
            <View style={styles.infoCard}>
              {bio.awards.map((award: any, idx: number) => (
                <View key={idx} style={[styles.awardRow, idx > 0 && styles.awardDivider]}>
                  <Ionicons name="trophy-outline" size={16} color={COLORS.accent} />
                  <Text style={styles.awardText}>{award.displayCount} {award.name}</Text>
                </View>
              ))}
            </View>
          </View>
        </AnimatedSection>
      )}
    </View>
  );

  const renderStatsTab = () => {
    if (!regularStats) return <ActivityIndicator size="small" color={COLORS.textSecondary} style={{marginTop: 40}} />;

    const labels = regularStats.labels || [];
    const stats = regularStats.statistics || [];
    const totals = regularStats.totals || [];

    return (
      <View style={styles.tabContent}>
        <AnimatedSection index={0} visible={isDataLoaded}>
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>常规赛场均数据</Text>
            
            <View style={styles.gridContainer}>
              {/* Pinned Column (Season) */}
              <View style={styles.pinnedColumn}>
                <View style={styles.tableHeader}>
                  <Text style={styles.seasonCol}>赛季</Text>
                </View>
                {stats.map((row: any, idx: number) => (
                  <View key={`season-${idx}`} style={styles.tableRow}>
                    <Text style={styles.seasonColText}>{row.season}</Text>
                  </View>
                ))}
                {totals.length > 0 && (
                  <View style={styles.totalsRow}>
                    <Text style={styles.seasonColTotal}>生涯总计</Text>
                  </View>
                )}
              </View>

              {/* Scrollable Stats */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  <View style={styles.tableHeader}>
                    {labels.map((label: string, idx: number) => (
                      <Text key={idx} style={styles.statCol}>{label}</Text>
                    ))}
                  </View>
                  
                  {stats.map((row: any, idx: number) => (
                    <View key={`row-${idx}`} style={styles.tableRow}>
                      {row.stats.map((val: string, sIdx: number) => (
                        <Text key={sIdx} style={styles.statColText}>{val}</Text>
                      ))}
                    </View>
                  ))}

                  {totals.length > 0 && (
                    <View style={styles.totalsRow}>
                      {totals.map((val: string, idx: number) => (
                        <Text key={idx} style={styles.statColTotal}>{val}</Text>
                      ))}
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </AnimatedSection>
      </View>
    );
  };

  const renderLogTab = () => {
    if (!gameLog) return <ActivityIndicator size="small" color={COLORS.textSecondary} style={{marginTop: 40}} />;

    const events = gameLog.events || [];

    return (
      <View style={styles.tabContent}>
        <AnimatedSection index={0} visible={isDataLoaded}>
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>最近5场比赛</Text>
            <View style={styles.logCard}>
              {events.map((event: any, idx: number) => {
                const isWin = event.gameResult === 'W';
                // Find PTS, REB, AST indices from original names if possible, else use indices 0, 1, 2
                // Based on playerService.js: points, totalRebounds, assists are first 3
                const pts = event.stats[0];
                const reb = event.stats[1];
                const ast = event.stats[2];

                return (
                  <TouchableOpacity 
                    key={event.eventId || idx} 
                    style={[styles.logRow, idx < events.length - 1 && styles.logDivider]}
                    onPress={() => event.eventId && router.push(`/game/${event.eventId}`)}
                  >
                    <View style={styles.logLeft}>
                      <Text style={styles.logDate}>{event.gameDate ? new Date(event.gameDate).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) : '-'}</Text>
                      <View style={styles.logMatchup}>
                        <Image source={getTeamImage(event.opponent?.abbreviation)} style={styles.logTeamLogo} />
                        <Text style={styles.logOpponent}>{event.atVs === 'at' ? '@' : 'vs'} {event.opponent?.abbreviation || '-'}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.logRight}>
                      <View style={styles.logStatGroup}>
                        <Text style={styles.logStatValue}>{pts}</Text>
                        <Text style={styles.logStatLabel}>PTS</Text>
                      </View>
                      <View style={styles.logStatGroup}>
                        <Text style={styles.logStatValue}>{reb}</Text>
                        <Text style={styles.logStatLabel}>REB</Text>
                      </View>
                      <View style={styles.logStatGroup}>
                        <Text style={styles.logStatValue}>{ast}</Text>
                        <Text style={styles.logStatLabel}>AST</Text>
                      </View>
                      <View style={[styles.logResult, { backgroundColor: isWin ? COLORS.win : COLORS.loss }]}>
                        <Text style={styles.logResultText}>{event.gameResult || '-'}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </AnimatedSection>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={[styles.header, { height: headerHeight, paddingTop: insets.top, opacity: headerOpacity }]}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
          </TouchableOpacity>
          
          <Animated.View style={[styles.compactHeader, { opacity: collapsedOpacity }]}>
            {details.photo && <Image source={{ uri: details.photo }} style={styles.compactPhoto} />}
            <Text style={styles.compactTitle}>{details.name}</Text>
          </Animated.View>
          
          <View style={styles.iconButton} />
        </View>

        {/* Expanded Content */}
        <Animated.View style={[styles.expandedContent, { opacity: expandedOpacity }]}>
          <View style={styles.headerTop}>
            <View style={styles.photoContainer}>
              {details.photo && <Image source={{ uri: details.photo }} style={styles.mainPhoto} />}
            </View>
            <View style={styles.headerInfo}>
              <View style={styles.teamRow}>
                {details.team?.abbreviation && (
                  <Image source={getTeamImage(details.team.abbreviation)} style={styles.teamLogo} />
                )}
                <Text style={styles.teamName}>{details.team?.name || 'Free Agent'}</Text>
              </View>
              <Text style={styles.playerNameMain}>{details.name}</Text>
              <Text style={styles.playerMeta}>
                #{details.jersey?.replace('##', '') || '-'} • {details.position || '-'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabs}>
            <TouchableOpacity onPress={() => handleTabChange('overview')} style={styles.tab}>
              <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>概览</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleTabChange('stats')} style={styles.tab}>
              <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>赛季数据</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleTabChange('log')} style={styles.tab}>
              <Text style={[styles.tabText, activeTab === 'log' && styles.tabTextActive]}>比赛日志</Text>
            </TouchableOpacity>
          </View>
          <Animated.View style={[styles.tabIndicator, { 
            left: tabIndicatorPos.interpolate({
              inputRange: [0, 1, 2],
              outputRange: [0, width / 3, (width / 3) * 2]
            }) 
          }]} />
        </View>
      </Animated.View>

      {/* Main Scroll Content */}
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: HEADER_EXPANDED_HEIGHT + insets.top + 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ 
          opacity: headerOpacity,
          transform: [{
            translateX: tabContentAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 16]
            })
          }, {
            scale: tabContentAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0.98]
            })
          }]
        }}>
          {activeTab === 'overview' ? renderOverviewTab() : 
           activeTab === 'stats' ? renderStatsTab() : renderLogTab()}
        </Animated.View>

        {/* Bottom Spacer */}
        <View style={{ height: insets.bottom + 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.header,
    zIndex: 10,
    overflow: 'hidden',
  },
  navBar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    position: 'absolute',
    left: 60,
    right: 60,
    height: 44, // Match navBar height
    justifyContent: 'center',
  },
  compactPhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2c2c2e',
  },
  compactTitle: {
    color: COLORS.textMain,
    fontSize: 17,
    fontWeight: '700',
  },
  expandedContent: {
    height: 120,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1c1c1e',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#2c2c2e',
  },
  mainPhoto: {
    width: '100%',
    height: '100%',
  },
  headerInfo: {
    flex: 1,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  teamLogo: {
    width: 20,
    height: 20,
  },
  teamName: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  playerNameMain: {
    color: COLORS.textMain,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  playerMeta: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '500',
    marginTop: 2,
  },
  tabsContainer: {
    height: 48,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.header,
  },
  tabs: {
    flexDirection: 'row',
    height: '100%',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.textMain,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: width / 3,
    height: 2,
    backgroundColor: COLORS.accent,
  },
  tabContent: {
    paddingHorizontal: 16,
  },
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 24,
  },
  kpiBox: {
    width: '25%',
    alignItems: 'center',
    borderRightWidth: 0.5,
    borderRightColor: COLORS.divider,
  },
  kpiValue: {
    color: COLORS.textMain,
    fontSize: 20,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  kpiLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    color: COLORS.textMain,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: COLORS.textMain,
    fontSize: 15,
    fontWeight: '600',
  },
  awardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  awardDivider: {
    borderTopWidth: 0.5,
    borderTopColor: COLORS.divider,
  },
  awardText: {
    color: COLORS.textMain,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    padding: 12,
  },
  pinnedColumn: {
    width: 80,
    backgroundColor: COLORS.card,
    zIndex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.divider,
    paddingBottom: 8,
    marginBottom: 8,
    height: 32,
  },
  seasonCol: {
    width: 80,
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  statCol: {
    width: 45,
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  tableRow: {
    flexDirection: 'row',
    height: 38,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
  },
  seasonColText: {
    width: 80,
    color: COLORS.textMain,
    fontSize: 13,
    fontWeight: '500',
  },
  statColText: {
    width: 45,
    textAlign: 'center',
    color: COLORS.textMain,
    fontSize: 13,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  totalsRow: {
    flexDirection: 'row',
    height: 44,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    alignItems: 'center',
  },
  seasonColTotal: {
    width: 80,
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  statColTotal: {
    width: 45,
    textAlign: 'center',
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  logCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 4,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  logDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.divider,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logDate: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    width: 40,
  },
  logMatchup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logTeamLogo: {
    width: 20,
    height: 20,
  },
  logOpponent: {
    color: COLORS.textMain,
    fontSize: 14,
    fontWeight: '600',
  },
  logRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logStatGroup: {
    alignItems: 'center',
    width: 32,
  },
  logStatValue: {
    color: COLORS.textMain,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  logStatLabel: {
    color: COLORS.textSecondary,
    fontSize: 8,
    fontWeight: '600',
    marginTop: 2,
  },
  logResult: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logResultText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
