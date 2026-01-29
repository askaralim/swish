/**
 * Team logo image mapping
 * Maps team abbreviations to local image assets
 */

// Team abbreviation to image mapping
// Only includes teams that have images in assets/images/teams/
const teamImageMap: Record<string, any> = {
  'ATL': require('../../assets/images/teams/atl.png'),
  'BKN': require('../../assets/images/teams/bkn.png'),
  'BOS': require('../../assets/images/teams/bos.png'),
  'CHA': require('../../assets/images/teams/cha.png'),
  'CHI': require('../../assets/images/teams/chi.png'),
  'CLE': require('../../assets/images/teams/cle.png'),
  'DAL': require('../../assets/images/teams/dal.png'),
  'DEN': require('../../assets/images/teams/den.png'),
  'DET': require('../../assets/images/teams/det.png'),
  'GS': require('../../assets/images/teams/gs.png'),
  'GSW': require('../../assets/images/teams/gs.png'), // Golden State Warriors
  'HOU': require('../../assets/images/teams/hou.png'),
  'IND': require('../../assets/images/teams/ind.png'),
  'LAC': require('../../assets/images/teams/lac.png'),
  'LAL': require('../../assets/images/teams/lal.png'),
  'MEM': require('../../assets/images/teams/mem.png'),
  'MIA': require('../../assets/images/teams/mia.png'),
  'MIL': require('../../assets/images/teams/mil.png'),
  'MIN': require('../../assets/images/teams/min.png'),
  'NO': require('../../assets/images/teams/no.png'),
  'NOP': require('../../assets/images/teams/no.png'), // New Orleans Pelicans
  'NY': require('../../assets/images/teams/ny.png'),
  'NYK': require('../../assets/images/teams/ny.png'), // New York Knicks
  'ORL': require('../../assets/images/teams/orl.png'),
  'PHI': require('../../assets/images/teams/phi.png'),
  'PHX': require('../../assets/images/teams/phx.png'),
  'POR': require('../../assets/images/teams/por.png'),
  'SA': require('../../assets/images/teams/sa.png'),
  'SAS': require('../../assets/images/teams/sa.png'), // San Antonio Spurs
  'SAC': require('../../assets/images/teams/sac.png'),
  'TOR': require('../../assets/images/teams/tor.png'),
  'UTAH': require('../../assets/images/teams/utah.png'),
  'WAS': require('../../assets/images/teams/was.png'),
  'WSH': require('../../assets/images/teams/was.png'), // Washington Wizards
  'OKC': require('../../assets/images/teams/okc.png'), // Oklahoma City Thunder
};

/**
 * Get team logo image source
 * @param abbreviation - Team abbreviation (e.g., 'LAL', 'GSW')
 * @returns Image source object for React Native Image component
 */
export function getTeamImage(
  abbreviation: string | null | undefined
): any {
  if (!abbreviation) {
    return null;
  }

  const upperAbbr = abbreviation.toUpperCase();
  const localImage = teamImageMap[upperAbbr];

  if (localImage) {
    return localImage;
  }

  return null;
}

/**
 * Check if team logo exists locally
 */
export function hasLocalTeamImage(abbreviation: string | null | undefined): boolean {
  if (!abbreviation) return false;
  return teamImageMap[abbreviation.toUpperCase()] !== undefined;
}
