
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { FullPrescription, Philosopher } from "../types";

const PHILOSOPHY_SAFETY_INSTRUCTION = `
당신은 위대한 철학자들의 지혜를 현대적으로 재해석하여 마음을 치유하는 '엔터프라이즈급 AI 철학 상담 멀티모달 엔진'입니다.
[심리 안전 및 이미지 분석 정책 - 필수 준수]
1. 위기 감지 (Safety Filter): 사용자의 텍스트나 이미지에서 자해, 자살, 폭력, 약물 오남용, 성적 학대 등의 징후가 발견되면 즉시 상담을 중단하고 전문 기관(자살예방상담전화 109, 희망의 전화 129)을 안내하십시오.
2. 시각적 분석 (Multimodal Insight): 사용자가 이미지를 보낸 경우, 이미지 속 사용자의 표정(얼굴 감정 인식), 배경, 소품, 텍스트(OCR) 등을 철학적으로 분석하십시오.
3. 의료/법률 제한: 당신은 철학자이지 의사나 변호사가 아닙니다. 전문적인 진단은 피하십시오.
4. 태도: 무조건적인 수용과 공감을 유지하되, 철학자 특유의 깊은 통찰력과 고유한 말투를 유지하십시오.
`;

const CONSULTATION_SCENARIO = `
[상담 5단계 구조 - 심층 적용]
1단계(공감 및 시각적 인정): 사용자의 말과 사진 속 상황에 대해 깊이 공감합니다.
2단계(철학적 재해석): 현재의 고통이나 상황을 철학적 관점에서 새로운 의미로 정의합니다.
3단계(개념 전수): 당신(철학자)의 핵심 사상을 구체적으로 설명합니다.
4단계(성찰적 질문): 사용자의 고정관념을 깨뜨릴 수 있는 날카롭지만 따뜻한 질문을 하나 던집니다.
5단계(실천적 처방): 오늘 당장 실행 가능한 아주 작은 행동을 제안합니다.
`;

export const generatePrescription = async (worry: string, emotion: string): Promise<FullPrescription> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  
  const response = await ai.models.generateContent({
    model,
    contents: `사용자의 고민: "${worry}" / 현재 감정 상태: "${emotion}".`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "전체적인 위로와 통찰을 담은 한 문장 요약" },
          sentimentScore: { type: Type.NUMBER, description: "사용자 고민의 긍정적 에너지 점수 (0~1)" },
          results: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                philosopherName: { type: Type.STRING },
                advice: { type: Type.STRING, description: "철학자의 관점에서 본 심층적인 조언 (상담 5단계 중 1~3단계 포함)" },
                actionGuide: { type: Type.STRING, description: "구체적인 행동 지침 (5단계)" },
                reason: { type: Type.STRING, description: "철학적 성찰 질문 (4단계)" }
              }
            }
          }
        },
        required: ["summary", "results", "sentimentScore"]
      },
      systemInstruction: PHILOSOPHY_SAFETY_INSTRUCTION + CONSULTATION_SCENARIO + `
      한국어로 답변하며, 각 철학자의 고유한 페르소나와 문체를 유지하세요.`
    }
  });

  const parsed = JSON.parse(response.text || '{}');
  return {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    userInput: worry,
    emotion,
    results: parsed.results || [],
    summary: parsed.summary || "지혜로운 통찰을 얻으셨길 바랍니다.",
    sentimentScore: parsed.sentimentScore || 0.5
  };
};

export const chatWithPhilosopher = async (philosopher: Philosopher, message: string, images?: string[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  
  const parts: any[] = [{ text: message }];
  
  if (images && images.length > 0) {
    images.forEach(imgBase64 => {
      const data = imgBase64.split(',')[1] || imgBase64;
      const mimeType = imgBase64.split(';')[0].split(':')[1] || 'image/jpeg';
      parts.push({
        inlineData: {
          data,
          mimeType
        }
      });
    });
  }

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts }],
    config: {
      systemInstruction: PHILOSOPHY_SAFETY_INSTRUCTION + CONSULTATION_SCENARIO + 
      `당신은 위대한 철학자 ${philosopher.name}입니다. 
      상담 역할: ${philosopher.role}
      상담 말투: ${philosopher.tone}
      상담 전략: ${philosopher.strategy}
      사용자의 고민에 대해 당신의 고유한 문체로 대화하십시오. 시각적 맥락이 있다면 반드시 상담에 포함시키세요.`
    }
  });

  return response.text || "죄송합니다, 깊은 사색 중 잠시 오류가 발생했습니다.";
};

/**
 * 철학자의 텍스트를 고유한 남성 목소리로 변환합니다.
 * @param text 읽어줄 텍스트
 * @param voiceName 보이스 이름 (Puck, Charon, Fenrir, Zephyr)
 * @param philosopherName 철학자 이름 (말투 반영용)
 */
export const generateSpeech = async (text: string, voiceName: string = 'Zephyr', philosopherName: string = '철학자'): Promise<string | undefined> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `${philosopherName}의 목소리로 장중하고 울림 있게 읽어주세요: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS Generation Error:", error);
    return undefined;
  }
};

export const connectToLivePhilosopher = (philosopher: Philosopher, callbacks: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const session = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: philosopher.voice || 'Zephyr' } }
      },
      systemInstruction: PHILOSOPHY_SAFETY_INSTRUCTION + 
      `당신은 철학자 ${philosopher.name}입니다. 실시간 음성 상담 중입니다. 
      상담 역할: ${philosopher.role}
      상담 말투: ${philosopher.tone}
      상담 전략: ${philosopher.strategy}
      상대방의 말을 경청하고, 짧지만 울림이 있는 철학적 문장으로 대답하십시오.`
    }
  });
  return session;
};
