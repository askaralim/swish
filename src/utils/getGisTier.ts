/** GIS tier label for Swish Score (same thresholds as product copy). */
export function getGisTier(score: number): string {
  if (score >= 50) return '🔥 MVP级表现';
  if (score >= 40) return '⭐ 全明星表现';
  if (score >= 30) return '👍 主力表现';
  if (score >= 20) return '👌 合格表现';
  return '📉 低效表现';
}