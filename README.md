# 영어 단어 시험 사이트 🎯

학원에서 학생들이 영어 단어 시험을 치를 수 있는 종합 학습 관리 시스템입니다.

## 기술 스택

- **Frontend**: Next.js 16, TypeScript, Mantine UI v7
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel
- **Design**: 네오브루탈리즘 (Neobrutalism)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Supabase 데이터베이스 설정

Supabase 프로젝트를 생성한 후, SQL 에디터에서 다음 마이그레이션 파일을 실행하세요:

```bash
supabase/migrations/001_initial_schema.sql
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 주요 기능

### 선생님 (학원 관리자)

- ✅ 학생 관리 (등록, 수정, 삭제, 상태 관리)
- ✅ 반 생성 및 관리
- ✅ 단어장 관리 (Excel 업로드/다운로드)
- ✅ 듣기 시험 관리
- ✅ 커리큘럼 생성 및 관리
- ✅ 커리큘럼 복사 기능
- ✅ 학습 진도 관리
- ✅ 공지사항 및 쪽지 시스템
- ✅ 보상 시스템 (달러 관리)
- ✅ 학원 설정 및 백업/복원

### 학생

- ✅ 대시보드 (공지사항, 오늘의 학습, 달러 현황)
- ✅ 나의 학습 (주별 수업 일지)
- ✅ 단어 시험 (타이핑, 문장 섞기, 4지선다)
- ✅ 듣기 시험
- ✅ 쪽지함
- ✅ 개인 설정

## 시험 시스템

### 단어 시험 프로세스

1. **플래시카드 학습** - TTS 음성 재생
2. **1차 타이핑 시험** - 한글→영어
3. **오답 재학습** - 플래시카드
4. **오답 재시험** - 0개 될 때까지 반복
5. **복습 시험** - 이전 2일치, 5지선다
6. **복습 오답 재시험** - 0개 될 때까지 반복

### 듣기 시험 프로세스

1. **듣기 문제** - 4지선다
2. **오답 시 빈칸 채우기** - 스크립트 학습
3. **오답 재시험** - 0개 될 때까지 반복

## 디자인 시스템

### 네오브루탈리즘 스타일

- 굵은 테두리 (3-4px)
- 강한 그림자 효과
- 화려한 애니메이션
- 높은 대비 색상

### 주요 CSS 클래스

- `.neo-card` - 카드 스타일
- `.neo-button` - 버튼 스타일
- `.neo-input` - 입력 필드 스타일
- `.animate-bounce-in` - 바운스 애니메이션
- `.animate-slide-in-right` - 오른쪽에서 슬라이드
- `.animate-fade-in` - 페이드 인

## 데이터베이스 최적화

Supabase 무료 티어(500MB)를 고려한 최적화 전략:

1. **단어 데이터 압축** - 소단원별 JSONB 배열로 저장
2. **클라이언트 캐싱** - TanStack Query 사용
3. **배치 작업** - 여러 API 호출 통합
4. **페이지네이션** - 대량 데이터 지연 로딩

## 프로젝트 구조

```
wt-sonnet/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 로그인 페이지
│   ├── teacher/           # 선생님 포털
│   └── student/           # 학생 포털
├── components/            # React 컴포넌트
│   ├── ui/               # 공통 UI 컴포넌트
│   ├── teacher/          # 선생님용 컴포넌트
│   ├── student/          # 학생용 컴포넌트
│   └── test/             # 시험 엔진 컴포넌트
├── lib/                   # 라이브러리 및 유틸리티
│   ├── supabase/         # Supabase 클라이언트
│   ├── utils/            # 유틸리티 함수
│   ├── types/            # TypeScript 타입
│   └── hooks/            # 커스텀 훅
├── stores/                # Zustand 상태 관리
└── supabase/
    └── migrations/        # 데이터베이스 마이그레이션
```

## 개발 현황

### Phase 1: 프로젝트 설정 및 핵심 인프라 ✅

- [x] Next.js 프로젝트 초기화
- [x] Mantine UI 설정
- [x] Supabase 연결 준비
- [x] 데이터베이스 스키마 설계
- [x] 네오브루탈리즘 디자인 시스템
- [x] 로그인 페이지 (Eastern-WordTest 브랜드)

### Phase 2: 선생님 포털 - 기본 기능 ✅

- [x] 학생 관리 (CRUD, 상태 관리, 반 등록)
- [x] 단어장 관리 (Excel 업로드/다운로드, 개별 수정)
- [x] 커리큘럼 관리 (템플릿 CRUD, 항목 추가, 시험 설정)
- [x] 선생님 포털 레이아웃 (사이드바 네비게이션)

### Phase 3: 시험 엔진 - 단어 시험 ✅

- [x] 플래시카드 학습 모드 (TTS 음성, 카드 뒤집기)
- [x] 타이핑 시험 (제한 시간, 채점, 복사 방지)

### Phase 4: 학생 포털 (진행 예정)

- [ ] 대시보드
- [ ] 나의 학습
- [ ] 쪽지함

### Phase 5: 고급 기능 (진행 예정)

- [ ] 오답 처리 시스템
- [ ] 복습 시험
- [ ] 듣기 시험

### Phase 6: 최적화 및 배포 (진행 예정)

- [ ] Supabase 실제 연동
- [ ] 성능 최적화
- [ ] Vercel 배포

## 테스트 방법

### 1. 로그인
- URL: http://localhost:3000
- 아이디/비밀번호: 아무거나 입력 (임시)

### 2. 선생님 포털
- 학생 관리: http://localhost:3000/teacher/students
- 단어장 관리: http://localhost:3000/teacher/wordbooks
- 커리큘럼 관리: http://localhost:3000/teacher/curriculums

### 3. 시험 엔진
- 플래시카드: http://localhost:3000/test/flashcard
- 타이핑 시험: http://localhost:3000/test/typing

## 라이선스

MIT

## 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.
