// ─── SensorPocCard.jsx ────────────────────────────────
// 본선 발표용 하드웨어 PoC 패널
// XIAO ESP32-C3 + ACS712 5A + SG90 Servo
//
// 기능:
//  - Web Serial로 XIAO JSON 텔레메트리 수신 (115200 baud)
//  - 미연결 시 mock 프로파일로 자동 fallback (DEMO MODE)
//  - D4: 이상 전류 주입 → AnomalyList + AIReport 트리거
//  - D3: 관리자 장치 정지 조치 완료 표시
//  - MQTT-ready Payload 표시 + JSON Copy
//  - RAG 근거 문서 링크

import { useState, useEffect, useRef } from 'react';
import {
  Cpu, Zap, AlertTriangle, CheckCircle, Activity,
  Wifi, WifiOff, Copy, Check, ExternalLink, BookOpen, StopCircle,
} from 'lucide-react';
import { useWebSerial } from '../hooks/useWebSerial';
import {
  MQTT_TOPIC,
  WARNING_THRESHOLD,
  ALERT_THRESHOLD,
  MOCK_INTERVAL_MS,
  NORMAL_PROFILE,
  ANOMALY_PROFILE,
  RECOVERY_PROFILE,
  getMockFrame,
  RAG_DOCUMENTS,
  XIAO_ANOMALY_REPORTS,
} from '../data/sensorMockData';

// ── Phase 상수 ─────────────────────────────────────────
const PHASE = { NORMAL: 'normal', ANOMALY: 'anomaly', RECOVERY: 'recovery' };

function profileFor(phase) {
  if (phase === PHASE.ANOMALY)   return ANOMALY_PROFILE;
  if (phase === PHASE.RECOVERY)  return RECOVERY_PROFILE;
  return NORMAL_PROFILE;
}

// ── 내부 소형 헬퍼 ─────────────────────────────────────
function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ color: '#475569', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: '9.5px', fontWeight: 600, color: '#64748b', width: '46px', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#cbd5e1' }}>{value}</span>
    </div>
  );
}

function MiniCell({ label, value, color }) {
  return (
    <div style={{
      background: 'rgba(74,90,138,0.12)', borderRadius: '6px', padding: '4px 6px',
    }}>
      <div style={{ fontSize: '8.5px', fontWeight: 600, color: '#64748b', marginBottom: '1px' }}>{label}</div>
      <div style={{ fontSize: '9.5px', fontWeight: 700, color: color || '#94a3b8' }}>{value}</div>
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────
export default function SensorPocCard({ isMobile, onAnomaly }) {
  // ── Web Serial ──────────────────────────────────────
  const { isSupported, isConnected, telemetry, connect, disconnect, error: serialError } = useWebSerial();

  // ── Mock 상태 (Web Serial 미연결 시 사용) ────────────
  const phaseRef     = useRef(PHASE.NORMAL);
  const frameIdxRef  = useRef(0);
  const phaseCountRef = useRef(0);
  const [mockFrame, setMockFrame] = useState(() => getMockFrame(NORMAL_PROFILE, 0));

  // ── D3 상태 ─────────────────────────────────────────
  const [d3Status, setD3Status] = useState(null); // null | { time }
  // ── Copy 상태 ────────────────────────────────────────
  const [copied, setCopied] = useState(false);
  // ── D4 throttle (10초 중복 방지) ──────────────────────
  const lastD4Ref = useRef(0);

  // ── 활성 프레임 결정 ────────────────────────────────
  // 실제 연결된 경우 telemetry 우선, 아니면 mockFrame
  const activeFrame = (isConnected && telemetry) ? telemetry : mockFrame;
  const isLive      = isConnected && !!telemetry;

  const I_A    = activeFrame?.I_A    ?? 0;
  const status = activeFrame?.status ?? 'normal';
  const servo  = activeFrame?.servo  ?? 'idle';

  const isAlert   = I_A >= ALERT_THRESHOLD;
  const isWarning = I_A >= WARNING_THRESHOLD;

  const statusColor = isAlert   ? '#ef4444'
                    : isWarning ? '#f59e0b'
                    : '#10b981';
  const statusBg    = isAlert   ? 'rgba(239,68,68,0.10)'
                    : isWarning ? 'rgba(245,158,11,0.10)'
                    : 'rgba(16,185,129,0.10)';

  // 진행 막대 % (0.05 ~ 1.50A 기준)
  const currentPct = Math.min(100, Math.round(((I_A - 0.05) / (1.50 - 0.05)) * 100));

  // ── Mock 업데이트 루프 ───────────────────────────────
  // isConnected=true 이면 실제 serial 우선, mock 루프는 멈추지 않지만 표시에 쓰이지 않음
  useEffect(() => {
    const id = setInterval(() => {
      // 인덱스 증가
      frameIdxRef.current++;
      phaseCountRef.current++;

      const phase   = phaseRef.current;
      const profile = profileFor(phase);

      // 페이즈 전환 체크
      if (phase === PHASE.ANOMALY && phaseCountRef.current >= ANOMALY_PROFILE.length) {
        phaseRef.current      = PHASE.RECOVERY;
        phaseCountRef.current = 0;
        frameIdxRef.current   = 0;
      } else if (phase === PHASE.RECOVERY && phaseCountRef.current >= RECOVERY_PROFILE.length) {
        phaseRef.current      = PHASE.NORMAL;
        phaseCountRef.current = 0;
        frameIdxRef.current   = 0;
      }

      setMockFrame(getMockFrame(profileFor(phaseRef.current), frameIdxRef.current));
    }, MOCK_INTERVAL_MS);

    return () => clearInterval(id);
  }, []); // 마운트 시 1회만 — 페이즈는 ref로 관리

  // ── D4: 이상 전류 주입 ───────────────────────────────
  function handleD4() {
    // 10초 throttle — 중복 이벤트 방지
    const now = Date.now();
    if (now - lastD4Ref.current < 10_000) return;
    lastD4Ref.current = now;

    // mock 페이즈를 즉시 ANOMALY로 전환
    phaseRef.current      = PHASE.ANOMALY;
    phaseCountRef.current = 0;
    frameIdxRef.current   = 0;
    setMockFrame(getMockFrame(ANOMALY_PROFILE, 0));

    // 부모(App.jsx)에 XIAO 센서 이상 이벤트 전달
    if (typeof onAnomaly === 'function') {
      const d = new Date();
      const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      onAnomaly({
        equipment:  'XIAO ESP32-C3',
        typeKey:    'sensorCurrent',
        severity:   'HIGH',
        time,
        sortIndex:  Date.now(),
        createdAt:  d.toISOString(),
        reports:    XIAO_ANOMALY_REPORTS,
      });
    }
  }

  // ── D3: 관리자 장치 정지 ─────────────────────────────
  function handleD3() {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    setD3Status({ time });
    // mock이 ANOMALY/RECOVERY 상태면 RECOVERY로 전환
    if (phaseRef.current !== PHASE.NORMAL) {
      phaseRef.current      = PHASE.RECOVERY;
      phaseCountRef.current = 0;
      frameIdxRef.current   = 0;
    }
  }

  // ── MQTT Payload 객체 ────────────────────────────────
  const mqttPayload = {
    topic:  MQTT_TOPIC,
    ts:     activeFrame?.ts ?? Date.now(),
    I_A,
    status,
    servo,
    source: isLive ? 'xiao-serial' : 'mock',
  };

  function handleCopy() {
    navigator.clipboard
      .writeText(JSON.stringify(mqttPayload, null, 2))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {/* HTTPS 필요 환경에서만 실패 */});
  }

  // ── 렌더 ─────────────────────────────────────────────
  return (
    <div
      id="sensor-poc-card"
      className="glass-card animate-fade-in-up"
      style={{
        padding: '14px 16px 14px',
        flexShrink: 0,
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        animationDelay: '350ms',
      }}
    >
      {/* ───────────────────────────────────────────────
          섹션 1: 헤더
      ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
            background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Cpu size={14} style={{ color: '#00e5ff' }} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9', letterSpacing: '0.02em' }}>
              Hardware PoC
            </div>
            <div style={{ fontSize: '9px', fontWeight: 600, color: '#64748b', marginTop: '1px' }}>
              XIAO ESP32-C3 · ACS712 5A · SG90 Servo
            </div>
          </div>
        </div>
        {/* Live / Demo 뱃지 */}
        <span style={{
          fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em',
          padding: '2px 8px', borderRadius: '9999px', flexShrink: 0, whiteSpace: 'nowrap',
          background: isLive ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
          border:     `1px solid ${isLive ? 'rgba(16,185,129,0.4)' : 'rgba(59,130,246,0.3)'}`,
          color:      isLive ? '#34d399' : '#93c5fd',
        }}>
          {isLive ? '● XIAO LIVE' : 'DEMO MODE'}
        </span>
      </div>

      {/* 하드웨어 사양 요약 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <InfoRow icon={<Cpu size={10} />}      label="Device"  value="XIAO ESP32-C3" />
        <InfoRow icon={<Zap size={10} />}      label="Sensor"  value="ACS712 5A (±1.5%)" />
        <InfoRow icon={<Activity size={10} />} label="Load"    value="SG90 Servo / 저전압" />
      </div>

      {/* ───────────────────────────────────────────────
          섹션 2: Web Serial 연결 버튼
      ─────────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(21,29,53,0.55)', border: '1px solid rgba(74,90,138,0.2)',
        borderRadius: '8px', padding: '8px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0, flex: 1 }}>
          {isConnected
            ? <Wifi    size={11} style={{ color: '#10b981', flexShrink: 0 }} />
            : <WifiOff size={11} style={{ color: '#475569', flexShrink: 0 }} />
          }
          <span style={{
            fontSize: '9.5px', fontWeight: 600, flexShrink: 1, minWidth: 0,
            color: isConnected ? '#34d399' : isSupported ? '#64748b' : '#475569',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {isConnected
              ? 'XIAO 연결됨 · 115200 baud'
              : isSupported
                ? 'Web Serial 지원 · 미연결'
                : 'Web Serial 미지원 — Demo 모드'}
          </span>
          {serialError && (
            <span style={{ fontSize: '8.5px', color: '#f87171', flexShrink: 0 }}>
              ⚠
            </span>
          )}
        </div>
        <button
          id="btn-connect-xiao"
          onClick={isConnected ? disconnect : connect}
          disabled={!isSupported}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', borderRadius: '6px', flexShrink: 0,
            fontSize: '10px', fontWeight: 700,
            cursor: isSupported ? 'pointer' : 'not-allowed',
            opacity: isSupported ? 1 : 0.55,
            background: isConnected ? 'rgba(239,68,68,0.10)' : 'rgba(0,229,255,0.08)',
            border: `1px solid ${isConnected ? 'rgba(239,68,68,0.3)' : 'rgba(0,229,255,0.2)'}`,
            color:  isConnected ? '#f87171' : isSupported ? '#00e5ff' : '#475569',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            if (!isSupported) return;
            e.currentTarget.style.background = isConnected ? 'rgba(239,68,68,0.18)' : 'rgba(0,229,255,0.15)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = isConnected ? 'rgba(239,68,68,0.10)' : 'rgba(0,229,255,0.08)';
          }}
        >
          {isConnected ? <WifiOff size={10} /> : <Wifi size={10} />}
          {isConnected ? '연결 해제' : 'Connect XIAO'}
        </button>
      </div>

      {/* ───────────────────────────────────────────────
          섹션 3: 실시간 텔레메트리
      ─────────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(0,229,255,0.04)', border: `1px solid ${isAlert ? 'rgba(239,68,68,0.25)' : 'rgba(0,229,255,0.12)'}`,
        borderRadius: '10px', padding: '10px 12px',
        transition: 'border-color 0.4s',
      }}>
        {/* 전류값 숫자 */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
          <span style={{
            fontSize: '28px', fontWeight: 800, lineHeight: 1,
            color: statusColor, transition: 'color 0.4s',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {I_A.toFixed(3)}
          </span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>A</span>
          <span style={{ fontSize: '9px', color: '#475569', marginLeft: '8px' }}>
            {isLive ? '● XIAO Real' : '● Mock'}
          </span>
        </div>

        {/* 진행 막대 */}
        <div style={{
          height: '5px', background: 'rgba(255,255,255,0.06)',
          borderRadius: '9999px', overflow: 'hidden', marginBottom: '8px',
        }}>
          <div style={{
            height: '100%', width: `${currentPct}%`, borderRadius: '9999px',
            background: isAlert   ? 'linear-gradient(90deg,#ef4444,#dc2626)'
                       : isWarning ? 'linear-gradient(90deg,#f59e0b,#ef4444)'
                       : 'linear-gradient(90deg,#00e5ff,#10b981)',
            transition: 'width 1.5s cubic-bezier(0.4,0,0.2,1), background 0.4s',
          }} />
        </div>

        {/* 3칸 그리드: 상태 / 서보 / 임계값 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
          <MiniCell
            label="상태"
            value={status === 'alert' ? '● Alert' : status === 'warning' ? '● Warning' : '● Normal'}
            color={statusColor}
          />
          <MiniCell label="서보" value={servo} color="#94a3b8" />
          <MiniCell label="임계값" value={`${WARNING_THRESHOLD} A`} color="#6b7280" />
        </div>
      </div>

      {/* ───────────────────────────────────────────────
          섹션 4: D4 / D3 버튼
      ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '7px' }}>
        {/* D4: 이상 전류 주입 */}
        <button
          id="btn-d4-inject"
          onClick={handleD4}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            padding: '8px 0', borderRadius: '8px', cursor: 'pointer',
            fontSize: '10px', fontWeight: 700,
            background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.20)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.10)'; }}
        >
          <Zap size={11} />
          D4 — 이상 전류 주입
        </button>

        {/* D3: 장치 정지 */}
        <button
          id="btn-d3-stop"
          onClick={handleD3}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            padding: '8px 0', borderRadius: '8px', cursor: 'pointer',
            fontSize: '10px', fontWeight: 700,
            background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.3)',
            color: '#a5b4fc', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.20)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.10)'; }}
        >
          <StopCircle size={11} />
          D3 — 장치 정지
        </button>
      </div>

      {/* D3 조치 완료 메시지 */}
      {d3Status && (
        <div style={{
          fontSize: '9.5px', fontWeight: 600, lineHeight: 1.5,
          color: '#a5b4fc',
          background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: '6px', padding: '6px 10px',
        }}>
          🔵 {d3Status.time} — 관리자 장치 정지 조치 완료 · 후속 점검 대기
        </div>
      )}

      {/* ───────────────────────────────────────────────
          섹션 5: MQTT-ready Payload
      ─────────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(10,16,30,0.7)', border: '1px solid rgba(74,90,138,0.2)',
        borderRadius: '8px', padding: '8px 10px',
      }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em' }}>
            MQTT Payload
          </span>
          <button
            id="btn-copy-mqtt"
            onClick={handleCopy}
            style={{
              display: 'flex', alignItems: 'center', gap: '3px',
              padding: '2px 8px', borderRadius: '5px', cursor: 'pointer',
              fontSize: '9px', fontWeight: 700, transition: 'all 0.2s',
              background: copied ? 'rgba(16,185,129,0.12)' : 'rgba(74,90,138,0.15)',
              border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(74,90,138,0.25)'}`,
              color: copied ? '#34d399' : '#9aaad0',
            }}
          >
            {copied ? <Check size={9} /> : <Copy size={9} />}
            {copied ? '복사됨!' : 'Copy JSON'}
          </button>
        </div>

        {/* topic 줄 */}
        <div style={{ fontFamily: 'monospace', fontSize: '8.5px', color: '#64748b', marginBottom: '3px' }}>
          <span style={{ color: '#6b7db0' }}>topic:</span>{' '}
          <span style={{ color: '#60a5fa' }}>"{MQTT_TOPIC}"</span>
        </div>

        {/* payload 줄 */}
        <div style={{ fontFamily: 'monospace', fontSize: '8.5px', color: '#94a3b8', lineHeight: 1.6 }}>
          <span style={{ color: '#a78bfa' }}>I_A:</span>{' '}
          <span style={{ color: statusColor }}>{I_A.toFixed(3)}</span>
          {'  '}
          <span style={{ color: '#a78bfa' }}>status:</span>{' '}
          <span style={{ color: statusColor }}>"{status}"</span>
          {'  '}
          <span style={{ color: '#a78bfa' }}>servo:</span>{' '}
          <span style={{ color: '#94a3b8' }}>"{servo}"</span>
        </div>
      </div>

      {/* ───────────────────────────────────────────────
          섹션 6: RAG 근거 문서
      ─────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
          <BookOpen size={10} style={{ color: '#64748b' }} />
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.03em' }}>
            RAG 근거 문서
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {RAG_DOCUMENTS.map((doc, i) => (
            <a
              key={i}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '6px',
                padding: '5px 8px', borderRadius: '6px', textDecoration: 'none',
                background: 'rgba(74,90,138,0.08)', border: '1px solid rgba(74,90,138,0.14)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,90,138,0.20)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(74,90,138,0.08)'; }}
            >
              <ExternalLink size={9} style={{ color: '#475569', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '9px', fontWeight: 700, color: '#c8d2e8', lineHeight: 1.35 }}>
                  {doc.title}
                </div>
                <div style={{ fontSize: '8.5px', fontWeight: 500, color: '#64748b', marginTop: '1px' }}>
                  {doc.desc}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
