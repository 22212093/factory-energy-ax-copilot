import { Zap, TrendingUp, AlertTriangle, Brain } from 'lucide-react';

const iconMap = {
  'zap': Zap,
  'trending-up': TrendingUp,
  'alert-triangle': AlertTriangle,
  'brain': Brain,
};

export default function MetricCard({ metric, delay = 0, t }) {
  const Icon = iconMap[metric.icon] || Zap;
  const label = t[metric.labelKey] || metric.labelKey;
  const trend = metric.trendKey ? t[metric.trendKey] : metric.trend;

  return (
    <div
      id={`metric-${metric.id}`}
      className="glass-card animate-fade-in-up group"
      style={{
        animationDelay: `${delay}ms`,
        height: '112px',
        padding: '14px 18px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
      }}
    >
      {/* Accent glow */}
      <div
        style={{
          position: 'absolute',
          top: '-24px',
          left: '-24px',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          opacity: 0.15,
          filter: 'blur(20px)',
          background: metric.color,
          pointerEvents: 'none',
        }}
      />

      {/* Top row: label + icon */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.03em',
              color: '#f1f5f9',
              lineHeight: '1.3',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              margin: 0,
            }}
          >
            {label}
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginTop: '4px' }}>
            <span
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1,
              }}
            >
              {metric.value}
            </span>
            {metric.unit && (
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#cbd5e1' }}>
                {metric.unit}
              </span>
            )}
          </div>
        </div>
        <div
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: `${metric.color}18`,
            border: `1px solid ${metric.color}30`,
          }}
        >
          <Icon size={14} style={{ color: metric.color }} />
        </div>
      </div>

      {/* Bottom row: trend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative', zIndex: 1 }}>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: '9999px',
            color: metric.trendUp ? '#ef4444' : '#10b981',
            background: metric.trendUp ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
          }}
        >
          {trend}
        </span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8' }}>
          {t.vsYesterday}
        </span>
      </div>
    </div>
  );
}
