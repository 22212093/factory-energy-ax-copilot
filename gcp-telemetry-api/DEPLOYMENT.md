# GCP Cloud Run 텔레메트리 API 배포 검증 보고서

## 서비스 정보

| 항목 | 값 |
|---|---|
| **서비스명** | `fieldkeeper-telemetry-api` |
| **프로젝트** | `knudc-gajoggongyu5` |
| **리전** | `asia-northeast3` (서울) |
| **플랫폼** | Google Cloud Run (Managed) |
| **리비전** | `fieldkeeper-telemetry-api-00001-9dz` |
| **URL** | `https://fieldkeeper-telemetry-api-431524974551.asia-northeast3.run.app` |

---

## 공개 접근 제한 안내

이 Cloud Run 서비스는 **기관 조직 정책** (`constraints/iam.allowedPolicyMemberDomains`)에 의해 인증 없는 공개 호출이 차단됩니다.

- 인증 없이 호출 시 → `403 Forbidden` (보안 정책에 따른 의도된 제한)
- 인증 토큰 포함 시 → 정상 동작 확인 완료

> 이는 결함이 아닌 **기관 GCP 보안 정책**에 따른 동작입니다.  
> 실제 운영 환경에서는 서비스 계정 + Cloud Run Invoker 역할로 ESP32/프론트를 인증합니다.

---

## 인증 토큰 발급 (발표 데모 전 실행)

```powershell
# 1. Google Cloud 로그인 상태 확인
gcloud auth login

# 2. 프로젝트 설정
gcloud config set project knudc-gajoggongyu5

# 3. 인증 토큰 발급 (1시간 유효)
$TOKEN = gcloud auth print-identity-token
```

---

## 엔드포인트 검증 명령어

### GET /health — 헬스체크

```powershell
$TOKEN = gcloud auth print-identity-token
$BASE = "https://fieldkeeper-telemetry-api-431524974551.asia-northeast3.run.app"
Invoke-RestMethod -Uri "$BASE/health" -Headers @{Authorization="Bearer $TOKEN"}
```

**검증 성공 응답:**
```json
{
  "status": "ok",
  "service": "gcp-telemetry-api",
  "version": "1.0.0",
  "timestamp": "2026-06-03T16:07:50.427Z",
  "frames": 0
}
```

---

### GET /api/status — 서비스 상태 조회

```powershell
Invoke-RestMethod -Uri "$BASE/api/status" -Headers @{Authorization="Bearer $TOKEN"}
```

**검증 성공 응답:**
```json
{
  "ok": true,
  "mqttTopic": "factory/fieldkeeper/line-a/compressor-2/power",
  "warningThreshold": 0.8,
  "alertThreshold": 1.0,
  "maxHistory": 200,
  "currentFrames": 0,
  "injectionActive": false,
  "latestStatus": null,
  "latestI_A": null
}
```

---

### POST /api/telemetry — XIAO 텔레메트리 프레임 전송

```powershell
$BODY = '{"I_A":0.423,"status":"normal","servo":"idle"}'
$FRAME = Invoke-RestMethod -Method Post `
  -Uri "$BASE/api/telemetry" `
  -Headers @{Authorization="Bearer $TOKEN"; "x-device-token"="fieldkeeper-demo-7215"} `
  -Body $BODY `
  -ContentType "application/json"
$FRAME | ConvertTo-Json -Depth 4
```

**검증 성공 응답:**
```json
{
  "ok": true,
  "frame": {
    "ts": 1780505181721,
    "serverTs": 1780505181721,
    "receivedAt": "2026-06-03T16:46:21.721Z",
    "I_A": 0.423,
    "status": "normal",
    "servo": "idle",
    "topic": "factory/fieldkeeper/line-a/compressor-2/power",
    "source": "xiao-serial"
  }
}
```

---

### GET /api/telemetry/latest — 최신 프레임 조회

```powershell
Invoke-RestMethod -Uri "$BASE/api/telemetry/latest" -Headers @{Authorization="Bearer $TOKEN"}
```

**검증 성공 응답:** POST로 저장된 최신 프레임 반환

---

### POST /api/telemetry/inject — D4 이상 전류 주입 시뮬레이션

```powershell
$INJECT = Invoke-RestMethod -Method Post `
  -Uri "$BASE/api/telemetry/inject" `
  -Headers @{Authorization="Bearer $TOKEN"; "x-device-token"="fieldkeeper-demo-7215"} `
  -Body '{"I_A":1.15,"servo":"triggered"}' `
  -ContentType "application/json"
$INJECT | ConvertTo-Json -Depth 4
```

**검증 성공 응답:**
```json
{
  "ok": true,
  "injected": true,
  "frame": {
    "I_A": 1.15,
    "status": "alert",
    "servo": "triggered",
    "topic": "factory/fieldkeeper/line-a/compressor-2/power",
    "source": "inject-d4"
  }
}
```

---

## 전체 검증 결과 (2026-06-03)

| 엔드포인트 | 방식 | 결과 |
|---|---|---|
| `GET /health` | 인증 토큰 | ✅ 200 OK |
| `GET /api/status` | 인증 토큰 | ✅ 200 OK |
| `POST /api/telemetry` | 인증 토큰 + x-device-token | ✅ 201 Created |
| `GET /api/telemetry/latest` | 인증 토큰 | ✅ 200 OK |
| `POST /api/telemetry/inject` | 인증 토큰 + x-device-token | ✅ 201 Created |
| 인증 없이 호출 | 없음 | ⛔ 403 (조직 보안 정책) |

---

## 시스템 아키텍처 (PoC 발표용)

```
XIAO ESP32-C3
  │  ACS712 5A 전류 측정
  │  SG90 Servo 제어
  │
  ├─[Web Serial @ 115200 baud]──▶ 브라우저 Web Serial API
  │                                └─▶ SensorPocCard.jsx (실시간 표시)
  │
  └─[HTTP POST + GCP 인증]──────▶ Cloud Run fieldkeeper-telemetry-api
                                   └─▶ 인메모리 히스토리 저장
                                        GET /api/telemetry/latest 조회 가능

MQTT-ready payload topic: factory/fieldkeeper/line-a/compressor-2/power
```

---

## 발표 데모 순서

1. `gcloud auth print-identity-token`으로 토큰 발급
2. `GET /health` 호출 → 서비스 정상 응답 시연
3. `POST /api/telemetry` 호출 → 텔레메트리 수신 시연
4. `POST /api/telemetry/inject` 호출 → D4 이상 전류 주입 시연
5. Web Serial 연결로 실시간 XIAO 텔레메트리 표시 (SensorPocCard)

---

_브랜치: `gcp-cloudrun-telemetry` | 작성: 2026-06-03_
