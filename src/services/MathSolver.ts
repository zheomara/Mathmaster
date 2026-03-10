import { parse as parsePartialJson } from "best-effort-json-parser";

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

export class MathSolver {
  /**
   * Fetches a math solution using Puter.js.
   */
  static async fetchMathSolution(userPrompt: string, imageBase64?: string, mimeType?: string): Promise<MathSolution> {
    const systemPrompt = "You are an expert math tutor. Solve the math problem provided. First, provide the 'assumedKnowledge' (prerequisite concepts, formulas, or theorems needed to understand the solution). Then, provide a detailed, 'steps' array. Explain everything using very simple English that a 5th grader (10-year-old) would easily understand. Avoid overly complex academic jargon where possible, and explain concepts simply. Finally, provide 3 similar 'practiceProblems' for the user to try. Use LaTeX for all math expressions, wrapping inline math in single $ and block math in double $$. IMPORTANT: You MUST return ONLY a valid JSON object matching this schema: { \"assumedKnowledge\": [\"string\"], \"steps\": [\"string\"], \"practiceProblems\": [\"string\"] }";

    try {
      const puterPrompt = `${systemPrompt}\n\nProblem: ${userPrompt}`;
      const res = await puter.ai.chat(puterPrompt, imageBase64);
      const text = typeof res === 'string' ? res : res?.message?.content || res?.message || JSON.stringify(res);
      return normalizeMathSolution(text);
    } catch (error: any) {
      console.error("Puter AI Error:", error);
      return { assumedKnowledge: [], steps: ["An error occurred while solving the problem. Please try again."], practiceProblems: [] };
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
      const puterPrompt = `${systemPrompt}\n\nProblem: ${userPrompt}`;
      const res = await puter.ai.chat(puterPrompt, imageBase64);
      const text = typeof res === 'string' ? res : res?.message?.content || res?.message || JSON.stringify(res);
      return JSON.parse(text);
    } catch (e: any) {
      console.error("Failed to analyze prerequisites", e);
      return [];
    }
  }

  static async generateMicroLesson(concept: string, problemText: string): Promise<{ lesson: string, youtubeVideoId: string }> {
    const systemPrompt = `You are an expert math tutor. A student needs to understand the concept of "${concept}" before they can solve the problem: "${problemText}". Provide a very short, focused micro-lesson (max 2 paragraphs) explaining this concept simply to a 5th grader. Use LaTeX for math, wrapping inline math in single $ and block math in double $$. Also, find a highly relevant educational YouTube video ID for this concept (e.g., from Khan Academy, Math Antics, etc.). Return a JSON object with "lesson" and "youtubeVideoId" (if found, else empty string).`;
    
    try {
      const res = await puter.ai.chat(systemPrompt);
      const text = typeof res === 'string' ? res : res?.message?.content || res?.message || JSON.stringify(res);
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

  static async evaluatePracticeProblem(problemText: string, userAnswer: string): Promise<PracticeEvaluation> {
    const systemPrompt = `You are an expert math tutor. A student is trying to solve this practice problem: "${problemText}". The student's answer is: "${userAnswer}". 
              First, determine if the student's answer is correct.
              Second, provide a brief, encouraging feedback message.
              Third, provide a detailed, step-by-step solution to the problem using simple English suitable for a 5th grader.
              Use LaTeX for all math expressions, wrapping inline math in single $ and block math in double $$.`;
    try {
      const res = await puter.ai.chat(systemPrompt);
      const text = typeof res === 'string' ? res : res?.message?.content || res?.message || JSON.stringify(res);
      return JSON.parse(text);
    } catch (error: any) {
      console.error("Puter AI Error:", error);
      return { isCorrect: false, feedback: "An error occurred while evaluating the answer. Please try again.", steps: [] };
    }
  }
}
