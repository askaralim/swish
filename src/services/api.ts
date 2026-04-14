import { CURRENT_SEASON } from '../constants/season';

/**
 * API Configuration (single source of truth for REST base URL)
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? 'http://192.168.0.101:3000' : 'https://nba-stats-api-production.up.railway.app');

/**
 * Parse API response
 */
async function parseResponse(response: Response) {
  const data = await response.json();

  if (data.success === true) {
    return data.data; 
  }

  if (data.success === false && data.error) {
    throw new Error(data.error.message || 'API error');
  }

  // Fallback for legacy responses
  if (data.success === undefined) {
    return data;
  }

  throw new Error('Invalid API response format');
}

/**
 * Make API request
 */
async function apiRequest(endpoint: string, options: RequestInit = {}, returnFullResponse: boolean = false) {
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Too many requests, please try again later');
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  if (returnFullResponse) {
    const data = await response.json();
    if (data.success === false && data.error) {
      throw new Error(data.error.message || 'API error');
    }
    return data;
  }

  return await parseResponse(response);
}

/**
 * GET request helper
 */
export async function apiGet(endpoint: string, params: Record<string, any> = {}, returnFullResponse: boolean = false) {
  const queryString = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined) {
        acc[key] = String(value);
      }
      return acc;
    }, {} as Record<string, string>)
  ).toString();
  
  const url = queryString ? `${endpoint}?${queryString}` : endpoint;
  return apiRequest(url, { method: 'GET' }, returnFullResponse);
}

/**
 * Format date for API (YYYYMMDD)
 */
export function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const chineseDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const chineseMidnight = new Date(`${chineseDateStr}T00:00:00+08:00`);
  
  const usEasternDateStr = chineseMidnight.toLocaleString('en-CA', { 
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const [usYear, usMonth, usDay] = usEasternDateStr.split('-');
  return `${usYear}${String(usMonth).padStart(2, '0')}${String(usDay).padStart(2, '0')}`;
}

/**
 * Get current date in Chinese timezone
 */
export function getChineseDate(): Date {
  const now = new Date();
  const chineseDateStr = now.toLocaleString('en-CA', { timeZone: 'Asia/Shanghai' }).split(',')[0];
  const [year, month, day] = chineseDateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// --- API Endpoints ---

export type AppConfig = {
  showPlayerHeadshots: boolean;
};

/** Remote feature flags (cached on home via React Query). */
export async function fetchAppConfig(): Promise<AppConfig> {
  const data = (await apiGet('/api/v1/app/config')) as { showPlayerHeadshots?: boolean };
  return { showPlayerHeadshots: data?.showPlayerHeadshots === true };
}

export async function fetchTodayTopPerformers(date: Date) {
  const dateParam = formatDateForAPI(date);
  return apiGet('/api/v1/nba/todayTopPerformers', { date: dateParam });
}

export async function fetchSeasonLeaders() {
  return apiGet('/api/v1/nba/seasonLeaders');
}

export async function fetchGames(date?: Date, featured: boolean = false) {
  const dateParam = date ? formatDateForAPI(date) : formatDateForAPI(getChineseDate());
  const params: Record<string, any> = { date: dateParam };
  if (featured) {
    params.featured = 'true';
  }
  return apiGet('/api/v1/nba/games/today', params);
}

export async function fetchStandings() {
  return apiGet('/api/v1/nba/standings');
}

export async function fetchGameDetail(gameId: string) {
  return apiGet(`/api/v1/nba/games/${gameId}`);
}

export async function fetchGameSummary(gameId: string) {
  return apiGet(`/api/v1/nba/games/${gameId}/summary`);
}

export async function fetchTeamOverview(teamAbbreviation: string) {
  return apiGet(`/api/v1/nba/teams/${teamAbbreviation}`);
}

export async function fetchTeamLeaders(teamAbbreviation: string) {
  return apiGet(`/api/v1/nba/teams/${teamAbbreviation}/leaders`);
}

export async function fetchTeamRecentGames(teamAbbreviation: string, params: { seasontype?: number, page?: number, limit?: number } = {}) {
  const { seasontype = 2, page = 1, limit = 20 } = params;
  return apiGet(`/api/v1/nba/teams/${teamAbbreviation}/recent-games`, { seasontype, page, limit });
}

export async function fetchTeamSchedule(teamAbbreviation: string, params: { seasontype?: number, page?: number, limit?: number } = {}) {
  const { seasontype = 2, page = 1, limit = 20 } = params;
  return apiGet(`/api/v1/nba/teams/${teamAbbreviation}/schedule`, { seasontype, page, limit }, true);
}

export async function fetchPlayerDetails(playerId: string) {
  return apiGet(`/api/v1/nba/players/${playerId}`);
}

export async function fetchPlayerBio(playerId: string) {
  return apiGet(`/api/v1/nba/players/${playerId}/bio`);
}

export async function fetchPlayerCurrentStats(playerId: string) {
  return apiGet(`/api/v1/nba/players/${playerId}/stats/current`);
}

export async function fetchPlayerRegularStats(playerId: string) {
  return apiGet(`/api/v1/nba/players/${playerId}/stats`);
}

export async function fetchPlayerAdvancedStats(playerId: string) {
  return apiGet(`/api/v1/nba/players/${playerId}/stats/advanced`);
}

export async function fetchPlayerGameLog(playerId: string) {
  return apiGet(`/api/v1/nba/players/${playerId}/gamelog`);
}

export async function fetchPlayerStats(params: {
  season?: string;
  position?: string;
  conference?: string;
  page?: number;
  limit?: number;
  sort?: string;
} = {}) {
  const {
    season = CURRENT_SEASON,
    position = 'all-positions',
    conference = '0',
    page = 1,
    limit = 100, 
    sort = 'offensive.avgPoints:desc'
  } = params;
  
  return apiGet('/api/v1/nba/stats/players', {
    season,
    position,
    conference,
    page,
    limit,
    sort
  });
}

/**
 * Fetch translated NBA news articles (v2 API)
 */
export async function fetchTranslatedNews(params: {
  page?: number;
  limit?: number;
  sort?: string;
} = {}) {
  const { page = 1, limit = 20, sort = 'published_at:desc' } = params;
  return apiGet('/api/v2/nba/translated-news', { page, limit, sort }, true);
}

export async function fetchTranslatedNewsDetail(articleId: string) {
  return apiGet(`/api/v2/nba/translated-news/${articleId}`);
}

export async function fetchTeams() {
  return apiGet('/api/v1/nba/teams');
}

export async function fetchPlayersByTeam(teamAbbreviation: string) {
  return apiGet(`/api/v1/nba/teams/${teamAbbreviation}/roster`);
}
