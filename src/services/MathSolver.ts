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
      // If it's a string, try to wrap it in the expected format
      if (typeof text === 'string' && text.trim().length > 0) {
        return {
          text: text,
          steps: [],
          assumedKnowledge: [],
          practiceProblems: []
        };
      }
      return fallback;
    }
  }

  private static extractPuterResponse(response: any): string {
    if (!response) return "";
    if (typeof response === "string") return response;
    if (response?.message?.content) return response.message.content;
    if (response?.text) return response.text;
    if (response?.choices?.[0]?.message?.content) return response.choices[0].message.content;
    if (response?.choices?.[0]?.text) return response.choices[0].text;
    if (response?.result) return response.result;
    try {
      return JSON.stringify(response);
    } catch (e) {
      return "";
    }
  }

  private static async withTimeout<T>(promise: Promise<T>, timeoutMs: number = 60000): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Puter timeout")), timeoutMs))
    ]);
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
        try {
          const response = await this.withTimeout(puter.ai.chat(`Evaluate if the answer is correct for problem: ${problem}. User Answer: ${answer}. Return JSON with fields: isCorrect (boolean), feedback (string), steps (array of strings).`));
          return this.safeParseJSON(this.extractPuterResponse(response), {});
        } catch (puterError) {
          console.error("Puter fallback failed:", puterError);
          throw puterError;
        }
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
        try {
          let response;
          const prompt = `Analyze this math problem and list the prerequisite concepts needed to solve it: ${text}. Return a JSON array of strings.`;
          if (base64Data && mimeType) {
            const dataUrl = `data:${mimeType};base64,${base64Data}`;
            response = await this.withTimeout(puter.ai.chat(prompt, dataUrl));
          } else {
            response = await this.withTimeout(puter.ai.chat(prompt));
          }
          return this.safeParseJSON(this.extractPuterResponse(response), []);
        } catch (puterError) {
          console.error("Puter fallback failed:", puterError);
          throw puterError;
        }
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
        try {
          const response = await this.withTimeout(puter.ai.chat(`Generate a micro-lesson for the concept: ${concept}, related to the problem: ${problem}. Return JSON with fields: lesson (string), youtubeVideoId (string).`));
          return this.safeParseJSON(this.extractPuterResponse(response), {});
        } catch (puterError) {
          console.error("Puter fallback failed:", puterError);
          throw puterError;
        }
      }
      throw error;
    }
  }

  static async fetchStreamedSolution(problem: string, onChunk: (partial: any) => void, base64Data?: string, mimeType?: string): Promise<MathSolution> {
    try {
      const prompt = `You are an expert math tutor. Your task is to solve the provided math problem step-by-step.
If an image is provided, carefully analyze the handwritten or printed math problem in the image.
Problem text (if any): ${problem}

Return a JSON object with the following fields:
- text (string): A brief summary of the problem and the final answer.
- steps (array of strings): Detailed, step-by-step instructions to solve the problem. Use Unicode for simple exponents (e.g., write x² instead of x^2) and standard text formatting for inline math. Do not use $ signs for inline math.
- assumedKnowledge (array of strings): Key concepts needed to understand the solution.
- practiceProblems (array of strings): 2-3 similar practice problems.

If you cannot read the image or solve the problem, do NOT return a generic error message in the steps array. Instead, provide a helpful explanation in the 'text' field about why you couldn't solve it (e.g., "The image is too blurry to read the equation clearly."), and leave 'steps', 'assumedKnowledge', and 'practiceProblems' as empty arrays.`;
      
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
        try {
          console.log("Attempting Puter fallback...");
          let puterPrompt = `You are an expert math tutor. Your task is to solve the provided math problem step-by-step.
Problem text: ${problem}

Return a JSON object with the following fields:
- text (string): A brief summary of the problem and the final answer.
- steps (array of strings): Detailed, step-by-step instructions to solve the problem. Use Unicode for simple exponents (e.g., write x² instead of x^2) and standard text formatting for inline math. Do not use $ signs for inline math.
- assumedKnowledge (array of strings): Key concepts needed to understand the solution.
- practiceProblems (array of strings): 2-3 similar practice problems.`;

          let response;
          if (base64Data && mimeType) {
            const dataUrl = `data:${mimeType};base64,${base64Data}`;
            response = await this.withTimeout(puter.ai.chat(puterPrompt, dataUrl));
          } else {
            response = await this.withTimeout(puter.ai.chat(puterPrompt));
          }

          const solution = this.safeParseJSON(this.extractPuterResponse(response), {});

          onChunk(solution);
          return solution;
        } catch (puterError) {
          console.error("Puter fallback failed:", puterError);
          throw puterError;
        }
      }
      throw error;
    }
  }
}
