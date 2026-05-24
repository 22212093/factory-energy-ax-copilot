import { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Wind,
  Clock,
  Gauge,
  Cog,
  Calendar,
  User,
  Monitor,
  RefreshCw,
  Cpu,
  Thermometer,
  Database,
  Zap,
  CheckCircle2,
  TrendingDown,
  Shield,
  ChevronRight,
  Sparkles,
  Loader2,
} from 'lucide-react';

const iconMap = {
  wind: Wind,
  clock: Clock,
  gauge: Gauge,
  cog: Cog,
  calendar: Calendar,
  user: User,
  monitor: Monitor,
  refresh: RefreshCw,
  cpu: Cpu,
  thermometer: Thermometer,
  database: Database,
  zap: Zap,
};

const priorityKeyToStyle = {
  immediate: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', color: '#ef4444' },
  today: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', color: '#f59e0b' },
  thisWeek: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', color: '#3b82f6' },
};

// ─── Gemini generate button ────────────────────────────────
function GeminiButton({ onGenerate, loading, source, language }) {
  const isGemini = source === 'gemini';
  const isMock = source === 'mock' || source === 'api_error_fallback' || source === 'parse_error_fallback' || source === 'local_rule_engine' || source === 'api_error_local_rule' || source === 'parse_error_local_rule';
  const isQuota = source === 'quota_exceeded';

  const labels = {
    ko: {
      generating: 'Gemini 분석 중...',
      generate: 'Gemini로 리포트 생성',
      quota: '{l.quota}',
      quotaTitle: 'API 할당량 초과 — Mock 리포트를 표시합니다. 나중에 다시 시도하세요.',
      fallback: 'Local Rule',
    },
    en: {
      generating: 'Analyzing with Gemini...',
      generate: 'Generate with Gemini',
      quota: 'Quota exceeded · Mock',
      quotaTitle: 'API quota exceeded — showing mock report. Try again later.',
      fallback: 'Local Rule',
    },
    ja: {
      generating: 'Geminiで分析中...',
      generate: 'Geminiでレポート生成',
      quota: 'Quota超過 · Mock',
      quotaTitle: 'APIクォータを超過しました。Mockレポートを表示します。後でもう一度お試しください。',
      fallback: 'Local Rule',
    },
    zh: {
      generating: 'Gemini 分析中...',
      generate: '使用 Gemini 生成报告',
      quota: '配额超限 · Mock',
      quotaTitle: 'API 配额已超限，正在显示 Mock 报告。请稍后重试。',
      fallback: 'Local Rule',
    },
    fr: {
      generating: 'Analyse Gemini en cours...',
      generate: 'Générer avec Gemini',
      quota: 'Quota dépassé · Mock',
      quotaTitle: 'Quota API dépassé — affichage du rapport mock. Réessayez plus tard.',
      fallback: 'Local Rule',
    },
    de: {
      generating: 'Gemini analysiert...',
      generate: 'Mit Gemini generieren',
      quota: 'Quota überschritten · Mock',
      quotaTitle: 'API-Kontingent überschritten — Mock-Bericht wird angezeigt. Später erneut versuchen.',
      fallback: 'Local Rule',
    },
    id: {
      generating: 'Menganalisis dengan Gemini...',
      generate: 'Buat laporan dengan Gemini',
      quota: 'Kuota terlampaui · Mock',
      quotaTitle: 'Kuota API terlampaui — menampilkan laporan mock. Coba lagi nanti.',
      fallback: 'Local Rule',
    },
  };

  const l = labels[language] || labels.en;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
      <button
        id="btn-gemini-generate"
        onClick={onGenerate}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '5px 12px',
          borderRadius: '8px',
          fontSize: '11px',
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          border: '1px solid rgba(168,85,247,0.4)',
          background: loading
            ? 'rgba(168,85,247,0.05)'
            : 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(99,102,241,0.15))',
          color: loading ? '#9ca3af' : '#c084fc',
          transition: 'all 0.2s',
          opacity: loading ? 0.7 : 1,
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(99,102,241,0.25))';
            e.currentTarget.style.borderColor = 'rgba(168,85,247,0.6)';
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(99,102,241,0.15))';
            e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)';
          }
        }}
      >
        {loading ? (
          <Loader2
            size={11}
            style={{ color: '#a855f7', animation: 'spin 1s linear infinite' }}
          />
        ) : (
          <Sparkles size={11} style={{ color: '#c084fc' }} />
        )}
        {loading ? l.generating : l.generate}
      </button>

      {/* ── Source badges ── */}
      {isGemini && !loading && (
        <span
          style={{
            fontSize: '9px',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '9999px',
            background: 'rgba(168,85,247,0.15)',
            border: '1px solid rgba(168,85,247,0.35)',
            color: '#c084fc',
          }}
        >
          ✦ Gemini Live
        </span>
      )}
      {isQuota && !loading && (
        <span
          title={l.quotaTitle}
          style={{
            fontSize: '9px',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '9999px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171',
          }}
        >
          {l.quota}
        </span>
      )}
      {isMock && !loading && (
        <span
          style={{
            fontSize: '9px',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '9999px',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)',
            color: '#f59e0b',
          }}
        >
          Local Rule
        </span>
      )}
    </div>
  );
}

// ─── Report body (shared by static and generated reports) ──
function ReportBody({ report, t }) {
  return (
    <>
      {/* Header + Summary */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flexShrink: 0 }}>
        <div
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: 'rgba(168,85,247,0.1)',
            border: '1px solid rgba(168,85,247,0.2)',
          }}
          className="animate-pulse-glow"
        >
          <Brain size={14} style={{ color: '#a855f7' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', lineHeight: 1.3, margin: '0 0 3px' }}>
            {report.title}
          </h3>
          <p style={{ fontSize: '10px', lineHeight: 1.5, fontWeight: 600, color: '#cbd5e1', margin: 0 }}>
            {report.summary}
          </p>
        </div>
      </div>

      {/* Confidence + Savings */}
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <div
          style={{
            flex: 1,
            borderRadius: '10px',
            padding: '8px 10px',
            background: 'rgba(168,85,247,0.06)',
            border: '1px solid rgba(168,85,247,0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
            <Shield size={10} style={{ color: '#a855f7' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#e2e8f0' }}>{t.confidence}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
              {report.confidence}
            </span>
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#cbd5e1' }}>%</span>
          </div>
          <div
            style={{
              marginTop: '4px',
              height: '3px',
              borderRadius: '9999px',
              overflow: 'hidden',
              background: 'rgba(74,90,138,0.2)',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: '9999px',
                width: `${report.confidence}%`,
                background: 'linear-gradient(90deg, #a855f7, #c084fc)',
                transition: 'width 0.7s ease',
              }}
            />
          </div>
        </div>
        <div
          style={{
            flex: 1,
            borderRadius: '10px',
            padding: '8px 10px',
            background: 'rgba(16,185,129,0.06)',
            border: '1px solid rgba(16,185,129,0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
            <TrendingDown size={10} style={{ color: '#10b981' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#e2e8f0' }}>{t.expectedSavings}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
              {report.savings}
            </span>
          </div>
        </div>
      </div>

      {/* Root Causes */}
      <div style={{ flexShrink: 0 }}>
        <h4
          style={{
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#e2e8f0',
            margin: '0 0 6px',
          }}
        >
          {t.rootCauseAnalysis}
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {report.causes.map((cause, i) => {
            const CauseIcon = iconMap[cause.icon] || Zap;
            return (
              <div
                key={i}
                className="animate-fade-in-up"
                style={{
                  animationDelay: `${i * 30}ms`,
                  borderRadius: '8px',
                  padding: '6px 8px',
                  background: 'rgba(21,29,53,0.5)',
                  border: '1px solid rgba(74,90,138,0.15)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0,229,255,0.15)';
                  e.currentTarget.style.background = 'rgba(21,29,53,0.7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(74,90,138,0.15)';
                  e.currentTarget.style.background = 'rgba(21,29,53,0.5)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <CauseIcon size={10} style={{ color: '#00e5ff' }} />
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#ffffff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cause.label}
                  </span>
                </div>
                {cause.detail && (
                  <p style={{ fontSize: '9px', lineHeight: 1.4, fontWeight: 600, color: '#94a3b8', margin: '2px 0 0' }}>
                    {cause.detail}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended Actions */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <h4
          style={{
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#e2e8f0',
            margin: '0 0 6px',
            flexShrink: 0,
          }}
        >
          {t.recommendedActions}
        </h4>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
          }}
        >
          {report.actions.map((action, i) => {
            const pStyle = priorityKeyToStyle[action.priority] || priorityKeyToStyle.today;
            const priorityLabel = t[action.priority] || action.priority;
            return (
              <div
                key={i}
                className="animate-fade-in-up"
                style={{
                  animationDelay: `${i * 30 + 100}ms`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '8px',
                  padding: '6px 8px',
                  background: 'rgba(21,29,53,0.5)',
                  border: '1px solid rgba(74,90,138,0.15)',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: pStyle.bg,
                    border: `1px solid ${pStyle.border}`,
                  }}
                >
                  <CheckCircle2 size={10} style={{ color: pStyle.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#ffffff',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {action.label}
                    </span>
                    <span
                      className="animate-pulse"
                      style={{
                        fontSize: '8px',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        flexShrink: 0,
                        background: pStyle.bg,
                        color: pStyle.color,
                        border: `1px solid ${pStyle.border}`,
                      }}
                    >
                      {priorityLabel}
                    </span>
                  </div>
                  {action.detail && (
                    <p
                      style={{
                        fontSize: '10px',
                        margin: '1px 0 0',
                        fontWeight: 600,
                        color: '#94a3b8',
                        lineHeight: 1.3,
                      }}
                    >
                      {action.detail}
                    </p>
                  )}
                </div>
                <ChevronRight size={10} style={{ color: '#6b7db0', flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Main export ───────────────────────────────────────────
export default function AIReport({ report: staticReport, event, language, t, onReportGenerated }) {
  const [generatedReport, setGeneratedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState(null); // 'gemini' | 'local_rule_engine' | 'quota_exceeded' | null

  // ── Reset generated report whenever the selected event changes ──
  useEffect(() => {
    setGeneratedReport(null);
    setSource(null);
    setLoading(false);
  }, [event?.id, language]);

  const activeReport = generatedReport || staticReport;
  const lastNotifiedReportKey = useRef(null);

  useEffect(() => {
    if (!generatedReport || !source) return;

    const key = [event?.id || 'event', source, language, generatedReport.title || '', generatedReport.savings || ''].join('|');
    if (lastNotifiedReportKey.current === key) return;

    lastNotifiedReportKey.current = key;

    onReportGenerated?.({
      event,
      report: generatedReport,
      source,
      language,
    });
  }, [generatedReport, source, event, language, onReportGenerated]);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, language }),
      });
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      setGeneratedReport(data.report);
      setSource(data.source);

      // REPORT_NOTIFICATION_DISPATCH_V2_START
      if (typeof window !== 'undefined' && data && data.report) {
        window.dispatchEvent(new CustomEvent('fax-report-generated-v2', {
          detail: {
            event,
            report: data.report,
            source: data.source,
            language,
          },
        }));
      }
      // REPORT_NOTIFICATION_DISPATCH_V2_END

      if (typeof window !== 'undefined' && data?.report) {
        window.dispatchEvent(new CustomEvent('fax-report-generated', {
          detail: {
            event,
            report: data.report,
            source: data.source,
            language,
          },
        }));
      }
    } catch {
      // Never show raw errors — use current/static report as local-rule fallback
      setSource('local_rule_engine');

      // REPORT_NOTIFICATION_CATCH_V2_START
      if (typeof window !== 'undefined' && staticReport) {
        window.dispatchEvent(new CustomEvent('fax-report-generated-v2', {
          detail: {
            event,
            report: staticReport,
            source: 'local_rule_engine',
            language,
          },
        }));
      }
      // REPORT_NOTIFICATION_CATCH_V2_END
      if (staticReport) {
        onReportGenerated?.({
          event,
          report: staticReport,
          source: 'local_rule_engine',
          language,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Empty state: no event selected ──
  if (!activeReport) {
    return (
      <div
        id="ai-report"
        className="glass-card"
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '20px',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px',
            flexShrink: 0,
            background: 'rgba(168,85,247,0.08)',
            border: '1px solid rgba(168,85,247,0.15)',
          }}
        >
          <Brain size={18} style={{ color: '#a855f7' }} />
        </div>
        <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', margin: '0 0 4px' }}>
          {t.aiAnalysisReport}
        </h3>
        <p style={{ fontSize: '11px', fontWeight: 600, color: '#cbd5e1', margin: 0 }}>
          {t.selectEventPrompt}
        </p>
      </div>
    );
  }

  // ── Report with Gemini button ──
  return (
    <div
      id="ai-report"
      className="glass-card animate-slide-in-right"
      key={event?.id}    // remount on event switch so animation replays
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '12px 14px',
        boxSizing: 'border-box',
        gap: '10px',
      }}
    >
      {/* Gemini action row */}
      <GeminiButton onGenerate={handleGenerate} loading={loading} source={source} language={language} />

      {/* Report content */}
      <ReportBody report={activeReport} t={t} />
    </div>
  );
}






