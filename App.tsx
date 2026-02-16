
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { EmotionType, Philosopher, FullPrescription, ViewType } from './types';
import { EMOTIONS, PHILOSOPHERS, TEST_QUESTIONS, POPULAR_WORRIES } from './constants';
import { generatePrescription, chatWithPhilosopher, generateSpeech } from './services/geminiService';
import { 
  Heart, BookOpen, MessageCircle, Home, 
  Quote, Sparkles, ArrowLeft, Send, 
  Loader2, Share2, CheckCircle2, 
  Target, ChevronRight, Bookmark,
  User, ClipboardCheck, BarChart3, LayoutGrid,
  Mic, Square, Play, RefreshCw, Trash2,
  Volume2, Waves, Activity,
  AlertCircle, Phone, Info, TrendingUp, ShieldAlert,
  Moon, Sun, Compass, Zap, Paperclip, Image as ImageIcon, X, Camera, MoreHorizontal,
  MicOff, XCircle, ShieldCheck, VolumeX, Speaker
} from 'lucide-react';
// Import Modality from @google/genai
import { GoogleGenAI, Modality } from '@google/genai';

// --- Gemini Specific Types (Defined locally to avoid Import errors) ---
interface GeminiBlob {
  data: string;
  mimeType: string;
}

// --- Audio Utilities ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createGeminiBlob(data: Float32Array): GeminiBlob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// --- Interfaces ---
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

// --- Sub-Components ---

const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-1.5 px-4 py-3 bg-white border border-slate-100 rounded-2xl w-fit shadow-sm animate-pulse">
    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
  </div>
);

const WaveformVisualizer: React.FC<{ active: boolean }> = ({ active }) => (
  <div className="flex items-end gap-1 h-8 px-2">
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
      <div 
        key={i} 
        className={`w-1 bg-[#3B82F6] rounded-full transition-all duration-300 ${active ? 'waveform-bar' : 'h-1.5'}`}
        style={active ? { animationDelay: `${i * 0.08}s` } : {}}
      />
    ))}
  </div>
);

const RiskAlert: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-[300] bg-red-950/40 backdrop-blur-md flex items-center justify-center p-6">
    <div className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-3xl text-center space-y-6 animate-in zoom-in-95">
      <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <ShieldAlert size={40} />
      </div>
      <h3 className="text-3xl font-black text-slate-900 serif-font">당신의 안전이 걱정됩니다</h3>
      <p className="text-slate-500 text-lg leading-relaxed">
        전달해주신 내용에서 심각한 심리적 위기 징후가 감지되었습니다. <br/>
        저희는 당신을 돕고 싶습니다. 지금 바로 아래의 전문 기관에 연락하여 따뜻한 상담을 받아보세요.
      </p>
      <div className="space-y-3 pt-4">
        <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
          <span className="font-bold text-slate-800">자살예방 상담전화</span>
          <span className="text-red-600 font-black text-xl">109</span>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
          <span className="font-bold text-slate-800">희망의 전화</span>
          <span className="text-red-600 font-black text-xl">129</span>
        </div>
      </div>
      <button 
        onClick={onClose}
        className="w-full py-5 bg-[#1E293B] text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all mt-4"
      >
        이해했습니다
      </button>
    </div>
  </div>
);

const LiveSessionOverlay: React.FC<{ philosopher: Philosopher; onClose: () => void }> = ({ philosopher, onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-white text-center">
      <div className="relative mb-12">
        <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center pulse-ring">
          <div className="w-32 h-32 bg-slate-800 text-white rounded-[3rem] flex items-center justify-center font-black text-5xl shadow-2xl">
            {philosopher.name[0]}
          </div>
        </div>
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">Live Session</div>
      </div>
      
      <h3 className="text-4xl font-bold serif-font mb-4">{philosopher.name}</h3>
      <p className="text-slate-400 text-lg mb-2">{philosopher.role}</p>
      <p className="text-slate-400 text-lg mb-12 max-w-md">"{philosopher.tagline}"<br/>현자가 당신의 목소리에 귀를 기울이고 있습니다.</p>
      
      <div className="flex gap-4 items-center mb-16 h-12">
        <WaveformVisualizer active={true} />
      </div>

      <button 
        onClick={onClose}
        className="px-12 py-5 bg-white text-slate-900 rounded-[2.5rem] font-black text-xl shadow-2xl hover:bg-red-50 hover:text-red-600 transition-all flex items-center gap-4"
      >
        <MicOff size={24} /> 상담 종료하기
      </button>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ 
  active, onClick, icon, label 
}) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-2.5 transition-all w-20 lg:w-40 relative ${active ? 'text-blue-600' : 'text-slate-300 hover:text-slate-500'}`}>
    {active && <div className="absolute -top-12 w-12 h-1.5 bg-blue-500 rounded-full blur-[2px]"></div>}
    <div className={`p-3.5 rounded-2xl transition-all ${active ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
      {icon}
    </div>
    <span className={`text-[10px] lg:text-[11px] font-black uppercase tracking-[0.4em] transition-all ${active ? 'opacity-100' : 'opacity-30'}`}>{label}</span>
  </button>
);

// --- Main App Component ---

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [worry, setWorry] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [prescription, setPrescription] = useState<FullPrescription | null>(null);
  const [history, setHistory] = useState<FullPrescription[]>([]);
  const [showRiskAlert, setShowRiskAlert] = useState(false);
  
  const [testStep, setTestStep] = useState(0);
  const [testScores, setTestScores] = useState<Record<string, number>>({});
  const [testResult, setTestResult] = useState<Philosopher | null>(null);

  const [chatPhilosopher, setChatPhilosopher] = useState<Philosopher | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [livePhilosopher, setLivePhilosopher] = useState<Philosopher | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  // TTS states
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const ttsAudioContextRef = useRef<AudioContext | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const sessionPromiseRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('philo_history');
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatLoading, pendingImages, currentView]);

  const saveToHistory = (item: FullPrescription) => {
    setHistory(prev => {
      const newHistory = [item, ...prev].slice(0, 50);
      localStorage.setItem('philo_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const analytics = useMemo(() => {
    if (!history || history.length === 0) return null;
    
    const validScores = history.filter(h => h.sentimentScore !== undefined);
    const avgEnergy = validScores.length > 0 
      ? validScores.reduce((acc, curr) => acc + (curr.sentimentScore || 0), 0) / validScores.length 
      : 0.5;
    const avgRisk = history.reduce((acc, curr) => acc + (curr.riskScore || 0), 0) / history.length;
    
    const philoSuccess: Record<string, { total: number, improved: number }> = {};
    history.forEach(h => {
      if (h.results) {
        h.results.forEach(r => {
          if (!philoSuccess[r.philosopherName]) philoSuccess[r.philosopherName] = { total: 0, improved: 0 };
          philoSuccess[r.philosopherName].total += 1;
          if ((h.sentimentScore || 0) > 0.6) philoSuccess[r.philosopherName].improved += 1;
        });
      }
    });

    const successEntries = Object.entries(philoSuccess);
    const topPhilo = successEntries.length > 0 
      ? successEntries.sort((a, b) => (b[1].improved / b[1].total) - (a[1].improved / a[1].total))[0]
      : null;
      
    const trendScores = history.slice(0, 7).map(h => Math.round((h.sentimentScore || 0) * 100)).reverse();

    return {
      avgEnergy: Math.round(avgEnergy * 100),
      avgRisk: Math.round(avgRisk * 100),
      topPhilosopher: topPhilo ? topPhilo[0] : '니체',
      topPhiloRate: topPhilo ? Math.round((topPhilo[1].improved / topPhilo[1].total) * 100) : 0,
      trendScores
    };
  }, [history]);

  const stopTts = () => {
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
      } catch (e) {}
      currentAudioSourceRef.current = null;
    }
    setPlayingMessageId(null);
  };

  const toggleSpeech = async (id: string, text: string, voiceName: string = 'Zephyr', philosopherName: string = '철학자') => {
    if (playingMessageId === id) {
      stopTts();
      return;
    }

    stopTts();
    setPlayingMessageId(id);

    const base64Audio = await generateSpeech(text, voiceName, philosopherName);
    if (!base64Audio) {
      setPlayingMessageId(null);
      return;
    }

    if (!ttsAudioContextRef.current) {
      ttsAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      ttsAudioContextRef.current,
      24000,
      1
    );

    const source = ttsAudioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ttsAudioContextRef.current.destination);
    source.onended = () => {
      setPlayingMessageId((prev) => (prev === id ? null : prev));
    };
    source.start();
    currentAudioSourceRef.current = source;
  };

  const handlePrescription = async () => {
    if (!worry.trim() || !selectedEmotion) return;
    const riskKeywords = ['자살', '자해', '죽고 싶', '죽어', '끝내고 싶', '안락사'];
    const isRisk = riskKeywords.some(k => worry.includes(k));
    
    if (isRisk) setShowRiskAlert(true);

    setIsLoading(true);
    try {
      const result = await generatePrescription(worry, selectedEmotion);
      const riskScore = isRisk ? 0.9 : 0.1;
      const finalResult = { ...result, riskScore };
      setPrescription(finalResult);
      saveToHistory(finalResult);
      setCurrentView('result');
    } catch (error) {
      console.error(error);
      alert("상담 엔진 연결 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if ((!text.trim() && pendingImages.length === 0) || !chatPhilosopher || isChatLoading) return;
    
    if (['자살', '자해', '죽고 싶', '죽어'].some(k => text.includes(k))) {
      setShowRiskAlert(true);
      return;
    }

    const userMsg: ChatMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      text, 
      imageUrls: [...pendingImages],
      type: pendingImages.length > 0 ? 'image' : 'text', 
      status: 'sent',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    const currentImages = [...pendingImages];
    setPendingImages([]);
    setChatInput(''); // Clear input after sending
    setIsChatLoading(true);

    try {
      const response = await chatWithPhilosopher(chatPhilosopher, text || "이미지를 통해 상담을 원합니다.", currentImages);
      const aiMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        text: response, 
        type: 'text',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (error) { 
      console.error(error); 
    } finally { 
      setIsChatLoading(false); 
    }
  };

  const startLiveSession = async (philosopher: Philosopher) => {
    try {
      setLivePhilosopher(philosopher);
      setIsLiveActive(true);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = 0;
      audioSourcesRef.current = new Set();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createGeminiBlob(inputData);
              sessionPromiseRef.current?.then((session: any) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: any) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
              const buffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
              const source = outputAudioContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outputAudioContextRef.current.destination);
              source.addEventListener('ended', () => audioSourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              audioSourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => console.error('Live session error:', e),
          onclose: () => stopLiveSession(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: philosopher.voice || 'Zephyr' } },
          },
          systemInstruction: `당신은 위대한 철학자 ${philosopher.name}입니다. 상담 역할: ${philosopher.role}, 말투: ${philosopher.tone}, 전략: ${philosopher.strategy}. 따뜻하고 위엄 있는 목소리로 사용자와 실시간 대화 중입니다.`,
        },
      });
    } catch (err) {
      console.error(err);
      alert("마이크 연결 실패 또는 세션 시작 중 오류가 발생했습니다.");
      setIsLiveActive(false);
    }
  };

  const stopLiveSession = () => {
    sessionPromiseRef.current?.then((session: any) => session?.close());
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    audioSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    setIsLiveActive(false);
    setLivePhilosopher(null);
  };

  const startChat = (philosopher: Philosopher) => {
    setChatPhilosopher(philosopher);
    setChatMessages([{ 
      id: 'welcome', 
      role: 'ai', 
      type: 'text',
      text: `반갑네, 나는 ${philosopher.name}이라네. 자네의 어떤 고민이 나를 찾아오게 했는가?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setCurrentView('chat');
  };

  const startTest = () => {
    setTestStep(0);
    setTestScores({});
    setTestResult(null);
    setCurrentView('test');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        alert("이미지는 5MB 이하만 가능합니다.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setPendingImages(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const startRecording = async () => { 
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = () => setRecordedBlob(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerIntervalRef.current = window.setInterval(() => setRecordingTime(p => p + 1), 1000);
    } catch (e) { alert("마이크 접근 권한이 필요합니다."); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const removePendingImage = (index: number) => {
    setPendingImages(prev => prev.filter((_, i) => i !== index));
  };

  // --- Main Render Logic ---

  return (
    <div className="flex flex-col w-full bg-[#F8FAFC] overflow-hidden relative min-h-screen">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#F8FAFC]/90 backdrop-blur-xl px-6 lg:px-12 py-5 flex justify-between items-center border-b border-slate-100/50 shrink-0">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => { stopTts(); setCurrentView('home'); }}>
          <div className="w-10 h-10 bg-[#1E293B] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-200 group-hover:bg-[#3B82F6] transition-all">
            <Zap size={20} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg lg:text-xl font-bold text-[#0F172A] tracking-tight">PhiloCare Pro</h1>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest hidden lg:block">Enterprise Intelligence</span>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => { stopTts(); setCurrentView('dashboard'); }} className="p-3 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all relative">
            <BarChart3 size={22} />
            {analytics && analytics.avgRisk > 70 && <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></div>}
          </button>
          <button onClick={() => { stopTts(); setCurrentView('history'); }} className="p-3 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all">
            <Bookmark size={22} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full overflow-hidden">
        
        <div className={`flex-1 ${currentView === 'chat' ? 'overflow-hidden' : 'overflow-y-auto'} custom-scrollbar pb-32`}>
          
          {/* Home View */}
          {currentView === 'home' && (
            <div className="space-y-8 fade-in-view max-w-7xl mx-auto py-8 px-6 lg:px-12">
              <section className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full border border-blue-100">
                  <Sparkles size={12} /> Wisdom DNA Engine
                </div>
                <h2 className="text-3xl lg:text-5xl font-extrabold text-[#0F172A] leading-tight tracking-tighter serif-font">
                  삶의 고뇌를<br />찬란한 지혜로
                </h2>
                <p className="text-slate-500 text-sm lg:text-base max-w-2xl mx-auto font-medium">검증된 11인의 철학자가 당신의 마음을 정밀하게 진단하고 맞춤형 지혜를 처방합니다.</p>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div onClick={() => { stopTts(); startTest(); }} className="premium-card p-6 lg:p-8 cursor-pointer group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50/50 rounded-full translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform"></div>
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner group-hover:bg-[#1E293B] group-hover:text-white transition-all">
                    <Compass size={24} />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold text-slate-900">영혼의 동반자 매칭</h3>
                  <p className="text-slate-400 mt-2 text-sm lg:text-base">가치관 테스트를 통해 당신의 내면과 가장 닮은 현자를 추천합니다.</p>
                </div>
                <div onClick={() => { stopTts(); setCurrentView('library'); }} className="premium-card p-6 lg:p-8 cursor-pointer group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/50 rounded-full translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform"></div>
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner group-hover:bg-[#1E293B] group-hover:text-white transition-all">
                    <BookOpen size={24} />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold text-slate-900">지혜의 아카이브</h3>
                  <p className="text-slate-400 mt-2 text-sm lg:text-base">인류 최고의 현자들과 실시간 음성 및 이미지 상담을 시작하세요.</p>
                </div>
              </div>

              <section className="space-y-6 py-4">
                <div className="flex flex-col items-center gap-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.5em]">Current Mind State</h4>
                  <div className="w-12 h-0.5 bg-slate-100 rounded-full"></div>
                </div>
                <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
                  {EMOTIONS.map((item) => (
                    <button
                      key={item.type}
                      onClick={() => setSelectedEmotion(item.type)}
                      className={`group p-3 lg:p-4 rounded-[1.5rem] flex flex-col items-center gap-2 transition-all border-2 active:scale-95 ${
                        selectedEmotion === item.type 
                          ? 'border-[#3B82F6] bg-white shadow-xl shadow-blue-100 scale-105' 
                          : 'border-transparent bg-white shadow-sm hover:shadow-md hover:border-slate-100'
                      }`}
                    >
                      <span className="text-3xl lg:text-4xl transition-transform group-hover:scale-110">{item.icon}</span>
                      <span className="text-[11px] lg:text-[13px] font-bold text-slate-800 tracking-tight">{item.type}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-4 bg-white p-6 lg:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center">
                  <h4 className="text-base font-bold text-slate-900 serif-font">고민의 본질을 적어주세요</h4>
                  <button onClick={() => setWorry(POPULAR_WORRIES[Math.floor(Math.random() * POPULAR_WORRIES.length)])} className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1">
                    <RefreshCw size={12} /> 랜덤 고민
                  </button>
                </div>
                <textarea
                  value={worry}
                  onChange={(e) => setWorry(e.target.value)}
                  placeholder="오늘 어떤 마음으로 오셨나요? 당신의 고통을 지혜로 바꿀 준비가 되었습니다."
                  className="w-full h-32 p-6 rounded-[1.5rem] bg-slate-50 border-none focus:ring-4 focus:ring-blue-50/50 outline-none resize-none transition-all text-base lg:text-xl serif-font placeholder:text-slate-300 leading-relaxed"
                />
                <button
                  onClick={handlePrescription}
                  disabled={!worry || !selectedEmotion || isLoading}
                  className={`w-full py-4 rounded-[1.5rem] flex items-center justify-center gap-3 text-lg font-black shadow-xl transition-all active:scale-[0.99] ${
                    isLoading || !worry || !selectedEmotion
                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                      : 'bg-[#1E293B] text-white hover:bg-slate-800 shadow-slate-200'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span className="text-sm">지혜를 치환 중...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={20} />
                      <span className="text-sm lg:text-base">지혜 처방전 생성</span>
                    </>
                  )}
                </button>
              </section>
            </div>
          )}

          {/* Library View */}
          {currentView === 'library' && (
            <div className="space-y-8 fade-in-view max-w-7xl mx-auto py-8 px-6 lg:px-12 pb-32">
              <header className="px-1 space-y-2 text-center lg:text-left">
                <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-900 serif-font tracking-tight leading-none">The Academy</h2>
                <p className="text-sm lg:text-base text-slate-400 font-medium max-w-2xl">인류의 역사를 바꾼 11인의 현자들이 당신의 고민을 분석할 준비가 되어 있습니다.</p>
              </header>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {PHILOSOPHERS.map((p) => (
                  <div key={p.id} className="premium-card p-4 lg:p-6 space-y-4 group relative overflow-hidden border-none shadow-lg hover:shadow-blue-50 transition-all duration-500">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-[#1E293B]/5 transition-all duration-700"></div>
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <h3 className="text-xl lg:text-2xl font-black text-slate-900 serif-font">{p.name}</h3>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">{p.period}</p>
                      </div>
                      <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-md transform group-hover:rotate-12 transition-all">
                        {p.name[0]}
                      </div>
                    </div>
                    <div className="space-y-2 relative z-10">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[8px] font-black uppercase tracking-widest">
                        <Target size={10} /> {p.role}
                      </div>
                      <div className="p-3 bg-slate-50/50 rounded-xl border-l-4 border-[#3B82F6] italic text-slate-700 font-bold text-xs lg:text-sm serif-font leading-relaxed line-clamp-2">
                        "{p.tagline}"
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 relative z-10">
                      <button onClick={() => { stopTts(); startChat(p); }} className="py-2.5 bg-[#1E293B] text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-95 transition-all shadow-md">
                        <MessageCircle size={14} /> 상담실
                      </button>
                      <button onClick={() => { stopTts(); startLiveSession(p); }} className="py-2.5 bg-white text-slate-700 rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-95 transition-all border border-slate-200 shadow-md">
                        <Volume2 size={14} /> 음성
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat View */}
          {currentView === 'chat' && chatPhilosopher && (
            <div className="flex flex-col h-full fade-in-view max-w-4xl mx-auto bg-white border-x border-slate-100 shadow-2xl relative">
              <header className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#1E293B] text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
                    {chatPhilosopher.name[0]}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">{chatPhilosopher.name}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{chatPhilosopher.role}</p>
                  </div>
                </div>
                <button onClick={() => { stopTts(); setCurrentView('library'); }} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X size={24} className="text-slate-400" /></button>
              </header>

              <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar pb-40">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                    <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`p-5 rounded-3xl text-sm lg:text-base font-medium leading-relaxed shadow-sm relative group ${
                        msg.role === 'user' 
                          ? 'bg-[#1E293B] text-white rounded-tr-none' 
                          : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100'
                      }`}>
                        {msg.text}
                        {msg.role === 'ai' && (
                          <div className="mt-3 pt-3 border-t border-slate-200/50 flex justify-end">
                            <button 
                              onClick={() => toggleSpeech(msg.id, msg.text || "", chatPhilosopher.voice, chatPhilosopher.name)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${
                                playingMessageId === msg.id 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                              }`}
                            >
                              {playingMessageId === msg.id ? <VolumeX size={12} /> : <Speaker size={12} />}
                              {playingMessageId === msg.id ? "음성 중단" : "음성 듣기"}
                            </button>
                          </div>
                        )}
                        {msg.audioUrl && (
                          <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl mt-2">
                            <Play size={16} fill="currentColor" />
                            <div className="h-1 bg-white/20 flex-1 rounded-full"><div className="h-full bg-white w-1/3 rounded-full"></div></div>
                            <span className="text-[10px] opacity-70">0:{msg.duration?.toString().padStart(2, '0')}</span>
                          </div>
                        )}
                        {msg.imageUrls && msg.imageUrls.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            {msg.imageUrls.map((url, i) => (
                              <img key={i} src={url} alt="User upload" className="rounded-xl w-full h-32 object-cover border border-white/10" />
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] font-black text-slate-300 uppercase px-1">{msg.timestamp}</span>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <TypingIndicator />
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-white via-white to-transparent pt-12 z-20">
                {pendingImages.length > 0 && (
                  <div className="flex gap-2 mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-bottom-2">
                    {pendingImages.map((img, i) => (
                      <div key={i} className="relative group">
                        <img src={img} className="w-16 h-16 rounded-xl object-cover shadow-md border-2 border-white" />
                        <button onClick={() => removePendingImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg scale-0 group-hover:scale-100 transition-all"><X size={12} /></button>
                      </div>
                    ))}
                    <button onClick={() => fileInputRef.current?.click()} className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-all"><ImageIcon size={20} /></button>
                  </div>
                )}
                
                <div className="flex items-center gap-3 bg-white p-2 rounded-[2rem] border border-slate-200 shadow-2xl shadow-slate-200 focus-within:border-blue-500 transition-all">
                  <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"><Paperclip size={20} /></button>
                  <input 
                    type="text" 
                    value={chatInput} 
                    onChange={(e) => setChatInput(e.target.value)} 
                    placeholder="고민을 나누어 보세요..." 
                    className="flex-1 bg-transparent border-none outline-none text-slate-800 font-medium px-2 py-3"
                    onKeyDown={(e) => { 
                      if (e.key === 'Enter' && !isChatLoading) {
                        handleSendMessage(chatInput);
                      } 
                    }}
                  />
                  {isRecording ? (
                    <button onClick={stopRecording} className="p-4 bg-red-500 text-white rounded-full animate-pulse shadow-lg"><Square size={20} /></button>
                  ) : (
                    <button onClick={startRecording} className="p-4 text-slate-400 hover:text-slate-600 rounded-full"><Mic size={20} /></button>
                  )}
                  <button onClick={() => handleSendMessage(chatInput)} className="p-4 bg-[#1E293B] text-white rounded-full hover:bg-slate-800 transition-all shadow-lg shadow-slate-200" disabled={isChatLoading}><Send size={20} /></button>
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple className="hidden" accept="image/*" />
                </div>
              </div>
            </div>
          )}

          {/* Result View */}
          {currentView === 'result' && prescription && (
             <div className="space-y-16 fade-in-view max-w-7xl mx-auto py-12 px-6 lg:px-12 pb-32">
               <header className="flex justify-between items-center px-1">
                  <button onClick={() => { stopTts(); setCurrentView('home'); }} className="flex items-center gap-3 text-slate-500 font-black uppercase tracking-widest text-xs hover:text-slate-900 transition-colors">
                    <ArrowLeft size={18} /> Back
                  </button>
                  <div className="flex gap-4">
                    <div className="px-6 py-2 rounded-full text-[11px] font-black border bg-green-50 text-green-600 border-green-100 flex items-center gap-2 shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-green-500"></div>
                      ENERGY: {Math.round((prescription.sentimentScore || 0) * 100)}%
                    </div>
                  </div>
                </header>

                <div className="bg-[#1E293B] p-20 lg:p-32 rounded-[5rem] text-white text-center space-y-10 shadow-2xl relative overflow-hidden">
                  <div className="relative z-10 space-y-8">
                    <Quote size={80} className="mx-auto text-blue-400/20 mb-6" />
                    <h3 className="text-3xl lg:text-6xl font-bold serif-font leading-tight px-6 lg:px-32 italic">"{prescription.summary}"</h3>
                    <div className="flex justify-center mt-6">
                      <button 
                        onClick={() => toggleSpeech(prescription.id, prescription.summary, 'Zephyr', '지혜의 목소리')}
                        className={`flex items-center gap-3 px-8 py-3 rounded-full font-black transition-all ${
                          playingMessageId === prescription.id 
                          ? 'bg-red-500 text-white shadow-xl' 
                          : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        }`}
                      >
                        {playingMessageId === prescription.id ? <VolumeX size={20} /> : <Speaker size={20} />}
                        {playingMessageId === prescription.id ? "음성 중단" : "지혜 음성 듣기"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  {prescription.results.map((res, idx) => {
                    const philo = PHILOSOPHERS.find(p => p.name === res.philosopherName) || PHILOSOPHERS[0];
                    const cardId = `pres-res-${idx}`;
                    return (
                      <div key={idx} className="premium-card p-12 flex flex-col group relative overflow-hidden">
                        <span className="px-5 py-1.5 bg-slate-100 text-slate-600 text-[11px] font-black rounded-[1rem] w-fit mb-10 uppercase tracking-[0.2em] relative z-10">{res.philosopherName}</span>
                        <div className="flex justify-between items-start mb-6 relative z-10">
                          <p className="text-slate-800 text-2xl lg:text-3xl leading-relaxed flex-1 serif-font italic font-medium">"{res.advice}"</p>
                        </div>
                        <button 
                          onClick={() => toggleSpeech(cardId, res.advice, philo.voice, philo.name)}
                          className={`mb-10 w-fit flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all relative z-10 ${
                            playingMessageId === cardId 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {playingMessageId === cardId ? <VolumeX size={14} /> : <Speaker size={14} />}
                          {playingMessageId === cardId ? "음성 중단" : "조언 듣기"}
                        </button>
                        <div className="pt-10 border-t border-slate-100 relative z-10 mt-auto">
                          <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => { stopTts(); startChat(philo); }} className="py-4 bg-[#1E293B] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg"><MessageCircle size={18} /> 상담실</button>
                            <button onClick={() => { stopTts(); startLiveSession(philo); }} className="py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-lg"><Volume2 size={18} /> 음성</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
             </div>
          )}

          {/* Test View */}
          {currentView === 'test' && (
            <div className="space-y-16 fade-in-view max-w-5xl mx-auto py-20 px-6 pb-32">
              {!testResult ? (
                <div className="space-y-20">
                  <div className="space-y-12 text-center">
                    <div className="flex justify-center gap-4">
                      {TEST_QUESTIONS.map((_, i) => (
                        <div key={i} className={`h-2.5 rounded-full transition-all duration-700 ${i <= testStep ? 'w-24 bg-blue-500 shadow-xl shadow-blue-100' : 'w-8 bg-slate-100'}`}></div>
                      ))}
                    </div>
                    <h3 className="text-4xl lg:text-7xl font-extrabold text-slate-900 serif-font leading-[1.1] tracking-tight">{TEST_QUESTIONS[testStep].text}</h3>
                  </div>
                  <div className="grid gap-6">
                    {TEST_QUESTIONS[testStep].options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const newScores = { ...testScores, [opt.philosopherId]: (testScores[opt.philosopherId] || 0) + 1 };
                          setTestScores(newScores);
                          if (testStep < TEST_QUESTIONS.length - 1) {
                            setTestStep(testStep + 1);
                          } else {
                            const winnerId = Object.entries(newScores).reduce((a: any, b: any) => (a[1] > b[1] ? a : b))[0];
                            setTestResult(PHILOSOPHERS.find(p => p.id === winnerId) || PHILOSOPHERS[0]);
                          }
                        }}
                        className="w-full p-12 text-left bg-white border-2 border-slate-100 hover:border-blue-400 hover:bg-blue-50/10 rounded-[3rem] transition-all shadow-xl shadow-slate-100 font-black text-slate-700 text-2xl lg:text-3xl active:scale-[0.98] active:bg-blue-50"
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-20 text-center animate-in zoom-in-95 duration-700">
                  <div className="space-y-6">
                    <span className="text-[12px] font-black text-blue-500 uppercase tracking-[0.5em] bg-blue-50 px-6 py-2 rounded-full border border-blue-100">Analysis Complete</span>
                    <h3 className="text-6xl lg:text-9xl font-extrabold text-slate-900 serif-font leading-none">당신은 <span className="text-blue-600">{testResult.name}</span></h3>
                  </div>
                  <div className="premium-card p-20 lg:p-32 space-y-12 relative overflow-hidden group">
                    <p className="text-4xl lg:text-6xl font-bold text-slate-900 serif-font italic leading-tight relative z-10">"{testResult.tagline}"</p>
                    <p className="text-slate-500 text-xl lg:text-3xl leading-relaxed font-medium relative z-10 max-w-4xl mx-auto">{testResult.description}</p>
                    <div className="flex justify-center mt-6">
                      <button 
                        onClick={() => toggleSpeech('test-res', testResult.tagline + ". " + testResult.description, testResult.voice, testResult.name)}
                        className={`flex items-center gap-3 px-8 py-3 rounded-full font-black transition-all relative z-10 ${
                          playingMessageId === 'test-res' 
                          ? 'bg-blue-600 text-white shadow-xl' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {playingMessageId === 'test-res' ? <VolumeX size={20} /> : <Speaker size={20} />}
                        {playingMessageId === 'test-res' ? "음성 중단" : "결과 음성 듣기"}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-6 max-w-md mx-auto pb-12">
                    <button onClick={() => { stopTts(); startChat(testResult); }} className="w-full py-8 bg-[#1E293B] text-white rounded-[2.5rem] font-black text-2xl shadow-3xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all">
                      상담 시작하기
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Navigation Footer */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-2xl border-t border-slate-100/50 flex justify-around items-center h-24 lg:h-28 px-8 lg:px-24 z-50 shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.05)] shrink-0">
        <NavButton active={currentView === 'home'} onClick={() => { stopTts(); setCurrentView('home'); }} icon={<Home size={28} />} label="Home" />
        <NavButton active={currentView === 'dashboard'} onClick={() => { stopTts(); setCurrentView('dashboard'); }} icon={<BarChart3 size={28} />} label="Insight" />
        <NavButton active={currentView === 'library'} onClick={() => { stopTts(); setCurrentView('library'); }} icon={<Compass size={28} />} label="Academy" />
        <NavButton active={currentView === 'history'} onClick={() => { stopTts(); setCurrentView('history'); }} icon={<Bookmark size={28} />} label="Archive" />
      </nav>
    </div>
  );
};

export default App;
