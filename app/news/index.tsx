import React, { useMemo } from 'react';
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
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { fetchTranslatedNews } from '../../src/services/api';
import { COLORS } from '../../src/constants/theme';
import { AnimatedSection } from '../../src/components/AnimatedSection';
import { ErrorState } from '../../src/components/ErrorState';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NewsArticle {
  id: string;
  author?: string;
  authorAvatar?: string;
  title: string;
  content: string;
  publishedAt: string;
  publishedTime: string;
  images: string[];
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
  const router = useRouter();
  const imageWidth = width - 32;

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<
    TranslatedNewsResponse,
    Error,
    InfiniteData<TranslatedNewsResponse>,
    string[],
    number
  >({
    queryKey: ['translatedNews'],
    queryFn: ({ pageParam }) => fetchTranslatedNews({ page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.meta?.pagination;
      const next = pagination?.nextPage;
      return pagination?.hasMore && typeof next === 'number' ? next : undefined;
    },
    initialPageParam: 1,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const allArticles = useMemo(() => {
    const raw =
      data?.pages.flatMap((page) => (page as TranslatedNewsResponse).data?.articles || []) ?? [];
    const seen = new Set<string>();
    return raw.filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
  }, [data]);

  const onRefresh = async () => {
    await refetch();
  };

  const renderNewsArticle = ({ item: article, index }: { item: NewsArticle; index: number }) => {
    const avatarLetter = article.author?.charAt(0) || '?';

    return (
      <AnimatedSection index={index % 20} visible={true}>
        <TouchableOpacity
          style={styles.newsCard}
          activeOpacity={0.7}
          onPress={() => router.push(`/news/${article.id}`)}
        >
          <View style={styles.authorRow}>
            {article.authorAvatar ? (
              <Image source={{ uri: article.authorAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>{avatarLetter}</Text>
              </View>
            )}
            {article.author && <Text style={styles.authorName}>{article.author}</Text>}
            {article.publishedTime && (
              <Text style={styles.publishedTime}> · {article.publishedTime}</Text>
            )}
          </View>

          {article.images && article.images.length > 0 && (
            <View style={styles.mediaContainer}>
              {article.images.map((imageUrl, idx) => (
                <View key={idx} style={styles.mediaWrapper}>
                  <Image
                    source={{ uri: imageUrl }}
                    style={[styles.mediaImage, { width: imageWidth - 32, maxHeight: 400 }]}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </View>
          )}

          <View style={[styles.articleContent, { padding: 12 }]}>
            {article.title && <Text style={styles.articleTitle}>{article.title}</Text>}
            <Text style={styles.articleText} numberOfLines={3} ellipsizeMode="tail">
              {article.content}
            </Text>
          </View>
        </TouchableOpacity>
      </AnimatedSection>
    );
  };

  if (isLoading && !data) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="NBA 新闻" subtitle="最新动态，尽在掌握" insetsTop={insets.top} />
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
        message={error instanceof Error ? error.message : '无法获取新闻'}
        onRetry={refetch}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="NBA 新闻" subtitle="最新动态，尽在掌握" insetsTop={insets.top} />

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
        ListFooterComponent={() =>
          isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={COLORS.textSecondary} />
            </View>
          ) : (
            <View style={{ height: 40 }} />
          )
        }
        ListEmptyComponent={() =>
          !isLoading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>暂无新闻</Text>
              <Text style={styles.emptyMessage}>目前没有可显示的新闻。请稍后再试。</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                <Text style={styles.retryText}>刷新</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
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
  },
});
