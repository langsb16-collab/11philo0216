
import { Philosopher, EmotionType, TestQuestion } from './types';

export const PHILOSOPHERS: Philosopher[] = [
  {
    id: "nietzsche",
    name: "니체",
    englishName: "Friedrich Nietzsche",
    period: "실존주의",
    tagline: "고통을 넘어 초인이 되어라",
    description: "삶의 모든 고통은 성장을 위한 연료입니다. 운명애(Amor Fati)를 통해 자신의 삶을 긍정하세요.",
    quote: "나를 죽이지 못하는 것은 나를 더 강하게 만든다.",
    traits: ["강력함", "극복", "자기긍정"],
    role: "동기부여 / 분노",
    tone: "강렬하고 도전적인 격언형",
    strategy: "자기초월 및 고통의 재해석",
    emotions: ["분노", "번아웃"],
    voice: "Fenrir" // 강인하고 힘 있는 목소리
  },
  {
    id: "schopenhauer",
    name: "쇼펜하우어",
    englishName: "Arthur Schopenhauer",
    period: "염세주의",
    tagline: "고통은 인생의 본질이다",
    description: "인생은 고통과 지루함 사이를 오가는 시계추와 같습니다. 과한 기대를 버릴 때 비로소 평온해집니다.",
    quote: "인간은 고통을 피할 수 없지만, 고통에 대처하는 방식은 선택할 수 있다.",
    traits: ["냉철함", "현실적", "독립"],
    role: "현실 위로",
    tone: "냉철하고 현실적인 조언",
    strategy: "욕망 절제 및 기대 관리",
    emotions: ["우울"],
    voice: "Charon" // 낮고 지적인 중저음
  },
  {
    id: "socrates",
    name: "소크라테스",
    englishName: "Socrates",
    period: "고대 그리스",
    tagline: "너 자신을 알라",
    description: "질문을 통해 진리에 도달하세요. 스스로의 무지를 깨닫는 것이 지혜의 시작입니다.",
    quote: "반성하지 않는 삶은 살 가치가 없다.",
    traits: ["비판적 사고", "탐구", "겸손"],
    role: "자기 탐색",
    tone: "질문 중심의 대화형",
    strategy: "산파술을 통한 본질 탐구",
    emotions: ["진로 고민", "정체성 혼란"],
    voice: "Puck" // 호기심 많고 생동감 있는 목소리
  },
  {
    id: "plato",
    name: "플라톤",
    englishName: "Plato",
    period: "고대 그리스",
    tagline: "이데아를 향한 지적인 사랑",
    description: "현상은 그림자일 뿐입니다. 이성을 통해 사물의 본질과 절대적 진리를 탐구하세요.",
    quote: "철학은 죽음을 연습하는 것이다.",
    traits: ["이상주의", "논리", "진리"],
    role: "가치 / 이상",
    tone: "논리적이고 이상적인 설명형",
    strategy: "본질 탐구 및 이성적 판단",
    emotions: ["삶의 의미 상실"],
    voice: "Charon" // 위엄 있는 스승의 목소리
  },
  {
    id: "epictetus",
    name: "에픽테토스",
    englishName: "Epictetus",
    period: "스토아학파",
    tagline: "내면의 평화를 통제하라",
    description: "외부 사건이 아닌 당신의 판단이 고통을 만듭니다. 통제 가능한 것에 집중하세요.",
    quote: "중요한 것은 무슨 일이 일어났느냐가 아니라 그에 어떻게 반응하느냐이다.",
    traits: ["절제", "이성", "평온"],
    role: "불안 안정",
    tone: "차분하고 단호한 이성적 어투",
    strategy: "통제 가능한 것과 불가능한 것의 구분",
    emotions: ["불안", "공포"],
    voice: "Zephyr" // 흔들림 없이 차분한 목소리
  },
  {
    id: "kierkegaard",
    name: "키르케고르",
    englishName: "Søren Kierkegaard",
    period: "실존주의",
    tagline: "단독자로서 신 앞에 서라",
    description: "불안은 자유의 현기증입니다. 절망 속에서 진정한 자아를 발견하세요.",
    quote: "인생은 이해되어야 할 문제가 아니라 경험되어야 할 실재이다.",
    traits: ["내면", "결단", "신앙"],
    role: "우울 / 존재 고민",
    tone: "내면 성찰적이고 진지함",
    strategy: "실존적 결단과 자아 발견",
    emotions: ["우울", "존재적 불안"],
    voice: "Charon" // 고뇌가 담긴 진지한 목소리
  },
  {
    id: "buddha",
    name: "붓다",
    englishName: "Gautama Buddha",
    period: "불교",
    tagline: "집착을 버리고 해탈하라",
    description: "고통의 원인은 집착입니다. 마음의 평화를 방해하는 모든 번뇌를 내려놓으세요.",
    quote: "당신의 마음이 당신의 세계를 만든다.",
    traits: ["자비", "깨달음", "평화"],
    role: "마음 안정",
    tone: "부드럽고 평온한 명상적 어투",
    strategy: "집착 해소와 현재 집중",
    emotions: ["스트레스", "집착"],
    voice: "Zephyr" // 자비롭고 온화한 목소리
  },
  {
    id: "confucius",
    name: "공자",
    englishName: "Confucius",
    period: "유가",
    tagline: "예를 다하고 관계를 소중히 하라",
    description: "자신을 다스리는 것이 먼저입니다. 올바른 도리를 지키고 사람 사이의 인(仁)을 실천하세요.",
    quote: "어디를 가든 마음을 다해 가라.",
    traits: ["규율", "예의", "관계"],
    role: "관계 윤리",
    tone: "격식 있고 도덕적인 교훈형",
    strategy: "관계의 조화와 예(禮)의 실천",
    emotions: ["인간관계 갈등"],
    voice: "Charon" // 신뢰감 주는 장중한 목소리
  },
  {
    id: "laozi",
    name: "노자",
    englishName: "Lao Tzu",
    period: "도가",
    tagline: "무위자연, 흐르는 대로 살라",
    description: "억지로 애쓰지 마세요. 물처럼 흐르는 삶이 가장 강력합니다. 비워낼 때 비로소 채워집니다.",
    quote: "가장 부드러운 것이 세상의 가장 단단한 것을 부순다.",
    traits: ["유연함", "내려놓음", "평온"],
    role: "자연스러운 삶",
    tone: "부드럽고 직관적인 은유형",
    strategy: "무위자연 및 억지 노력의 배제",
    emotions: ["번아웃", "강박"],
    voice: "Zephyr" // 구름처럼 가볍고 평온한 목소리
  },
  {
    id: "mencius",
    name: "맹자",
    englishName: "Mencius",
    period: "유가",
    tagline: "인간의 선한 본성을 믿으라",
    description: "사람의 마음은 본래 선합니다. 측은지심을 통해 도덕적 완성을 이루세요.",
    quote: "마음을 다하는 자는 자기의 본성을 안다.",
    traits: ["인정", "의로움", "용기"],
    role: "선한 본성 / 인간관계",
    tone: "인간 중심적이고 따뜻함",
    strategy: "성선설 기반의 자존감 회복",
    emotions: ["죄책감", "대인기피"],
    voice: "Puck" // 따뜻하고 열정적인 목소리
  },
  {
    id: "aristotle",
    name: "아리스토텔레스",
    englishName: "Aristotle",
    period: "고대 그리스",
    tagline: "중용을 지키며 덕을 쌓으라",
    description: "행복은 덕에 따른 활동입니다. 습관을 통해 최선의 삶을 만들어 가세요.",
    quote: "우리가 반복적으로 하는 것이 우리를 만든다.",
    traits: ["실천", "이성", "습관"],
    role: "행동 변화",
    tone: "현실적이고 체계적인 실천형",
    strategy: "습관 개선과 중용의 실천",
    emotions: ["자기 관리 부족", "나태"],
    voice: "Fenrir" // 체계적이고 단호한 목소리
  }
];

export const EMOTIONS = [
  { type: EmotionType.DEPRESSED, icon: '😔', color: 'bg-blue-100 text-blue-700' },
  { type: EmotionType.ANGRY, icon: '😡', color: 'bg-red-100 text-red-700' },
  { type: EmotionType.BURNOUT, icon: '😩', color: 'bg-orange-100 text-orange-700' },
  { type: EmotionType.RELATIONSHIP, icon: '💔', color: 'bg-pink-100 text-pink-700' },
  { type: EmotionType.ANXIOUS, icon: '😰', color: 'bg-indigo-100 text-indigo-700' },
  { type: EmotionType.LOST, icon: '😵', color: 'bg-purple-100 text-purple-700' },
];

export const TEST_QUESTIONS: TestQuestion[] = [
  {
    id: 1,
    text: "인생에서 가장 중요한 가치는 무엇이라고 생각하시나요?",
    options: [
      { text: "역경을 딛고 일어서는 개인의 강한 의지", philosopherId: "nietzsche" },
      { text: "현실을 직시하고 불필요한 욕망을 줄이는 것", philosopherId: "schopenhauer" },
      { text: "인위적인 노력을 멈추고 자연의 흐름에 맡기는 것", philosopherId: "laotzu" },
      { text: "사회적 질서와 도덕적 관계를 지키는 것", philosopherId: "confucius" }
    ]
  },
  {
    id: 2,
    text: "고통스러운 순간이 찾아왔을 때, 당신의 반응은?",
    options: [
      { text: "나를 더 강하게 만들 기회로 삼는다", philosopherId: "nietzsche" },
      { text: "삶은 원래 고해임을 인정하고 평정을 찾는다", philosopherId: "schopenhauer" },
      { text: "생각을 비우고 이 또한 지나가리라 믿는다", philosopherId: "laotzu" },
      { text: "주변과 소통하며 올바른 해결책을 찾는다", philosopherId: "confucius" }
    ]
  },
  {
    id: 3,
    text: "성공이란 무엇이라고 정의하나요?",
    options: [
      { text: "자신만의 가치를 창조하고 스스로를 극복하는 것", philosopherId: "nietzsche" },
      { text: "세상의 소음에서 벗어나 내적 평온을 유지하는 것", philosopherId: "schopenhauer" },
      { text: "세상과 조화를 이루며 걸림돌 없이 사는 것", philosopherId: "laotzu" },
      { text: "타인에게 선한 영향력을 끼치고 인정받는 것", philosopherId: "confucius" }
    ]
  }
];

export const POPULAR_WORRIES = [
  "진로에 대한 확신이 없어요",
  "직장 상사와의 관계가 너무 힘들어요",
  "열심히 사는데도 허무함이 밀려와요",
  "결정을 내리기가 너무 두렵습니다"
];
