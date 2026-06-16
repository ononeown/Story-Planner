# Story Planner Web

작가 전용 스토리 빌딩 웹 서비스. 정형 템플릿의 구조와 무한 캔버스 스크랩의 자유로움을 결합한 통합 집필 환경.

- 기획서: [`Story Planner Web.md`](./Story%20Planner%20Web.md)
- 아키텍처: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- 데이터 모델: [`docs/DATA_MODEL.md`](./docs/DATA_MODEL.md)

## 기술 스택
Vite · React 18 · TypeScript · Tailwind CSS v4 · React Router · Zustand · TanStack Query · Supabase(Postgres/Auth/Storage) · React Flow · TipTap

## 6개 핵심 탭
1. **마스터 시놉시스** — 메타데이터 · 5단 플롯
2. **스크랩 보드** — 무한 캔버스 포스트잇 · OG 스크랩
3. **세계관 위키** — 시공간/사회/정신 아카이브
4. **캐릭터 DB** — 프로필 · 관계도 · 변화표 · 등장표
5. **타임라인 & 씬** — 진행률 · 회차/복선 · 씬 디자이너
6. **워크스페이스** — 본문 에디터 · 데이터 귀속

## 시작하기

### 1) 의존성 설치
```bash
npm install
```

### 2) Supabase 프로젝트 준비
1. [supabase.com](https://supabase.com) 에서 새 프로젝트 생성.
2. **SQL Editor** 에 [`supabase/schema.sql`](./supabase/schema.sql) 전체를 붙여넣고 실행 → 테이블 + RLS 생성.
3. **Project Settings → API** 에서 `Project URL` 과 `anon public` 키 복사.

### 3) 환경변수 설정
[`.env.example`](./.env.example) 을 복사해 `.env.local` 생성 후 값 입력:
```bash
cp .env.example .env.local
```
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhb...
```

### 4) 개발 서버 실행
```bash
npm run dev
```
→ http://localhost:5173 (기본 `/synopsis` 로 진입)

### 5) (선택) OG 스크래퍼 Edge Function 배포
스크랩 보드의 URL 자동 파싱을 쓰려면:
```bash
npx supabase functions deploy og-scrape
```

## 스크립트
| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 타입체크 + 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |

## 현재 상태 (v0.1 — 뼈대)
✅ 프로젝트 스캐폴딩 · 다크 테마 · 6탭 라우팅/레이아웃 · Supabase 클라이언트 · DB 스키마 · OG Edge Function 스텁
⬜ 다음: 인증/로그인 → workspace 생성 → Tab1 시놉시스부터 기능 구현 (로드맵은 ARCHITECTURE.md §6)

> 참고: `npm install` 시 dev 의존성(vite/esbuild) 관련 감사 경고가 있을 수 있으나 런타임/프로덕션 빌드에는 영향 없음.
