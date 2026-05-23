// ─── Load .env before anything else ─────────────────────
import "dotenv/config";

import express from "express";
import { GoogleGenAI } from "@google/genai";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// ─── Serve Vite production build ─────────────────────────
app.use(express.static(join(__dirname, "dist")));

// ─── Gemini API key (from .env) ───────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ─── Mock fallback report (returned when no API key) ──────
function buildMockReport(language) {
  const reports = {
    ko: {
      title: "Compressor-2 전력 급증",
      summary:
        "15:08 기준선 대비 전력 피크 감지. AI Agent가 누설·공회전·압력 과다를 원인 후보로 분석.",
      causes: [
        { icon: "wind", label: "압축공기 누설 가능성", detail: "" },
        { icon: "clock", label: "비작업시간 공회전", detail: "" },
        { icon: "gauge", label: "압력 설정값 과다", detail: "" },
        { icon: "cog", label: "장비 노후화", detail: "" },
      ],
      actions: [
        { priority: "immediate", label: "압력 설정값 확인", detail: "" },
        { priority: "today", label: "누설 지점 점검", detail: "" },
        { priority: "thisWeek", label: "자동 차단 스케줄 적용", detail: "" },
      ],
      savings: "8~12%",
      confidence: 94,
    },
    en: {
      title: "Compressor-2 Power Spike",
      summary:
        "Power spike detected at 15:08. AI analyzed air leak, idle running, and excessive pressure as cause candidates.",
      causes: [
        { icon: "wind", label: "Compressed air leak", detail: "" },
        { icon: "clock", label: "Off-hour idling", detail: "" },
        { icon: "gauge", label: "High pressure setting", detail: "" },
        { icon: "cog", label: "Aging equipment", detail: "" },
      ],
      actions: [
        { priority: "immediate", label: "Check pressure set-point", detail: "" },
        { priority: "today", label: "Inspect leak points", detail: "" },
        { priority: "thisWeek", label: "Apply auto-shutoff schedule", detail: "" },
      ],
      savings: "8~12%",
      confidence: 94,
    },
  };
  return reports[language] || reports.en;
}

// ─── Build the Gemini prompt ──────────────────────────────
function buildPrompt(event, language) {
  const langNames = {
    ko: "Korean",
    en: "English",
    ja: "Japanese",
    zh: "Chinese (Simplified)",
    fr: "French",
    es: "Spanish",
    de: "German",
    vi: "Vietnamese",
    id: "Indonesian",
    th: "Thai",
  };
  const langName = langNames[language] || "English";

  return `You are an industrial energy AI analyst. Analyze the following factory anomaly event and respond ONLY with a JSON object. Do not include markdown, code fences, or explanations.

Event data:
- Equipment: ${event.equipment}
- Event type: ${event.type}
- Severity: ${event.severity}
- Time: ${event.time}
- Power peak: 92.4 kW (baseline: 65 kW)

Respond in ${langName}. Return this exact JSON shape:
{
  "title": "short event title (max 30 chars)",
  "summary": "2-sentence diagnosis and analysis summary",
  "causes": [
    { "icon": "wind", "label": "Cause label (max 20 chars)", "detail": "" },
    { "icon": "clock", "label": "Cause label (max 20 chars)", "detail": "" },
    { "icon": "gauge", "label": "Cause label (max 20 chars)", "detail": "" },
    { "icon": "cog", "label": "Cause label (max 20 chars)", "detail": "" }
  ],
  "actions": [
    { "priority": "immediate", "label": "Action label (max 25 chars)", "detail": "" },
    { "priority": "today", "label": "Action label (max 25 chars)", "detail": "" },
    { "priority": "thisWeek", "label": "Action label (max 25 chars)", "detail": "" }
  ],
  "savings": "X~Y%",
  "confidence": <integer 80-99>
}`;
}

// ─── POST /api/generate-report ────────────────────────────
app.post("/api/generate-report", async (req, res) => {
  const { event, language = "ko" } = req.body;

  console.log("Gemini API key loaded:", Boolean(GEMINI_API_KEY));

  // No API key → return mock immediately
  if (!GEMINI_API_KEY) {
    const mode = "no_key";
    console.log("Generate report mode:", mode);
    return res.json({ source: "mock", mode, report: buildMockReport(language) });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const prompt = buildPrompt(event, language);

    const mode = "gemini_call";
    console.log("Generate report mode:", mode);

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const rawText = result.text.trim();

    // Strip any accidental markdown fences
    const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let report;
    try {
      report = JSON.parse(cleaned);
    } catch {
      console.warn("[server] JSON parse failed — raw snippet:", cleaned.slice(0, 200));
      const fallbackMode = "parse_error_fallback";
      console.log("Generate report mode:", fallbackMode);
      return res.json({ source: "mock", mode: fallbackMode, report: buildMockReport(language) });
    }

    console.log("Generate report mode: gemini_success");
    return res.json({ source: "gemini", mode: "gemini_success", report });

  } catch (err) {
    // Detect quota / rate-limit errors (HTTP 429 RESOURCE_EXHAUSTED)
    const isQuota =
      err.message?.includes("RESOURCE_EXHAUSTED") ||
      err.message?.includes("429") ||
      err.message?.includes("quota");

    if (isQuota) {
      console.warn("[server] Gemini quota exceeded — returning mock with quota flag.");
      console.log("Generate report mode: quota_exceeded");
      return res.json({ source: "quota_exceeded", mode: "quota_exceeded", report: buildMockReport(language) });
    }

    console.error("[server] Gemini API error:", err.message?.slice(0, 120));
    console.log("Generate report mode: api_error_fallback");
    return res.json({ source: "mock", mode: "api_error_fallback", report: buildMockReport(language) });
  }
});

// ─── Catch-all: serve index.html for client-side routing ──
app.get("/{*path}", (_req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

// ─── Start ────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  const hasKey = !!GEMINI_API_KEY;
  console.log(`\n🚀  Factory Energy AX Copilot`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   Gemini API: ${hasKey ? "✅ connected" : "⚠️  no key — mock mode"}\n`);
});
