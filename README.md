# Factory Energy AX Copilot

## 산업현장 에너지 운영 AX 코파일럿
전력 이상감지 및 AI 절감 리포트 자동화 시스템

산업현장의 전력 점검, 이상 이벤트 탐지, 원인 분석, 절감 리포트 생성을 AI Agent 기반 AX 워크플로우로 전환하는 웹 기반 프로토타입입니다.

## Live Demo

- Vercel: https://factory-energy-ax-copilot.vercel.app/
- GitHub: https://github.com/22212093/factory-energy-ax-copilot

## 주요 기능

- 실시간 전력 KPI 대시보드
- 시간대별 전력 사용량 그래프
- 이상 이벤트 탐지
- Gemini API 기반 AI 리포트 생성
- Gemini 한도 초과 또는 실패 시 Local Rule Engine 자동 분석
- 리포트 생성 완료 알림 연동
- AI 리포트 TXT 다운로드
- 다국어 UI 지원

## Demo Scenario

1. 대시보드에서 전력 KPI와 그래프를 확인합니다.
2. 이상 이벤트 목록에서 Compressor-2 이벤트를 선택합니다.
3. AI 리포트 영역에서 원인 후보와 권장 조치를 확인합니다.
4. 리포트 생성 버튼을 클릭합니다.
5. Gemini Live 또는 Local Rule 리포트가 생성됩니다.
6. 생성 완료 알림이 헤더 알림 패널에 표시됩니다.
7. 필요 시 TXT 파일로 리포트를 다운로드합니다.

## AI Report Flow

Gemini API가 정상 동작하면 Gemini Live 리포트를 생성합니다.

Gemini API 한도 초과, 호출 실패, JSON 파싱 실패 상황에서는 Local Rule Engine이 이벤트 데이터를 기준으로 자체 분석 리포트를 생성합니다.

Anomaly Event
→ Gemini API
→ Gemini Live Report

Anomaly Event
→ API Error / Quota Exceeded
→ Local Rule Engine Report

## Tech Stack

| Category | Stack |
|---|---|
| Frontend | React, Vite |
| Chart | Recharts |
| Icons | lucide-react |
| Deployment | Vercel |
| AI API | Google Gemini API |
| Fallback | Local Rule Engine |
| Export | TXT Download |

## Project Structure

factory-energy-ax-copilot
├─ api
│  └─ generate-report.js
├─ src
│  ├─ components
│  │  ├─ Header.jsx
│  │  ├─ MetricCard.jsx
│  │  ├─ PowerChart.jsx
│  │  ├─ AnomalyList.jsx
│  │  └─ AIReport.jsx
│  ├─ data
│  │  ├─ mockData.js
│  │  └─ translations.js
│  ├─ App.jsx
│  └─ index.css
├─ package.json
└─ README.md

## Local Development

Install:

npm install

Run:

npm run dev

PowerShell:

npm.cmd run dev

Build:

npm run build

PowerShell:

npm.cmd run build

## Environment Variables

Gemini API는 프론트엔드에서 직접 호출하지 않고 Vercel Serverless Function에서 호출합니다.

GEMINI_API_KEY=your_api_key
GEMINI_MODEL=gemini-2.5-flash

Vercel Project Settings의 Environment Variables에 등록해야 합니다.

## Future Expansion

- ESP32 기반 전력 센서 데이터 수집
- CT 전류 센서 또는 산업용 전력계 연동
- MQTT / HTTP 기반 실시간 데이터 수집
- Supabase 기반 전력 로그 저장
- Google Cloud Run 기반 API 서버
- RAG 기반 설비 매뉴얼 / SOP 검색
- 관리자 조치 로그 및 이력 관리

## Team

| Role | Name |
|---|---|
| Team | 현장지킴이 |
| Lead | 우지은 |
| University | 영남대학교 |

## Submission

영남대학교_현장지킴이_7215
