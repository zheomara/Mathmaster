export const LicenseService = {
  TRIAL_LIMIT: 2,
  STORAGE_KEY: 'mathmaster_license',
  USAGE_KEY: 'mathmaster_usage_count',

  isLicensed: (): boolean => {
    try {
      return localStorage.getItem(LicenseService.STORAGE_KEY) === 'MATH-MASTER-2026';
    } catch {
      return false;
    }
  },

  getUsageCount: (): number => {
    try {
      return parseInt(localStorage.getItem(LicenseService.USAGE_KEY) || '0', 10);
    } catch {
      return 0;
    }
  },

  incrementUsage: () => {
    try {
      const count = LicenseService.getUsageCount();
      localStorage.setItem(LicenseService.USAGE_KEY, (count + 1).toString());
    } catch (e) {
      console.warn('Failed to increment usage', e);
    }
  },

  activateLicense: (key: string): boolean => {
    if (key.trim().toUpperCase() === 'MATH-MASTER-2026') {
      localStorage.setItem(LicenseService.STORAGE_KEY, 'MATH-MASTER-2026');
      return true;
    }
    return false;
  },

  hasRemainingTrial: (): boolean => {
    if (LicenseService.isLicensed()) return true;
    return LicenseService.getUsageCount() < LicenseService.TRIAL_LIMIT;
  }
};
