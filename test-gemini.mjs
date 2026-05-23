import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const key = process.env.GEMINI_API_KEY;

console.log("Key loaded:", Boolean(key));
console.log("Key prefix:", key ? key.slice(0, 8) + "..." : "none");

const ai = new GoogleGenAI({ apiKey: key });

try {
  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: 'Say only: {"ok":true}',
  });

  console.log("result keys:", Object.keys(result));
  console.log("text:", result.text);
} catch (err) {
  console.error("ERROR name:", err.name);
  console.error("ERROR message:", err.message);
}
