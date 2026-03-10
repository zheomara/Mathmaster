export interface UserStats {
  lastActiveDate: string | null;
  currentStreak: number;
  maxStreak: number;
  problemsSolved: number;
  badges: string[];
}

export const BADGES = {
  FIRST_PROBLEM: { id: 'first_problem', name: 'First Step', description: 'Solved your first problem', icon: '🎯' },
  TEN_PROBLEMS: { id: 'ten_problems', name: 'Getting the Hang of It', description: 'Solved 10 problems', icon: '🌟' },
  MATH_WHIZ: { id: 'math_whiz', name: 'Math Whiz', description: 'Solved 25 problems', icon: '🧠' },
  STREAK_3: { id: 'streak_3', name: 'On Fire', description: '3 day streak', icon: '🔥' },
  STREAK_7: { id: 'streak_7', name: 'Unstoppable', description: '7 day streak', icon: '⚡' },
};

export class GamificationService {
  private static STORAGE_KEY = 'mathmaster_stats';

  static getStats(): UserStats {
    const defaultStats: UserStats = {
      lastActiveDate: null,
      currentStreak: 0,
      maxStreak: 0,
      problemsSolved: 0,
      badges: [],
    };
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return { ...defaultStats, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Error reading stats', e);
    }
    return defaultStats;
  }

  private static saveStats(stats: UserStats) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stats));
  }

  static getTodayString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  static recordActivity() {
    const stats = this.getStats();
    const today = this.getTodayString();

    if (stats.lastActiveDate !== today) {
      if (stats.lastActiveDate) {
        const lastDate = new Date(stats.lastActiveDate);
        const currentDate = new Date(today);
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          stats.currentStreak += 1;
        } else if (diffDays > 1) {
          stats.currentStreak = 1;
        }
      } else {
        stats.currentStreak = 1;
      }

      stats.lastActiveDate = today;
      if (stats.currentStreak > stats.maxStreak) {
        stats.maxStreak = stats.currentStreak;
      }

      this.checkBadges(stats);
      this.saveStats(stats);
    }
  }

  static recordProblemSolved(): { newBadges: string[] } {
    this.recordActivity();
    const stats = this.getStats();
    stats.problemsSolved += 1;
    
    const newBadges = this.checkBadges(stats);
    this.saveStats(stats);
    return { newBadges };
  }

  private static checkBadges(stats: UserStats): string[] {
    const newBadges: string[] = [];
    const addBadge = (badgeId: string) => {
      if (!stats.badges.includes(badgeId)) {
        stats.badges.push(badgeId);
        newBadges.push(badgeId);
      }
    };

    if (stats.problemsSolved >= 1) addBadge(BADGES.FIRST_PROBLEM.id);
    if (stats.problemsSolved >= 10) addBadge(BADGES.TEN_PROBLEMS.id);
    if (stats.problemsSolved >= 25) addBadge(BADGES.MATH_WHIZ.id);
    if (stats.currentStreak >= 3) addBadge(BADGES.STREAK_3.id);
    if (stats.currentStreak >= 7) addBadge(BADGES.STREAK_7.id);

    return newBadges;
  }
}
