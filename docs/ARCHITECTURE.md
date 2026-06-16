# Story Planner Web — 아키텍처 정리

> 기획서: [`Story Planner Web.md`](../Story%20Planner%20Web.md)
> 이 문서는 "무엇을, 어떤 도구로, 어떻게" 만들지를 정리한 기준 문서입니다.

## 1. 기술 스택 (Tech Stack)

| 영역 | 선택 | 이유 |
|---|---|---|
| 빌드 도구 | **Vite** | 빠른 HMR, 익숙한 SPA 구조 |
| UI | **React 18 + TypeScript** | 컴포넌트 재사용, 타입 안정성 |
| 스타일 | **Tailwind CSS v4** | 다크모드 우선, 라인 중심 미니멀 UI 빠른 구현 |
| 라우팅 | **React Router v7** | 6개 탭 라우팅 |
| 상태관리 | **Zustand** | 캔버스 좌표/줌, 필터 등 경량 클라이언트 상태 |
| 서버 상태/캐시 | **@tanstack/react-query** | Supabase 데이터 패칭·캐싱·낙관적 업데이트 |
| 데이터베이스 | **Supabase (Postgres)** | 관계형 모델(다대다 다수) + RLS 인증 일체형 |
| 인증 | **Supabase Auth** | 작가별 개인 작업공간 분리 |
| 파일 저장 | **Supabase Storage** | OG 이미지 캐시, 첨부 이미지 |
| OG 스크래퍼 | **Supabase Edge Function** | 브라우저 CORS 우회 프록시 (서버 불필요) |
| 무한 캔버스 | **React Flow (@xyflow/react)** | 스크랩 보드 배치 + 캐릭터 관계도 선 연결 |
| 리치텍스트 에디터 | **TipTap** | 마크다운 단축키 지원 경량 에디터 |
| 드래그앤드롭 | **@dnd-kit** | 워크스페이스 탭의 카드→프로필 귀속 |

### 왜 Next.js가 아니라 Vite인가
서버가 꼭 필요한 기능은 **OG 스크래퍼 하나**뿐이며, 이는 Supabase Edge Function으로 해결된다.
로그인형 작가 툴이라 SSR/SEO 이점이 없어 Next.js의 추가 학습비용을 감수할 이유가 없다.

## 2. 폴더 구조 (Project Structure)

```
Story Planner/
├─ docs/                      # 설계 문서 (이 폴더)
│  ├─ ARCHITECTURE.md
│  └─ DATA_MODEL.md
├─ supabase/
│  ├─ schema.sql              # 테이블 + RLS 정의 (DB 초기화 SQL)
│  └─ functions/
│     └─ og-scrape/           # OG 메타 파싱 Edge Function
├─ src/
│  ├─ main.tsx                # 진입점
│  ├─ App.tsx                 # 라우터
│  ├─ index.css               # Tailwind + 다크 테마 토큰
│  ├─ lib/
│  │  ├─ supabase.ts          # Supabase 클라이언트 싱글톤
│  │  └─ queryClient.ts       # react-query 설정
│  ├─ types/
│  │  └─ database.ts          # DB 엔티티 타입 (스키마와 1:1)
│  ├─ components/
│  │  └─ layout/              # AppLayout, TabNav 등 공통 셸
│  ├─ features/               # 탭별 기능 모듈 (도메인 단위)
│  │  ├─ synopsis/            # Tab 1
│  │  ├─ scrap-board/         # Tab 2
│  │  ├─ worldbuilding/       # Tab 3
│  │  ├─ characters/          # Tab 4
│  │  ├─ timeline/            # Tab 5
│  │  └─ workspace/           # Tab 6
│  └─ pages/                  # 라우트별 페이지 (탭 진입점)
├─ .env.example               # 환경변수 템플릿
├─ index.html
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
```

> **설계 원칙:** 기능은 `features/<도메인>` 폴더에 응집(co-location)시킨다.
> 컴포넌트·훅·쿼리·타입을 도메인별로 모아 6개 탭이 서로 간섭 없이 성장하게 한다.

## 3. 핵심 기술 과제 4가지 (기획서 §4)

### 3.1 OG 스크래퍼
- 흐름: 클라이언트가 URL 입력 → `og-scrape` Edge Function 호출 → 함수가 대상 페이지 fetch → `og:title/og:image/og:description` 파싱 → JSON 반환.
- 브라우저에서 직접 외부 URL fetch는 CORS로 막히므로 **반드시 서버(Edge Function) 경유**.
- 이미지는 핫링크 깨짐 대비 Supabase Storage로 복사 캐시(2차 과제).

### 3.2 캔버스 상태 동기화
- 포스트잇 카드의 `pos_x, pos_y, width, height`를 `scrap_cards` 행에 저장.
- 드래그 중 매 픽셀 저장은 과부하 → **드래그 종료(onNodeDragStop) 시점에 디바운스 저장**.
- 전역 줌/패닝(viewport)은 작업공간 단위로 `workspaces.canvas_viewport(jsonb)`에 보관.

### 3.3 실시간 필터링
- 카드 목록은 메모리에 적재 후 **클라이언트 사이드 필터**(키워드/태그).
- 키워드 입력은 디바운스(150~200ms), 비매칭 카드는 제거가 아닌 **blur/fade 처리**(기획서 §2 Tab2).

### 3.4 리치텍스트 에디터
- TipTap StarterKit + 마크다운 입력 규칙.
- 본문은 `episodes.content(jsonb, TipTap JSON)` 저장. 자동저장 디바운스.

## 4. 데이터 연동 시나리오 (탭 간 유기성)
- **캐릭터 변경 → 회차 플래너 반영:** 캐릭터는 단일 소스(`characters`). 인물 변화표/등장표/씬은 `character_id`로 참조만 하므로 이름·설정 변경이 자동 전파.
- **스크랩 카드 귀속:** `card_links`(다형성 링크 테이블)로 한 카드를 캐릭터/세계관/회차 어디에나 N:M 연결. 워크스페이스 탭의 드롭은 이 테이블에 행 추가.
- **씬 인과관계:** `scene_links`(자기참조 N:M)로 "이어지는 사건" 그래프 구성.

## 5. 인증·권한 모델
- 모든 데이터는 `workspaces.user_id` 소유자에 귀속.
- Postgres **RLS**로 "본인 workspace의 행만 read/write" 강제 (schema.sql 참고).

## 6. 단계별 로드맵 (제안)
1. **[현재] 뼈대:** 스캐폴딩 + 스키마 + 레이아웃/라우팅 + Supabase 연결.
2. 인증(로그인) + workspace 생성/선택.
3. Tab 1 시놉시스(정형 폼) — 가장 단순, CRUD 패턴 정립.
4. Tab 4 캐릭터 DB(프로필+관계도).
5. Tab 2 스크랩 보드(캔버스 + OG 스크래퍼).
6. Tab 3 세계관 / Tab 5 타임라인.
7. Tab 6 워크스페이스(에디터 + 드롭 귀속) — 모든 데이터 연동 종합.
