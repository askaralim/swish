// app/config/playerStats.ts
import { PlayerStatsResponse } from '../types/player';

export interface StatSectionConfig {
  statName: keyof PlayerStatsResponse['topPlayersByStat'];
  title: string;
  icon: string;
  color: string; // Gradient colors for iOS
  description: string;
}

export const STAT_SECTIONS: StatSectionConfig[] = [
  {
    statName: 'avgPoints',
    title: '得分',
    icon: '🏀',
    color: '#EF4444', // red-500
    description: 'Points Per Game'
  },
  {
    statName: 'avgAssists',
    title: '助攻',
    icon: '🎯',
    color: '#3B82F6', // blue-500
    description: 'Assists Per Game'
  },
  {
    statName: 'avgRebounds',
    title: '篮板',
    icon: '📊',
    color: '#10B981', // green-500
    description: 'Rebounds Per Game'
  },
  {
    statName: 'avgSteals',
    title: '抢断',
    icon: '⚡',
    color: '#F59E0B', // yellow-500
    description: 'Steals Per Game'
  },
  {
    statName: 'avgBlocks',
    title: '盖帽',
    icon: '🛡️',
    color: '#8B5CF6', // purple-500
    description: 'Blocks Per Game'
  },
  {
    statName: 'doubleDouble',
    title: '两双',
    icon: '⭐',
    color: '#F59E0B', // amber-500
    description: 'Double Double'
  },
  {
    statName: 'tripleDouble',
    title: '三双',
    icon: '💎',
    color: '#F43F5E', // rose-500
    description: 'Triple Double'
  },
  {
    statName: 'avgThreePointFieldGoalsMade',
    title: '三分命中',
    icon: '🎪',
    color: '#14B8A6', // teal-500
    description: 'Average 3-Point Field Goals Made'
  },
  {
    statName: 'fieldGoalPct',
    title: '投篮%',
    icon: '🎨',
    color: '#8B5CF6', // violet-500
    description: 'Field Goal Percentage'
  },
  {
    statName: 'threePointFieldGoalPct',
    title: '三分%',
    icon: '🌈',
    color: '#0EA5E9', // sky-500
    description: '3-Point Field Goal Percentage'
  }
];
