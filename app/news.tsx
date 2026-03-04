import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  FlatList,
} from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchTranslatedNews } from '../src/services/api'; // Changed import
import { COLORS } from '../src/constants/theme';
import { AnimatedSection } from '../src/components/AnimatedSection';
import { Skeleton } from '../src/components/Skeleton';
import { ErrorState } from '../src/components/ErrorState';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// New interface for translated news articles
interface NewsArticle {
  id: string;
  author?: string; // Added optional author
  authorAvatar?: string; // Added optional authorAvatar
  title: string;
  content: string;
  publishedAt: string; // ISO 8601 string
  publishedTime: string; // e.g., "2小时前"
  images: string[]; // Array of image URLs
}

interface TranslatedNewsResponse {
  success: boolean;
  data: {
    articles: NewsArticle[];
  };
  meta: {
    version: string;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
      nextPage: number | null;
      prevPage: number | null;
    };
  };
  timestamp: string;
}

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
    isFetchingNextPage,
  } = useInfiniteQuery<TranslatedNewsResponse>({
    queryKey: ['translatedNews'], // Changed queryKey
    queryFn: ({ pageParam = 1 }) => fetchTranslatedNews({ page: pageParam, limit: 20 }), // Changed fetch function
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.meta?.pagination;
      return pagination?.hasMore ? pagination.nextPage : undefined;
    },
    initialPageParam: 1,
  });

  const onRefresh = async () => {
    await refetch();
  };

  const renderNewsArticle = ({ item: article, index }: { item: NewsArticle, index: number }) => {
    const avatarLetter = article.author?.charAt(0) || '?';

    return (
      <AnimatedSection key={article.id} index={index % 20} visible={true}>
        <View style={styles.newsCard}>
          <View style={styles.authorRow}>
            {article.authorAvatar ? (
              <Image source={{ uri: article.authorAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>{avatarLetter}</Text>
              </View>
            )}
            {article.author && <Text style={styles.authorName}>{article.author}</Text>}
            {article.publishedTime && <Text style={styles.publishedTime}> · {article.publishedTime}</Text>}
          </View>

          {article.images && article.images.length > 0 && (
            <View style={styles.mediaContainer}>
              {article.images.map((imageUrl, idx) => (
                <View
                  key={idx}
                  style={styles.mediaWrapper}
                >
                  <Image
                    source={{ uri: imageUrl }}
                    style={[styles.mediaImage, { width: imageWidth - 32, maxHeight: 400 }]} // Adjusted width
                    resizeMode="cover"
                  />
                </View>
              ))}
            </View>
          )}

          <View style={[styles.articleContent, {padding: 12}]}>
            {article.title && <Text style={styles.articleTitle}>{article.title}</Text>}
            <Text style={styles.articleText} numberOfLines={3} ellipsizeMode="tail">{article.content}</Text>
          </View>
        </View>
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
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>正在加载新闻...</Text>
        </View>
      </View>
    );
  }

  if (error && !isRefetching) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : '无法获取新闻'} // Updated error message
        onRetry={refetch}
      />
    );
  }

  const allArticles = data?.pages.flatMap(page => (page as TranslatedNewsResponse).data?.articles || []) ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>NBA 新闻</Text>
          <Text style={styles.subtitle}>最新动态，尽在掌握</Text>
        </View>
      </View>

      <FlatList
        data={allArticles}
        renderItem={renderNewsArticle}
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
                目前没有可显示的新闻。请稍后再试。 {/* Updated empty message */}
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.bg,
  },
  title: {
    color: COLORS.textMain,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  newsCard: {
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 0,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarLetter: {
    color: COLORS.textMain,
    fontSize: 14,
    fontWeight: '600',
  },
  authorName: {
    color: COLORS.textMain,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  publishedTime: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  mediaContainer: {
    marginBottom: 8,
  },
  mediaWrapper: {
    backgroundColor: '#1c1c1e',
  },
  mediaImage: {
    height: 180,
    width: '100%',
    borderRadius: 8,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  skeletonNewsCard: {
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 12,
    marginBottom: 10,
    padding: 12,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
    fontSize: 14,
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
  articleContent: {
    padding: 12,
  },
  articleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 4,
  },
  articleText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },});