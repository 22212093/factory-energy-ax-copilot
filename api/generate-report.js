const languageNames = {
  ko: 'Korean',
  en: 'English',
  ja: 'Japanese',
  zh: 'Chinese',
  fr: 'French',
  de: 'German',
  id: 'Indonesian',
};

const fallbackReports = {
  ko: {
    title: 'AI Agent 분석 리포트',
    summary: 'Gemini API 호출이 불가능하여 Mock/Fallback 리포트를 표시합니다. 선택한 이상 이벤트를 기준으로 원인 후보와 조치안을 정리했습니다.',
    confidence: 88,
    savings: '8~12%',
    causes: [
      { icon: 'wind', label: '압축공기 누설 가능성', detail: '배관·연결부 누설로 컴프레서 부하가 증가했을 수 있습니다.' },
      { icon: 'clock', label: '비작업시간 공회전', detail: '작업 종료 후 무부하 가동이 지속되었을 수 있습니다.' },
      { icon: 'gauge', label: '압력 설정값 과다', detail: '필요 압력보다 높은 설정으로 불필요한 전력 사용이 발생했을 수 있습니다.' },
    ],
    actions: [
      { priority: 'immediate', label: '누설 지점 점검', detail: '배관, 밸브, 연결부를 우선 점검합니다.' },
      { priority: 'today', label: '압력 설정값 확인', detail: '공정 요구 압력과 실제 설정값을 비교합니다.' },
      { priority: 'thisWeek', label: '자동 차단 규칙 검토', detail: '비작업시간 무부하 운전을 줄이는 제어 규칙을 검토합니다.' },
    ],
  },
  en: {
    title: 'AI Agent Analysis Report',
    summary: 'Gemini API is unavailable, so a Mock/Fallback report is shown. The report summarizes likely causes and recommended actions for the selected anomaly event.',
    confidence: 88,
    savings: '8–12%',
    causes: [
      { icon: 'wind', label: 'Possible air leakage', detail: 'Pipe or connector leakage may have increased compressor load.' },
      { icon: 'clock', label: 'Off-hour idle operation', detail: 'The equipment may have continued running without production demand.' },
      { icon: 'gauge', label: 'Excessive pressure setting', detail: 'A pressure setting above process demand may have caused unnecessary power use.' },
    ],
    actions: [
      { priority: 'immediate', label: 'Inspect leakage points', detail: 'Check pipes, valves, and connectors first.' },
      { priority: 'today', label: 'Review pressure setting', detail: 'Compare process demand with the current pressure setting.' },
      { priority: 'thisWeek', label: 'Review auto-shutdown rule', detail: 'Reduce idle operation during off-hours.' },
    ],
  },
  ja: {
    title: 'AI Agent 分析レポート',
    summary: 'Gemini APIを利用できないため、Mock/Fallbackレポートを表示しています。選択された異常イベントに対する原因候補と推奨対応を整理しました。',
    confidence: 88,
    savings: '8〜12%',
    causes: [
      { icon: 'wind', label: '圧縮空気漏れの可能性', detail: '配管や接続部の漏れによりコンプレッサー負荷が増加した可能性があります。' },
      { icon: 'clock', label: '非稼働時間のアイドル運転', detail: '生産需要がない時間帯にも設備が稼働し続けた可能性があります。' },
      { icon: 'gauge', label: '圧力設定値の過大', detail: '工程要求より高い圧力設定により不要な電力消費が発生した可能性があります。' },
    ],
    actions: [
      { priority: 'immediate', label: '漏れ箇所の点検', detail: '配管、バルブ、接続部を優先的に確認します。' },
      { priority: 'today', label: '圧力設定値の確認', detail: '工程要求圧力と現在の設定値を比較します。' },
      { priority: 'thisWeek', label: '自動停止ルールの見直し', detail: '非稼働時間の無負荷運転を削減します。' },
    ],
  },
};

function getFallbackReport(language) {
  return fallbackReports[language] || fallbackReports.en;
}

function buildPrompt(event, language) {
  const outputLanguage = languageNames[language] || 'English';

  return `
You are a senior industrial energy management AI agent.

Generate an industrial energy anomaly report in ${outputLanguage}.
Return ONLY valid JSON. Do not include markdown.

Required JSON schema:
{
  "title": "string",
  "summary": "string",
  "confidence": number,
  "savings": "string",
  "causes": [
    { "icon": "wind | clock | gauge | cog | zap | database | thermometer | cpu | monitor | refresh", "label": "string", "detail": "string" }
  ],
  "actions": [
    { "priority": "immediate | today | thisWeek", "label": "string", "detail": "string" }
  ]
}

Rules:
- All human-readable text must be written in ${outputLanguage}.
- Use 3 causes and 3 actions.
- The report must be practical for a factory energy manager.
- confidence must be between 70 and 95.
- savings should be a realistic range such as "8–12%".

Selected event:
${JSON.stringify(event, null, 2)}
`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      source: 'api_error_fallback',
      report: getFallbackReport('en'),
      error: 'Method not allowed',
    });
  }

  let body = {};
  try {
    body = req.body || {};
  } catch {
    body = {};
  }

  const { event, language = 'en' } = body;
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    return res.status(200).json({
      source: 'mock',
      report: getFallbackReport(language),
    });
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: buildPrompt(event, language) }],
            },
          ],
          generationConfig: {
            temperature: 0.25,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (geminiRes.status === 429) {
      return res.status(200).json({
        source: 'quota_exceeded',
        report: getFallbackReport(language),
      });
    }

    if (!geminiRes.ok) {
      return res.status(200).json({
        source: 'api_error_fallback',
        report: getFallbackReport(language),
      });
    }

    const data = await geminiRes.json();
    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || '')
        .join('')
        .trim() || '';

    const report = JSON.parse(text);

    return res.status(200).json({
      source: 'gemini',
      report,
    });
  } catch {
    return res.status(200).json({
      source: 'parse_error_fallback',
      report: getFallbackReport(language),
    });
  }
}
