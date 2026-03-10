import { useState, useCallback } from 'react';
import { GeminiMathSolver, MathSolution } from '../services/GeminiMathSolver';
import { CacheService } from '../services/CacheService';

export function useMathStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [partialSolution, setPartialSolution] = useState<Partial<MathSolution> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startStream = useCallback(async (prompt: string, imageBase64?: string, mimeType?: string) => {
    setIsStreaming(true);
    setPartialSolution(null);
    setError(null);

    // Generate cache key
    const cacheKey = imageBase64 ? `img_${imageBase64.substring(0, 100)}` : `txt_${prompt}`;

    try {
      // Check cache first
      const cachedSolution = await CacheService.get(cacheKey);
      if (cachedSolution) {
        setPartialSolution(cachedSolution);
        setIsStreaming(false);
        return cachedSolution;
      }

      const finalSolution = await GeminiMathSolver.fetchStreamedSolution(
        prompt,
        (partial) => {
          setPartialSolution(partial);
        },
        imageBase64,
        mimeType
      );
      
      // Once done, set the final solution to ensure it's complete
      setPartialSolution(finalSolution);
      
      // Save to cache when complete
      if (finalSolution) {
        await CacheService.set(cacheKey, finalSolution);
      }
      
      return finalSolution;
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching the solution.');
      return null;
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return {
    isStreaming,
    partialSolution,
    error,
    startStream
  };
}
