// ─── gcp-telemetry-api / server.js ───────────────────────
// Cloud Run용 텔레메트리 수신·조회 Express API
// XIAO ESP32-C3 + ACS712 5A + SG90 Servo 하드웨어 PoC 연동
//
// 엔드포인트:
//   GET  /health                  — Cloud Run 헬스체크
//   POST /api/telemetry           — XIAO가 전송하는 JSON 프레임 수신
//   GET  /api/telemetry/latest    — 마지막 수신 프레임 조회
//   GET  /api/telemetry/history   — 최근 N개 프레임 조회 (?limit=50)
//   POST /api/telemetry/inject    — D4 이상 전류 주입 시뮬레이션
//   DELETE /api/telemetry/history — 히스토리 초기화

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// ── 환경변수 ─────────────────────────────────────────────
const PORT           = parseInt(process.env.PORT || '8080', 10);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';   // Vercel 배포 URL 설정 권장
const MAX_HISTORY    = parseInt(process.env.MAX_HISTORY || '200', 10);
// DEVICE_TOKEN: POST 쓰기 엔드포인트 경량 보호 (x-device-token 헤더)
// 미설정 시 토큰 검사 생략 (개발 편의)
const DEVICE_TOKEN   = process.env.DEVICE_TOKEN || null;

// ── MQTT topic (고정값) ──────────────────────────────────
const MQTT_TOPIC = 'factory/fieldkeeper/line-a/compressor-2/power';

// ── 임계값 상수 ──────────────────────────────────────────
const WARNING_THRESHOLD = 0.80; // A
const ALERT_THRESHOLD   = 1.00; // A

// ── 인메모리 스토어 ──────────────────────────────────────
// Cloud Run stateless 환경 — 재시작 시 초기화됨 (의도된 동작)
// 프로덕션: Firestore / Bigtable로 교체
let telemetryHistory = [];  // 최신 MAX_HISTORY개 프레임
let latestFrame      = null;
let injectionActive  = false;

// ── Express 앱 설정 ──────────────────────────────────────
const app = express();

app.use(express.json({ limit: '64kb' }));

// CORS: 프론트엔드(Vercel)에서 직접 호출 허용
app.use(cors({
  origin: ALLOWED_ORIGIN,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-token'],
}));

// ── DEVICE_TOKEN 검증 미들웨어 ───────────────────────────
// 쓰기 엔드포인트(POST, DELETE)에만 적용
// DEVICE_TOKEN 미설정 시 검사 생략 (로컬 개발 호환)
function writeAuth(req, res, next) {
  if (!DEVICE_TOKEN) return next();  // 토큰 미설정 → 개방
  const provided = req.headers['x-device-token'];
  if (provided === DEVICE_TOKEN) return next();
  console.warn(`[AUTH] 401 invalid token from ${req.ip} path=${req.path}`);
  return res.status(401).json({ error: 'Invalid or missing x-device-token' });
}

// ── 유틸리티 ─────────────────────────────────────────────
function nowIso() {
  return new Date().toISOString();
}

function deriveStatus(I_A) {
  if (I_A >= ALERT_THRESHOLD)   return 'alert';
  if (I_A >= WARNING_THRESHOLD) return 'warning';
  return 'normal';
}

function appendHistory(frame) {
  telemetryHistory.push(frame);
  if (telemetryHistory.length > MAX_HISTORY) {
    telemetryHistory = telemetryHistory.slice(-MAX_HISTORY);
  }
}

// ── 헬스체크 ─────────────────────────────────────────────
// Cloud Run이 컨테이너 기동 후 이 엔드포인트로 헬스를 확인
app.get('/health', (_req, res) => {
  res.json({
    status:    'ok',
    service:   'gcp-telemetry-api',
    version:   '1.0.0',
    timestamp: nowIso(),
    frames:    telemetryHistory.length,
  });
});

// ── POST /api/telemetry ──────────────────────────────────
// XIAO ESP32-C3가 JSON 텔레메트리를 전송하는 엔드포인트
//
// 헤더: x-device-token: <DEVICE_TOKEN>  (DEVICE_TOKEN 설정 시 필수)
// 바디: { "ts": 1717000000, "I_A": 0.423, "status": "normal", "servo": "idle" }
// ts 필드가 없으면 서버 타임스탬프 사용
app.post('/api/telemetry', writeAuth, (req, res) => {
  const body = req.body;

  // 필수 필드 검증
  if (typeof body.I_A !== 'number') {
    return res.status(400).json({
      error: 'Missing or invalid field: I_A (number required)',
    });
  }

  const I_A = parseFloat(body.I_A.toFixed(3));

  const frame = {
    ts:        body.ts      ?? Date.now(),
    serverTs:  Date.now(),
    receivedAt: nowIso(),
    I_A,
    status:    body.status  ?? deriveStatus(I_A),
    servo:     body.servo   ?? 'unknown',
    topic:     MQTT_TOPIC,
    source:    'xiao-serial',
  };

  latestFrame = frame;
  appendHistory(frame);

  // 이상 감지 시 서버 로그 (Cloud Run Logging → Cloud Monitoring 연동)
  if (frame.status === 'alert') {
    console.warn(`[ALERT] ${frame.receivedAt} I_A=${I_A}A servo=${frame.servo}`);
  } else if (frame.status === 'warning') {
    console.log(`[WARN]  ${frame.receivedAt} I_A=${I_A}A servo=${frame.servo}`);
  }

  res.status(201).json({ ok: true, frame });
});

// ── GET /api/telemetry/latest ────────────────────────────
// 프론트엔드가 폴링해 최신 프레임을 가져감
app.get('/api/telemetry/latest', (_req, res) => {
  if (!latestFrame) {
    return res.status(404).json({ error: 'No telemetry data yet' });
  }
  res.json({ ok: true, frame: latestFrame });
});

// ── GET /api/telemetry/history ───────────────────────────
// 최근 N개 프레임 반환 (?limit=50, 기본 50, 최대 MAX_HISTORY)
app.get('/api/telemetry/history', (req, res) => {
  const limit = Math.min(
    parseInt(req.query.limit ?? '50', 10),
    MAX_HISTORY,
  );
  const frames = telemetryHistory.slice(-limit);
  res.json({
    ok:     true,
    count:  frames.length,
    total:  telemetryHistory.length,
    frames,
  });
});

// ── POST /api/telemetry/inject ───────────────────────────
// D4 버튼 클릭 시뮬레이션 — 이상 전류 스파이크 프레임 주입
// 프론트엔드 또는 발표 데모에서 사용
app.post('/api/telemetry/inject', writeAuth, (req, res) => {
  const { I_A = 1.15, servo = 'triggered' } = req.body || {};

  const frame = {
    ts:         Date.now(),
    serverTs:   Date.now(),
    receivedAt: nowIso(),
    I_A:        parseFloat(Math.min(1.50, Math.max(WARNING_THRESHOLD, I_A)).toFixed(3)),
    status:     'alert',
    servo,
    topic:      MQTT_TOPIC,
    source:     'inject-d4',
  };

  latestFrame    = frame;
  injectionActive = true;
  appendHistory(frame);

  console.warn(`[INJECT] D4 anomaly injection: I_A=${frame.I_A}A servo=${frame.servo}`);

  res.status(201).json({ ok: true, injected: true, frame });
});

// ── DELETE /api/telemetry/history ────────────────────────
// 히스토리 초기화 (개발·데모 리셋용)
app.delete('/api/telemetry/history', writeAuth, (_req, res) => {
  const count = telemetryHistory.length;
  telemetryHistory = [];
  latestFrame      = null;
  injectionActive  = false;
  console.log(`[RESET] Cleared ${count} telemetry frames`);
  res.json({ ok: true, cleared: count });
});

// ── GET /api/status ───────────────────────────────────────
// 서비스 상태 요약 (MQTT topic, 임계값, 인젝션 여부 등)
app.get('/api/status', (_req, res) => {
  res.json({
    ok:               true,
    mqttTopic:        MQTT_TOPIC,
    warningThreshold: WARNING_THRESHOLD,
    alertThreshold:   ALERT_THRESHOLD,
    maxHistory:       MAX_HISTORY,
    currentFrames:    telemetryHistory.length,
    injectionActive,
    latestStatus:     latestFrame?.status ?? null,
    latestI_A:        latestFrame?.I_A    ?? null,
    latestReceivedAt: latestFrame?.receivedAt ?? null,
  });
});

// ── 404 핸들러 ────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── 서버 기동 ─────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[START] gcp-telemetry-api listening on port ${PORT}`);
  console.log(`[INFO]  MQTT topic  : ${MQTT_TOPIC}`);
  console.log(`[INFO]  Thresholds  : warning=${WARNING_THRESHOLD}A  alert=${ALERT_THRESHOLD}A`);
  console.log(`[INFO]  Max history : ${MAX_HISTORY} frames`);
  console.log(`[INFO]  CORS origin : ${ALLOWED_ORIGIN}`);
  console.log(`[INFO]  Device token: ${DEVICE_TOKEN ? 'SET (write endpoints protected)' : 'NOT SET (open)'}`);
});
