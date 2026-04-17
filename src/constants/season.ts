/**
 * Client season labels + ESPN `season` query (e.g. 2026|2 = 2025–26 regular).
 * When the league year changes, update these and server
 * `nba-stats-api/config/seasonDefaults.js` (or env NBA_ESPN_STATS_SEASON / NBA_STANDINGS_*).
 */
export const SEASON_TYPES = { REGULAR: 2, POSTSEASON: 3, PLAYIN: 5 } as const;

/** Ending year of the NBA season (same as server STANDINGS_YEAR). */
export const CURRENT_SEASON_YEAR = 2026;

export const CURRENT_SEASON = `${CURRENT_SEASON_YEAR}|${SEASON_TYPES.REGULAR}`;

export const CURRENT_SEASON_DISPLAY = '2025-26 赛季';

/** @param leagueDisplayName e.g. `2025-26` from API `leagueSeason.displayName` */
export function getSeasonSubtitle(seasonType: number, leagueDisplayName?: string | null): string {
  const prefix = leagueDisplayName?.trim()
    ? `${leagueDisplayName.trim()} 赛季`
    : CURRENT_SEASON_DISPLAY;
  switch (seasonType) {
    case SEASON_TYPES.POSTSEASON:
      return `${prefix} • 季后赛`;
    case SEASON_TYPES.PLAYIN:
      return `${prefix} • 附加赛`;
    default:
      return `${prefix} • 常规赛`;
  }
}

/** @param endingYear NBA season year (e.g. 2026); defaults to `CURRENT_SEASON_YEAR` */
export function buildSeasonParam(
  seasonType: number = SEASON_TYPES.REGULAR,
  endingYear?: number | null
): string {
  const y = endingYear != null && Number.isFinite(endingYear) ? endingYear : CURRENT_SEASON_YEAR;
  return `${y}|${seasonType}`;
}
