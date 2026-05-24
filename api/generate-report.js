const languageNames = {
  ko: 'Korean',
  en: 'English',
  ja: 'Japanese',
  zh: 'Chinese',
  fr: 'French',
  de: 'German',
  id: 'Indonesian',
};

const text = {
  ko: {
    title: '로컬 규칙 기반 분석 리포트',
    prefix: 'Gemini API 한도 초과 또는 호출 실패로 로컬 규칙 엔진이 이벤트 데이터를 분석했습니다.',
    compressor: '컴프레서 부하 증가 패턴으로 판단됩니다.',
    offhour: '비작업시간 전력 사용 패턴으로 판단됩니다.',
    ai: 'AI 작업 공간의 반복 사용 패턴으로 판단됩니다.',
    default: '선택된 이상 이벤트를 기준으로 원인 후보와 조치안을 산출했습니다.',
    causes: {
      leakage: ['압축공기 누설 가능성', '배관·밸브·연결부 누설로 컴프레서 부하가 증가했을 수 있습니다.'],
      idle: ['비작업시간 공회전', '무부하 운전이 지속되어 불필요한 전력 사용이 발생했을 수 있습니다.'],
      pressure: ['압력 설정값 과다', '공정 요구보다 높은 압력 설정으로 전력 사용량이 증가했을 수 있습니다.'],
      schedule: ['자동 차단 미적용', '비작업시간에도 설비 전원이 차단되지 않았을 수 있습니다.'],
      standby: ['잔류 대기전력', '주변 설비의 대기전력이 누적되었을 수 있습니다.'],
      retry: ['AI 작업 재시도', '실패 재시도 또는 중복 호출로 연산 부하가 증가했을 수 있습니다.'],
      batch: ['반복 배치 작업', '동일 작업이 반복 실행되어 전력 사용이 누적되었을 수 있습니다.'],
      cooling: ['냉각 부하 증가', '장비 발열 또는 환기 부족으로 냉각 전력이 증가했을 수 있습니다.'],
    },
    actions: {
      leak: ['누설 지점 점검', '배관, 밸브, 연결부를 우선 점검합니다.'],
      pressure: ['압력 설정값 확인', '공정 요구 압력과 현재 설정값을 비교합니다.'],
      shutdown: ['자동 차단 규칙 검토', '비작업시간 무부하 운전을 줄이는 제어 규칙을 검토합니다.'],
      schedule: ['운전 스케줄 점검', '작업 시간표와 설비 가동 시간이 일치하는지 확인합니다.'],
      standby: ['대기전력 차단', '사용하지 않는 장비의 대기전력을 차단합니다.'],
      retry: ['재시도 제한 설정', '실패 재시도 횟수와 호출 간격을 제한합니다.'],
      batch: ['반복 작업 정리', '중복 실행되는 배치·분석 작업을 통합합니다.'],
      cooling: ['냉각·환기 점검', '환기 상태와 냉각 장치의 부하를 확인합니다.'],
    },
  },
  en: {
    title: 'Local Rule-Based Analysis Report',
    prefix: 'Gemini API is unavailable or quota-limited, so the local rule engine analyzed the event data.',
    compressor: 'The event matches a compressor load increase pattern.',
    offhour: 'The event matches an off-hour power usage pattern.',
    ai: 'The event matches repeated AI workspace usage.',
    default: 'Likely causes and recommended actions were generated from the selected anomaly event.',
    causes: {
      leakage: ['Possible air leakage', 'Pipe, valve, or connector leakage may have increased compressor load.'],
      idle: ['Off-hour idle operation', 'The equipment may have kept running without production demand.'],
      pressure: ['Excessive pressure setting', 'A pressure setting above process demand may have increased power usage.'],
      schedule: ['Missing auto-shutdown', 'Equipment power may not have been shut down during off-hours.'],
      standby: ['Residual standby load', 'Standby power from auxiliary equipment may have accumulated.'],
      retry: ['AI job retries', 'Failed retries or duplicate calls may have increased compute load.'],
      batch: ['Repeated batch workload', 'Duplicate or repeated jobs may have accumulated power usage.'],
      cooling: ['Increased cooling load', 'Equipment heat or poor ventilation may have increased cooling power.'],
    },
    actions: {
      leak: ['Inspect leakage points', 'Check pipes, valves, and connectors first.'],
      pressure: ['Review pressure setting', 'Compare process demand with the current pressure setting.'],
      shutdown: ['Review auto-shutdown rules', 'Reduce idle operation during off-hours.'],
      schedule: ['Check operation schedule', 'Verify that equipment runtime matches the work schedule.'],
      standby: ['Cut standby power', 'Turn off unused auxiliary equipment.'],
      retry: ['Limit retry behavior', 'Control retry count and retry interval.'],
      batch: ['Consolidate repeated jobs', 'Merge duplicate batch or analysis tasks.'],
      cooling: ['Inspect cooling and ventilation', 'Check ventilation and cooling system load.'],
    },
  },
  ja: {
    title: 'ローカル規則ベース分析レポート',
    prefix: 'Gemini APIを利用できないため、ローカル規則エンジンがイベントデータを分析しました。',
    compressor: 'コンプレッサー負荷増加パターンと判断されます。',
    offhour: '非稼働時間の電力使用パターンと判断されます。',
    ai: 'AI作業空間の反復使用パターンと判断されます。',
    default: '選択された異常イベントに基づき、原因候補と推奨対応を算出しました。',
    causes: {
      leakage: ['圧縮空気漏れの可能性', '配管、バルブ、接続部の漏れにより負荷が増加した可能性があります。'],
      idle: ['非稼働時間のアイドル運転', '生産需要がない状態で設備が稼働し続けた可能性があります。'],
      pressure: ['圧力設定値の過大', '工程要求より高い圧力設定により電力使用が増加した可能性があります。'],
      schedule: ['自動停止未適用', '非稼働時間にも設備電源が遮断されていない可能性があります。'],
      standby: ['残留待機電力', '補助設備の待機電力が累積した可能性があります。'],
      retry: ['AI作業の再試行', '失敗再試行や重複呼び出しにより負荷が増加した可能性があります。'],
      batch: ['反復バッチ作業', '重複または反復作業により電力使用が累積した可能性があります。'],
      cooling: ['冷却負荷増加', '発熱または換気不足により冷却電力が増加した可能性があります。'],
    },
    actions: {
      leak: ['漏れ箇所の点検', '配管、バルブ、接続部を優先的に確認します。'],
      pressure: ['圧力設定値の確認', '工程要求圧力と現在の設定値を比較します。'],
      shutdown: ['自動停止ルールの見直し', '非稼働時間の無負荷運転を削減します。'],
      schedule: ['運転スケジュール確認', '作業時間と設備稼働時間が一致しているか確認します。'],
      standby: ['待機電力の遮断', '未使用の補助設備を停止します。'],
      retry: ['再試行制限設定', '再試行回数と間隔を制御します。'],
      batch: ['反復作業の整理', '重複するバッチ・分析作業を統合します。'],
      cooling: ['冷却・換気点検', '換気状態と冷却装置の負荷を確認します。'],
    },
  },
};

function pickLang(language) {
  return text[language] || text.en;
}

function pair(obj, key, icon) {
  const [label, detail] = obj[key];
  return { icon, label, detail };
}

function getKind(event) {
  const raw = `${event?.equipment || ''} ${event?.typeKey || ''} ${event?.severity || ''}`.toLowerCase();
  if (raw.includes('compressor') || raw.includes('압축') || raw.includes('コンプレッサ')) return 'compressor';
  if (raw.includes('line') || raw.includes('off') || raw.includes('비작업') || raw.includes('非稼働')) return 'offhour';
  if (raw.includes('ai') || raw.includes('lab') || raw.includes('token') || raw.includes('api')) return 'ai';
  return 'default';
}

function confidence(severity) {
  const s = String(severity || '').toLowerCase();
  if (s === 'high') return 88;
  if (s === 'medium') return 81;
  return 74;
}

function savingRange(severity, kind) {
  const s = String(severity || '').toLowerCase();
  if (kind === 'compressor') return s === 'high' ? '8–12%' : '5–9%';
  if (kind === 'offhour') return s === 'high' ? '7–11%' : '4–8%';
  if (kind === 'ai') return s === 'high' ? '6–10%' : '3–7%';
  return s === 'high' ? '6–10%' : '3–7%';
}

function generateLocalRuleReport(event = {}, language = 'en') {
  const t = pickLang(language);
  const kind = getKind(event);
  const equipment = event?.equipment || 'Unknown equipment';

  let summary = t.default;
  let causes = [
    pair(t.causes, 'schedule', 'clock'),
    pair(t.causes, 'standby', 'database'),
    pair(t.causes, 'idle', 'monitor'),
  ];
  let actions = [
    { priority: 'immediate', ...pair(t.actions, 'schedule', 'calendar') },
    { priority: 'today', ...pair(t.actions, 'standby', 'zap') },
    { priority: 'thisWeek', ...pair(t.actions, 'shutdown', 'clock') },
  ];

  if (kind === 'compressor') {
    summary = t.compressor;
    causes = [
      pair(t.causes, 'leakage', 'wind'),
      pair(t.causes, 'idle', 'clock'),
      pair(t.causes, 'pressure', 'gauge'),
    ];
    actions = [
      { priority: 'immediate', ...pair(t.actions, 'leak', 'wind') },
      { priority: 'today', ...pair(t.actions, 'pressure', 'gauge') },
      { priority: 'thisWeek', ...pair(t.actions, 'shutdown', 'clock') },
    ];
  }

  if (kind === 'offhour') {
    summary = t.offhour;
    causes = [
      pair(t.causes, 'schedule', 'clock'),
      pair(t.causes, 'standby', 'database'),
      pair(t.causes, 'idle', 'monitor'),
    ];
    actions = [
      { priority: 'immediate', ...pair(t.actions, 'schedule', 'calendar') },
      { priority: 'today', ...pair(t.actions, 'standby', 'zap') },
      { priority: 'thisWeek', ...pair(t.actions, 'shutdown', 'clock') },
    ];
  }

  if (kind === 'ai') {
    summary = t.ai;
    causes = [
      pair(t.causes, 'retry', 'refresh'),
      pair(t.causes, 'batch', 'cpu'),
      pair(t.causes, 'cooling', 'thermometer'),
    ];
    actions = [
      { priority: 'immediate', ...pair(t.actions, 'retry', 'refresh') },
      { priority: 'today', ...pair(t.actions, 'batch', 'cpu') },
      { priority: 'thisWeek', ...pair(t.actions, 'cooling', 'thermometer') },
    ];
  }

  return {
    title: t.title,
    summary: `${t.prefix} ${equipment}: ${summary}`,
    confidence: confidence(event?.severity),
    savings: savingRange(event?.severity, kind),
    causes,
    actions,
  };
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
- confidence must be between 70 and 95.
- savings should be a realistic range such as "8–12%".

Selected event:
${JSON.stringify(event, null, 2)}
`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      source: 'local_rule_engine',
      report: generateLocalRuleReport({}, 'en'),
      error: 'Method not allowed',
    });
  }

  const body = req.body || {};
  const { event, language = 'en' } = body;
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    return res.status(200).json({
      source: 'local_rule_engine',
      report: generateLocalRuleReport(event, language),
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

    if (!geminiRes.ok) {
      return res.status(200).json({
        source: geminiRes.status === 429 ? 'local_rule_engine' : 'api_error_local_rule',
        report: generateLocalRuleReport(event, language),
      });
    }

    const data = await geminiRes.json();
    const out = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim() || '';
    const report = JSON.parse(out);

    return res.status(200).json({
      source: 'gemini',
      report,
    });
  } catch {
    return res.status(200).json({
      source: 'parse_error_local_rule',
      report: generateLocalRuleReport(event, language),
    });
  }
}
