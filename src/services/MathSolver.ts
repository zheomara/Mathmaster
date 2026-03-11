import { parse as parsePartialJson } from "best-effort-json-parser";
import { GoogleGenAI } from "@google/genai";
import { Capacitor } from "@capacitor/core";

declare const puter: any;

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
 * Normalizes the response from Puter into the strict MathSolution interface.
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

function getGeminiKey(): string {
  // Defined in `vite.config.ts` via `define: { 'process.env.GEMINI_API_KEY': ... }`
  const key = (process.env as any)?.GEMINI_API_KEY;
  return typeof key === "string" ? key : "";
}

function getSolverApiBase(): string {
  const base = (import.meta as any)?.env?.VITE_SOLVER_API_BASE;
  return typeof base === "string" ? base.replace(/\/+$/, "") : "";
}

async function callSolverApi(
  fullPrompt: string,
  imageBase64?: string,
  mimeType?: string
): Promise<MathSolution> {
  const base = getSolverApiBase();
  if (!base) {
    throw new Error("Missing VITE_SOLVER_API_BASE (required on mobile).");
  }

  const res = await fetch(`${base}/api/solve`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt: fullPrompt, imageBase64, mimeType }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "The AI service is currently busy or unavailable.");
  }

  return normalizeMathSolution(data?.solution);
}

async function geminiJson(prompt: string, imageBase64?: string, mimeType?: string): Promise<any> {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const parts: any[] = [{ text: prompt }];
  if (imageBase64 && mimeType) {
    parts.push({
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    });
  }

  const res = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts }],
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = res.text ?? "";
  if (!text) throw new Error("Empty response from Gemini.");

  try {
    return JSON.parse(text);
  } catch {
    // Gemini can still occasionally return almost-JSON; best-effort parse.
    return parsePartialJson(text);
  }
}

export class MathSolver {
  /**
   * Fetches a math solution using Puter.js.
   */
  static async fetchMathSolution(userPrompt: string, imageBase64?: string, mimeType?: string): Promise<MathSolution> {
    const systemPrompt = "You are an expert math tutor. Solve the math problem provided. First, provide the 'assumedKnowledge' (prerequisite concepts, formulas, or theorems needed to understand the solution). Then, provide a detailed, 'steps' array. Explain everything using very simple English that a 5th grader (10-year-old) would easily understand. Avoid overly complex academic jargon where possible, and explain concepts simply. Finally, provide 3 similar 'practiceProblems' for the user to try. Use LaTeX for all math expressions, wrapping inline math in single $ and block math in double $$. IMPORTANT: You MUST return ONLY a valid JSON object matching this schema: { \"assumedKnowledge\": [\"string\"], \"steps\": [\"string\"], \"practiceProblems\": [\"string\"] }";

    try {
      const fullPrompt = `${systemPrompt}\n\nProblem: ${userPrompt}`;

      // Native builds must use a real HTTPS origin; server-side can do Gemini + Puter fallback safely.
      if (Capacitor.isNativePlatform()) {
        return await callSolverApi(fullPrompt, imageBase64, mimeType);
      }

      // If a server endpoint is configured, prefer it even on web (keeps fallback behavior consistent).
      if (getSolverApiBase()) {
        return await callSolverApi(fullPrompt, imageBase64, mimeType);
      }

      // Prefer Gemini when configured (works in native without Puter auth redirects).
      const geminiKey = getGeminiKey();
      if (geminiKey) {
        const json = await geminiJson(fullPrompt, imageBase64, mimeType);
        return normalizeMathSolution(json);
      }

      if (typeof puter === "undefined") {
        throw new Error("AI provider unavailable. Please try again later.");
      }

      // Only use Puter if already signed in; otherwise it may navigate to puter.com and trap the user.
      const signedIn = await puter.auth?.isSignedIn?.().catch(() => false);
      if (!signedIn) {
        throw new Error("Backup Solver not connected. Open Profile → Connect Backup Solver, or configure GEMINI_API_KEY.");
      }

      const res = await puter.ai.chat(fullPrompt, imageBase64);
      const text = typeof res === "string" ? res : res?.message?.content || res?.message || JSON.stringify(res);
      return normalizeMathSolution(text);
    } catch (error: any) {
      console.error("Puter AI Error:", error);
      throw new Error(error?.message || "An error occurred while solving the problem. Please try again.");
    }
  }

  static async fetchStreamedSolution(
    userPrompt: string, 
    onChunk: (partialSolution: Partial<MathSolution>) => void,
    imageBase64?: string, 
    mimeType?: string
  ): Promise<MathSolution> {
    // Puter.js doesn't seem to support streaming, so we fallback to non-streaming
    return this.fetchMathSolution(userPrompt, imageBase64, mimeType);
  }

  static async analyzePrerequisites(userPrompt: string, imageBase64?: string, mimeType?: string): Promise<string[]> {
    const systemPrompt = "Analyze the following math problem and list 3 to 5 foundational concepts required to solve it. Return ONLY a valid JSON array of strings. Example: [\"Understanding Variables\", \"Factoring Quadratics\"]";
    try {
      const fullPrompt = `${systemPrompt}\n\nProblem: ${userPrompt}`;

      const geminiKey = getGeminiKey();
      if (geminiKey) {
        const json = await geminiJson(fullPrompt, imageBase64, mimeType);
        return Array.isArray(json) ? json : [];
      }

      if (Capacitor.isNativePlatform()) return [];
      if (typeof puter === "undefined") return [];

      const signedIn = await puter.auth?.isSignedIn?.().catch(() => false);
      if (!signedIn) return [];

      const res = await puter.ai.chat(fullPrompt, imageBase64);
      const text = typeof res === "string" ? res : res?.message?.content || res?.message || JSON.stringify(res);
      return JSON.parse(text);
    } catch (e: any) {
      console.error("Failed to analyze prerequisites", e);
      return [];
    }
  }

  static async generateMicroLesson(concept: string, problemText: string): Promise<{ lesson: string, youtubeVideoId: string }> {
    const systemPrompt = `You are an expert math tutor. A student needs to understand the concept of "${concept}" before they can solve the problem: "${problemText}". Provide a very short, focused micro-lesson (max 2 paragraphs) explaining this concept simply to a 5th grader. Use LaTeX for math, wrapping inline math in single $ and block math in double $$. Also, find a highly relevant educational YouTube video ID for this concept (e.g., from Khan Academy, Math Antics, etc.). Return a JSON object with "lesson" and "youtubeVideoId" (if found, else empty string).`;
    
    try {
      const geminiKey = getGeminiKey();
      const parsed = geminiKey
        ? await geminiJson(systemPrompt)
        : await (async () => {
            if (Capacitor.isNativePlatform()) throw new Error("AI is not configured for mobile.");
            if (typeof puter === "undefined") throw new Error("AI provider unavailable.");
            const signedIn = await puter.auth?.isSignedIn?.().catch(() => false);
            if (!signedIn) throw new Error("Backup Solver not connected.");
            const res = await puter.ai.chat(systemPrompt);
            const text = typeof res === "string" ? res : res?.message?.content || res?.message || JSON.stringify(res);
            return JSON.parse(text);
          })();
      
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

  static async evaluatePracticeProblem(problemText: string, userAnswer: string): Promise<PracticeEvaluation> {
    const systemPrompt = `You are an expert math tutor. A student is trying to solve this practice problem: "${problemText}". The student's answer is: "${userAnswer}". 
              First, determine if the student's answer is correct.
              Second, provide a brief, encouraging feedback message.
              Third, provide a detailed, step-by-step solution to the problem using simple English suitable for a 5th grader.
              Use LaTeX for all math expressions, wrapping inline math in single $ and block math in double $$.`;
    try {
      const geminiKey = getGeminiKey();
      if (geminiKey) {
        const json = await geminiJson(systemPrompt);
        return json as PracticeEvaluation;
      }

      if (Capacitor.isNativePlatform()) {
        throw new Error("AI is not configured for mobile.");
      }
      if (typeof puter === "undefined") {
        throw new Error("AI provider unavailable.");
      }
      const signedIn = await puter.auth?.isSignedIn?.().catch(() => false);
      if (!signedIn) {
        throw new Error("Backup Solver not connected.");
      }

      const res = await puter.ai.chat(systemPrompt);
      const text = typeof res === "string" ? res : res?.message?.content || res?.message || JSON.stringify(res);
      return JSON.parse(text);
    } catch (error: any) {
      console.error("Puter AI Error:", error);
      throw new Error(error?.message || "An error occurred while evaluating the answer. Please try again.");
    }
  }
}
