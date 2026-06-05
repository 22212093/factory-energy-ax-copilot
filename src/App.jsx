import { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import MetricCard from './components/MetricCard';
import PowerChart from './components/PowerChart';
import AnomalyList from './components/AnomalyList';
import AIReport from './components/AIReport';
import SensorPocCard from './components/SensorPocCard';
import {
  metrics,
  anomalyEvents as seedEvents,
  eventTemplates,
  generatePowerData,
  getSpikeTime,
  consumeNextId,
} from './data/mockData';
import translations from './data/translations';

// ─── Settings helpers ──────────────────────────────────
const DEFAULT_SETTINGS = {
  liveMode: true,
  interval: 60,       // seconds between simulated events
  threshold: 80,      // kW threshold line on chart
  notifications: true,
  aiMode: 'mock',     // 'mock' | 'gemini'
};

function loadSettings() {
  try {
    const saved = localStorage.getItem('fax-copilot-settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function persistSettings(s) {
  try { localStorage.setItem('fax-copilot-settings', JSON.stringify(s)); } catch { /* ignore */ }
}

// ─── Time helpers ──────────────────────────────────────
function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function eventHHMM(event) {
  if (event?.time) return event.time;

  const d = new Date(event?.createdAt);
  if (!Number.isNaN(d.getTime())) {
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  return nowHHMM();
}

function nowHHMMSS() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
}

// ─── Responsive helper ─────────────────────────────────
function useIsMobile(breakpoint = 768) {
  const getValue = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= breakpoint;
  };

  const [isMobile, setIsMobile] = useState(getValue);

  useEffect(() => {
    const handleResize = () => setIsMobile(getValue());
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [breakpoint]);

  return isMobile;
}

// ─── App ───────────────────────────────────────────────
export default function App() {
  const [language, setLanguage] = useState('ko');
  const [selectedEventId, setSelectedEventId] = useState(1);

  // Live event list — starts with seed events (time-stamped relative to now)
  const [events, setEvents] = useState(() => {
    const offsets = [8, 5, 2]; // minutes ago per seed (oldest → newest)
    return seedEvents.map((ev, i) => {
      const d = new Date(Date.now() - (offsets[i] ?? 0) * 60_000);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return {
        ...ev,
        time: `${hh}:${mm}`,
        sortIndex:  d.getTime(),
        createdAt:  d.toISOString(),
      };
    });
  });

  // Notifications — separate from event list
  const [notifList, setNotifList] = useState([]);

  // Settings (persisted)
  const [settings, setSettings] = useState(loadSettings);

  // Real current time string (HH:MM:SS), updates every second
  const [currentTime, setCurrentTime] = useState(nowHHMMSS);

  // Power chart data (regenerated every minute)
  const [chartData, setChartData] = useState(() => generatePowerData());

  // Interval ref for simulation (so we can cancel/restart on settings change)
  const simTimerRef = useRef(null);

  const isMobile = useIsMobile(768);
  const t = translations[language];
  const spikeTime = getSpikeTime(chartData);

  // ── Clock: tick every second ──
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(nowHHMMSS()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Chart: regenerate every 60 seconds so times stay current ──
  useEffect(() => {
    const id = setInterval(() => setChartData(generatePowerData()), 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Live anomaly simulation ──
  const fireNewEvent = useCallback(() => {
    // LIVE_ANOMALY_DUPLICATE_GUARD_START
    const liveAnomalyNow = Date.now();

    if (typeof window !== 'undefined') {
      if (!window.__faxLiveAnomalyGuard) {
        window.__faxLiveAnomalyGuard = {
          lastAt: 0,
        };
      }

      if (
        window.__faxLiveAnomalyGuard.lastAt &&
        liveAnomalyNow - window.__faxLiveAnomalyGuard.lastAt < 55_000
      ) {
        return;
      }

      window.__faxLiveAnomalyGuard.lastAt = liveAnomalyNow;
    }
    // LIVE_ANOMALY_DUPLICATE_GUARD_END
const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
    const id = consumeNextId();
    const time = nowHHMM();

    const newEvent = {
      id,
      time,
      equipment: template.equipment,
      typeKey: template.typeKey,
      severity: template.severity,
      reports: template.reports,
      sortIndex: Date.now(),
      createdAt: new Date().toISOString(),
    };

    // Prepend to event list (newest first)
    setEvents(prev => [newEvent, ...prev]);
      // LIVE_ANOMALY_HEADER_EVENT_START
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('fax-anomaly-detected', {
          detail: {
            event: newEvent,
            language: language,
          },
        }));
      }

      window.setTimeout(() => {
        setSelectedEventId(newEvent.id);
      }, 5000);
      // LIVE_ANOMALY_HEADER_EVENT_END

    // Add notification if enabled
    if (settings.notifications) {
      setNotifList(prev => [{
        id,
        equipment: template.equipment,
        typeKey: template.typeKey,
        severity: template.severity,
        time: newEvent.time,
        read: false,
      }, ...prev]);
    }
  }, [settings.notifications]);

  useEffect(() => {
    // Clear any existing timer
    if (simTimerRef.current) clearInterval(simTimerRef.current);

    if (!settings.liveMode) return;

    // Start a new interval based on current settings.interval
    const firstAnomalyTimer = window.setTimeout(fireNewEvent, 5_000);
    simTimerRef.current = setInterval(fireNewEvent, 65_000);

    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [settings.liveMode, settings.interval, fireNewEvent]);

  // ── Settings handlers ──
  function handleSettingsChange(newSettings) {
    setSettings(newSettings);
    persistSettings(newSettings);
  }

  // ── Notification handlers ──
  function handleMarkRead(notifId) {
    // Mark as read (badge decreases) but keep in list until dismissed
    setNotifList(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  }

  function handleDismissNotif(notifId) {
    // Remove from notification panel only — anomaly event stays in AnomalyList
    setNotifList(prev => prev.filter(n => n.id !== notifId));
  }

  function handleDismissAllNotifs() {
    setNotifList([]);
  }

  // ── Sensor PoC D4 이상 전류 이벤트 핸들러 ──────────
  // SensorPocCard의 D4 클릭 → AnomalyList 추가 + AIReport 선택
  const handleSensorAnomaly = useCallback((eventData) => {
    const id = consumeNextId();
    const now = Date.now();
    const createdAt = eventData.createdAt ?? new Date(now).toISOString();
    const newEvent = {
      ...eventData,
      id,
      time:       eventData.time       ?? eventHHMM({ createdAt }),
      sortIndex:  eventData.sortIndex  ?? now,
      createdAt,
    };
    setEvents(prev => [newEvent, ...prev]);
    setSelectedEventId(newEvent.id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fax-anomaly-detected', {
        detail: {
          // Header의 기존 전력 이상 알림 문구를 재사용하고 센서 이벤트 자체는 sensorCurrent로 유지
          event: { ...newEvent, typeKey: 'powerSpike' },
          language,
        },
      }));
    }
    if (settings.notifications) {
      setNotifList(prev => [{
        id,
        equipment: newEvent.equipment,
        typeKey:   newEvent.typeKey,
        severity:  newEvent.severity,
        time:      newEvent.time,
        read:      false,
      }, ...prev]);
    }
  }, [language, settings.notifications]);


  // ── AI report notification bridge ──
  useEffect(() => {
    function handleReportGeneratedNotification(e) {
      const detail = e.detail || {};

      // Ignore stale events from a previous language state
      if (detail.language && detail.language !== language) return;

      const labelsByLang = {
        ko: { done: 'AI 리포트 생성 완료', saving: '예상 절감' },
        en: { done: 'AI report generated', saving: 'Expected saving' },
        ja: { done: 'AIレポート生成完了', saving: '予想削減' },
        zh: { done: 'AI报告生成完成', saving: '预计节省' },
        fr: { done: 'Rapport IA généré', saving: 'Économie estimée' },
        de: { done: 'KI-Bericht generiert', saving: 'Erwartete Einsparung' },
        id: { done: 'Laporan AI dibuat', saving: 'Estimasi penghematan' },
      };

      const labels = labelsByLang[language] || labelsByLang.en;
      const equipment = detail.event?.equipment || detail.report?.title || 'AI Report';
      const savings = detail.report?.savings ? ` · ${labels.saving} ${detail.report.savings}` : '';
      const time = eventHHMM(detail.event);

      setNotifList((prev) => [
        {
          id: `report-${detail.event?.id || Date.now()}-${Date.now()}`,
          equipment,
          typeKey: 'aiReportGenerated',
          severity: detail.source === 'gemini' ? 'info' : 'medium',
          time,
          read: false,
          text: `${labels.done}: ${equipment}${savings}`,
        },
        ...prev,
      ]);
    }

    window.addEventListener('fax-report-generated', handleReportGeneratedNotification);
    return () => window.removeEventListener('fax-report-generated', handleReportGeneratedNotification);
  }, [language]);

  function handleAIReportGenerated(detail) {
    const labelsByLang = {
      ko: { done: 'AI 리포트 생성 완료', saving: '예상 절감' },
      en: { done: 'AI report generated', saving: 'Expected saving' },
      ja: { done: 'AIレポート生成完了', saving: '予想削減' },
      zh: { done: 'AI报告生成完成', saving: '预计节省' },
      fr: { done: 'Rapport IA généré', saving: 'Économie estimée' },
      de: { done: 'KI-Bericht generiert', saving: 'Erwartete Einsparung' },
      id: { done: 'Laporan AI dibuat', saving: 'Estimasi penghematan' },
    };

    const labels = labelsByLang[language] || labelsByLang.en;
    const equipment = detail?.event?.equipment || detail?.report?.title || 'AI Report';
    const savings = detail?.report?.savings ? ` · ${labels.saving} ${detail.report.savings}` : '';
    const sourceLabel = detail?.source === 'gemini' ? 'Gemini Live' : 'Local Rule';
    const time = eventHHMM(detail?.event);

    setNotifList((prev) => [
      {
        id: `report-${detail?.event?.id || 'event'}-${Date.now()}`,
        equipment,
        typeKey: 'aiReportGenerated',
        severity: detail?.source === 'gemini' ? 'info' : 'medium',
        time,
        read: false,
        text: `${labels.done}: ${equipment}${savings} · ${sourceLabel}`,
      },
      ...prev,
    ].slice(0, 12));
  }

  // REPORT_NOTIFICATION_V2_START
  useEffect(() => {
    function handleGeneratedReportNotificationV2(e) {
      const detail = e.detail || {};

      const labelsByLang = {
        ko: { done: 'AI 리포트 생성 완료', saving: '예상 절감' },
        en: { done: 'AI report generated', saving: 'Expected saving' },
        ja: { done: 'AIレポート生成完了', saving: '予想削減' },
        zh: { done: 'AI报告生成完成', saving: '预计节省' },
        fr: { done: 'Rapport IA généré', saving: 'Économie estimée' },
        de: { done: 'KI-Bericht generiert', saving: 'Erwartete Einsparung' },
        id: { done: 'Laporan AI dibuat', saving: 'Estimasi penghematan' },
      };

      const labels = labelsByLang[language] || labelsByLang.en;
      const report = detail.report || {};
      const equipment = detail.event?.equipment || report.title || 'AI Report';
      const savings = report.savings ? ' · ' + labels.saving + ' ' + report.savings : '';
      const sourceLabel = detail.source === 'gemini' ? 'Gemini Live' : 'Local Rule';
      const time = eventHHMM(detail.event);

      setNotifList((prev) => [
        {
          id: 'report-' + Date.now(),
          equipment,
          typeKey: 'aiReportGenerated',
          severity: detail.source === 'gemini' ? 'info' : 'medium',
          time,
          read: false,
          text: labels.done + ': ' + equipment + savings + ' · ' + sourceLabel,
        },
        ...prev,
      ].slice(0, 20));
    }

    window.addEventListener('fax-report-generated-v2', handleGeneratedReportNotificationV2);
    return () => window.removeEventListener('fax-report-generated-v2', handleGeneratedReportNotificationV2);
  }, [language]);
  // REPORT_NOTIFICATION_V2_END
  // ── Derived state ──
  const selectedEvent = events.find(e => e.id === selectedEventId);
  const selectedReport = selectedEvent?.reports?.[language] || null;
  const unreadCount = notifList.filter(n => !n.read).length;

  return (
    <div
      id="app-shell"
      className="flex flex-col"
      style={{
        minHeight: isMobile ? '100dvh' : '100vh',
        height: isMobile ? 'auto' : '100vh',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        overflowY: isMobile ? 'auto' : 'hidden',
        background: 'var(--color-navy-950)',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          minHeight: '44px',
          height: isMobile ? 'auto' : '44px',
          flexShrink: 0,
          maxWidth: '100%',
          overflowX: 'hidden',
        }}
      >
        <Header
          language={language}
          setLanguage={setLanguage}
          t={t}
          currentTime={currentTime}
          settings={settings}
          onSettingsChange={handleSettingsChange}
          notifList={notifList}
          unreadCount={unreadCount}
          onMarkRead={handleMarkRead}
          onDismissNotif={handleDismissNotif}
          onDismissAllNotifs={handleDismissAllNotifs}
          events={events}
        />
      </div>

      {/* ── Main content ── */}
      <main
        id="dashboard-main"
        style={{
          height: isMobile ? 'auto' : 'calc(100vh - 44px)',
          minHeight: 0,
          overflowX: 'hidden',
          overflowY: isMobile ? 'visible' : 'hidden',
          padding: isMobile ? '10px 10px 18px' : '10px 12px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '14px' : '12px',
          width: '100%',
          maxWidth: '100%',
        }}
      >
        {/* ── Left column ── */}
        <div
          style={{
            width: isMobile ? '100%' : '66%',
            maxWidth: '100%',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '12px' : '10px',
            overflowX: 'hidden',
            overflowY: isMobile ? 'visible' : 'auto',
          }}
        >
          {/* Metric cards row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile
                ? 'repeat(2, minmax(0, 1fr))'
                : 'repeat(4, minmax(0, 1fr))',
              gap: isMobile ? '10px' : '10px',
              height: isMobile ? 'auto' : '112px',
              minHeight: isMobile ? 'auto' : '112px',
              flexShrink: 0,
              width: '100%',
              maxWidth: '100%',
            }}
          >
            {metrics.map((m, i) => {
              let metric = m;

              if (m.id === 'anomaly-events') {
                metric = {
                  ...m,
                  value: String(events.length),
                  trend: undefined,
                  trendKey: 'live',
                  trendUp: false,
                  suffixText: t.detectedToday || '오늘 감지됨',
                };
              }

              if (m.id === 'ai-reports') {
                metric = {
                  ...m,
                  value: String(events.length),
                  trend: t.ready || '준비됨',
                  trendKey: undefined,
                  trendUp: false,
                  suffixText: t.docxAvailable || 'DOCX 생성 가능',
                };
              }

              return <MetricCard key={m.id} metric={metric} delay={i * 50} t={t} />;
            })}
          </div>

          {/* Power chart */}
          <div
            style={{
              flex: 'none',
              minHeight: 0,
              height: isMobile ? '430px' : '260px',
              overflowX: 'hidden',
              overflowY: 'hidden',
              width: '100%',
              maxWidth: '100%',
            }}
          >
            <PowerChart
              t={t}
              threshold={settings.threshold}
              powerData={chartData}
              spikeTime={spikeTime}
            />
          </div>

          {/* Sensor PoC — 좌측 컬럼 하단 (PowerChart 아래) */}
          <SensorPocCard isMobile={isMobile} onAnomaly={handleSensorAnomaly} language={language} />
        </div>

        {/* ── Right column ── */}
        <div
          style={{
            width: isMobile ? '100%' : '34%',
            maxWidth: '100%',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '12px' : '10px',
            overflowX: 'hidden',
            overflowY: isMobile ? 'visible' : 'hidden',
          }}
        >
          {/* Anomaly events */}
          <div
            style={{
              height: isMobile ? 'auto' : '230px',
              minHeight: isMobile ? '260px' : 0,
              flexShrink: 0,
              overflowX: 'hidden',
              overflowY: isMobile ? 'visible' : 'hidden',
              width: '100%',
              maxWidth: '100%',
            }}
          >
            <AnomalyList
              events={events}
              selectedId={selectedEventId}
              onSelect={setSelectedEventId}
              t={t}
              language={language}
            />
          </div>

          {/* AI Report */}
          <div
            style={{
              flex: isMobile ? 'none' : 1,
              minHeight: isMobile ? '520px' : 0,
              height: isMobile ? 'auto' : 'auto',
              overflowX: 'hidden',
              overflowY: isMobile ? 'visible' : 'hidden',
              width: '100%',
              maxWidth: '100%',
            }}
          >
            <AIReport
              report={selectedReport}
              event={selectedEvent}
              language={language}
              t={t}
            />
          </div>

        </div>
      </main>
    </div>
  );
}













