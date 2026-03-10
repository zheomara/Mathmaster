async function hashString(str: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export const CacheService = {
  async get(key: string): Promise<any | null> {
    try {
      const hashedKey = await hashString(key);
      const cached = localStorage.getItem(`math_cache_${hashedKey}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Cache get error:', e);
    }
    return null;
  },
  
  async set(key: string, value: any): Promise<void> {
    try {
      const hashedKey = await hashString(key);
      localStorage.setItem(`math_cache_${hashedKey}`, JSON.stringify(value));
    } catch (e) {
      console.warn('Cache set error:', e);
    }
  }
};
