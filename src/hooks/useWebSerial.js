// ─── useWebSerial.js ───────────────────────────────────
// XIAO ESP32-C3 Web Serial 연결 커스텀 훅
// baudRate: 115200 (ESP32 Serial.begin(115200) 기준)
// 지원 브라우저: Chrome 89+, Edge 89+
// 미지원 시 isSupported=false, caller가 mock fallback 처리

import { useState, useRef, useCallback } from 'react';

const BAUD_RATE = 115200;

export function useWebSerial() {
  // navigator.serial 지원 여부 (렌더 중 변하지 않으므로 상수로 처리)
  const isSupported =
    typeof navigator !== 'undefined' && 'serial' in navigator;

  const [isConnected, setIsConnected] = useState(false);
  const [telemetry,   setTelemetry]   = useState(null);
  const [error,       setError]       = useState(null);

  const portRef   = useRef(null);
  const readerRef = useRef(null);

  // ── connect: 포트 선택 다이얼로그 → 열기 → 스트리밍 시작 ──
  const connect = useCallback(async () => {
    if (!isSupported) {
      setError('Web Serial API not supported in this browser.');
      return;
    }
    try {
      setError(null);

      // 사용자 포트 선택 (취소 시 NotFoundError)
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: BAUD_RATE });
      portRef.current = port;
      setIsConnected(true);

      // UART 바이트 → TextDecoder → 줄 단위 파싱
      const decoder = new TextDecoderStream();
      // port.readable → decoder.writable (파이프)
      // 포트 닫힐 때 파이프 오류는 무시
      port.readable.pipeTo(decoder.writable).catch(() => {});
      const reader = decoder.readable.getReader();
      readerRef.current = reader;

      let buf = '';

      // Read loop (포트 닫힐 때까지 계속)
      ;(async () => {
        try {
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;

            buf += value;
            const lines = buf.split('\n');
            buf = lines.pop() ?? ''; // 미완성 줄은 버퍼에 보관

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              try {
                // ESP32가 출력하는 JSON 텔레메트리 파싱
                // 예: {"ts":1234567890,"I_A":0.423,"status":"normal","servo":"idle"}
                const frame = JSON.parse(trimmed);
                setTelemetry(frame);
                setError(null);
              } catch {
                // JSON이 아닌 디버그 출력 등은 무시
              }
            }
          }
        } catch (err) {
          // AbortError는 disconnect() 호출 시 정상 종료
          if (err.name !== 'AbortError') {
            setError(err.message ?? 'Serial read error');
          }
        } finally {
          setIsConnected(false);
          setTelemetry(null);
          portRef.current   = null;
          readerRef.current = null;
        }
      })();

    } catch (err) {
      // 사용자가 포트 선택을 취소한 경우 — 오류 표시 안 함
      if (err.name === 'NotFoundError') return;
      setError(err.message ?? 'Failed to open serial port');
      setIsConnected(false);
    }
  }, [isSupported]);

  // ── disconnect: reader 취소 → 포트 닫기 ──────────────
  const disconnect = useCallback(async () => {
    try { await readerRef.current?.cancel(); } catch { /* ok */ }
    try { await portRef.current?.close();   } catch { /* ok */ }
    readerRef.current = null;
    portRef.current   = null;
    setIsConnected(false);
    setTelemetry(null);
  }, []);

  return {
    isSupported,
    isConnected,
    telemetry,   // 최신 JSON 프레임 or null
    connect,
    disconnect,
    error,       // 마지막 오류 메시지 or null
  };
}
