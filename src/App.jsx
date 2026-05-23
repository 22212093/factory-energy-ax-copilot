import { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import MetricCard from './components/MetricCard';
import PowerChart from './components/PowerChart';
import AnomalyList from './components/AnomalyList';
import AIReport from './components/AIReport';
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

  // Live event list — starts with seed events (newest first)
  const [events, setEvents] = useState([...seedEvents]);

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
    };

    // Prepend to event list (newest first)
    setEvents(prev => [newEvent, ...prev]);

    // Add notification if enabled
    if (settings.notifications) {
      setNotifList(prev => [{
        id,
        equipment: template.equipment,
        typeKey: template.typeKey,
        severity: template.severity,
        time,
        read: false,
      }, ...prev]);
    }
  }, [settings.notifications]);

  useEffect(() => {
    // Clear any existing timer
    if (simTimerRef.current) clearInterval(simTimerRef.current);

    if (!settings.liveMode) return;

    // Start a new interval based on current settings.interval
    simTimerRef.current = setInterval(fireNewEvent, settings.interval * 1000);

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
            overflowY: isMobile ? 'visible' : 'hidden',
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
            {metrics.map((m, i) => (
              <MetricCard key={m.id} metric={m} delay={i * 50} t={t} />
            ))}
          </div>

          {/* Power chart */}
          <div
            style={{
              flex: isMobile ? 'none' : 1,
              minHeight: 0,
              height: isMobile ? '430px' : 'auto',
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


