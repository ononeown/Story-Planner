# Story Planner Web — 데이터 모델 (ERD)

> 기획서 §4의 ERD 힌트를 구체 테이블로 확장한 것. 실제 정의는 [`supabase/schema.sql`](../supabase/schema.sql).

## 1. 엔티티 관계 한눈에

```
auth.users (Supabase 내장)
   └─1:N─ workspaces (작품)
            ├─1:1─ synopsis            (Tab1 시놉시스)
            ├─1:N─ scrap_cards         (Tab2 포스트잇)
            ├─1:N─ tags                (Tab2 태그)
            ├─1:N─ worldbuilding       (Tab3 세계관, 자기참조 트리)
            ├─1:N─ characters          (Tab4 인물)
            ├─1:N─ character_relations (Tab4 관계도, characters 자기참조 N:M)
            ├─1:N─ episodes            (Tab5 회차)
            │        ├─1:N─ foreshadowings  (복선/회수)
            │        └─1:N─ character_arcs  (Tab4 인물 변화표, 회차×캐릭터)
            └─1:N─ scenes              (Tab5 씬/사건)

다대다(M:N) 연결 테이블
  scrap_card_tags   : scrap_cards  × tags
  card_links        : scrap_cards  × (characters | worldbuilding | episodes)  ← 다형성 귀속
  scene_characters  : scenes       × characters            (등장표 + 씬 인물)
  scene_links       : scenes       × scenes (자기참조)      (인과관계 "이어지는 사건")
  episode_characters: episodes      × characters            (인물 등장 그리드 On/Off)
```

## 2. 테이블 상세

### workspaces (작품 = 최상위 컨테이너)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK→auth.users | 소유자 (RLS 기준) |
| title | text | 작품명 |
| genre | text | 장르 |
| expected_length | text | 예상 분량 |
| canvas_viewport | jsonb | 스크랩보드 줌/패닝 상태 `{x,y,zoom}` |
| created_at / updated_at | timestamptz | |

### synopsis (Tab1, workspace와 1:1)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| workspace_id | uuid PK FK | 1:1 |
| logline | text | 한 줄 요약 |
| intention | text | 기획 의도 |
| plot_intro / plot_rising / plot_crisis / plot_climax / plot_resolution | text | 5단 플롯 (발단·전개·위기·절정·결말) |

### scrap_cards (Tab2 포스트잇)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| kind | text | `link` \| `memo` |
| url | text | 링크 카드 원본 URL |
| title / description | text | OG 또는 수기 입력 |
| image_url | text | og:image (Storage 캐시 가능) |
| body | text | 메모 본문 |
| color | text | 컬러칩 (yellow/pink/green/blue/gray) |
| pinned | boolean | 핀 고정 |
| pos_x / pos_y / width / height | numeric | 캔버스 좌표·크기 |
| created_at | timestamptz | |

### tags / scrap_card_tags (Tab2 태그, N:M)
- `tags(id, workspace_id, name)`
- `scrap_card_tags(scrap_card_id, tag_id)` — 복합 PK

### worldbuilding (Tab3, 자기참조 트리)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| parent_id | uuid FK→self NULL | 아코디언/토글 계층 |
| category | text | `spacetime`(시공간) \| `society`(사회/인프라) \| `mind`(정신/제약) |
| field_key | text | place/era/language/history/politics/economy/custom/religion/myth/rule/taboo … |
| title | text | 항목 제목 |
| content | text | 설정 본문 |
| sort_order | int | 정렬 |

### characters (Tab4 인물)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| name / age / gender / appearance | text | 외적 요소 |
| strengths / weaknesses / values / trauma / lack / desire / signature_line | text | 내적 요소 (장점/단점/가치관/트라우마/결핍/욕구·목적/시그니처 대사) |
| portrait_url | text | 이미지 |
| pos_x / pos_y | numeric | 관계도 캔버스 좌표 |

### character_relations (Tab4 관계도, N:M 자기참조)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| from_character_id / to_character_id | uuid FK→characters | 방향 |
| relation_type | text | 우호/적대/동맹 등 |
| label | text | 오버레이 텍스트 |

### character_arcs (Tab4 인물 변화표 = Arc Matrix)
- 고정값(욕망·목적)은 `characters`에, **회차별 변동값**은 여기에.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| character_id | uuid FK | |
| episode_id | uuid FK→episodes | 회차 |
| task / goal / emotion / action / result | text | 과제→목표→감정변화→행동→결과 |

### episodes (Tab5 회차)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| season | int | 시즌 |
| episode_no | int | 회차 번호 (1~50+) |
| title / summary / idea_memo | text | |
| progress_percent | int | 서사 위치 10~100 (진행률 바) |
| content | jsonb | TipTap 본문 (Tab6 집필) |
| sort_order | int | |

### episode_characters (인물 등장표 그리드, N:M)
- `episode_characters(episode_id, character_id)` 존재 = 해당 회차 등장 On. 복합 PK.

### foreshadowings (복선/회수)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| episode_id | uuid FK | 심은 회차 |
| content | text | 복선 내용 |
| resolved | boolean | 회수 체크 |
| resolved_episode_id | uuid FK→episodes NULL | 회수된 회차 |

### scenes (Tab5 씬/사건 디자이너)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK | |
| episode_id | uuid FK NULL | 소속 회차 |
| title / detail | text | 사건 제목·상세 |
| location | text | 공간 배경 |
| purpose | text | 사건 목적 |
| result | text | 사건 결과 |
| pos_x / pos_y | numeric | 트리 뷰 좌표 |

### scene_characters / scene_links (N:M)
- `scene_characters(scene_id, character_id)` — 씬 관련 인물.
- `scene_links(scene_id, next_scene_id)` — 인과관계 "이어지는 사건" (자기참조).

### card_links (스크랩 카드 다형성 귀속, N:M)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| scrap_card_id | uuid FK | |
| target_type | text | `character` \| `worldbuilding` \| `episode` |
| target_id | uuid | 대상 행 id (다형성) |

> 기획서의 "ScrapCard (N):(M) Characters/WorldBuilding"을 단일 다형성 테이블로 통합.
> 워크스페이스 탭 드롭앤드롭 귀속이 여기에 행을 추가한다.

## 3. 인덱스·제약 요약
- 모든 자식 테이블 FK에 `workspace_id` 또는 상위 FK 인덱스.
- N:M 연결 테이블은 복합 PK로 중복 방지.
- `ON DELETE CASCADE`로 workspace 삭제 시 하위 전체 정리.
- RLS: `workspace_id`가 본인 소유 workspace일 때만 접근 허용 (헬퍼 함수 `owns_workspace()`).
