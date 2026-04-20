/** GIS tier label for Swish Score (same thresholds as product copy). */
export function getGisTier(score: number): string {
  if (score >= 30) return 'MVP表现';
  if (score >= 22) return '精英表现';
  if (score >= 15) return '主力表现';
  if (score >= 8) return '影响比赛';
  return '有限';
}
