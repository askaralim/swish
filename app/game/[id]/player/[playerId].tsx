import React, { useRef, useState, useMemo, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { fetchGameDetail } from '@/src/services/api';
import { COLORS } from '@/src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from '@/src/components/Skeleton';
import {
  ShareablePlayerPerformanceCard,
  type ShareablePlayerPerformanceCardHandle,
} from '@/src/components/ShareablePlayerPerformanceCard';
import type { PlayerPerformanceCardData } from '@/src/components/PlayerPerformanceCard';
import { usePostHog } from 'posthog-react-native';
import { goBackOrReplace } from '@/src/utils/navigation';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

export default function PlayerGamePerformanceScreen() {
  const { id, playerId } = useLocalSearchParams<{ id: string; playerId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const posthog = usePostHog();
  const shareableRef = useRef<ShareablePlayerPerformanceCardHandle>(null);
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
      const athlete = [...team.starters, ...team.bench].find((a) => a.athleteId === playerId);
      if (athlete) {
        return {
          ...athlete,
          teamAbbreviation: team.abbreviation,
          teamLogo: team.logo,
          teamName: team.name,
          teamNameZhCN: team.nameZhCN,
          gameScore: `${game.awayTeam.nameZhCN} ${game.awayTeam.score} - ${game.homeTeam.score} ${game.homeTeam.nameZhCN}`,
        };
      }
    }
    return null;
  }, [game, playerId]);

  const cardData: PlayerPerformanceCardData | null = useMemo(() => {
    if (!playerStats) return null;
    return {
      name: playerStats.name,
      headshot: playerStats.headshot,
      position: playerStats.position,
      teamAbbreviation: playerStats.teamAbbreviation,
      teamNameZhCN: playerStats.teamNameZhCN,
      gameScore: playerStats.gameScore,
      gis: playerStats.gis ?? null,
      stats: {
        minutes: playerStats.stats.minutes,
        points: playerStats.stats.points,
        rebounds: playerStats.stats.rebounds,
        assists: playerStats.stats.assists,
        steals: playerStats.stats.steals,
        blocks: playerStats.stats.blocks,
        plusMinus: playerStats.stats.plusMinus,
        fieldGoals: playerStats.stats.fieldGoals,
        threePointers: playerStats.stats.threePointers,
        freeThrows: playerStats.stats.freeThrows,
        turnovers: playerStats.stats.turnovers,
        fouls: playerStats.stats.fouls,
      },
    };
  }, [playerStats]);

  const gameStatusLabel = useMemo(() => {
    if (!game) return '';
    if (game.gameStatus === 3) return '已结束';
    if (game.gameStatus === 2) return '直播中';
    return game.gameStatusText?.toUpperCase() ?? '';
  }, [game]);

  useEffect(() => {
    if (playerStats) {
      posthog.capture('player_card_viewed', {
        game_id: id,
        player_id: playerId,
        player_name: playerStats.name ?? null,
        team: playerStats.teamAbbreviation ?? null,
        gis: playerStats.gis ?? null,
      });
    }
  }, [playerStats]);

  const handleDownloadPress = async () => {
    posthog.capture('performance_card_captured', {
      game_id: id,
      player_id: playerId,
      player_name: playerStats?.name ?? null,
    });
    try {
      setIsSaving(true);
      setSaveProgress(0.2);
      const uri = await shareableRef.current?.capture();
      if (uri) {
        setPreviewUri(uri);
        setSaveProgress(1.0);
        setTimeout(() => {
          setIsSaving(false);
          setShowPreview(true);
          setSaveProgress(0);
        }, 400);
      } else {
        setIsSaving(false);
        setSaveProgress(0);
        Alert.alert('生成失败', '无法生成预览图，请稍后再试');
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
      posthog.capture('performance_card_saved', { game_id: id, player_id: playerId });
      Alert.alert('保存成功', '图片已保存到您的相册');
      setShowPreview(false);
    } catch (error) {
      console.error('Save failed', error);
      Alert.alert('保存失败', '无法保存图片');
    }
  };

  const handleSharePreview = async () => {
    if (!previewUri) return;
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('无法分享', '当前设备不支持分享此图片');
        return;
      }
      posthog.capture('performance_card_shared', { game_id: id, player_id: playerId });
      await Sharing.shareAsync(previewUri, {
        mimeType: 'image/png',
        dialogTitle: '分享表现卡',
        ...(Platform.OS === 'ios' ? { UTI: 'public.png' as const } : {}),
      });
    } catch (error) {
      console.error('Share failed', error);
      Alert.alert('分享失败', '请稍后再试');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={{ backgroundColor: COLORS.bg, paddingTop: insets.top }}>
          <View style={styles.navBar}>
            <TouchableOpacity onPress={() => goBackOrReplace(router, `/game/${id}`)} style={styles.navButton}>
              <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
            </TouchableOpacity>
            <Text style={styles.navTitle}>表现卡</Text>
            <View style={styles.navButton} />
          </View>
        </View>
        <View style={styles.scrollContent}>
          <View style={[styles.cardSkeleton, { width: CARD_WIDTH }]}>
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
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <View key={i} style={styles.statItem}>
                  <Skeleton width={30} height={10} style={{ marginBottom: 6 }} />
                  <Skeleton width={40} height={20} />
                </View>
              ))}
            </View>
            <View style={styles.divider} />
            <View style={styles.shootingRow}>
              {[1, 2, 3, 4].map((i) => (
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

  if (!playerStats || !cardData) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: COLORS.textSecondary }}>未找到该球员在此场比赛的数据</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ backgroundColor: COLORS.bg, paddingTop: insets.top }}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => goBackOrReplace(router, `/game/${id}`)} style={styles.navButton}>
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
        <ShareablePlayerPerformanceCard
          ref={shareableRef}
          cardWidth={CARD_WIDTH}
          player={cardData}
          gameStatusLabel={gameStatusLabel}
        />

        <TouchableOpacity
          style={styles.detailLink}
          onPress={() => router.push(`/player/${playerId}`)}
        >
          <Text style={styles.detailLinkText}>查看球员详情</Text>
          <Ionicons name="arrow-forward" size={16} color={COLORS.accent} />
        </TouchableOpacity>
      </ScrollView>

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
              <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />
            )}
          </ScrollView>

          <View style={[styles.previewFooter, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <TouchableOpacity style={styles.footerBtnGhost} onPress={() => setShowPreview(false)}>
              <Text style={styles.footerBtnGhostText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerBtnShare} onPress={handleSharePreview}>
              <Ionicons name="share-outline" size={20} color={COLORS.textMain} />
              <Text style={styles.footerBtnShareText}>分享</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerBtnPrimary} onPress={confirmSave}>
              <Ionicons name="download-outline" size={18} color="#000" style={{ marginRight: 6 }} />
              <Text style={styles.footerBtnPrimaryText} numberOfLines={1}>
                保存到相册
              </Text>
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
  cardSkeleton: {
    backgroundColor: '#0A0A0C',
    borderRadius: 0,
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
  nameRow: {
    justifyContent: 'center',
  },
  gameInfo: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#1C1C1E',
    marginBottom: 24,
  },
  shootingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shootingItem: {
    flex: 1,
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
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.5,
    borderRadius: 0,
  },
  previewFooter: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 16,
    gap: 8,
    backgroundColor: '#000',
    alignItems: 'stretch',
  },
  footerBtnGhost: {
    flex: 1,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  footerBtnGhostText: {
    color: COLORS.textMain,
    fontSize: 14,
    fontWeight: '600',
  },
  footerBtnShare: {
    flex: 1,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: '#2C2C2E',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
  },
  footerBtnShareText: {
    color: COLORS.textMain,
    fontSize: 14,
    fontWeight: '600',
  },
  footerBtnPrimary: {
    flex: 1.2,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  footerBtnPrimaryText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
});
