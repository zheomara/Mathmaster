import { GoogleGenAI, Type } from "@google/genai";
import { parse as parsePartialJson } from "best-effort-json-parser";

declare const puter: any;

// Lazily initialize the Gemini API client
let ai: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export interface MathSolution {
  assumedKnowledge: string[];
  steps: string[];
  practiceProblems: string[];
}

export interface PracticeEvaluation {
  isCorrect: boolean;
  feedback: string;
  steps: string[];
}

/**
 * Normalizes the response from either Gemini or Puter into the strict MathSolution interface.
 */
function normalizeMathSolution(rawResponse: any): MathSolution {
  // If it's already a string, try to parse it
  let data = rawResponse;
  if (typeof rawResponse === 'string') {
    try {
      // Sometimes LLMs wrap JSON in markdown blocks
      const jsonMatch = rawResponse.match(/```json\n([\s\S]*?)\n```/) || rawResponse.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : rawResponse;
      data = JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse response as JSON:", rawResponse);
      return {
        assumedKnowledge: [],
        steps: ["Could not understand the response format from the AI."],
        practiceProblems: []
      };
    }
  }

  return {
    assumedKnowledge: Array.isArray(data?.assumedKnowledge) ? data.assumedKnowledge : [],
    steps: Array.isArray(data?.steps) ? data.steps : ["No steps provided."],
    practiceProblems: Array.isArray(data?.practiceProblems) ? data.practiceProblems : []
  };
}

function isRateLimitOrUnavailable(error: any): boolean {
  const msg = error?.message || '';
  const status = error?.status;
  return (
    status === 429 || 
    status === 503 || 
    msg.includes('429') || 
    msg.includes('503') ||
    msg.includes('Rate Limit Exceeded') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('Service Unavailable') ||
    msg.includes('API key') ||
    msg.includes('api_key') ||
    msg.includes('API_KEY')
  );
}

export class GeminiMathSolver {
  /**
   * Fetches a math solution, attempting Gemini.
   */
  static async fetchMathSolution(userPrompt: string, imageBase64?: string, mimeType?: string): Promise<MathSolution> {
    const systemPrompt = "You are an expert math tutor. Solve the math problem provided. First, provide the 'assumedKnowledge' (prerequisite concepts, formulas, or theorems needed to understand the solution). Then, provide a detailed, 'steps' array. Explain everything using very simple English that a 5th grader (10-year-old) would easily understand. Avoid overly complex academic jargon where possible, and explain concepts simply. Finally, provide 3 similar 'practiceProblems' for the user to try. Use LaTeX for all math expressions, wrapping inline math in single $ and block math in double $$. IMPORTANT: You MUST return ONLY a valid JSON object matching this schema: { \"assumedKnowledge\": [\"string\"], \"steps\": [\"string\"], \"practiceProblems\": [\"string\"] }";

    try {
      // --- PRIMARY ATTEMPT: Google Gemini ---
      const parts: any[] = [];
      if (imageBase64 && mimeType) {
        parts.push({
          inlineData: {
            data: imageBase64,
            mimeType: mimeType
          }
        });
      }
      parts.push({ text: `${systemPrompt}\n\nProblem: ${userPrompt}` });

      const response = await getGeminiClient().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              assumedKnowledge: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of prerequisite concepts, formulas, or theorems needed."
              },
              steps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Step-by-step solution to the problem."
              },
              practiceProblems: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of 3 similar practice problems for the user to try."
              }
            },
            required: ["assumedKnowledge", "steps", "practiceProblems"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from Gemini");
      
      return normalizeMathSolution(text);

    } catch (error: any) {
      // If it's a rate limit or unavailable error, provide a clear message
      if (isRateLimitOrUnavailable(error)) {
        // --- SECONDARY ATTEMPT: Puter.js (Safe Fallback) ---
        const puterResult = await GeminiMathSolver.fetchPuterFallback(userPrompt, imageBase64);
        if (puterResult) return puterResult;

        return { 
          assumedKnowledge: [], 
          steps: ["The AI service is currently busy or unavailable. Please check your internet connection and try again in a few moments."], 
          practiceProblems: [] 
        };
      }

      // If it's a different kind of error from Gemini, log it and return a generic error solution
      console.error("Gemini API Error:", error);
      return { assumedKnowledge: [], steps: ["An error occurred while solving the problem. Please try again."], practiceProblems: [] };
    }
  }

  static async fetchStreamedSolution(
    userPrompt: string, 
    onChunk: (partialSolution: Partial<MathSolution>) => void,
    imageBase64?: string, 
    mimeType?: string
  ): Promise<MathSolution> {
    const systemPrompt = "You are an expert math tutor. Solve the math problem provided. First, provide the 'assumedKnowledge' (prerequisite concepts, formulas, or theorems needed to understand the solution). Then, provide a detailed, 'steps' array. Explain everything using very simple English that a 5th grader (10-year-old) would easily understand. Avoid overly complex academic jargon where possible, and explain concepts simply. Finally, provide 3 similar 'practiceProblems' for the user to try. Use LaTeX for all math expressions, wrapping inline math in single $ and block math in double $$. IMPORTANT: You MUST return ONLY a valid JSON object matching this schema: { \"assumedKnowledge\": [\"string\"], \"steps\": [\"string\"], \"practiceProblems\": [\"string\"] }";

    try {
      const parts: any[] = [];
      if (imageBase64 && mimeType) {
        parts.push({
          inlineData: {
            data: imageBase64,
            mimeType: mimeType
          }
        });
      }
      parts.push({ text: `${systemPrompt}\n\nProblem: ${userPrompt}` });

      const responseStream = await getGeminiClient().models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              assumedKnowledge: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of prerequisite concepts, formulas, or theorems needed."
              },
              steps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Step-by-step solution to the problem."
              },
              practiceProblems: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of 3 similar practice problems for the user to try."
              }
            },
            required: ["assumedKnowledge", "steps", "practiceProblems"]
          }
        }
      });

      let fullText = "";
      let lastUpdateTime = 0;
      const THROTTLE_MS = 60; // ~16fps update rate for streaming

      for await (const chunk of responseStream) {
        fullText += chunk.text;
        
        const now = Date.now();
        if (now - lastUpdateTime > THROTTLE_MS) {
          try {
            const partialData = parsePartialJson(fullText);
            onChunk({
              assumedKnowledge: Array.isArray(partialData?.assumedKnowledge) ? partialData.assumedKnowledge : [],
              steps: Array.isArray(partialData?.steps) ? partialData.steps : [],
              practiceProblems: Array.isArray(partialData?.practiceProblems) ? partialData.practiceProblems : []
            });
            lastUpdateTime = now;
          } catch (e) {
            // Ignore parsing errors for intermediate chunks
          }
        }
      }

      return normalizeMathSolution(fullText);

    } catch (error: any) {
      console.error("Gemini Streaming API Error:", error);
      // Fallback to non-streaming if stream fails
      return this.fetchMathSolution(userPrompt, imageBase64, mimeType);
    }
  }

  static async analyzePrerequisites(userPrompt: string, imageBase64?: string, mimeType?: string): Promise<string[]> {
    const systemPrompt = "Analyze the following math problem and list 3 to 5 foundational concepts required to solve it. Return ONLY a valid JSON array of strings. Example: [\"Understanding Variables\", \"Factoring Quadratics\"]";
    try {
      const parts: any[] = [];
      if (imageBase64 && mimeType) {
        parts.push({ inlineData: { data: imageBase64, mimeType } });
      }
      parts.push({ text: `${systemPrompt}\n\nProblem: ${userPrompt}` });

      const response = await getGeminiClient().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of prerequisite concepts."
          }
        }
      });
      const text = response.text;
      if (!text) return [];
      return JSON.parse(text);
    } catch (e: any) {
      console.error("Failed to analyze prerequisites", e);
      return [];
    }
  }

  static async generateMicroLesson(concept: string, problemText: string): Promise<{ lesson: string, youtubeVideoId: string }> {
    const systemPrompt = `You are an expert math tutor. A student needs to understand the concept of "${concept}" before they can solve the problem: "${problemText}". Provide a very short, focused micro-lesson (max 2 paragraphs) explaining this concept simply to a 5th grader. Use LaTeX for math, wrapping inline math in single $ and block math in double $$. Also, find a highly relevant educational YouTube video ID for this concept (e.g., from Khan Academy, Math Antics, etc.). Return a JSON object with "lesson" and "youtubeVideoId" (if found, else empty string).`;
    
    try {
      const response = await getGeminiClient().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: systemPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lesson: { type: Type.STRING },
              youtubeVideoId: { type: Type.STRING }
            },
            required: ["lesson", "youtubeVideoId"]
          },
          tools: [{ googleSearch: {} }]
        }
      });
      const text = response.text;
      if (!text) return { lesson: "", youtubeVideoId: "" };
      const parsed = JSON.parse(text);
      
      // Clean up youtube video ID if it's a full URL
      let videoId = parsed.youtubeVideoId || "";
      if (videoId.includes("youtube.com/watch?v=")) {
        videoId = videoId.split("v=")[1].split("&")[0];
      } else if (videoId.includes("youtu.be/")) {
        videoId = videoId.split("youtu.be/")[1].split("?")[0];
      }
      
      return { lesson: parsed.lesson, youtubeVideoId: videoId };
    } catch (e: any) {
      console.error("Failed to generate micro lesson", e);
      return { lesson: `Here is a quick overview of ${concept}.`, youtubeVideoId: "" };
    }
  }

  static async solveFromImage(base64Data: string, mimeType: string): Promise<MathSolution> {
      return this.fetchMathSolution("Solve the math problem shown in the image.", base64Data, mimeType);
  }

  static async solveFromText(problemText: string): Promise<MathSolution> {
      return this.fetchMathSolution(problemText);
  }

  /**
   * Safe Puter.js fallback that avoids redirects by checking authentication status.
   */
  private static async fetchPuterFallback(prompt: string, image?: string): Promise<MathSolution | null> {
    if (typeof puter === 'undefined') return null;

    try {
      // CRITICAL: Check if signed in to avoid the top-level redirect that gets users "stuck"
      const isSigned = await puter.auth.isSignedIn();
      if (!isSigned) {
        console.warn("Puter.js is not signed in. Skipping fallback to avoid redirect.");
        return null;
      }

      // Use a timeout to ensure we don't wait forever
      return await new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(null), 15000); // 15s timeout

        const puterPrompt = `You are an expert math tutor. Solve the math problem provided. First, provide the 'assumedKnowledge' (prerequisite concepts, formulas, or theorems needed to understand the solution). Then, provide a detailed, 'steps' array. Explain everything using very simple English that a 5th grader (10-year-old) would easily understand. Avoid overly complex academic jargon where possible, and explain concepts simply. Finally, provide 3 similar 'practiceProblems' for the user to try. Use LaTeX for all math expressions, wrapping inline math in single $ and block math in double $$. IMPORTANT: You MUST return ONLY a valid JSON object matching this schema: { \"assumedKnowledge\": [\"string\"], \"steps\": [\"string\"], \"practiceProblems\": [\"string\"] }\n\nProblem: ${prompt}`;

        puter.ai.chat(puterPrompt, image)
          .then((res: any) => {
            clearTimeout(timeout);
            const text = typeof res === 'string' ? res : res?.message?.content || res?.message || JSON.stringify(res);
            resolve(normalizeMathSolution(text));
          })
          .catch((err: any) => {
            console.error("Puter.js error:", err);
            clearTimeout(timeout);
            resolve(null);
          });
      });
    } catch (e) {
      console.error("Error checking Puter auth status:", e);
      return null;
    }
  }

  static async evaluatePracticeProblem(problemText: string, userAnswer: string): Promise<PracticeEvaluation> {
    const systemPrompt = `You are an expert math tutor. A student is trying to solve this practice problem: "${problemText}". The student's answer is: "${userAnswer}". 
              First, determine if the student's answer is correct.
              Second, provide a brief, encouraging feedback message.
              Third, provide a detailed, step-by-step solution to the problem using simple English suitable for a 5th grader.
              Use LaTeX for all math expressions, wrapping inline math in single $ and block math in double $$.`;
    try {
      const response = await getGeminiClient().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            {
              text: systemPrompt
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isCorrect: {
                type: Type.BOOLEAN,
                description: "True if the student's answer is correct, false otherwise."
              },
              feedback: {
                type: Type.STRING,
                description: "A brief, encouraging feedback message."
              },
              steps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Step-by-step solution to the problem."
              }
            },
            required: ["isCorrect", "feedback", "steps"]
          }
        }
      });

      const text = response.text;
      if (!text) return { isCorrect: false, feedback: "Could not evaluate the answer.", steps: [] };
      return JSON.parse(text);
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      return { isCorrect: false, feedback: "An error occurred while evaluating the answer. Please try again.", steps: [] };
    }
  }
}
