// ─── Power Chart Data ───────────────────────────────────
// Fixed power profile shape — spike always at index 9.
// generatePowerData() maps this onto real current timestamps.
const POWER_PROFILE = [62, 64, 61, 66, 63, 67, 65, 68, 72, 92.4, 84, 71, 66, 63, 61, 64];

export function generatePowerData(now = new Date()) {
  // Start 30 minutes before now, round to nearest 2-min boundary
  const start = new Date(now.getTime() - 30 * 60 * 1000);
  start.setMinutes(Math.floor(start.getMinutes() / 2) * 2, 0, 0);
  return POWER_PROFILE.map((power, i) => {
    const d = new Date(start.getTime() + i * 2 * 60 * 1000);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return { time: `${hh}:${mm}`, power, baseline: 65 };
  });
}

// Spike is always at index 9 — expose its time for ReferenceDot
export function getSpikeTime(data) {
  return data[9]?.time ?? '';
}

// Keep legacy static export for any components that still import it directly
export const powerData = generatePowerData();


// ─── Anomaly Event Reports — per language ──────────────
// Each event has a `reports` object keyed by language code.

const compressorReports = {
  ko: {
    title: 'Compressor-2 전력 급증',
    summary: '15:08 기준선 대비 전력 피크 감지. AI Agent가 누설·공회전·압력 과다를 원인 후보로 분석.',
    causes: [
      { icon: 'wind', label: '압축공기 누설 가능성', detail: '' },
      { icon: 'clock', label: '비작업시간 공회전', detail: '' },
      { icon: 'gauge', label: '압력 설정값 과다', detail: '' },
      { icon: 'cog', label: '장비 노후화', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: '압력 설정값 확인', detail: '' },
      { priority: 'today', label: '누설 지점 점검', detail: '' },
      { priority: 'thisWeek', label: '자동 차단 스케줄 적용', detail: '' },
    ],
    savings: '8~12%',
    confidence: 94,
  },
  en: {
    title: 'Compressor-2 Power Spike',
    summary: 'Power spike detected at 15:08. AI analyzed air leak, idle running, and excessive pressure as causes.',
    causes: [
      { icon: 'wind', label: 'Compressed air leak', detail: '' },
      { icon: 'clock', label: 'Off-hour idling', detail: '' },
      { icon: 'gauge', label: 'High pressure setting', detail: '' },
      { icon: 'cog', label: 'Aging equipment', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'Check pressure set-point', detail: '' },
      { priority: 'today', label: 'Inspect leak points', detail: '' },
      { priority: 'thisWeek', label: 'Apply auto-shutoff schedule', detail: '' },
    ],
    savings: '8~12%',
    confidence: 94,
  },
  ja: {
    title: 'Compressor-2 電力スパイク',
    summary: '15:08電力ピーク検出。AIが空気漏れ、アイドル運転、過圧力を原因として分析。',
    causes: [
      { icon: 'wind', label: '圧縮空気漏れの可能性', detail: '' },
      { icon: 'clock', label: '時間外アイドリング', detail: '' },
      { icon: 'gauge', label: '圧力設定値過大', detail: '' },
      { icon: 'cog', label: '設備老朽化', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: '圧力設定値の確認', detail: '' },
      { priority: 'today', label: '漏れ箇所の点検', detail: '' },
      { priority: 'thisWeek', label: '自動遮断の適用', detail: '' },
    ],
    savings: '8~12%',
    confidence: 94,
  },
  zh: {
    title: 'Compressor-2 功率尖峰',
    summary: '15:08检测到电力峰值。AI分析原因为漏气、空转及压力过高。',
    causes: [
      { icon: 'wind', label: '压缩空气泄漏可能', detail: '' },
      { icon: 'clock', label: '非工时空转', detail: '' },
      { icon: 'gauge', label: '压力设定值过高', detail: '' },
      { icon: 'cog', label: '设备老化', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: '检查压力设定值', detail: '' },
      { priority: 'today', label: '检查泄漏点', detail: '' },
      { priority: 'thisWeek', label: '应用自动关闭计划', detail: '' },
    ],
    savings: '8~12%',
    confidence: 94,
  },
  fr: {
    title: 'Compressor-2 Pic de puissance',
    summary: "Pic détecté à 15:08. L'IA a analysé la fuite d'air, le ralenti et la surpression.",
    causes: [
      { icon: 'wind', label: "Fuite d'air comprimé", detail: '' },
      { icon: 'clock', label: 'Marche à vide', detail: '' },
      { icon: 'gauge', label: 'Réglage de pression haut', detail: '' },
      { icon: 'cog', label: 'Équipement vieillissant', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'Vérifier la pression', detail: '' },
      { priority: 'today', label: 'Inspecter les fuites', detail: '' },
      { priority: 'thisWeek', label: "Appliquer l'arrêt auto", detail: '' },
    ],
    savings: '8~12%',
    confidence: 94,
  },
  es: {
    title: 'Pico de potencia de Compressor-2',
    summary: 'Pico de potencia detectado a las 15:08. La IA analizó fugas, ralentí y sobrepresión.',
    causes: [
      { icon: 'wind', label: 'Fuga de aire comprimido', detail: '' },
      { icon: 'clock', label: 'Ralentí fuera de horario', detail: '' },
      { icon: 'gauge', label: 'Ajuste de presión alta', detail: '' },
      { icon: 'cog', label: 'Equipo antiguo', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'Verificar presión', detail: '' },
      { priority: 'today', label: 'Inspeccionar fugas', detail: '' },
      { priority: 'thisWeek', label: 'Aplicar apagado auto', detail: '' },
    ],
    savings: '8~12%',
    confidence: 94,
  },
  de: {
    title: 'Compressor-2 Leistungsspitze',
    summary: 'Leistungsspitze um 15:08. KI analysierte Leckage, Leerlauf und Überdruck als Ursachen.',
    causes: [
      { icon: 'wind', label: 'Druckluftleckage', detail: '' },
      { icon: 'clock', label: 'Leerlauf off-hour', detail: '' },
      { icon: 'gauge', label: 'Hohe Druckeinstellung', detail: '' },
      { icon: 'cog', label: 'Veraltetes Gerät', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'Druck-Sollwert prüfen', detail: '' },
      { priority: 'today', label: 'Leckstellen inspizieren', detail: '' },
      { priority: 'thisWeek', label: 'Auto-Abschaltung nutzen', detail: '' },
    ],
    savings: '8~12%',
    confidence: 94,
  },
  vi: {
    title: 'Compressor-2 Đỉnh điện năng',
    summary: 'Phát hiện đỉnh điện lúc 15:08. AI phân tích rò rỉ, chạy không tải và quá áp.',
    causes: [
      { icon: 'wind', label: 'Rò rỉ khí nén', detail: '' },
      { icon: 'clock', label: 'Chạy không tải ngoài giờ', detail: '' },
      { icon: 'gauge', label: 'Áp suất cài đặt cao', detail: '' },
      { icon: 'cog', label: 'Thiết bị lão hóa', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'Kiểm tra áp suất', detail: '' },
      { priority: 'today', label: 'Kiểm tra rò rỉ', detail: '' },
      { priority: 'thisWeek', label: 'Lịch tự động tắt', detail: '' },
    ],
    savings: '8~12%',
    confidence: 94,
  },
  id: {
    title: 'Compressor-2 Lonjakan Daya',
    summary: 'Lonjakan daya pukul 15:08. AI menganalisis kebocoran, idle, dan tekanan berlebih.',
    causes: [
      { icon: 'wind', label: 'Kebocoran udara', detail: '' },
      { icon: 'clock', label: 'Idle luar jam kerja', detail: '' },
      { icon: 'gauge', label: 'Tekanan terlalu tinggi', detail: '' },
      { icon: 'cog', label: 'Peralatan menua', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'Periksa titik tekan', detail: '' },
      { priority: 'today', label: 'Periksa kebocoran', detail: '' },
      { priority: 'thisWeek', label: 'Mati otomatis', detail: '' },
    ],
    savings: '8~12%',
    confidence: 94,
  },
  th: {
    title: 'Compressor-2 พลังงานกระชาก',
    summary: 'พบไฟกระชากเวลา 15:08 น. AI วิเคราะห์สาเหตุจากลมรั่ว การเดินเครื่องเปล่า และแรงดันสูงเกิน',
    causes: [
      { icon: 'wind', label: 'ลมรั่วไหล', detail: '' },
      { icon: 'clock', label: 'เดินเครื่องเปล่านอกเวลา', detail: '' },
      { icon: 'gauge', label: 'ตั้งค่าแรงดันสูงเกิน', detail: '' },
      { icon: 'cog', label: 'อุปกรณ์เสื่อมสภาพ', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'ตรวจสอบแรงดัน', detail: '' },
      { priority: 'today', label: 'ตรวจสอบจุดรั่ว', detail: '' },
      { priority: 'thisWeek', label: 'ใช้ตารางปิดเครื่องออโต้', detail: '' },
    ],
    savings: '8~12%',
    confidence: 94,
  },
};

const lineAReports = {
  ko: {
    title: 'Line-A 비작업시간 전력 사용',
    summary: '비작업시간대 전력 사용 감지. AI가 스케줄 불일치, 대기 전력 차단 미흡을 원인으로 분석.',
    causes: [
      { icon: 'calendar', label: '생산 스케줄 불일치', detail: '' },
      { icon: 'user', label: '설비 수동 오버라이드', detail: '' },
      { icon: 'monitor', label: '컨베이어 대기 전력', detail: '' },
      { icon: 'refresh', label: '비작업시간 예열 사이클', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'MES 일정 자동 연동', detail: '' },
      { priority: 'today', label: '수동 작동 이력 감사', detail: '' },
      { priority: 'thisWeek', label: '유휴 대기 차단 정책 적용', detail: '' },
    ],
    savings: '5~8%',
    confidence: 87,
  },
  en: {
    title: 'Line-A Off-hour Usage',
    summary: 'Off-hour power usage detected. AI analyzed schedule mismatch and standby draw as causes.',
    causes: [
      { icon: 'calendar', label: 'Schedule mismatch', detail: '' },
      { icon: 'user', label: 'Manual override', detail: '' },
      { icon: 'monitor', label: 'Standby draw', detail: '' },
      { icon: 'refresh', label: 'Warm-up cycle', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'Sync schedules', detail: '' },
      { priority: 'today', label: 'Audit overrides', detail: '' },
      { priority: 'thisWeek', label: 'Implement standby policy', detail: '' },
    ],
    savings: '5~8%',
    confidence: 87,
  },
  ja: {
    title: 'Line-A 時間外使用',
    summary: '時間外電力使用検出。AIがスケジュール不一致、待機電力カット不足を分析。',
    causes: [
      { icon: 'calendar', label: 'スケジュール不一致', detail: '' },
      { icon: 'user', label: '手動オーバーライド', detail: '' },
      { icon: 'monitor', label: 'スタンバイ消費', detail: '' },
      { icon: 'refresh', label: '予熱サイクル', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'スケジュール同期', detail: '' },
      { priority: 'today', label: 'オーバーライド監査', detail: '' },
      { priority: 'thisWeek', label: '待機電力ポリシー適用', detail: '' },
    ],
    savings: '5~8%',
    confidence: 87,
  },
  zh: {
    title: 'Line-A 非工时用电',
    summary: '非工时用电检测。AI分析原因为计划不匹配及待机功耗未切断。',
    causes: [
      { icon: 'calendar', label: '计划不匹配', detail: '' },
      { icon: 'user', label: '手动覆盖', detail: '' },
      { icon: 'monitor', label: '待机功耗', detail: '' },
      { icon: 'refresh', label: '预热周期', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: '同步计划', detail: '' },
      { priority: 'today', label: '审核手动覆盖', detail: '' },
      { priority: 'thisWeek', label: '实施待机策略', detail: '' },
    ],
    savings: '5~8%',
    confidence: 87,
  },
  fr: {
    title: 'Line-A Usage hors horaires',
    summary: "Usage hors horaires détecté. L'IA a analysé un décalage de planning et une veille active.",
    causes: [
      { icon: 'calendar', label: 'Décalage de planning', detail: '' },
      { icon: 'user', label: 'Contournement manuel', detail: '' },
      { icon: 'monitor', label: 'Consommation en veille', detail: '' },
      { icon: 'refresh', label: 'Cycle de préchauffage', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'Synchroniser plannings', detail: '' },
      { priority: 'today', label: 'Auditer contournements', detail: '' },
      { priority: 'thisWeek', label: 'Politique de veille auto', detail: '' },
    ],
    savings: '5~8%',
    confidence: 87,
  },
  es: {
    title: 'Uso de Line-A fuera de horario',
    summary: 'Uso fuera de horario detectado. La IA analizó desajuste de horario y consumo en espera.',
    causes: [
      { icon: 'calendar', label: 'Desajuste de cronograma', detail: '' },
      { icon: 'user', label: 'Anulación manual', detail: '' },
      { icon: 'monitor', label: 'Consumo en standby', detail: '' },
      { icon: 'refresh', label: 'Precalentamiento', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'Sincronizar cronogramas', detail: '' },
      { priority: 'today', label: 'Auditar anulaciones', detail: '' },
      { priority: 'thisWeek', label: 'Política de standby', detail: '' },
    ],
    savings: '5~8%',
    confidence: 87,
  },
  de: {
    title: 'Line-A Nutzung außerhalb der Zeit',
    summary: 'Nutzung außerhalb der Zeit. KI analysierte Planungsfehler und Standby-Verbrauch.',
    causes: [
      { icon: 'calendar', label: 'Zeitplanabweichung', detail: '' },
      { icon: 'user', label: 'Manuelle Übersteuerung', detail: '' },
      { icon: 'monitor', label: 'Standby-Verbrauch', detail: '' },
      { icon: 'refresh', label: 'Aufwärmzyklus', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'Zeitpläne abgleichen', detail: '' },
      { priority: 'today', label: 'Übersteuerungen prüfen', detail: '' },
      { priority: 'thisWeek', label: 'Standby-Regel nutzen', detail: '' },
    ],
    savings: '5~8%',
    confidence: 87,
  },
  vi: {
    title: 'Line-A Sử dụng ngoài giờ',
    summary: 'Phát hiện sử dụng điện ngoài giờ. AI phân tích lịch trình lệch và điện chờ.',
    causes: [
      { icon: 'calendar', label: 'Lệch lịch trình', detail: '' },
      { icon: 'user', label: 'Ghi đè thủ công', detail: '' },
      { icon: 'monitor', label: 'Dòng điện chờ', detail: '' },
      { icon: 'refresh', label: 'Khởi động trước', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'Đồng bộ lịch trình', detail: '' },
      { priority: 'today', label: 'Kiểm tra ghi đè', detail: '' },
      { priority: 'thisWeek', label: 'Áp dụng chính sách chờ', detail: '' },
    ],
    savings: '5~8%',
    confidence: 87,
  },
  id: {
    title: 'Line-A Penggunaan Luar Jam Kerja',
    summary: 'Penggunaan daya luar jam kerja. AI menganalisis ketidakcocokan jadwal dan siaga.',
    causes: [
      { icon: 'calendar', label: 'Ketidakcocokan jadwal', detail: '' },
      { icon: 'user', label: 'Bypass manual', detail: '' },
      { icon: 'monitor', label: 'Daya siaga', detail: '' },
      { icon: 'refresh', label: 'Siklus pemanasan', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'Sinkronkan jadwal', detail: '' },
      { priority: 'today', label: 'Audit bypass manual', detail: '' },
      { priority: 'thisWeek', label: 'Terapkan kebijakan siaga', detail: '' },
    ],
    savings: '5~8%',
    confidence: 87,
  },
  th: {
    title: 'Line-A การใช้งานนอกเวลา',
    summary: 'พบการใช้ไฟนอกเวลาทำงาน AI วิเคราะห์ตารางเวลาไม่ตรงกันและพลังงานสแตนด์บาย',
    causes: [
      { icon: 'calendar', label: 'ตารางงานไม่ตรงกัน', detail: '' },
      { icon: 'user', label: 'การควบคุมด้วยมือ', detail: '' },
      { icon: 'monitor', label: 'พลังงานสแตนด์บาย', detail: '' },
      { icon: 'refresh', label: 'รอบอุ่นเครื่อง', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'ซิงค์ตารางเวลา', detail: '' },
      { priority: 'today', label: 'ตรวจสอบบันทึกข้ามระบบ', detail: '' },
      { priority: 'thisWeek', label: 'นโยบายสแตนด์บาย', detail: '' },
    ],
    savings: '5~8%',
    confidence: 87,
  },
};

const aiLabReports = {
  ko: {
    title: 'AI Lab 반복 사용 패턴',
    summary: 'GPU 클러스터 유휴→피크 반복 패턴 감지. AI가 비효율적 작업 스케줄링을 원인으로 분석.',
    causes: [
      { icon: 'cpu', label: '작업 스케줄링 공백', detail: '' },
      { icon: 'thermometer', label: '냉각 오버헤드', detail: '' },
      { icon: 'database', label: '데이터 파이프라인 정체', detail: '' },
      { icon: 'zap', label: '전원 공급 비효율', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: '배치 스케줄 통합', detail: '' },
      { priority: 'today', label: '캐시 파이프라인 최적화', detail: '' },
      { priority: 'thisWeek', label: 'GPU 동적 전력 스케일링', detail: '' },
    ],
    savings: '3~5%',
    confidence: 79,
  },
  en: {
    title: 'AI Lab Repetitive Pattern',
    summary: 'Repeating GPU idle-peak cycles. AI analyzed inefficient job scheduling as the cause.',
    causes: [
      { icon: 'cpu', label: 'Job scheduling gaps', detail: '' },
      { icon: 'thermometer', label: 'Cooling overhead', detail: '' },
      { icon: 'database', label: 'Data pipeline stalls', detail: '' },
      { icon: 'zap', label: 'Power supply loss', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'Batch consolidation', detail: '' },
      { priority: 'today', label: 'Optimize data pipeline', detail: '' },
      { priority: 'thisWeek', label: 'Enable GPU DVFS', detail: '' },
    ],
    savings: '3~5%',
    confidence: 79,
  },
  ja: {
    title: 'AI Lab 反復パターン',
    summary: 'GPUアイドルの反復検出。AIが非効率なジョブスケジューリングを分析。',
    causes: [
      { icon: 'cpu', label: 'ジョブスケジューリングギャップ', detail: '' },
      { icon: 'thermometer', label: '冷却オーバーヘッド', detail: '' },
      { icon: 'database', label: 'データパイプライン停滞', detail: '' },
      { icon: 'zap', label: '電源効率低下', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'バッチジョブ統合', detail: '' },
      { priority: 'today', label: 'パイプライン最適化', detail: '' },
      { priority: 'thisWeek', label: 'GPU電力スケーリング有効化', detail: '' },
    ],
    savings: '3~5%',
    confidence: 79,
  },
  zh: {
    title: 'AI Lab 重复模式',
    summary: 'GPU空闲循环重复。AI分析原因为低效作业调度。',
    causes: [
      { icon: 'cpu', label: '作业调度间隙', detail: '' },
      { icon: 'thermometer', label: '冷却开销', detail: '' },
      { icon: 'database', label: '数据管道停滞', detail: '' },
      { icon: 'zap', label: '电源效率低', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: '合并训练作业', detail: '' },
      { priority: 'today', label: '优化数据管道', detail: '' },
      { priority: 'thisWeek', label: '启用GPU动态功率调节', detail: '' },
    ],
    savings: '3~5%',
    confidence: 79,
  },
  fr: {
    title: 'AI Lab Schéma répétitif',
    summary: 'Cycles répétitifs GPU. L\'IA a analysé une planification inefficace des tâches.',
    causes: [
      { icon: 'cpu', label: 'Lacunes de planification', detail: '' },
      { icon: 'thermometer', label: 'Surcharge de CVC', detail: '' },
      { icon: 'database', label: 'Pipeline de données bloqué', detail: '' },
      { icon: 'zap', label: 'Inefficacité alimentation', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'Consolidation des lots', detail: '' },
      { priority: 'today', label: 'Optimiser le pipeline', detail: '' },
      { priority: 'thisWeek', label: 'Activer GPU DVFS', detail: '' },
    ],
    savings: '3~5%',
    confidence: 79,
  },
  es: {
    title: 'Patrón repetitivo de AI Lab',
    summary: 'Ciclos repetitivos de GPU. La IA analizó una planificación ineficiente de tareas.',
    causes: [
      { icon: 'cpu', label: 'Vacíos de programación', detail: '' },
      { icon: 'thermometer', label: 'Exceso de refrigeración', detail: '' },
      { icon: 'database', label: 'Colas en pipeline', detail: '' },
      { icon: 'zap', label: 'Ineficiencia de fuente', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'Consolidación de lotes', detail: '' },
      { priority: 'today', label: 'Optimizar pipeline', detail: '' },
      { priority: 'thisWeek', label: 'Activer DVFS de GPU', detail: '' },
    ],
    savings: '3~5%',
    confidence: 79,
  },
  de: {
    title: 'AI Lab Wiederholendes Muster',
    summary: 'Wiederholte GPU-Zyklen. KI analysierte ineffiziente Jobplanung als Ursache.',
    causes: [
      { icon: 'cpu', label: 'Lücken in Arbeitsplanung', detail: '' },
      { icon: 'thermometer', label: 'Kühlungs-Overhead', detail: '' },
      { icon: 'database', label: 'Datenpipeline-Engpass', detail: '' },
      { icon: 'zap', label: 'Netzteil-Ineffizienz', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'Batch-Konsolidierung', detail: '' },
      { priority: 'today', label: 'Pipeline optimieren', detail: '' },
      { priority: 'thisWeek', label: 'GPU-DVFS aktivieren', detail: '' },
    ],
    savings: '3~5%',
    confidence: 79,
  },
  vi: {
    title: 'AI Lab Mẫu lặp lại',
    summary: 'Chu kỳ GPU lặp lại. AI phân tích lập lịch tác vụ kém hiệu quả là nguyên nhân.',
    causes: [
      { icon: 'cpu', label: 'Khoảng cách lập lịch', detail: '' },
      { icon: 'thermometer', label: 'Quá tải làm mát', detail: '' },
      { icon: 'database', label: 'Nghẽn đường dữ liệu', detail: '' },
      { icon: 'zap', label: 'Nguồn cấp điện kém', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'Hợp nhất lô tác vụ', detail: '' },
      { priority: 'today', label: 'Tối ưu đường dữ liệu', detail: '' },
      { priority: 'thisWeek', label: 'GPU tự động điều chỉnh', detail: '' },
    ],
    savings: '3~5%',
    confidence: 79,
  },
  id: {
    title: 'AI Lab Pola Berulang',
    summary: 'Siklus berulang GPU. AI menganalisis penjadwalan pekerjaan yang tidak efisien.',
    causes: [
      { icon: 'cpu', label: 'Kesenjangan jadwal kerja', detail: '' },
      { icon: 'thermometer', label: 'Beban pendinginan', detail: '' },
      { icon: 'database', label: 'Kemacetan pipa data', detail: '' },
      { icon: 'zap', label: 'Ketidakefisienan daya', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'Konsolidasi batch', detail: '' },
      { priority: 'today', label: 'Optimalkan pipa data', detail: '' },
      { priority: 'thisWeek', label: 'Aktifkan DVFS GPU', detail: '' },
    ],
    savings: '3~5%',
    confidence: 79,
  },
  th: {
    title: 'AI Lab รูปแบบการทำซ้ำ',
    summary: 'พบรอบการทำงาน GPU ซ้ำกัน AI วิเคราะห์การจัดคิวงานที่ไม่มีประสิทธิภาพ',
    causes: [
      { icon: 'cpu', label: 'ช่องว่างการจัดคิวงาน', detail: '' },
      { icon: 'thermometer', label: 'ระบบทำความเย็นทำงานหนัก', detail: '' },
      { icon: 'database', label: 'คอขวดระบบส่งข้อมูล', detail: '' },
      { icon: 'zap', label: 'แหล่งจ่ายไฟสูญเสียกำลัง', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'รวบรวมคิวงานเข้าด้วยกัน', detail: '' },
      { priority: 'today', label: 'ปรับปรุงการอ่านข้อมูล', detail: '' },
      { priority: 'thisWeek', label: 'เปิดการปรับกำลังไฟ GPU', detail: '' },
    ],
    savings: '3~5%',
    confidence: 79,
  },
};

// ─── Anomaly Events ────────────────────────────────────
// `typeKey` is used to look up the translated event type from translations.js
export const anomalyEvents = [
  {
    id: 1,
    time: '15:08',
    equipment: 'Compressor-2',
    typeKey: 'powerSpike',
    severity: 'HIGH',
    reports: compressorReports,
  },
  {
    id: 2,
    time: '15:11',
    equipment: 'Line-A',
    typeKey: 'offHourUsage',
    severity: 'MEDIUM',
    reports: lineAReports,
  },
  {
    id: 3,
    time: '15:15',
    equipment: 'AI Lab',
    typeKey: 'repetitivePattern',
    severity: 'LOW',
    reports: aiLabReports,
  },
];

// ─── Chiller-1 reports ─────────────────────────────────
const chillerReports = {
  ko: {
    title: 'Chiller-1 냉각 부하 증가',
    summary: '냉각 시스템 전력 소비 급증 감지. AI가 냉각수 온도 이상과 부하 집중을 원인으로 분석.',
    causes: [
      { icon: 'thermometer', label: '냉각수 온도 상승', detail: '' },
      { icon: 'gauge', label: '압축기 과부하', detail: '' },
      { icon: 'wind', label: '냉매 순환 저하', detail: '' },
      { icon: 'cog', label: '열교환기 오염', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: '냉각수 온도 확인', detail: '' },
      { priority: 'today', label: '열교환기 청소 점검', detail: '' },
      { priority: 'thisWeek', label: '냉매 점검 및 보충', detail: '' },
    ],
    savings: '4~7%',
    confidence: 88,
  },
  en: {
    title: 'Chiller-1 Cooling Load Rise',
    summary: 'Spike in chiller power consumption detected. AI analyzed high coolant temp and load concentration.',
    causes: [
      { icon: 'thermometer', label: 'High coolant temp', detail: '' },
      { icon: 'gauge', label: 'Compressor overload', detail: '' },
      { icon: 'wind', label: 'Reduced refrigerant flow', detail: '' },
      { icon: 'cog', label: 'Heat exchanger fouling', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'Check coolant temperature', detail: '' },
      { priority: 'today', label: 'Inspect heat exchanger', detail: '' },
      { priority: 'thisWeek', label: 'Check refrigerant level', detail: '' },
    ],
    savings: '4~7%',
    confidence: 88,
  },
};
// Fall back all other languages to English
['ja','zh','fr','es','de','vi','id','th'].forEach(lang => {
  chillerReports[lang] = chillerReports.en;
});

// ─── Conveyor-B reports ────────────────────────────────
const conveyorReports = {
  ko: {
    title: 'Conveyor-B 대기전력 과다',
    summary: '비가동 상태에서 지속적인 대기전력 소비 감지. AI가 대기 전력 차단 미설정을 원인으로 분석.',
    causes: [
      { icon: 'monitor', label: '대기전력 차단 미설정', detail: '' },
      { icon: 'clock', label: '비가동 시간 대기 지속', detail: '' },
      { icon: 'cog', label: '모터 드라이버 대기 모드 없음', detail: '' },
      { icon: 'zap', label: '보조 회로 상시 전원', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: '대기전력 차단 설정', detail: '' },
      { priority: 'today', label: '비가동 시간 스케줄 적용', detail: '' },
      { priority: 'thisWeek', label: '모터 드라이버 절전 설정', detail: '' },
    ],
    savings: '2~5%',
    confidence: 82,
  },
  en: {
    title: 'Conveyor-B Standby Power',
    summary: 'Excessive standby power draw during idle periods. AI identified missing standby cutoff configuration.',
    causes: [
      { icon: 'monitor', label: 'No standby cutoff set', detail: '' },
      { icon: 'clock', label: 'Continuous idle draw', detail: '' },
      { icon: 'cog', label: 'Motor driver always-on', detail: '' },
      { icon: 'zap', label: 'Aux circuits energized', detail: '' },
    ],
    actions: [
      { priority: 'immediate', label: 'Enable standby cutoff', detail: '' },
      { priority: 'today', label: 'Apply idle schedule', detail: '' },
      { priority: 'thisWeek', label: 'Configure motor ECO mode', detail: '' },
    ],
    savings: '2~5%',
    confidence: 82,
  },
};
['ja','zh','fr','es','de','vi','id','th'].forEach(lang => {
  conveyorReports[lang] = conveyorReports.en;
});

// ─── Event templates for live simulation ───────────────
export const eventTemplates = [
  { equipment: 'Compressor-2', typeKey: 'powerSpike',        severity: 'HIGH',   reports: compressorReports },
  { equipment: 'Line-A',       typeKey: 'offHourUsage',      severity: 'MEDIUM', reports: lineAReports },
  { equipment: 'AI Lab',       typeKey: 'repetitivePattern', severity: 'LOW',    reports: aiLabReports },
  { equipment: 'Chiller-1',    typeKey: 'coolingLoad',       severity: 'MEDIUM', reports: chillerReports },
  { equipment: 'Conveyor-B',   typeKey: 'standbyPower',      severity: 'LOW',    reports: conveyorReports },
];

// Monotonically increasing event ID counter (starts after the 3 seed events)
export let nextEventId = 4;
export function consumeNextId() { return nextEventId++; }


// ─── Metric Card Data ──────────────────────────────────
// `labelKey` is used to look up the translated label from translations.js
export const metrics = [
  {
    id: 'total-power',
    labelKey: 'totalPower',
    value: '1,284',
    unit: 'kWh',
    icon: 'zap',
    trend: '+2.4%',
    trendUp: true,
    color: '#00e5ff',
  },
  {
    id: 'today-peak',
    labelKey: 'todayPeak',
    value: '92.4',
    unit: 'kW',
    icon: 'trending-up',
    trend: '+14.8%',
    trendUp: true,
    color: '#ef4444',
  },
  {
    id: 'anomaly-events',
    labelKey: 'anomalyEvents',
    value: '3',
    unit: '',
    icon: 'alert-triangle',
    trend: '+1',
    trendUp: true,
    color: '#f59e0b',
  },
  {
    id: 'ai-reports',
    labelKey: 'aiReports',
    value: '3',
    unit: '',
    icon: 'brain',
    trendKey: 'ready',
    trendUp: false,
    color: '#a855f7',
  },
];
