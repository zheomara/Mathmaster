const { GoogleGenAI } = require("@google/genai");

async function tryGemini({ prompt, imageBase64, mimeType }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY on server.");

  const ai = new GoogleGenAI({ apiKey });

  const parts = [{ text: prompt }];
  if (imageBase64 && mimeType) {
    parts.push({ inlineData: { data: imageBase64, mimeType } });
  }

  const res = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts }],
    config: { responseMimeType: "application/json" },
  });

  const text = res.text ?? "";
  if (!text) throw new Error("Empty response from Gemini.");
  return JSON.parse(text);
}

async function tryPuter({ prompt }) {
  const token =
    process.env.PUTER_AUTH_TOKEN ||
    process.env.PUTER_API_KEY ||
    process.env.puterAuthToken;

  if (!token) {
    throw new Error("Missing PUTER_AUTH_TOKEN (or PUTER_API_KEY) on server.");
  }

  // Node-only init. This file is CommonJS to keep Vercel happy.
  // eslint-disable-next-line import/no-unresolved
  const { init } = require("@heyputer/puter.js/src/init.cjs");
  const puter = init(token);

  const res = await puter.ai.chat(prompt, { model: "gpt-5-nano" });
  const text =
    typeof res === "string"
      ? res
      : res?.message?.content || res?.message || JSON.stringify(res);

  // Puter may not guarantee JSON; keep server predictable.
  // If parsing fails, return as plain text in steps.
  try {
    return JSON.parse(text);
  } catch {
    return { assumedKnowledge: [], steps: [String(text)], practiceProblems: [] };
  }
}

function normalizeMathSolution(data) {
  return {
    assumedKnowledge: Array.isArray(data?.assumedKnowledge) ? data.assumedKnowledge : [],
    steps: Array.isArray(data?.steps) ? data.steps : ["No steps provided."],
    practiceProblems: Array.isArray(data?.practiceProblems) ? data.practiceProblems : [],
  };
}

module.exports = async function handler(req, res) {
  // CORS for Capacitor (origin is typically `capacitor://localhost`)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    return res.end("Method Not Allowed");
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { prompt, imageBase64, mimeType } = body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing 'prompt'." });
    }

    // 1) Gemini first
    try {
      const json = await tryGemini({ prompt, imageBase64, mimeType });
      return res.status(200).json({
        provider: "gemini",
        solution: normalizeMathSolution(json),
      });
    } catch (e) {
      // 2) Puter fallback
      const json = await tryPuter({ prompt });
      return res.status(200).json({
        provider: "puter",
        solution: normalizeMathSolution(json),
      });
    }
  } catch (err) {
    const message = err?.message || "AI service is currently busy or unavailable.";
    return res.status(503).json({ error: message });
  }
};

