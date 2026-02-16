# Cloudflare Pages TTS API 설정 완료

## ✅ 완료된 작업

### 1. TTS API 서버사이드 구현
- **Cloudflare Pages Function** 생성: `/functions/tts.ts`
- **API 엔드포인트**: `/api/tts`
- **기능**: 브라우저에서 직접 Gemini API 호출 → 서버에서 호출로 변경

### 2. 보안 문제 해결
- ❌ **Before**: 브라우저에서 직접 API 키 노출 및 호출
- ✅ **After**: 서버사이드에서 안전하게 API 호출

### 3. 프론트엔드 수정
- `App.tsx`의 `toggleSpeech` 함수 수정
- 직접 Gemini TTS 호출 → `/api/tts` 호출로 변경
- HTML Audio Element 사용으로 간소화

---

## 🔧 환경 변수 설정 (중요!)

### Cloudflare Dashboard에서 환경 변수 설정 필요

1. **Cloudflare Dashboard** 접속
   - https://dash.cloudflare.com

2. **Workers & Pages** 선택

3. **11philo0216** 프로젝트 선택

4. **Settings** 탭 클릭

5. **Environment variables** 섹션

6. **Add variables** 클릭

7. 환경 변수 추가:
   ```
   Variable name: GEMINI_API_KEY
   Value: [YOUR_GEMINI_API_KEY]
   Environment: Production (and Preview)
   ```

8. **Save** 클릭

9. **재배포 필요**: 환경 변수 설정 후 재배포
   ```bash
   npm run build
   npx wrangler pages deploy dist --project-name 11philo0216
   ```

---

## 📝 로컬 개발 환경 설정

### .dev.vars 파일 생성
로컬 개발용 환경 변수 파일을 생성하세요:

```bash
# /home/user/webapp/.dev.vars
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**주의**: `.dev.vars` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다.

### 로컬 개발 서버 실행
```bash
# Wrangler로 로컬 실행 (Functions 포함)
npx wrangler pages dev dist --local
```

---

## 🌐 API 엔드포인트 사용법

### Request
```javascript
POST /api/tts
Content-Type: application/json

{
  "text": "안녕하세요, 저는 니체입니다.",
  "voiceName": "Zephyr",
  "philosopherName": "니체"
}
```

### Response
```
Content-Type: audio/mpeg
Cache-Control: public, max-age=86400

[Binary audio data]
```

### 프론트엔드에서 사용
```javascript
const response = await fetch('/api/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text, voiceName, philosopherName })
});

const audioBlob = await response.blob();
const audioUrl = URL.createObjectURL(audioBlob);
const audio = new Audio(audioUrl);
await audio.play();
```

---

## 🚀 배포 URL

- **Latest Deployment**: https://12ff9b0e.11philo0216.pages.dev
- **Production**: https://11philo0216.pages.dev
- **커스텀 도메인** (DNS 설정 후): https://feezone.my

---

## ✅ 문제 해결 체크리스트

### 음성이 재생되지 않는 경우

1. **Console 에러 확인**
   - `An API key must be set` → 환경 변수 미설정
   - `TTS generation failed` → API 키 오류 또는 API 할당량 초과

2. **Network 탭 확인**
   - `/api/tts` 호출이 200 OK인지 확인
   - Response Type이 `audio/mpeg`인지 확인

3. **환경 변수 재확인**
   - Cloudflare Dashboard에서 `GEMINI_API_KEY` 설정 확인
   - Production과 Preview 모두 설정되어 있는지 확인

4. **재배포**
   - 환경 변수 설정 후 반드시 재배포 필요

---

## 📊 기술 스택

- **Frontend**: React 19 + TypeScript
- **Backend**: Cloudflare Pages Functions (서버리스)
- **TTS API**: Google Gemini 2.5 Flash Preview TTS
- **Audio**: HTML5 Audio Element
- **Deployment**: Cloudflare Pages

---

## 🎯 다음 단계

1. ✅ Cloudflare에 환경 변수 설정
2. ✅ 재배포
3. ✅ 음성 재생 테스트
4. ✅ 모든 철학자 음성 확인

---

**마지막 업데이트**: 2026-02-16
