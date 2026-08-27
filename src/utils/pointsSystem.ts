export const POINTS_CONFIG = {
  ATTENDANCE: {
    REGULAR: 1000,
    DERBY: 1500,
    FINAL: 2000,
    AFC: 2500,
  },
  BONUSES: {
    WELCOME: 500,
    EARLY_ARRIVAL: 200,
    MAN_OF_MATCH_VOTE: 100,
    CONSECUTIVE_3: 500,
    SEASON_5: 1000,
    SEASON_10: 2000,
    SEASON_20: 3000,
    NO_ABSENCE_MONTH: 200,
    BIRTHDAY: 500,
    ANNIVERSARY: 300,
    CLUB_WIN: 100,
  },
  INTERACTIONS: {
    REFERRAL: 300,
    PREDICTION: 150,
    COMPLETE_PROFILE: 100,
    SHARE_ACHIEVEMENT: 100,
    RATE_MATCH: 50,
  },
  PARTNER: {
    FIRST_VISIT: 200,
    PER_10_SAR: 50,
    RATE_PARTNER: 50,
  },
  REDEMPTION_TIERS: [
    { name: 'أساسي', nameEn: 'Basic', points: 1000, value: 15, stars: 1 },
    { name: 'مميز', nameEn: 'Premium', points: 2000, value: 30, stars: 2 },
    { name: 'حصري', nameEn: 'Exclusive', points: 5000, value: 75, stars: 3 },
    { name: 'VIP', nameEn: 'VIP', points: 10000, value: 150, stars: 4 },
    { name: 'بلاتينيوم', nameEn: 'Platinum', points: 20000, value: 300, stars: 5 },
  ],
  LEVELS: [
    { name: 'مبتدئ', nameEn: 'Starter', min: 0, max: 499, color: '#6B7280' },
    { name: 'غانم', nameEn: 'Ghanem', min: 500, max: 1999, color: '#00E5A0' },
    { name: 'غانم بلس', nameEn: 'Ghanem+', min: 2000, max: 4999, color: 'rgba(0,229,160,0.7)' },
    { name: 'غانم إليت', nameEn: 'Ghanem Elite', min: 5000, max: Infinity, color: '#F0FDF4' },
  ],
  POINTS_TO_SAR: 0.015,
  MINISTRY_SUPPORT_PER_ATTENDANCE: 5,
};

export function getLevelInfo(totalPoints: number) {
  const level = POINTS_CONFIG.LEVELS.find(
    (l) => totalPoints >= l.min && totalPoints <= l.max
  ) || POINTS_CONFIG.LEVELS[0];

  const currentIndex = POINTS_CONFIG.LEVELS.findIndex((l) => l === level);
  const nextLevel = currentIndex < POINTS_CONFIG.LEVELS.length - 1
    ? POINTS_CONFIG.LEVELS[currentIndex + 1]
    : null;

  const nextPoints = nextLevel ? nextLevel.min - totalPoints : 0;

  return {
    ...level,
    nextLevel: nextLevel?.name || null,
    nextPoints,
  };
}

export function calculateAttendancePoints(
  matchType: 'regular' | 'derby' | 'final' | 'afc',
  earlyArrival: boolean
): number {
  let basePoints = POINTS_CONFIG.ATTENDANCE.REGULAR;

  if (matchType === 'derby') basePoints = POINTS_CONFIG.ATTENDANCE.DERBY;
  else if (matchType === 'final') basePoints = POINTS_CONFIG.ATTENDANCE.FINAL;
  else if (matchType === 'afc') basePoints = POINTS_CONFIG.ATTENDANCE.AFC;

  const earlyBonus = earlyArrival ? POINTS_CONFIG.BONUSES.EARLY_ARRIVAL : 0;

  return basePoints + earlyBonus;
}

export function pointsToSAR(points: number): number {
  return points * POINTS_CONFIG.POINTS_TO_SAR;
}

export function sarToPoints(sar: number): number {
  return Math.round(sar / POINTS_CONFIG.POINTS_TO_SAR);
}

export function getMinistrySupport(): number {
  return POINTS_CONFIG.MINISTRY_SUPPORT_PER_ATTENDANCE;
}

export function calculatePartnerPoints(amountSpent: number): number {
  return Math.floor(amountSpent / 10) * POINTS_CONFIG.PARTNER.PER_10_SAR;
}
