import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

declare const puter: any;

export interface PracticeEvaluation {
  isCorrect: boolean;
  feedback: string;
  steps: string[];
}

export interface MathSolution {
  text: string;
  steps: string[];
  assumedKnowledge?: string[];
  practiceProblems?: string[];
}

export class MathSolver {
  private static safeParseJSON(text: string, fallback: any) {
    if (!text) return fallback;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```(?:json)?\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : text;
      return JSON.parse(jsonString);
    } catch (e) {
      console.warn("Failed to parse JSON response:", text);
      return fallback;
    }
  }

  static async evaluatePracticeProblem(problem: string, answer: string): Promise<PracticeEvaluation> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Problem: ${problem}. User Answer: ${answer}. Evaluate if the answer is correct and provide step-by-step feedback. Return JSON with fields: isCorrect (boolean), feedback (string), steps (array of strings).`,
        config: { responseMimeType: "application/json" }
      });
      return this.safeParseJSON(response.text || "", {});
    } catch (error) {
      console.error("Gemini failed, trying Puter fallback", error);
      if (typeof puter !== 'undefined' && puter.ai) {
        const response = await puter.ai.chat(`Evaluate if the answer is correct for problem: ${problem}. User Answer: ${answer}. Return JSON with fields: isCorrect (boolean), feedback (string), steps (array of strings).`);
        return this.safeParseJSON(response || "", {});
      }
      throw error;
    }
  }

  static async analyzePrerequisites(text: string, base64Data?: string, mimeType?: string): Promise<string[]> {
    try {
      const prompt = `Analyze this math problem and list the prerequisite concepts needed to solve it: ${text}`;
      
      const parts: any[] = [{ text: prompt }];
      if (base64Data && mimeType) {
        parts.unshift({ inlineData: { data: base64Data, mimeType } });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: { parts },
        config: { responseMimeType: "application/json", responseSchema: { type: "ARRAY", items: { type: "STRING" } } }
      });
      return this.safeParseJSON(response.text || "", []);
    } catch (error) {
      console.error("Gemini analyzePrerequisites failed:", error);
      if (typeof puter !== 'undefined' && puter.ai) {
        const response = await puter.ai.chat(`Analyze this math problem and list the prerequisite concepts needed to solve it: ${text}. Return a JSON array of strings.`);
        return this.safeParseJSON(response || "", []);
      }
      throw error;
    }
  }

  static async generateMicroLesson(concept: string, problem: string): Promise<{ lesson: string; youtubeVideoId: string }> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Generate a micro-lesson for the concept: ${concept}, related to the problem: ${problem}. Return JSON with fields: lesson (string), youtubeVideoId (string).`,
        config: { responseMimeType: "application/json" }
      });
      return this.safeParseJSON(response.text || "", {});
    } catch (error) {
      console.error("Gemini generateMicroLesson failed:", error);
      if (typeof puter !== 'undefined' && puter.ai) {
        const response = await puter.ai.chat(`Generate a micro-lesson for the concept: ${concept}, related to the problem: ${problem}. Return JSON with fields: lesson (string), youtubeVideoId (string).`);
        return this.safeParseJSON(response || "", {});
      }
      throw error;
    }
  }

  static async fetchStreamedSolution(problem: string, onChunk: (partial: any) => void, base64Data?: string, mimeType?: string): Promise<MathSolution> {
    try {
      const prompt = `Solve this problem step-by-step: ${problem}. Return JSON with fields: text (string), steps (array of strings), assumedKnowledge (array of strings), practiceProblems (array of strings).`;
      
      const parts: any[] = [{ text: prompt }];
      if (base64Data && mimeType) {
        parts.unshift({ inlineData: { data: base64Data, mimeType } });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: { parts },
        config: { responseMimeType: "application/json" }
      });
      
      if (!response.text) {
        throw new Error("No response text from Gemini");
      }
      
      console.log("Gemini response:", response.text);
      const solution = this.safeParseJSON(response.text, {});
      onChunk(solution);
      return solution;
    } catch (error) {
      console.error("Gemini fetchStreamedSolution failed:", error);
      if (typeof puter !== 'undefined' && puter.ai) {
        // Puter fallback might not support image data easily, but let's keep it as is
        const response = await puter.ai.chat(`Solve this problem step-by-step: ${problem}. Return JSON with fields: text (string), steps (array of strings), assumedKnowledge (array of strings), practiceProblems (array of strings).`);
        const solution = this.safeParseJSON(response || "", {});
        onChunk(solution);
        return solution;
      }
      throw error;
    }
  }
}
