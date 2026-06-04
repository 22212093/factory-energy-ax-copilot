import { useState, useEffect, useRef } from 'react';
import { Document as DocxDocument, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ExternalHyperlink } from 'docx';
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
  ExternalLink,
  BookOpen,
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

const DEFAULT_RAG_DOCS = [
  {
    title: 'ISO 50001 Energy Management',
    desc: '에너지 성과 개선 및 운영관리 기준',
    url: 'https://www.iso.org/iso-50001-energy-management.html',
  },
  {
    title: 'Industrial Energy Audit Checklist',
    desc: '설비별 전력 낭비·공회전 점검 기준',
    url: 'https://www.energy.gov/eere/amo/energy-savings-assessments',
  },
  {
    title: 'Equipment Maintenance Best Practices',
    desc: '부하 이상·전원 품질·설비 점검 근거',
    url: 'https://www.energy.gov/eere/amo/advanced-manufacturing-office',
  },
];

function getRagDocs(report) {
  return report?.ragDocs?.length ? report.ragDocs : DEFAULT_RAG_DOCS;
}

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
  const ragDocs = getRagDocs(report);

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
      <div style={{ flexShrink: 0 }}>
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

      {/* RAG Evidence Documents */}
      {ragDocs.length > 0 && (
        <div style={{ flexShrink: 0 }}>
          <h4
            style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#e2e8f0',
              margin: '0 0 6px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <BookOpen size={10} style={{ color: '#64748b' }} />
            RAG 근거 문서
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {ragDocs.map((doc, i) => (
              <a
                key={i}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  background: 'rgba(74,90,138,0.08)',
                  border: '1px solid rgba(74,90,138,0.14)',
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
      )}
    </>
  );
}


// REPORT_DOCX_DOWNLOAD_HELPER_START
const docxLabels = {
  ko: { btn: 'DOCX \ub2e4\uc6b4\ub85c\ub4dc', title: '\uc0b0\uc5c5\ud604\uc7a5 \uc5d0\ub108\uc9c0 \uc6b4\uc601 AX \ucf54\ud30c\uc77c\ub7ff \u2014 AI \uc774\uc0c1 \ub9ac\ud3ec\ud2b8', src: '\ubd84\uc11d \uc18c\uc2a4', equip: '\uc124\ube44', time: '\uc774\ubca4\ud2b8 \uc2dc\uac04', sev: '\uc2ec\uac01\ub3c4', conf: '\uc2e0\ub8b0\ub3c4', save: '\uc608\uc0c1 \uc808\uac10 \ud6a8\uacfc', sum: '\uc694\uc57d', cause: 'AI \ucd94\uc815 \uc6d0\uc778', act: '\uad8c\uc7a5 \uc870\uce58', rag: 'RAG \uadfc\uac70 \ubb38\uc11c', foot: 'Factory Energy AX Copilot\uc5d0 \uc758\ud574 \uc790\ub3d9 \uc0dd\uc131\ub428' },
  en: { btn: 'DOCX Download', title: 'Factory Energy AX Copilot \u2014 AI Anomaly Report', src: 'Source', equip: 'Equipment', time: 'Event Time', sev: 'Severity', conf: 'Confidence', save: 'Expected Savings', sum: 'Summary', cause: 'Estimated Causes', act: 'Recommended Actions', rag: 'RAG Evidence Documents', foot: 'Auto-generated by Factory Energy AX Copilot' },
  ja: { btn: 'DOCX\u30c0\u30a6\u30f3\u30ed\u30fc\u30c9', title: 'Factory Energy AX Copilot \u2014 AI\u7570\u5e38\u30ec\u30dd\u30fc\u30c8', src: '\u5206\u6790\u30bd\u30fc\u30b9', equip: '\u8a2d\u5099', time: '\u30a4\u30d9\u30f3\u30c8\u6642\u523b', sev: '\u6df1\u523b\u5ea6', conf: '\u4fe1\u983c\u5ea6', save: '\u4e88\u60f3\u524a\u6e1b', sum: '\u8981\u7d04', cause: '\u63a8\u5b9a\u539f\u56e0', act: '\u63a8\u5968\u5bfe\u5fdc', rag: 'RAG\u6839\u62e0\u6587\u66f8', foot: 'Factory Energy AX Copilot\u306b\u3088\u308a\u81ea\u52d5\u751f\u6210' },
  zh: { btn: '\u4e0b\u8f7d DOCX', title: 'Factory Energy AX Copilot \u2014 AI \u5f02\u5e38\u62a5\u544a', src: '\u5206\u6790\u6765\u6e90', equip: '\u8bbe\u5907', time: '\u4e8b\u4ef6\u65f6\u95f4', sev: '\u4e25\u91cd\u6027', conf: '\u7f6e\u4fe1\u5ea6', save: '\u9884\u8ba1\u8282\u7701', sum: '\u6458\u8981', cause: '\u63a8\u6d4b\u539f\u56e0', act: '\u5efa\u8bae\u63aa\u65bd', rag: 'RAG\u8bc1\u636e\u6587\u6863', foot: '\u7531 Factory Energy AX Copilot \u81ea\u52a8\u751f\u6210' },
  fr: { btn: 'T\u00e9l\u00e9charger DOCX', title: 'Factory Energy AX Copilot \u2014 Rapport IA', src: 'Source', equip: '\u00c9quipement', time: 'Heure', sev: 'S\u00e9v\u00e9rit\u00e9', conf: 'Confiance', save: '\u00c9conomie', sum: 'R\u00e9sum\u00e9', cause: 'Causes', act: 'Actions', rag: 'Documents RAG', foot: 'G\u00e9n\u00e9r\u00e9 par Factory Energy AX Copilot' },
  de: { btn: 'DOCX herunterladen', title: 'Factory Energy AX Copilot \u2014 KI-Bericht', src: 'Quelle', equip: 'Anlage', time: 'Ereigniszeit', sev: 'Schweregrad', conf: 'Konfidenz', save: 'Einsparung', sum: 'Zusammenfassung', cause: 'Ursachen', act: 'Ma\u00dfnahmen', rag: 'RAG-Dokumente', foot: 'Erstellt von Factory Energy AX Copilot' },
  id: { btn: 'Unduh DOCX', title: 'Factory Energy AX Copilot \u2014 Laporan AI', src: 'Sumber', equip: 'Peralatan', time: 'Waktu', sev: 'Keparahan', conf: 'Kepercayaan', save: 'Penghematan', sum: 'Ringkasan', cause: 'Penyebab', act: 'Tindakan', rag: 'Dokumen RAG', foot: 'Dibuat oleh Factory Energy AX Copilot' },
};

const priorityLabels = { immediate: '\uc989\uc2dc / Immediate', today: '\uc624\ub298 / Today', thisWeek: '\uae08\uc8fc / This Week' };

function safeFileNamePart(v) {
  return String(v || 'report').replace(/[\\\\/:*?"<>|]/g, '_').replace(/\\s+/g, '_').slice(0, 40);
}

function buildDocxDocument(report, event, language, source) {
  const l = docxLabels[language] || docxLabels.en;
  const srcLabel = source === 'gemini' ? 'Gemini Live' : 'Local Rule';
  const equip = event?.equipment || report?.title || 'AI Report';
  const evTime = event?.time || '-';
  const stamp = new Date().toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US');
  const ragDocs = getRagDocs(report);
  const ch = [];

  ch.push(new Paragraph({ text: l.title, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 120 } }));
  ch.push(new Paragraph({ text: report?.title || equip, heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER, spacing: { after: 200 } }));

  ch.push(new Paragraph({ spacing: { after: 60 }, children: [
    new TextRun({ text: `${l.src}: `, bold: true, size: 20 }), new TextRun({ text: srcLabel, size: 20 }),
    new TextRun({ text: `   |   ${l.equip}: `, bold: true, size: 20 }), new TextRun({ text: equip, size: 20 }),
  ] }));
  ch.push(new Paragraph({ spacing: { after: 60 }, children: [
    new TextRun({ text: `${l.time}: `, bold: true, size: 20 }), new TextRun({ text: evTime, size: 20 }),
    new TextRun({ text: `   |   ${l.sev}: `, bold: true, size: 20 }), new TextRun({ text: event?.severity || '-', size: 20 }),
  ] }));
  ch.push(new Paragraph({ spacing: { after: 60 }, children: [
    new TextRun({ text: `${l.conf}: `, bold: true, size: 20 }), new TextRun({ text: `${report?.confidence ?? '-'}%`, size: 20 }),
    new TextRun({ text: `   |   ${l.save}: `, bold: true, size: 20 }), new TextRun({ text: report?.savings || '-', size: 20 }),
  ] }));
  ch.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

  ch.push(new Paragraph({ text: l.sum, heading: HeadingLevel.HEADING_3, spacing: { before: 100, after: 80 } }));
  ch.push(new Paragraph({ text: report?.summary || '-', spacing: { after: 200 } }));

  ch.push(new Paragraph({ text: l.cause, heading: HeadingLevel.HEADING_3, spacing: { before: 100, after: 80 } }));
  (report?.causes || []).forEach((c, i) => {
    ch.push(new Paragraph({ spacing: { after: 40 }, children: [
      new TextRun({ text: `${i + 1}. `, bold: true, size: 20 }), new TextRun({ text: c.label || '-', size: 20 }),
    ] }));
  });
  ch.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

  ch.push(new Paragraph({ text: l.act, heading: HeadingLevel.HEADING_3, spacing: { before: 100, after: 80 } }));
  (report?.actions || []).forEach((a, i) => {
    const pL = priorityLabels[a.priority] || a.priority || '';
    ch.push(new Paragraph({ spacing: { after: 40 }, children: [
      new TextRun({ text: `${i + 1}. `, bold: true, size: 20 }), new TextRun({ text: a.label || '-', size: 20 }),
      new TextRun({ text: pL ? `  [${pL}]` : '', italics: true, size: 18, color: '666666' }),
    ] }));
  });
  ch.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

  if (ragDocs.length) {
    ch.push(new Paragraph({ text: l.rag, heading: HeadingLevel.HEADING_3, spacing: { before: 100, after: 80 } }));
    ragDocs.forEach((doc, i) => {
      ch.push(
        new Paragraph({ spacing: { after: 20 }, children: [
          new TextRun({ text: `${i + 1}. `, bold: true, size: 20 }), new TextRun({ text: doc.title || '-', bold: true, size: 20 }),
        ] }),
        new Paragraph({ spacing: { after: 20 }, indent: { left: 400 }, children: [
          new TextRun({ text: doc.desc || '', size: 18, color: '555555' }),
        ] }),
        new Paragraph({ spacing: { after: 60 }, indent: { left: 400 }, children: [
          new ExternalHyperlink({ link: doc.url || '#', children: [
            new TextRun({ text: doc.url || '', size: 18, color: '0563C1', underline: {} }),
          ] }),
        ] }),
      );
    });
    ch.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
  }

  ch.push(new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.CENTER, children: [
    new TextRun({ text: `${l.foot}  |  ${stamp}`, size: 16, color: '999999', italics: true }),
  ] }));

  return new DocxDocument({ sections: [{ children: ch }] });
}

async function downloadReportDocx(report, event, language, source) {
  const equip = safeFileNamePart(event?.equipment || report?.title || 'AI_Report');
  const title = safeFileNamePart(report?.title || 'Report');
  const filename = `${equip}_${title}_AI_Report.docx`;
  const doc = buildDocxDocument(report, event, language, source);
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function ReportDownloadButton({ report, event, language, source }) {
  if (!report) return null;
  const l = docxLabels[language] || docxLabels.en;
  return (
    <button
      type="button"
      onClick={() => downloadReportDocx(report, event, language, source)}
      style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '5px 12px', borderRadius: '8px',
        fontSize: '11px', fontWeight: 700, cursor: 'pointer',
        border: '1px solid rgba(0,229,255,0.3)',
        background: 'rgba(0,229,255,0.08)',
        color: '#67e8f9', transition: 'all 0.2s',
      }}
    >
      {l.btn}
    </button>
  );
}
// REPORT_DOCX_DOWNLOAD_HELPER_END
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
        <GeminiButton onGenerate={handleGenerate} loading={loading} source={source} language={language} />
        <ReportDownloadButton report={activeReport} event={event} language={language} source={source} />
      </div>

      {/* Report content — scrollable */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <ReportBody report={activeReport} t={t} />
      </div>
    </div>
  );
}







