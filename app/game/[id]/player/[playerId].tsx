import React, { useRef, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions, 
  ScrollView,
  Platform,
  Alert,
  Modal
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchGameDetail } from '@/src/services/api';
import { getTeamImage } from '@/src/utils/teamImages';
import { COLORS } from '@/src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';

import { Skeleton } from '@/src/components/Skeleton';

const { width } = Dimensions.get('window');

export default function PlayerGamePerformanceScreen() {
  const { id, playerId } = useLocalSearchParams<{ id: string, playerId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const viewShotRef = useRef<ViewShot>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { data: game, isLoading } = useQuery({
    queryKey: ['gameDetail', id],
    queryFn: () => fetchGameDetail(id),
  });

  const playerStats = useMemo(() => {
    if (!game?.boxscore?.teams) return null;
    
    for (const team of game.boxscore.teams) {
      const athlete = [...team.starters, ...team.bench].find(a => a.athleteId === playerId);
      if (athlete) {
        return {
          ...athlete,
          teamAbbreviation: team.abbreviation,
          teamLogo: team.logo,
          teamName: team.name,
          teamNameZhCN: team.nameZhCN,
          gameScore: `${game.awayTeam.nameZhCN} ${game.awayTeam.score} - ${game.homeTeam.score} ${game.homeTeam.nameZhCN}`
        };
      }
    }
    return null;
  }, [game, playerId]);

  const handleDownloadPress = async () => {
    try {
      setIsSaving(true);
      setSaveProgress(0.2);
      const uri = await viewShotRef.current?.capture?.();
      if (uri) {
        setPreviewUri(uri);
        setSaveProgress(1.0);
        setTimeout(() => {
          setIsSaving(false);
          setShowPreview(true);
          setSaveProgress(0);
        }, 400);
      }
    } catch (error) {
      console.error('Capture failed', error);
      Alert.alert('生成失败', '无法生成预览图，请稍后再试');
      setIsSaving(false);
    }
  };

  const confirmSave = async () => {
    if (!previewUri) return;
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限不足', '我们需要访问您的相册以保存图片');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(previewUri);
      Alert.alert('保存成功', '图片已保存到您的相册');
      setShowPreview(false);
    } catch (error) {
      console.error('Save failed', error);
      Alert.alert('保存失败', '无法保存图片');
    }
  };

  const saveToGallery = async () => {
    // This is now handled by handleDownloadPress -> confirmSave
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={{ backgroundColor: COLORS.bg, paddingTop: insets.top }}>
          <View style={styles.navBar}>
            <TouchableOpacity onPress={() => router.push(`/game/${id}`)} style={styles.navButton}>
              <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
            </TouchableOpacity>
            <Text style={styles.navTitle}>表现卡</Text>
            <View style={styles.navButton} />
          </View>
        </View>
        <View style={styles.scrollContent}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.playerIdentity}>
                <Skeleton width={64} height={64} borderRadius={32} />
                <View style={[styles.nameRow, { marginLeft: 16 }]}>
                  <Skeleton width={150} height={24} />
                  <Skeleton width={100} height={14} style={{ marginTop: 8 }} />
                </View>
              </View>
              <Skeleton width={32} height={32} borderRadius={16} />
            </View>
            <View style={styles.gameInfo}>
              <Skeleton width={200} height={16} />
              <Skeleton width={100} height={12} style={{ marginTop: 8 }} />
            </View>
            <View style={styles.statsGrid}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <View key={i} style={styles.statItem}>
                  <Skeleton width={30} height={10} style={{ marginBottom: 6 }} />
                  <Skeleton width={40} height={20} />
                </View>
              ))}
            </View>
            <View style={styles.divider} />
            <View style={styles.shootingRow}>
              {[1, 2, 3, 4].map(i => (
                <View key={i} style={styles.shootingItem}>
                  <Skeleton width={30} height={10} style={{ marginBottom: 4 }} />
                  <Skeleton width={50} height={15} />
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (!playerStats) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: COLORS.textSecondary }}>未找到该球员在此场比赛的数据</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header NavBar */}
      <View style={{ backgroundColor: COLORS.bg, paddingTop: insets.top }}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.push(`/game/${id}`)} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>表现卡</Text>
          <TouchableOpacity onPress={handleDownloadPress} style={styles.navButton} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color={COLORS.accent} />
            ) : (
              <Ionicons name="download-outline" size={22} color={COLORS.accent} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* The Card to Capture */}
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
          <View style={styles.card}>
            {/* Header: Player Info */}
            <View style={styles.cardHeader}>
              <View style={styles.playerIdentity}>
                <Image source={{ uri: playerStats.headshot }} style={styles.headshot} />
                <View style={styles.nameRow}>
                  <Text style={styles.playerName}>{playerStats.name}</Text>
                  <Text style={styles.playerMeta}>
                    {playerStats.teamNameZhCN} · {playerStats.position}
                  </Text>
                </View>
              </View>
              <Image source={getTeamImage(playerStats.teamAbbreviation)} style={styles.teamLogo} />
            </View>

            {/* Game Result */}
            <View style={styles.gameInfo}>
              <Text style={styles.gameScore}>{playerStats.gameScore}</Text>
              <Text style={styles.gameStatus}>{game?.gameStatusText}</Text>
            </View>

            {/* Main Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>得分</Text>
                <Text style={styles.statValue}>{playerStats.stats.points}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>篮板</Text>
                <Text style={styles.statValue}>{playerStats.stats.rebounds}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>助攻</Text>
                <Text style={styles.statValue}>{playerStats.stats.assists}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>抢断</Text>
                <Text style={styles.statValue}>{playerStats.stats.steals || '0'}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>盖帽</Text>
                <Text style={styles.statValue}>{playerStats.stats.blocks || '0'}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>+/-</Text>
                <Text style={[
                  styles.statValue, 
                  parseFloat(playerStats.stats.plusMinus) > 0 ? { color: COLORS.win } : 
                  parseFloat(playerStats.stats.plusMinus) < 0 ? { color: COLORS.loss } : null
                ]}>
                  {parseFloat(playerStats.stats.plusMinus) > 0 ? `${playerStats.stats.plusMinus}` : playerStats.stats.plusMinus}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Shooting Splits */}
            <View style={styles.shootingRow}>
              <View style={styles.shootingItem}>
                <Text style={styles.shootingLabel}>投篮</Text>
                <Text style={styles.shootingValue}>{playerStats.stats.fieldGoals || '-'}</Text>
              </View>
              <View style={styles.shootingItem}>
                <Text style={styles.shootingLabel}>三分</Text>
                <Text style={styles.shootingValue}>{playerStats.stats.threePointers || '-'}</Text>
              </View>
              <View style={styles.shootingItem}>
                <Text style={styles.shootingLabel}>罚球</Text>
                <Text style={styles.shootingValue}>{playerStats.stats.freeThrows || '-'}</Text>
              </View>
              <View style={styles.shootingItem}>
                <Text style={styles.shootingLabel}>分钟</Text>
                <Text style={styles.shootingValue}>{playerStats.stats.minutes}</Text>
              </View>
            </View>

            {/* App Branding */}
            {/* <View style={styles.branding}>
              <Text style={styles.brandText}>SWISH NBA</Text>
              <Text style={styles.brandTag}>swish-nba.app</Text>
            </View> */}
          </View>
        </ViewShot>

        {/* Action Link back to Player Detail */}
        <TouchableOpacity 
          style={styles.detailLink}
          onPress={() => router.push(`/player/${playerId}`)}
        >
          <Text style={styles.detailLinkText}>查看球员详情</Text>
          <Ionicons name="arrow-forward" size={16} color={COLORS.accent} />
        </TouchableOpacity>
      </ScrollView>

      {/* Save Progress Overlay */}
      {isSaving && (
        <View style={styles.saveOverlay}>
          <View style={styles.saveModal}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.saveText}>正在生成预览...</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${saveProgress * 100}%` }]} />
            </View>
          </View>
        </View>
      )}

      {/* Preview Modal */}
      <Modal
        visible={showPreview}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <TouchableOpacity onPress={() => setShowPreview(false)} style={styles.previewClose}>
              <Ionicons name="close" size={28} color={COLORS.textMain} />
            </TouchableOpacity>
            <Text style={styles.previewTitle}>预览表现卡</Text>
            <View style={{ width: 44 }} />
          </View>
          
          <ScrollView contentContainerStyle={styles.previewScroll} showsVerticalScrollIndicator={false}>
            {previewUri && (
              <Image 
                source={{ uri: previewUri }} 
                style={styles.previewImage} 
                resizeMode="contain"
              />
            )}
          </ScrollView>

          <View style={[styles.previewFooter, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowPreview(false)}>
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={confirmSave}>
              <Ionicons name="download-outline" size={20} color="#000" style={{ marginRight: 8 }} />
              <Text style={styles.confirmButtonText}>保存到相册</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 44,
    backgroundColor: COLORS.bg,
  },
  navTitle: {
    flex: 1,
    color: COLORS.textMain,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  card: {
    width: width - 40,
    backgroundColor: '#0A0A0C',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1C1C1E',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  playerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headshot: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1C1C1E',
    marginRight: 16,
  },
  nameRow: {
    justifyContent: 'center',
  },
  playerName: {
    color: COLORS.textMain,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  playerMeta: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  teamLogo: {
    width: 32,
    height: 32,
  },
  gameInfo: {
    marginBottom: 24,
  },
  gameScore: {
    color: COLORS.textMain,
    fontSize: 15,
    fontWeight: '700',
  },
  gameStatus: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
  },
  statValue: {
    color: COLORS.textMain,
    fontSize: 20,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: '#1C1C1E',
    marginBottom: 24,
  },
  shootingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  shootingItem: {
    flex: 1,
  },
  shootingLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  shootingValue: {
    color: COLORS.textMain,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  branding: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  brandText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  brandTag: {
    color: '#3A3A3C',
    fontSize: 10,
    fontWeight: '600',
  },
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
    padding: 12,
  },
  detailLinkText: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  saveOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  saveModal: {
    backgroundColor: '#1C1C1E',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    width: width * 0.8,
  },
  saveText: {
    color: COLORS.textMain,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 16,
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: '#2C2C2E',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    marginTop: Platform.OS === 'ios' ? 44 : 0,
  },
  previewClose: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewTitle: {
    color: COLORS.textMain,
    fontSize: 17,
    fontWeight: '600',
  },
  previewScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewImage: {
    width: width - 40,
    height: (width - 40) * 1.5, // Aspect ratio for the card
    borderRadius: 24,
  },
  previewFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
    backgroundColor: '#000',
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.textMain,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  }
});
