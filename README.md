# PhiloCare Pro - 철학 상담 처방전 서비스

## 🎯 프로젝트 개요
**PhiloCare Pro**는 인류 역사상 가장 위대한 11인의 철학자들의 지혜를 AI로 구현하여, 사용자의 고민에 맞춤형 철학적 조언을 제공하는 혁신적인 웹 애플리케이션입니다.

## ✨ 완료된 주요 기능

### 1. **감정 기반 지혜 처방전 생성**
- 6가지 감정 상태 선택 (불안, 우울, 분노, 혼란, 외로움, 무기력)
- 사용자의 고민을 입력받아 AI가 철학자 3인의 맞춤형 조언 생성
- 감정 에너지 점수 및 위험도 분석

### 2. **11인의 철학자 라이브러리**
- 니체, 소크라테스, 부처, 에픽테토스, 칼 융, 비트겐슈타인, 키르케고르, 사르트르, 스피노자, 세네카, 장자
- 각 철학자의 고유한 사상, 말투, 전략 구현
- 실시간 텍스트 상담 및 음성 상담 지원

### 3. **실시간 음성 상담 (Live Session)**
- Gemini 2.5 Flash Native Audio 모델을 활용한 실시간 음성 대화
- 각 철학자의 고유한 목소리(Kore, Zephyr, Puck, Fenrir 등)
- 자연스러운 양방향 음성 대화

### 4. **멀티모달 채팅 상담**
- 텍스트, 이미지, 음성 메시지 지원
- 이미지 업로드를 통한 상황 설명 가능
- TTS(Text-to-Speech) 음성 재생 기능

### 5. **가치관 테스트**
- 5개의 철학적 질문을 통해 사용자와 가장 닮은 철학자 매칭
- 개인화된 철학적 동반자 추천

### 6. **상담 히스토리 & 분석 대시보드**
- 과거 상담 기록 저장 및 조회
- 평균 에너지 점수, 위험도 트렌드 분석
- 가장 효과적이었던 철학자 통계

### 7. **위기 개입 시스템**
- 자살, 자해 관련 키워드 감지 시 즉시 위기 경고
- 전문 상담 기관 연락처 제공 (109, 129)

## 🌐 배포 URL

- **Production URL**: https://11philo0216.pages.dev
- **Latest Deployment**: https://c776032e.11philo0216.pages.dev
- **커스텀 도메인** (DNS 설정 후): https://feezone.my
- **GitHub**: https://github.com/langsb16-collab/11philo0216

## 🛠 기술 스택

### Frontend
- **React 19** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 유틸리티 기반 스타일링
- **Lucide React** - 아이콘 라이브러리
- **Vite 6** - 빌드 도구

### AI & Backend
- **Google Gemini 2.5 Flash** - 텍스트 생성
- **Gemini 2.5 Flash Native Audio** - 실시간 음성 대화
- **Google AI TTS** - 음성 합성
- **Cloudflare Pages** - 서버리스 배포

### 데이터 저장
- **localStorage** - 클라이언트 측 상담 히스토리 저장

## 📊 데이터 구조

### Philosopher (철학자)
```typescript
interface Philosopher {
  id: string;
  name: string;
  period: string;
  role: string;
  tone: string;
  strategy: string;
  tagline: string;
  description: string;
  voice: string; // TTS 음성 이름
}
```

### FullPrescription (처방전)
```typescript
interface FullPrescription {
  id: string;
  userWorry: string;
  emotion: EmotionType;
  summary: string;
  sentimentScore?: number;
  riskScore?: number;
  results: {
    philosopherName: string;
    advice: string;
  }[];
  timestamp: string;
}
```

### ChatMessage (채팅 메시지)
```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text?: string;
  audioUrl?: string;
  imageUrls?: string[];
  duration?: number;
  type: 'text' | 'audio' | 'image';
  status?: 'sending' | 'sent' | 'read' | 'analyzing' | 'done';
  timestamp: string;
}
```

## 📁 프로젝트 구조

```
webapp/
├── src/
│   ├── App.tsx              # 메인 애플리케이션 컴포넌트
│   ├── index.tsx            # 진입점
│   ├── types.ts             # TypeScript 타입 정의
│   ├── constants.ts         # 철학자, 감정, 테스트 데이터
│   └── services/
│       └── geminiService.ts # Google Gemini API 통합
├── public/                  # 정적 파일
├── dist/                    # 빌드 결과물
├── index.html               # HTML 템플릿
├── vite.config.ts           # Vite 설정
├── tsconfig.json            # TypeScript 설정
├── package.json             # 의존성 관리
└── README.md                # 프로젝트 문서
```

## 🚀 로컬 개발 가이드

### 1. 환경 변수 설정
`.env` 파일 생성 후 Google Gemini API 키 추가:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:3000` 접속

### 4. 프로덕션 빌드
```bash
npm run build
```

### 5. 빌드 결과 미리보기
```bash
npm run preview
```

## 📝 배포 방법

### Cloudflare Pages 배포
```bash
# 1. 빌드
npm run build

# 2. Cloudflare Pages에 배포
npx wrangler pages deploy dist --project-name 11philo0216
```

### GitHub 푸시
```bash
git add .
git commit -m "Update: description"
git push origin main
```

## ⚙️ 환경 설정

### API 키 관리
- **로컬 개발**: `.env` 파일 사용
- **프로덕션**: Vite의 `define` 옵션으로 환경 변수 주입

### Cloudflare Pages 환경 변수
Cloudflare Dashboard에서 환경 변수 설정:
```
GEMINI_API_KEY=your_production_api_key
```

## 🎨 UI/UX 특징

- **프리미엄 디자인**: 고급스러운 카드 기반 레이아웃
- **부드러운 애니메이션**: Fade-in, hover, transition 효과
- **반응형 디자인**: 모바일 & 데스크탑 최적화
- **접근성**: 명확한 시각적 피드백 및 상태 표시

## 🔒 안전 기능

- **위기 키워드 감지**: 자살/자해 관련 표현 실시간 모니터링
- **즉시 개입**: 위험 상황 감지 시 전문 기관 정보 제공
- **데이터 프라이버시**: 모든 데이터는 사용자 브라우저에만 저장

## 📈 향후 개발 계획

### 미구현 기능
1. **대시보드 (Dashboard)** - 데이터 시각화 완성
2. **히스토리 (History)** - 과거 상담 기록 UI 구현
3. **소셜 공유** - 지혜 처방전 공유 기능
4. **다국어 지원** - 영어, 일본어 버전
5. **프리미엄 기능** - 심화 상담, 무제한 히스토리

### 성능 최적화
- Code splitting으로 초기 로드 시간 단축
- 이미지 최적화 및 lazy loading
- Service Worker를 통한 오프라인 지원

### 추가 철학자
- 공자, 플라톤, 아리스토텔레스, 장 폴 사르트르 등 확대

## 🛠 문제 해결

### 흰 화면 문제 (이미 해결됨)
**원인**: importmap 사용으로 Vite가 JavaScript 번들을 생성하지 못함  
**해결**: index.html에서 importmap 제거하고 `<script type="module" src="/index.tsx">` 추가

### Tailwind CSS 경고
**경고**: "cdn.tailwindcss.com should not be used in production"  
**해결 (선택)**: Tailwind를 npm 패키지로 설치하여 빌드 시점에 포함

## 📄 라이선스
이 프로젝트는 개인 프로젝트이며, 교육 및 연구 목적으로 사용됩니다.

## 👨‍💻 개발자
- **GitHub**: https://github.com/langsb16-collab/11philo0216
- **Cloudflare Project**: 11philo0216

---

**Last Updated**: 2026-02-16
