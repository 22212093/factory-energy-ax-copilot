#!/usr/bin/env node
// ─── serial-bridge.js ───────────────────────────────────────────────────────
// USB Serial → Cloud Run Bridge
//
// 역할:
//   XIAO ESP32-C3가 USB Serial(115200 baud)로 출력하는 JSON 한 줄을 읽어
//   gcloud identity token을 Authorization 헤더에 붙여 Cloud Run에 POST한다.
//
// 사용법:
//   node serial-bridge.js COM3          ← Windows
//   node serial-bridge.js /dev/ttyUSB0  ← Linux/Mac
//
// 사전 조건:
//   gcloud auth login 완료 상태여야 함

import { SerialPort }     from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { execSync }       from 'child_process';

// ── 설정 ──────────────────────────────────────────────────────────────────────
const CLOUD_RUN_URL = [
  'https://fieldkeeper-telemetry-api-431524974551',
  '.asia-northeast3.run.app/api/telemetry',
].join('');

const DEVICE_TOKEN      = 'fieldkeeper-demo-7215';
const BAUD_RATE         = 115200;
const TOKEN_REFRESH_MS  = 45 * 60 * 1000;  // 45분 (gcloud token 유효: 60분)

// ── CLI 인수 파싱 ─────────────────────────────────────────────────────────────
const portPath = process.argv[2];

if (!portPath) {
  console.error('');
  console.error('  사용법: node serial-bridge.js <COM_PORT>');
  console.error('  예시:   node serial-bridge.js COM3');
  console.error('          node serial-bridge.js /dev/ttyUSB0');
  console.error('');
  console.error('  사용 가능한 포트 목록 확인:');
  console.error('    node -e "import(\'serialport\').then(m=>m.SerialPort.list()).then(l=>l.forEach(p=>console.log(p.path)))"');
  console.error('');
  process.exit(1);
}

// ── gcloud identity token 발급 및 자동 갱신 ──────────────────────────────────
function fetchIdentityToken() {
  try {
    const token = execSync('gcloud auth print-identity-token', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    console.log(`[TOKEN] 갱신 완료 (${new Date().toLocaleTimeString('ko-KR')})`);
    return token;
  } catch (err) {
    console.error('[TOKEN] gcloud 토큰 발급 실패:', err.message);
    console.error('[TOKEN] gcloud auth login 이 완료됐는지 확인하세요.');
    process.exit(1);
  }
}

let identityToken = fetchIdentityToken();

// 45분마다 자동 갱신 (gcloud identity token 유효시간: 60분)
setInterval(() => {
  identityToken = fetchIdentityToken();
}, TOKEN_REFRESH_MS);

// ── Cloud Run POST ────────────────────────────────────────────────────────────
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 10;  // 연속 실패 10회면 경고

async function postTelemetry(payload, isRetry = false) {
  try {
    const res = await fetch(CLOUD_RUN_URL, {
      method:  'POST',
      headers: {
        'Content-Type':   'application/json',
        'Authorization':  `Bearer ${identityToken}`,
        'x-device-token': DEVICE_TOKEN,
      },
      body: JSON.stringify(payload),
    });

    // 401 → 토큰 만료, 즉시 갱신 후 1회 재시도
    if (res.status === 401 && !isRetry) {
      console.warn('[TOKEN] 401 수신 — 토큰 즉시 갱신 후 재시도');
      identityToken = fetchIdentityToken();
      return postTelemetry(payload, true);
    }

    const result = await res.json().catch(() => ({}));
    const frame  = result.frame ?? {};

    // 응답에서 값 추출, 없으면 보낸 payload의 값 사용
    const I_A    = frame.I_A    ?? payload.I_A    ?? payload.currentA ?? '?';
    const status = frame.status ?? payload.status ?? '?';

    const ts = new Date().toISOString();
    console.log(`[OK]   ${ts}  I_A=${I_A}A  status=${status}  http=${res.status}`);

    consecutiveErrors = 0;
    return true;

  } catch (err) {
    consecutiveErrors++;
    console.error(`[ERR]  POST 실패 (${consecutiveErrors}회): ${err.message}`);

    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      console.error(`[ERR]  연속 실패 ${MAX_CONSECUTIVE_ERRORS}회 — 네트워크/Cloud Run 상태 확인 필요`);
      consecutiveErrors = 0;  // 경고 후 카운터 리셋
    }
    return false;
  }
}

// ── Serial 포트 열기 ──────────────────────────────────────────────────────────
console.log('');
console.log('  FieldKeeper Serial → Cloud Run Bridge');
console.log('  ──────────────────────────────────────');
console.log(`  포트     : ${portPath} @ ${BAUD_RATE} baud`);
console.log(`  Cloud Run: ${CLOUD_RUN_URL}`);
console.log('');

const port   = new SerialPort({ path: portPath, baudRate: BAUD_RATE });
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

port.on('open', () => {
  console.log(`[SERIAL] ${portPath} 연결됨 — JSON 수신 대기 중...`);
  console.log('  Ctrl+C 로 종료\n');
});

port.on('error', (err) => {
  console.error(`[SERIAL ERR] ${err.message}`);
  console.error(`  포트 "${portPath}" 가 존재하는지, XIAO가 연결됐는지 확인하세요.`);
  process.exit(1);
});

// ── 핵심 루프: 한 줄씩 읽어 JSON parse → POST ────────────────────────────────
parser.on('data', (line) => {
  const raw = line.trim();

  // 빈 줄, 비JSON 시작 문자 skip
  if (!raw || !raw.startsWith('{')) return;

  // JSON parse
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    console.log(`[SKIP] JSON parse 실패: ${raw.slice(0, 60)}`);
    return;
  }

  // currentA → I_A 필드 정규화
  // (XIAO 펌웨어가 currentA를 쓸 경우 대응)
  if (typeof payload.currentA === 'number' && typeof payload.I_A !== 'number') {
    payload.I_A = payload.currentA;
  }

  // I_A 없으면 skip
  if (typeof payload.I_A !== 'number') {
    console.log(`[SKIP] I_A/currentA 필드 없음: ${raw.slice(0, 60)}`);
    return;
  }

  // 비동기 POST (await하지 않아 다음 줄 수신을 블로킹하지 않음)
  postTelemetry(payload);
});

// ── 종료 핸들러 ───────────────────────────────────────────────────────────────
process.on('SIGINT', () => {
  console.log('\n[STOP] 브릿지 종료 중...');
  port.close(() => {
    console.log('[STOP] 포트 닫힘. 종료.');
    process.exit(0);
  });
});
