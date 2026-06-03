// ─── Sensor PoC Mock Data ──────────────────────────────
// XIAO ESP32-C3 + ACS712 5A + SG90 Servo 하드웨어 PoC용
// Web Serial 미연결 시 사용하는 mock 텔레메트리 프로파일

// ── MQTT topic (고정값) ─────────────────────────────────
export const MQTT_TOPIC = 'factory/fieldkeeper/line-a/compressor-2/power';

// ── Threshold 상수 ──────────────────────────────────────
export const WARNING_THRESHOLD = 0.80; // A — 경고 수준
export const ALERT_THRESHOLD   = 1.00; // A — 이상 수준
export const MOCK_INTERVAL_MS  = 2000; // mock 갱신 주기 (ms)

// ── 정상 운전 프로파일 (0.40 ~ 0.45 A) ─────────────────
export const NORMAL_PROFILE = [
  { I_A: 0.41, status: 'normal',  servo: 'idle'      },
  { I_A: 0.43, status: 'normal',  servo: 'idle'      },
  { I_A: 0.42, status: 'normal',  servo: 'idle'      },
  { I_A: 0.45, status: 'normal',  servo: 'idle'      },
  { I_A: 0.40, status: 'normal',  servo: 'idle'      },
  { I_A: 0.43, status: 'normal',  servo: 'idle'      },
  { I_A: 0.41, status: 'normal',  servo: 'idle'      },
  { I_A: 0.44, status: 'normal',  servo: 'idle'      },
];

// ── D4 이상 전류 주입 프로파일 ──────────────────────────
export const ANOMALY_PROFILE = [
  { I_A: 0.75, status: 'warning', servo: 'idle'      },
  { I_A: 0.89, status: 'warning', servo: 'triggered' },
  { I_A: 1.12, status: 'alert',   servo: 'triggered' },
  { I_A: 1.18, status: 'alert',   servo: 'triggered' },
  { I_A: 0.94, status: 'warning', servo: 'triggered' },
  { I_A: 0.88, status: 'warning', servo: 'triggered' },
];

// ── 복구 프로파일 (이상 종료 후) ────────────────────────
export const RECOVERY_PROFILE = [
  { I_A: 0.62, status: 'normal',  servo: 'returning' },
  { I_A: 0.54, status: 'normal',  servo: 'returning' },
  { I_A: 0.47, status: 'normal',  servo: 'idle'      },
  { I_A: 0.43, status: 'normal',  servo: 'idle'      },
];

// ── 노이즈 함수 ─────────────────────────────────────────
// 기준값에 ±range A 이내 랜덤 노이즈 추가 (소수점 3자리)
export function jitter(base, range = 0.03) {
  const v = base + (Math.random() - 0.5) * range * 2;
  return parseFloat(Math.min(1.50, Math.max(0.05, v)).toFixed(3));
}

// ── mock 프레임 생성 ────────────────────────────────────
// profile: NORMAL_PROFILE | ANOMALY_PROFILE | RECOVERY_PROFILE
// idx: 현재 인덱스 (% profile.length 로 순환)
export function getMockFrame(profile, idx) {
  const base = profile[idx % profile.length];
  return {
    ts:     Date.now(),
    I_A:    jitter(base.I_A),
    status: base.status,
    servo:  base.servo,
  };
}

// ── RAG 근거 문서 ──────────────────────────────────────
export const RAG_DOCUMENTS = [
  {
    title:   'IEC 60947-4-1 — 전동기 기동기 및 과전류 보호',
    titleEn: 'IEC 60947-4-1 — Motor Starters & Overcurrent Protection',
    url:     'https://webstore.iec.ch/publication/4051',
    desc:    '과전류 임계값 설정 근거',
    descEn:  'Overcurrent threshold standard reference',
  },
  {
    title:   'ACS712 Datasheet — Allegro MicroSystems',
    titleEn: 'ACS712 Datasheet — Allegro MicroSystems',
    url:     'https://www.allegromicro.com/en/products/sense/current-sensor-ics/zero-to-fifty-amp-integrated-conductor-sensor-ics/acs712',
    desc:    '전류 센서 정밀도 ±1.5% 및 응답속도 근거',
    descEn:  'Current sensor ±1.5% accuracy & response time',
  },
  {
    title:   'KS C IEC 61000-4-5 — 서지 내성 시험',
    titleEn: 'KS C IEC 61000-4-5 — Surge Immunity Test',
    url:     'https://www.kats.go.kr/main.do',
    desc:    '과전류 서지 감지 임계값 기준',
    descEn:  'Surge detection threshold reference',
  },
];

// ── D4 이벤트용 AI 리포트 ──────────────────────────────
// AnomalyList 선택 → AIReport에 표시될 보고서 내용
// typeKey는 AnomalyList.jsx의 koMap에 있는 'powerSpike'를 재사용
// (equipment='XIAO ESP32-C3'으로 기기가 구분됨)
export const XIAO_ANOMALY_REPORTS = {
  ko: {
    title:   'XIAO ESP32-C3 센서 전류 이상',
    summary: 'ACS712 5A 센서에서 단일 저전압 부하의 전류가 임계값을 초과했습니다. AI가 서보 부하 증가, 기계적 저항, 전원 공급 불안정, 센서 노이즈를 원인 후보로 분석했습니다.',
    causes: [
      { icon: 'activity',       label: '서보모터 순간 부하 증가',           detail: '' },
      { icon: 'cog',            label: '회전부 기계적 저항 또는 걸림',      detail: '' },
      { icon: 'zap',            label: '5V 전원 공급 불안정',              detail: '' },
      { icon: 'cpu',            label: 'ACS712 센서 노이즈 또는 영점 오차', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: '부하 및 배선 상태 확인',           detail: '' },
      { priority: 'today',     label: '서보모터 동작 범위 및 걸림 점검',  detail: '' },
      { priority: 'thisWeek',  label: 'ACS712 영점 재보정 및 임계값 조정', detail: '' },
    ],
    savings:    '3~6%',
    confidence: 86,
  },
  en: {
    title:   'XIAO ESP32-C3 Sensor Current Anomaly',
    summary: 'ACS712 5A sensor detected current exceeding threshold on a single low-voltage load. AI analyzed servo load spike, mechanical resistance, 5V supply instability, and sensor noise as root causes.',
    causes: [
      { icon: 'activity',       label: 'Servo motor momentary load spike', detail: '' },
      { icon: 'cog',            label: 'Mechanical resistance or jam',     detail: '' },
      { icon: 'zap',            label: '5V supply instability',            detail: '' },
      { icon: 'cpu',            label: 'ACS712 noise or zero offset',      detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'Check load and wiring',             detail: '' },
      { priority: 'today',     label: 'Inspect servo range and jams',      detail: '' },
      { priority: 'thisWeek',  label: 'Recalibrate ACS712 zero and threshold', detail: '' },
    ],
    savings:    '3~6%',
    confidence: 86,
  },
};
// 나머지 언어는 영어로 fallback
['ja', 'zh', 'fr', 'es', 'de', 'vi', 'id', 'th'].forEach(lang => {
  XIAO_ANOMALY_REPORTS[lang] = XIAO_ANOMALY_REPORTS.en;
});

