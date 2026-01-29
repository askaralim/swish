/**
 * API Configuration
 */
// API Configuration
// IMPORTANT: For iOS physical device, localhost won't work!
// Use your computer's IP address instead (e.g., http://192.168.1.100:3000)
// Find your IP: macOS: System Preferences > Network, or run: ipconfig getifaddr en0
const API_BASE_URL = __DEV__
  ? 'http://192.168.0.100:3000'  // Works for iOS Simulator only
  : 'https://your-railway-app.up.railway.app';  // Update with your Railway URL

/**
 * Parse API response
 */
async function parseResponse(response: Response) {
  const data = await response.json();

  if (data.success === true) {
    return data.data; // Extract data from wrapper
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
async function apiRequest(endpoint: string, options: RequestInit = {}) {
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

  return await parseResponse(response);
}

/**
 * GET request helper
 */
export async function apiGet(endpoint: string, params: Record<string, any> = {}) {
  const queryString = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined) {
        acc[key] = String(value);
      }
      return acc;
    }, {} as Record<string, string>)
  ).toString();
  
  const url = queryString ? `${endpoint}?${queryString}` : endpoint;
  return apiRequest(url, { method: 'GET' });
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

/**
 * Fetch today's games
 */
export async function fetchGames(date?: Date) {
  const dateParam = date ? formatDateForAPI(date) : formatDateForAPI(getChineseDate());
  return apiGet('/api/v1/nba/games/today', { date: dateParam });
}

/**
 * Fetch team standings
 */
export async function fetchStandings() {
  return apiGet('/api/v1/nba/standings');
}

/**
 * Fetch game detail
 */
export async function fetchGameDetail(gameId: string) {
  return apiGet(`/api/v1/nba/games/${gameId}`);
}

/**
 * Fetch game summary (AI)
 */
export async function fetchGameSummary(gameId: string) {
  return apiGet(`/api/v1/nba/games/${gameId}/summary`);
}

/**
 * Fetch team overview
 */
export async function fetchTeamOverview(teamAbbreviation: string) {
  return apiGet(`/api/v1/nba/teams/${teamAbbreviation}`);
}

/**
 * Fetch team leaders
 */
export async function fetchTeamLeaders(teamAbbreviation: string) {
  return apiGet(`/api/v1/nba/teams/${teamAbbreviation}/leaders`);
}

/**
 * Fetch team recent games
 */
export async function fetchTeamRecentGames(teamAbbreviation: string, params: { seasontype?: number, page?: number, limit?: number } = {}) {
  const { seasontype = 2, page = 1, limit = 20 } = params;
  return apiGet(`/api/v1/nba/teams/${teamAbbreviation}/recent-games`, { seasontype, page, limit });
}

/**
 * Fetch team schedule
 */
export async function fetchTeamSchedule(teamAbbreviation: string, params: { seasontype?: number, page?: number, limit?: number } = {}) {
  const { seasontype = 2, page = 1, limit = 20 } = params;
  return apiGet(`/api/v1/nba/teams/${teamAbbreviation}/schedule`, { seasontype, page, limit });
}

// --- Player Endpoints ---

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
