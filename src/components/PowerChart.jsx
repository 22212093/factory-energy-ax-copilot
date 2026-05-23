import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import { generatePowerData, getSpikeTime } from '../data/mockData';

function CustomTooltip({ active, payload, label, t }) {
  if (!active || !payload?.length) return null;

  // Look up by dataKey name — immune to Area declaration order
  const powerEntry    = payload.find((p) => p.dataKey === 'power');
  const baselineEntry = payload.find((p) => p.dataKey === 'baseline');
  const power    = powerEntry?.value;
  const baseline = baselineEntry?.value;
  const isAnomaly = power > 80;

  return (
    <div
      style={{
        background: 'rgba(15, 22, 41, 0.97)',
        border: `1px solid ${isAnomaly ? 'rgba(239,68,68,0.4)' : 'rgba(0,229,255,0.2)'}`,
        borderRadius: '10px',
        padding: '8px 12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <p style={{ fontSize: '10px', fontWeight: 700, color: '#9aaad0', marginBottom: '4px' }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
        <span style={{ fontSize: '16px', fontWeight: 800, color: isAnomaly ? '#ef4444' : '#00e5ff' }}>
          {power}
        </span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8' }}>kW</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginTop: '2px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#c8d2e8' }}>
          {t.baseline}: {baseline} kW
        </span>
      </div>
      {isAnomaly && (
        <div
          style={{
            marginTop: '4px',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontSize: '9px',
            fontWeight: 700,
            display: 'inline-block',
            background: 'rgba(239,68,68,0.15)',
            color: '#ef4444',
          }}
        >
          {t.anomalyBadge}
        </div>
      )}
    </div>
  );
}

// ─── PowerChart ──────────────────────────────────────────
// Props:
//   t          — translations object
//   threshold  — kW threshold (default 80, from settings)
//   powerData  — array of { time, power, baseline } (optional, generates live data if omitted)
//   spikeTime  — x-value string for the ReferenceDot (optional)
export default function PowerChart({ t, threshold = 80, powerData, spikeTime }) {
  // Fall back to freshly generated data if parent doesn't pass it
  const data = powerData ?? generatePowerData();
  const spike = spikeTime ?? getSpikeTime(data);

  return (
    <div
      id="power-chart"
      className="glass-card animate-fade-in-up"
      style={{
        animationDelay: '200ms',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '14px 16px 10px',
        boxSizing: 'border-box',
      }}
    >
      {/* Chart header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, marginBottom: '10px' }}>
        <div>
          <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', lineHeight: 1.3, margin: 0 }}>
            {t.realtimePower}
          </h2>
          <p style={{ fontSize: '10px', fontWeight: 600, color: '#cbd5e1', lineHeight: 1.3, margin: '2px 0 0' }}>
            {t.rollingWindow}
          </p>
        </div>
        {/* Legend — kept away from chart right edge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingRight: '70px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00e5ff' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#cbd5e1' }}>{t.actual}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(154,170,208,0.35)' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#cbd5e1' }}>{t.baseline}</span>
          </div>
        </div>
      </div>

      {/* Recharts area — fills remaining height */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 12, right: 64, left: 0, bottom: 8 }}
          >
            <defs>
              <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#00e5ff" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(74, 90, 138, 0.12)"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#cbd5e1', fontSize: 10, fontWeight: 600 }}
              domain={[40, 100]}
            />
            <Tooltip content={<CustomTooltip t={t} />} />
            <ReferenceLine
              y={threshold}
              stroke="rgba(239,68,68,0.4)"
              strokeDasharray="6 4"
              label={{
                value: `${t.threshold} ${threshold}kW`,
                position: 'insideTopLeft',
                fill: '#f87171',
                fontSize: 10,
                fontWeight: 700,
                dx: 8,
                dy: -10,
              }}
            />
            {/* power first so its gradient renders on top of the baseline line */}
            <Area
              type="monotone"
              dataKey="power"
              stroke="#00e5ff"
              strokeWidth={2.5}
              fill="url(#powerGradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: '#00e5ff',
                stroke: 'rgba(0,229,255,0.3)',
                strokeWidth: 5,
              }}
            />
            <Area
              type="monotone"
              dataKey="baseline"
              stroke="rgba(154,170,208,0.25)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              fill="none"
              dot={false}
            />
            {spike && (
              <ReferenceDot
                x={spike}
                y={92.4}
                r={5}
                fill="#ef4444"
                stroke="rgba(239,68,68,0.3)"
                strokeWidth={6}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
