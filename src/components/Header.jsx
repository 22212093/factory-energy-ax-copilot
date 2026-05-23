import { useState, useRef, useEffect } from 'react';
import {
  Activity,
  Settings,
  Bell,
  Globe,
  ChevronDown,
  Check,
  AlertTriangle,
  FileText,
  Zap,
  Database,
  Cpu,
  Cloud,
  X,
} from 'lucide-react';
import { languageOptions } from '../data/translations';

// ─── Notification mock data (per-language) ─────────────
const notifications = {
  ko: [
    { icon: 'zap', text: 'Compressor-2 전력 급증 감지', time: '15:08', severity: 'high' },
    { icon: 'file', text: 'AI 리포트 생성 완료', time: '15:09', severity: 'info' },
    { icon: 'alert', text: 'Line-A 비작업시간 사용 감지', time: '15:11', severity: 'medium' },
  ],
  en: [
    { icon: 'zap', text: 'Compressor-2 power spike detected', time: '15:08', severity: 'high' },
    { icon: 'file', text: 'AI report generation complete', time: '15:09', severity: 'info' },
    { icon: 'alert', text: 'Line-A off-hour usage detected', time: '15:11', severity: 'medium' },
  ],
  ja: [
    { icon: 'zap', text: 'Compressor-2 電力スパイク検出', time: '15:08', severity: 'high' },
    { icon: 'file', text: 'AIレポート生成完了', time: '15:09', severity: 'info' },
    { icon: 'alert', text: 'Line-A 時間外使用検出', time: '15:11', severity: 'medium' },
  ],
  zh: [
    { icon: 'zap', text: 'Compressor-2 功率尖峰检测', time: '15:08', severity: 'high' },
    { icon: 'file', text: 'AI报告生成完成', time: '15:09', severity: 'info' },
    { icon: 'alert', text: 'Line-A 非工时用电检测', time: '15:11', severity: 'medium' },
  ],
  fr: [
    { icon: 'zap', text: 'Compressor-2 pic de puissance détecté', time: '15:08', severity: 'high' },
    { icon: 'file', text: 'Rapport IA généré', time: '15:09', severity: 'info' },
    { icon: 'alert', text: 'Line-A usage hors horaires détecté', time: '15:11', severity: 'medium' },
  ],
  es: [
    { icon: 'zap', text: 'Compressor-2 pico de potencia detectado', time: '15:08', severity: 'high' },
    { icon: 'file', text: 'Informe de IA generado', time: '15:09', severity: 'info' },
    { icon: 'alert', text: 'Line-A uso fuera de horario detectado', time: '15:11', severity: 'medium' },
  ],
  de: [
    { icon: 'zap', text: 'Compressor-2 Leistungsspitze erkannt', time: '15:08', severity: 'high' },
    { icon: 'file', text: 'KI-Bericht erfolgreich generiert', time: '15:09', severity: 'info' },
    { icon: 'alert', text: 'Line-A off-hour Nutzung erkannt', time: '15:11', severity: 'medium' },
  ],
  vi: [
    { icon: 'zap', text: 'Phát hiện đỉnh điện Compressor-2', time: '15:08', severity: 'high' },
    { icon: 'file', text: 'Báo cáo AI đã tạo thành công', time: '15:09', severity: 'info' },
    { icon: 'alert', text: 'Phát hiện sử dụng Line-A ngoài giờ', time: '15:11', severity: 'medium' },
  ],
  id: [
    { icon: 'zap', text: 'Lonjakan daya Compressor-2 terdeteksi', time: '15:08', severity: 'high' },
    { icon: 'file', text: 'Laporan AI selesai dibuat', time: '15:09', severity: 'info' },
    { icon: 'alert', text: 'Penggunaan Line-A luar jam kerja terdeteksi', time: '15:11', severity: 'medium' },
  ],
  th: [
    { icon: 'zap', text: 'ตรวจพบ Compressor-2 ไฟกระชาก', time: '15:08', severity: 'high' },
    { icon: 'file', text: 'สร้างรายงาน AI เสร็จสมบูรณ์', time: '15:09', severity: 'info' },
    { icon: 'alert', text: 'ตรวจพบการใช้งาน Line-A นอกเวลา', time: '15:11', severity: 'medium' },
  ],
};

const settingsData = {
  ko: [
    { icon: 'database', label: '데이터 소스', value: '가상 스마트미터' },
    { icon: 'cpu', label: 'AI 모드', value: 'Mock Agent' },
    { icon: 'gemini', label: 'Gemini API', value: '확장 예정' },
    { icon: 'cloud', label: 'Cloud Run', value: '배포 예정' },
    { icon: 'activity', label: '확장', value: 'ESP32 / MQTT / RAG' },
  ],
  en: [
    { icon: 'database', label: 'Data Source', value: 'Virtual Smart Meter' },
    { icon: 'cpu', label: 'AI Mode', value: 'Mock Agent' },
    { icon: 'gemini', label: 'Gemini API', value: 'Coming Soon' },
    { icon: 'cloud', label: 'Cloud Run', value: 'Deployment Planned' },
    { icon: 'activity', label: 'Expansion', value: 'ESP32 / MQTT / RAG' },
  ],
  ja: [
    { icon: 'database', label: 'データソース', value: '仮想スマートメーター' },
    { icon: 'cpu', label: 'AIモード', value: 'Mock Agent' },
    { icon: 'gemini', label: 'Gemini API', value: '拡張予定' },
    { icon: 'cloud', label: 'Cloud Run', value: 'デプロイ予定' },
    { icon: 'activity', label: '拡張', value: 'ESP32 / MQTT / RAG' },
  ],
  zh: [
    { icon: 'database', label: '数据源', value: '虚拟智能电表' },
    { icon: 'cpu', label: 'AI模式', value: 'Mock Agent' },
    { icon: 'gemini', label: 'Gemini API', value: '计划扩展' },
    { icon: 'cloud', label: 'Cloud Run', value: '计划部署' },
    { icon: 'activity', label: '扩展', value: 'ESP32 / MQTT / RAG' },
  ],
  fr: [
    { icon: 'database', label: 'Source de données', value: 'Compteur virtuel' },
    { icon: 'cpu', label: 'Mode IA', value: 'Mock Agent' },
    { icon: 'gemini', label: 'Gemini API', value: 'Bientôt disponible' },
    { icon: 'cloud', label: 'Cloud Run', value: 'Déploiement prévu' },
    { icon: 'activity', label: 'Extension', value: 'ESP32 / MQTT / RAG' },
  ],
  es: [
    { icon: 'database', label: 'Fuente de datos', value: 'Smart Meter Virtual' },
    { icon: 'cpu', label: 'Modo IA', value: 'Agente de Pruebas' },
    { icon: 'gemini', label: 'Gemini API', value: 'Próximamente' },
    { icon: 'cloud', label: 'Cloud Run', value: 'Despliegue planeado' },
    { icon: 'activity', label: 'Expansión', value: 'ESP32 / MQTT / RAG' },
  ],
  de: [
    { icon: 'database', label: 'Datenquelle', value: 'Virtueller Zähler' },
    { icon: 'cpu', label: 'KI-Modus', value: 'Mock Agent' },
    { icon: 'gemini', label: 'Gemini-API', value: 'Demnächst' },
    { icon: 'cloud', label: 'Cloud Run', value: 'Bereitstellung geplant' },
    { icon: 'activity', label: 'Erweiterung', value: 'ESP32 / MQTT / RAG' },
  ],
  vi: [
    { icon: 'database', label: 'Nguồn dữ liệu', value: 'Công tơ ảo' },
    { icon: 'cpu', label: 'Chế độ AI', value: 'Mock Agent' },
    { icon: 'gemini', label: 'Gemini API', value: 'Sắp tích hợp' },
    { icon: 'cloud', label: 'Cloud Run', value: 'Sắp triển khai' },
    { icon: 'activity', label: 'Mở rộng', value: 'ESP32 / MQTT / RAG' },
  ],
  id: [
    { icon: 'database', label: 'Sumber Data', value: 'Smart Meter Virtual' },
    { icon: 'cpu', label: 'Mode AI', value: 'Mock Agent' },
    { icon: 'gemini', label: 'Gemini API', value: 'Segera Hadir' },
    { icon: 'cloud', label: 'Cloud Run', value: 'Rencana Distribusi' },
    { icon: 'activity', label: 'Ekstensi', value: 'ESP32 / MQTT / RAG' },
  ],
  th: [
    { icon: 'database', label: 'แหล่งข้อมูล', value: 'สมาร์ทมิเตอร์เสมือน' },
    { icon: 'cpu', label: 'โหมด AI', value: 'ตัวแทนจำลอง' },
    { icon: 'gemini', label: 'Gemini API', value: 'แผนขยายระบบ' },
    { icon: 'cloud', label: 'Cloud Run', value: 'แผนการใช้งาน' },
    { icon: 'activity', label: 'การขยายระบบ', value: 'ESP32 / MQTT / RAG' },
  ],
};

const notifTitles = {
  ko: '알림', en: 'Notifications', ja: '通知', zh: '通知', fr: 'Notifications',
  es: 'Notificaciones', de: 'Benachrichtigungen', vi: 'Thông báo', id: 'Notifikasi', th: 'การแจ้งเตือน'
};
const settingsTitles = {
  ko: '시스템 설정', en: 'System Settings', ja: 'システム設定', zh: '系统设置', fr: 'Paramètres',
  es: 'Configuración', de: 'Systemeinstellungen', vi: 'Cài đặt hệ thống', id: 'Pengaturan Sistem', th: 'การตั้งค่าระบบ'
};

const noNotifsText = {
  ko: '새 알림 없음', en: 'No new notifications', ja: '新しい通知はありません',
  zh: '暂无新通知', fr: 'Aucune nouvelle notification', es: 'No hay nuevas notificaciones',
  de: 'Keine neuen Benachrichtigungen', vi: 'Không có thông báo mới',
  id: 'Tidak ada notifikasi baru', th: 'ไม่มีการแจ้งเตือนใหม่'
};

const nIconMap = {
  zap: Zap,
  file: FileText,
  alert: AlertTriangle,
};
const sIconMap = {
  database: Database,
  cpu: Cpu,
  gemini: Zap,
  cloud: Cloud,
  activity: Activity,
};

const severityDot = {
  high: '#ef4444',
  medium: '#f59e0b',
  info: '#3b82f6',
};

export default function Header({ language, setLanguage, t }) {
  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifList, setNotifList] = useState([]);

  const langRef = useRef(null);
  const notifRef = useRef(null);
  const settingsRef = useRef(null);

  // Load and map notifications with unique IDs when language changes
  useEffect(() => {
    const currentNotifs = notifications[language] || notifications.en;
    setNotifList(currentNotifs.map((n, idx) => ({ ...n, id: idx })));
  }, [language]);

  // Close any open dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = languageOptions.find((l) => l.code === language);
  const settings = settingsData[language] || settingsData.en;

  // Shared dropdown panel style
  const panelStyle = {
    background: '#0f1629',
    border: '1px solid rgba(74,90,138,0.35)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,229,255,0.04)',
  };

  const handleDismissNotif = (id) => {
    setNotifList((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <header
      id="dashboard-header"
      className="flex items-center justify-between px-5 border-b relative animate-fade-in-up"
      style={{
        background: 'rgba(10, 14, 26, 0.92)',
        borderColor: 'rgba(74, 90, 138, 0.15)',
        backdropFilter: 'blur(16px)',
        zIndex: 100,
        height: '44px',
        minHeight: '44px',
        maxHeight: '44px',
      }}
    >
      {/* Logo & Title */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center animate-pulse-glow shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(59,130,246,0.15))',
            border: '1px solid rgba(0,229,255,0.2)',
          }}
        >
          <Activity size={18} style={{ color: '#00e5ff' }} />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight leading-normal">
            Factory Energy AX Copilot
          </h1>
          <p className="text-xs font-semibold leading-normal" style={{ color: '#c8d2e8' }}>
            {t.subtitle}
          </p>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2.5">
        {/* Status pill */}
        <div
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10b981' }} />
          <span className="text-xs font-semibold" style={{ color: '#34d399' }}>
            {t.systemOnline}
          </span>
        </div>

        {/* ──────── Language selector ──────── */}
        <div ref={langRef} className="relative">
          <button
            id="btn-language-selector"
            onClick={() => { setLangOpen(!langOpen); setNotifOpen(false); setSettingsOpen(false); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer"
            style={{
              background: langOpen ? 'rgba(0,229,255,0.08)' : 'rgba(21,29,53,0.6)',
              border: `1px solid ${langOpen ? 'rgba(0,229,255,0.3)' : 'rgba(74,90,138,0.25)'}`,
            }}
            onMouseEnter={(e) => { if (!langOpen) e.currentTarget.style.borderColor = 'rgba(0,229,255,0.2)'; }}
            onMouseLeave={(e) => { if (!langOpen) e.currentTarget.style.borderColor = langOpen ? 'rgba(0,229,255,0.3)' : 'rgba(74,90,138,0.25)'; }}
          >
            <Globe size={13} style={{ color: '#00e5ff' }} />
            <span className="text-xs font-bold text-white">{currentLang?.label}</span>
            <span className="text-xs font-semibold hidden sm:inline" style={{ color: '#c8d2e8' }}>
              {currentLang?.name}
            </span>
            <ChevronDown
              size={11}
              style={{
                color: '#9aaad0',
                transform: langOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>

          {langOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-64 max-h-[280px] overflow-y-auto rounded-xl py-1.5 animate-fade-in-up"
              style={{ ...panelStyle, zIndex: 9999 }}
            >
              {languageOptions.map((lang) => {
                const isActive = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    id={`lang-option-${lang.code}`}
                    onClick={() => { setLanguage(lang.code); setLangOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 cursor-pointer"
                    style={{ background: isActive ? 'rgba(0,229,255,0.08)' : 'transparent' }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(74,90,138,0.15)'; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = isActive ? 'rgba(0,229,255,0.08)' : 'transparent'; }}
                  >
                    <span
                      className="text-xs font-bold w-7 text-center shrink-0"
                      style={{ color: isActive ? '#00e5ff' : '#9aaad0' }}
                    >
                      {lang.label}
                    </span>
                    <span
                      className="text-xs font-semibold flex-1"
                      style={{ color: isActive ? '#ffffff' : '#c8d2e8' }}
                    >
                      {lang.name}
                    </span>
                    {isActive && <Check size={13} style={{ color: '#00e5ff' }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ──────── Notification bell ──────── */}
        <div ref={notifRef} className="relative">
          <button
            id="btn-notifications"
            onClick={() => { setNotifOpen(!notifOpen); setLangOpen(false); setSettingsOpen(false); }}
            className="relative w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer"
            style={{
              background: notifOpen ? 'rgba(0,229,255,0.08)' : 'rgba(21,29,53,0.6)',
              border: `1px solid ${notifOpen ? 'rgba(0,229,255,0.3)' : 'rgba(74,90,138,0.25)'}`,
            }}
            onMouseEnter={(e) => { if (!notifOpen) e.currentTarget.style.borderColor = 'rgba(0,229,255,0.2)'; }}
            onMouseLeave={(e) => { if (!notifOpen) e.currentTarget.style.borderColor = notifOpen ? 'rgba(0,229,255,0.3)' : 'rgba(74,90,138,0.25)'; }}
          >
            <Bell size={15} style={{ color: notifOpen ? '#00e5ff' : '#9aaad0' }} />
            {notifList.length > 0 && (
              <div
                className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-white font-bold animate-pulse-glow"
                style={{ background: '#ef4444', fontSize: '8px' }}
              >
                {notifList.length}
              </div>
            )}
          </button>

          {notifOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-80 rounded-xl animate-fade-in-up"
              style={{ ...panelStyle, zIndex: 9999 }}
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b" style={{ borderColor: 'rgba(74,90,138,0.2)' }}>
                <span className="text-xs font-bold text-white leading-normal">
                  {notifTitles[language] || 'Notifications'}
                </span>
                <button
                  onClick={() => setNotifOpen(false)}
                  className="w-5.5 h-5.5 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                  style={{ background: 'rgba(74,90,138,0.1)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(74,90,138,0.25)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(74,90,138,0.1)'; }}
                >
                  <X size={11} style={{ color: '#9aaad0' }} />
                </button>
              </div>
              {/* Notification items */}
              <div className="py-1">
                {notifList.length === 0 ? (
                  <div className="py-8 px-4 text-center text-xs font-bold" style={{ color: '#94a3b8' }}>
                    {noNotifsText[language] || 'No new notifications'}
                  </div>
                ) : (
                  notifList.map((n) => {
                    const NIcon = nIconMap[n.icon] || Bell;
                    return (
                      <button
                        key={n.id}
                        onClick={() => handleDismissNotif(n.id)}
                        className="w-full text-left flex items-start gap-2.5 px-4 py-2.5 transition-colors cursor-pointer"
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(74,90,138,0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div className="relative mt-0.5 shrink-0">
                          <NIcon size={14} style={{ color: severityDot[n.severity] || '#3b82f6' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white leading-relaxed break-words">{n.text}</p>
                          <p className="text-[10px] mt-0.5 font-semibold" style={{ color: '#94a3b8' }}>{n.time}</p>
                        </div>
                        <div
                          className="w-1.5 h-1.5 rounded-full mt-2 shrink-0 animate-pulse"
                          style={{ background: severityDot[n.severity] || '#3b82f6' }}
                        />
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* ──────── Settings ──────── */}
        <div ref={settingsRef} className="relative">
          <button
            id="btn-settings"
            onClick={() => { setSettingsOpen(!settingsOpen); setLangOpen(false); setNotifOpen(false); }}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer"
            style={{
              background: settingsOpen ? 'rgba(0,229,255,0.08)' : 'rgba(21,29,53,0.6)',
              border: `1px solid ${settingsOpen ? 'rgba(0,229,255,0.3)' : 'rgba(74,90,138,0.25)'}`,
            }}
            onMouseEnter={(e) => { if (!settingsOpen) e.currentTarget.style.borderColor = 'rgba(0,229,255,0.2)'; }}
            onMouseLeave={(e) => { if (!settingsOpen) e.currentTarget.style.borderColor = settingsOpen ? 'rgba(0,229,255,0.3)' : 'rgba(74,90,138,0.25)'; }}
          >
            <Settings size={15} style={{ color: settingsOpen ? '#00e5ff' : '#9aaad0' }} />
          </button>

          {settingsOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-80 rounded-xl animate-fade-in-up"
              style={{ ...panelStyle, zIndex: 9999 }}
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b" style={{ borderColor: 'rgba(74,90,138,0.2)' }}>
                <span className="text-xs font-bold text-white leading-normal">
                  {settingsTitles[language] || 'Settings'}
                </span>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="w-5.5 h-5.5 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                  style={{ background: 'rgba(74,90,138,0.1)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(74,90,138,0.25)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(74,90,138,0.1)'; }}
                >
                  <X size={11} style={{ color: '#9aaad0' }} />
                </button>
              </div>
              {/* Settings items */}
              <div className="py-2.5 px-4 flex flex-col gap-2">
                {settings.map((s, i) => {
                  const SIcon = sIconMap[s.icon] || Settings;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg p-2 animate-fade-in-up"
                      style={{
                        background: 'rgba(21,29,53,0.6)',
                        border: '1px solid rgba(74,90,138,0.15)',
                        animationDelay: `${i * 40}ms`
                      }}
                    >
                      <div
                        className="w-7.5 h-7.5 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.1)' }}
                      >
                        <SIcon size={13} style={{ color: '#00e5ff' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold leading-normal" style={{ color: '#c8d2e8' }}>{s.label}</p>
                        <p className="text-xs font-bold text-white break-words mt-0.5 leading-normal">{s.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
