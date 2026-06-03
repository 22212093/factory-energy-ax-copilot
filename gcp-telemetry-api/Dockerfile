# ─── Cloud Run 컨테이너 빌드 설정 ───────────────────────
# Base: Node.js 20 Alpine (경량)
FROM node:20-alpine

# 보안: non-root 사용자
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# 의존성 먼저 복사 (레이어 캐싱 최적화)
COPY package.json ./

# 프로덕션 의존성만 설치
RUN npm install --omit=dev

# 소스 복사
COPY server.js ./

# 소유권 설정
RUN chown -R appuser:appgroup /app
USER appuser

# Cloud Run 기본 포트
EXPOSE 8080

# 환경변수 기본값 (Cloud Run에서 PORT는 자동 주입됨)
ENV PORT=8080
ENV NODE_ENV=production

# 헬스체크: Cloud Run이 /health로 확인
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["node", "server.js"]
