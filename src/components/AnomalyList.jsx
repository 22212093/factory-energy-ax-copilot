
function sortEventsByTimeDesc(events = []) {
  return [...events].sort((a, b) =>
    String(b.time || '').localeCompare(String(a.time || ''))
  );
}

function formatAnomalyListTypeText(typeKey, label, language = 'ko') {
  const koMap = {
    powerSpike: '전력 급증',
    offHourUsage: '비작업시간 전력 사용',
    repetitivePattern: '반복 사용 패턴',
    coolingLoad: '냉각 부하 증가',
    standbyPower: '대기전력 과다',
  };

  if (language === 'ko') {
    const base = koMap[typeKey] || label || typeKey || '이상 이벤트';
    return base.endsWith('감지') ? base : `${base} 감지`;
  }

  return label || typeKey || 'Anomaly detected';
}
import { Clock, AlertTriangle } from 'lucide-react';

const severityStyles = {
  HIGH: {
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.3)',
    text: '#ef4444',
    dot: '#ef4444',
  },
  MEDIUM: {
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.3)',
    text: '#f59e0b',
    dot: '#f59e0b',
  },
  LOW: {
    bg: 'rgba(16,185,129,0.1)',
    border: 'rgba(16,185,129,0.3)',
    text: '#10b981',
    dot: '#10b981',
  },
};

export default function AnomalyList({ events, selectedId, onSelect, t }) {
  const sortedEvents = sortEventsByTimeDesc(events);
  return (
    <div
      id="anomaly-events"
      className="glass-card animate-fade-in-up"
      style={{
        animationDelay: '300ms',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '12px 14px',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            <AlertTriangle size={13} style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', lineHeight: 1.3, margin: 0 }}>
              {t.anomalyEventsTitle}
            </h2>
            <p style={{ fontSize: '10px', fontWeight: 600, color: '#cbd5e1', lineHeight: 1.3, margin: '1px 0 0' }}>
              {events.length} {t.detectedToday}
            </p>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '9999px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.15)',
          }}
        >
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444' }} className="animate-pulse" />
          <span style={{ fontSize: '9px', fontWeight: 700, color: '#ef4444' }}>{t.live}</span>
        </div>
      </div>

      {/* Event list: maxHeight holds exactly 3 cards; auto-scrolls for 4+ */}
      <div
        style={{
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingRight: '2px',
          // 3 cards × 52px + 2 gaps × 8px = 172px
          maxHeight: '172px',
        }}
      >
        {sortedEvents.map((event, idx) => {
          const severity = severityStyles[event.severity];
          const isSelected = selectedId === event.id;
          const eventType = t[event.typeKey] || event.typeKey;

          return (
            <button
              key={event.id}
              id={`anomaly-event-${event.id}`}
              onClick={() => onSelect(event.id)}
              className="animate-fade-in-up"
              style={{
                animationDelay: `${350 + idx * 80}ms`,
                width: '100%',
                textAlign: 'left',
                borderRadius: '10px',
                padding: '10px 12px',
                border: `1px solid ${isSelected ? 'rgba(0,229,255,0.25)' : 'rgba(74,90,138,0.15)'}`,
                background: isSelected ? 'rgba(0,229,255,0.06)' : 'rgba(21,29,53,0.5)',
                boxShadow: isSelected ? '0 0 16px rgba(0,229,255,0.08)' : 'none',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'rgba(74,90,138,0.35)';
                  e.currentTarget.style.background = 'rgba(21,29,53,0.7)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'rgba(74,90,138,0.15)';
                  e.currentTarget.style.background = 'rgba(21,29,53,0.5)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: severity.dot,
                      boxShadow: `0 0 5px ${severity.dot}60`,
                    }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>
                        {event.equipment}
                      </span>
                      <span
                        style={{
                          fontSize: '9px',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          flexShrink: 0,
                          background: severity.bg,
                          color: severity.text,
                          border: `1px solid ${severity.border}`,
                        }}
                      >
                        {event.severity}
                      </span>
                    </div>
                    <p style={{ fontSize: '10px', fontWeight: 600, color: '#cbd5e1', marginTop: '1px' }}>
                      {eventType}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#94a3b8' }}>
                  <Clock size={9} />
                  <span style={{ fontSize: '10px', fontWeight: 700 }}>{event.time}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}




