export const KnowledgeService = {
  getKnownConcepts: (): string[] => {
    try {
      return JSON.parse(localStorage.getItem('known_concepts') || '[]');
    } catch {
      return [];
    }
  },
  markAsKnown: (concept: string) => {
    try {
      const known = new Set(KnowledgeService.getKnownConcepts());
      known.add(concept);
      localStorage.setItem('known_concepts', JSON.stringify(Array.from(known)));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  },
  markAsUnknown: (concept: string) => {
    try {
      const known = new Set(KnowledgeService.getKnownConcepts());
      known.delete(concept);
      localStorage.setItem('known_concepts', JSON.stringify(Array.from(known)));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }
};
