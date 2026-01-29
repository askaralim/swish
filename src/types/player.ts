// app/types/player.ts

export interface PlayerStat {
  value: number | string;
  rank: number | null;
  displayValue: string;
  label: string;
  displayName: string;
  description: string;
  category: string;
}

export interface Player {
  id: string;
  name: string;
  team: string;
  teamLogo: string | null;
  headshot: string | null;
  position: string;
  statRank: number;
  stats: {
    [key: string]: PlayerStat | null;
    gamesPlayed: PlayerStat | null;
  };
}

export interface StatCategory {
  title: string;
  description: string;
  players: Player[];
}

export interface PlayerStatsMetadata {
  season: string;
  seasonType: string;
  seasonTypeId: number;
  position: string;
  totalCount: number;
}

export interface PlayerStatsResponse {
  metadata: PlayerStatsMetadata;
  topPlayersByStat: {
    avgPoints: StatCategory;
    avgAssists: StatCategory;
    avgRebounds: StatCategory;
    avgSteals: StatCategory;
    avgBlocks: StatCategory;
    doubleDouble: StatCategory;
    tripleDouble: StatCategory;
    avgThreePointFieldGoalsMade: StatCategory;
    fieldGoalPct: StatCategory;
    threePointFieldGoalPct: StatCategory;
  };
}
