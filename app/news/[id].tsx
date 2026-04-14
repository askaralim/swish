import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchTranslatedNewsDetail } from '../../src/services/api';
import { COLORS } from '../../src/constants/theme';
import { ErrorState } from '../../src/components/ErrorState';

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

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const goBackToNewsList = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/news');
    }
  };
  const { width } = useWindowDimensions();
  const imageWidth = width - 48;

  const { data, isLoading, error, refetch } = useQuery<{ data: NewsArticle }>({
    queryKey: ['newsDetail', id],
    queryFn: () => fetchTranslatedNewsDetail(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  const article = (data as any)?.data ?? data;

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBackToNewsList} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </View>
    );
  }

  if (error || !article) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : '无法加载文章'}
        onRetry={refetch}
      />
    );
  }

  const avatarLetter = article.author?.charAt(0) || '?';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBackToNewsList} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>新闻详情</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {article.title ? (
          <Text style={styles.title}>{article.title}</Text>
        ) : null}

        <View style={styles.authorRow}>
          {article.authorAvatar ? (
            <Image source={{ uri: article.authorAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>{avatarLetter}</Text>
            </View>
          )}
          <View style={styles.authorInfo}>
            {article.author ? <Text style={styles.authorName}>{article.author}</Text> : null}
            {article.publishedTime ? <Text style={styles.publishedTime}>{article.publishedTime}</Text> : null}
          </View>
        </View>

        {article.images && article.images.length > 0 && (
          <View style={styles.imagesContainer}>
            {article.images.map((imageUrl: string, idx: number) => (
              <Image
                key={idx}
                source={{ uri: imageUrl }}
                style={[styles.articleImage, { width: imageWidth }]}
                resizeMode="cover"
              />
            ))}
          </View>
        )}

        <Text style={styles.content}>{article.content}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    color: COLORS.textMain,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textMain,
    lineHeight: 30,
    marginBottom: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarLetter: {
    color: COLORS.textMain,
    fontSize: 16,
    fontWeight: '600',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    color: COLORS.textMain,
    fontSize: 15,
    fontWeight: '600',
  },
  publishedTime: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  imagesContainer: {
    marginBottom: 20,
    gap: 12,
  },
  articleImage: {
    height: 220,
    borderRadius: 12,
    backgroundColor: COLORS.cardSecondary,
  },
  content: {
    fontSize: 16,
    color: COLORS.textMain,
    lineHeight: 26,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
});
