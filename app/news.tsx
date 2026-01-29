import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Linking,
  useWindowDimensions,
  Platform,
  FlatList
} from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchNews } from '../src/services/api';
import type { NewsResponse, Tweet } from '../src/types/news';
import { COLORS, MOTION } from '../src/constants/theme';
import { AnimatedSection } from '../src/components/AnimatedSection';
import { Skeleton } from '../src/components/Skeleton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NewsScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const imageWidth = width - 32; // padding 16 each side

  const { 
    data, 
    isLoading, 
    error, 
    refetch, 
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['news'],
    queryFn: ({ pageParam = 1 }) => fetchNews({ page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage: any) => {
      const pagination = lastPage?.meta?.pagination;
      return pagination?.hasMore ? pagination.nextPage : undefined;
    },
    initialPageParam: 1,
  });

  const onRefresh = async () => {
    await refetch();
  };

  const openLink = (url: string | null) => {
    if (url) Linking.openURL(url);
  };

  const renderTweet = ({ item: tweet, index }: { item: Tweet, index: number }) => {
    const displayTime = tweet.timestampFormatted?.display || tweet.timestamp;
    const avatarLetter = tweet.authorHandle?.charAt(1) || tweet.author?.charAt(0) || '?';

    return (
      <AnimatedSection key={tweet.id} index={index % 20} visible={true}>
        <TouchableOpacity
          style={styles.tweetCard}
          onPress={() => tweet.link && openLink(tweet.link)}
          activeOpacity={0.9}
        >
          <View style={styles.tweetRow}>
            {/* Avatar */}
            {tweet.avatar ? (
              <Image
                source={{ uri: tweet.avatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>{avatarLetter}</Text>
              </View>
            )}

            {/* Content */}
            <View style={styles.tweetContent}>
              <View style={styles.authorRow}>
                <Text style={styles.authorName} numberOfLines={1}>{tweet.author}</Text>
                <Text style={styles.authorHandle} numberOfLines={1}> {tweet.authorHandle}</Text>
                <Text style={styles.timestamp}> · {displayTime}</Text>
              </View>

              <Text style={styles.tweetText}>{tweet.text}</Text>

              {/* Media */}
              {tweet.images && tweet.images.length > 0 && (
                <View style={styles.mediaContainer}>
                  {tweet.images.map((imageUrl, idx) => {
                    const fullUrl = tweet.imageLinks?.[idx] || imageUrl;
                    return (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => openLink(fullUrl)}
                        style={styles.mediaWrapper}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={{ uri: imageUrl }}
                          style={[styles.mediaImage, { width: imageWidth - 64, maxHeight: 400 }]}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </AnimatedSection>
    );
  };

  if (isLoading && !data) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Skeleton width={120} height={32} />
          <Skeleton width={200} height={16} style={{ marginTop: 8 }} />
        </View>
        <View style={styles.scrollContent}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonTweetCard}>
              <View style={styles.skeletonTweetRow}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Skeleton width={150} height={14} />
                  <Skeleton width="100%" height={60} style={{ marginTop: 12 }} />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>加载失败</Text>
        <Text style={styles.errorMessage}>{error instanceof Error ? error.message : '未知错误'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const allTweets = data?.pages.flatMap(page => (page as any).data?.tweets || []) ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>NBA News!</Text>
        <Text style={styles.subtitle}>
          来自 <Text style={styles.subtitleBold}>@ShamsCharania</Text> 等的最新推文
        </Text>
      </View>

      <FlatList
        data={allTweets}
        renderItem={renderTweet}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
          />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => (
          isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={COLORS.textSecondary} />
            </View>
          ) : <View style={{ height: 40 }} />
        )}
        ListEmptyComponent={() => (
          !isLoading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>暂无新闻</Text>
              <Text style={styles.emptyMessage}>
                Twitter/X 可能阻止了数据抓取。请稍后再试。
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                <Text style={styles.retryText}>刷新</Text>
              </TouchableOpacity>
            </View>
          )
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  errorTitle: {
    color: COLORS.textMain,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorMessage: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
  },
  retryText: {
    color: COLORS.textMain,
    fontWeight: '600',
    fontSize: 15,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.bg,
  },
  title: {
    color: COLORS.textMain,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  subtitleBold: {
    color: COLORS.textMain,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  tweetCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: COLORS.divider,
  },
  tweetRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarLetter: {
    color: COLORS.textMain,
    fontSize: 18,
    fontWeight: '700',
  },
  tweetContent: {
    flex: 1,
    minWidth: 0,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  authorName: {
    color: COLORS.textMain,
    fontSize: 15,
    fontWeight: '700',
  },
  authorHandle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginLeft: 4,
  },
  timestamp: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  tweetText: {
    color: COLORS.textMain,
    fontSize: 15,
    lineHeight: 22,
  },
  mediaContainer: {
    marginTop: 12,
    gap: 8,
  },
  mediaWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1c1c1e',
  },
  mediaImage: {
    height: 200,
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: COLORS.textMain,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyMessage: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  skeletonTweetCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  skeletonTweetRow: {
    flexDirection: 'row',
  },
});
