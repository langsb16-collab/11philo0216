
export enum EmotionType {
  DEPRESSED = '우울',
  ANGRY = '분노',
  BURNOUT = '번아웃',
  RELATIONSHIP = '관계 문제',
  ANXIOUS = '불안',
  LOST = '진로 고민'
}

export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface TrajectoryPoint {
  date: string;
  score: number;
}

export interface PhilosopherStats {
  successRate: number;
  avgImprovement: number;
  totalSessions: number;
}

export interface Philosopher {
  id: string;
  name: string;
  englishName: string;
  period: string;
  tagline: string;
  description: string;
  quote: string;
  traits: string[];
  role: string;
  tone: string;
  strategy: string;
  emotions: string[];
  voice: string; // 추가: 철학자별 고유 목소리 설정
  stats?: PhilosopherStats;
}

export interface PrescriptionResult {
  philosopherName: string;
  advice: string;
  actionGuide: string;
  reason: string;
}

export interface FullPrescription {
  id: string;
  date: string;
  userInput: string;
  emotion: string;
  results: PrescriptionResult[];
  summary: string;
  sentimentScore?: number;
  riskScore?: number; // 0 to 1
}

export interface TestQuestion {
  id: number;
  text: string;
  options: {
    text: string;
    philosopherId: string;
  }[];
}

export type ViewType = 'home' | 'result' | 'library' | 'chat' | 'history' | 'test' | 'dashboard';
