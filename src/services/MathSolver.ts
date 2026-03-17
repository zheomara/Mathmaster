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
  static async evaluatePracticeProblem(problem: string, answer: string): Promise<PracticeEvaluation> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Problem: ${problem}. User Answer: ${answer}. Evaluate if the answer is correct and provide step-by-step feedback. Return JSON with fields: isCorrect (boolean), feedback (string), steps (array of strings).`,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("Gemini failed, trying Puter fallback", error);
      if (typeof puter !== 'undefined' && puter.ai) {
        const response = await puter.ai.chat(`Evaluate if the answer is correct for problem: ${problem}. User Answer: ${answer}. Return JSON with fields: isCorrect (boolean), feedback (string), steps (array of strings).`);
        return JSON.parse(response || "{}");
      }
      throw error;
    }
  }

  static async analyzePrerequisites(text: string, base64Data?: string, mimeType?: string): Promise<string[]> {
    try {
      const contents: any = { text: `Analyze this math problem and list the prerequisite concepts needed to solve it: ${text}` };
      if (base64Data && mimeType) {
        contents.parts = [{ inlineData: { data: base64Data, mimeType } }, { text: contents.text }];
      }
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: contents,
        config: { responseMimeType: "application/json", responseSchema: { type: "ARRAY", items: { type: "STRING" } } }
      });
      return JSON.parse(response.text || "[]");
    } catch (error) {
      console.error("Gemini failed, trying Puter fallback", error);
      if (typeof puter !== 'undefined' && puter.ai) {
        const response = await puter.ai.chat(`Analyze this math problem and list the prerequisite concepts needed to solve it: ${text}. Return a JSON array of strings.`);
        return JSON.parse(response || "[]");
      }
      throw error;
    }
  }

  static async generateMicroLesson(concept: string, problem: string): Promise<{ lesson: string; youtubeVideoId: string }> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a micro-lesson for the concept: ${concept}, related to the problem: ${problem}. Return JSON with fields: lesson (string), youtubeVideoId (string).`,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("Gemini failed, trying Puter fallback", error);
      if (typeof puter !== 'undefined' && puter.ai) {
        const response = await puter.ai.chat(`Generate a micro-lesson for the concept: ${concept}, related to the problem: ${problem}. Return JSON with fields: lesson (string), youtubeVideoId (string).`);
        return JSON.parse(response || "{}");
      }
      throw error;
    }
  }

  static async fetchStreamedSolution(problem: string, onChunk: (partial: any) => void, base64Data?: string, mimeType?: string): Promise<MathSolution> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Solve this problem step-by-step: ${problem}. Return JSON with fields: text (string), steps (array of strings), assumedKnowledge (array of strings), practiceProblems (array of strings).`,
        config: { responseMimeType: "application/json" }
      });
      const solution = JSON.parse(response.text || "{}");
      onChunk(solution);
      return solution;
    } catch (error) {
      console.error("Gemini failed, trying Puter fallback", error);
      if (typeof puter !== 'undefined' && puter.ai) {
        const response = await puter.ai.chat(`Solve this problem step-by-step: ${problem}. Return JSON with fields: text (string), steps (array of strings), assumedKnowledge (array of strings), practiceProblems (array of strings).`);
        const solution = JSON.parse(response || "{}");
        onChunk(solution);
        return solution;
      }
      throw error;
    }
  }
}
