import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Users, 
  MapPin, 
  TrendingUp, 
  AlertTriangle, 
  Navigation, 
  CheckCircle, 
  Compass, 
  Layers, 
  MessageSquare, 
  Cpu, 
  RefreshCw, 
  Globe, 
  QrCode, 
  Accessibility, 
  Utensils, 
  Leaf, 
  Send, 
  Bus, 
  Settings, 
  Volume2, 
  Zap, 
  Sparkles,
  Search,
  BookOpen,
  Bell,
  X,
  Info,
  VolumeX,
  Play,
  Image,
  Download,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

const VENUES = [
  { id: 'metlife', name: 'MetLife Stadium (East Rutherford, NJ/NY)', capacity: 82500, match: 'USA vs. England' },
  { id: 'sofi', name: 'SoFi Stadium (Los Angeles, CA)', capacity: 70240, match: 'Mexico vs. Germany' },
  { id: 'azteca', name: 'Estadio Azteca (Mexico City, MX)', capacity: 87523, match: 'Canada vs. Argentina' }
];

const PRESET_INCIDENTS = [
  {
    title: "Gate B Bottleneck",
    description: "Crowd congestion at Gate B after automatic ticket scanner failure. ~2,500 fans waiting in high-heat conditions.",
    category: "Crowd Control"
  },
  {
    title: "Heavy Transit Delays",
    description: "Regional rail shuttle line suspended temporarily due to power surge. 15,000 fans arriving in next 30 mins are affected.",
    category: "Transportation"
  },
  {
    title: "Extreme Thermal Warning",
    description: "Heat index reaches 98°F (36.7°C). Rapid increase in medical assistance requests for dehydration at Section 214.",
    category: "Health & Safety"
  }
];

const ECO_CONCESSIONS = [
  { id: 'burger', name: 'Regen Plant-Based Burger', price: '$12.50', ecoScore: 'A+', co2: '0.4kg CO2e', description: 'Zero-waste packaging, local micro-protein.' },
  { id: 'taco', name: 'Sustainable Fish Tacos', price: '$14.00', ecoScore: 'A', co2: '0.7kg CO2e', description: 'MSC-certified local catch, corn-husks bowls.' },
  { id: 'fries', name: 'Upcycled Potato Crisps', price: '$6.50', ecoScore: 'B+', co2: '0.2kg CO2e', description: 'Made from locally rescued misshapen potatoes.' }
];

// Encodes text and packs PCM audio arrays into standard WAVE formats
function base64ToArrayBuffer(base64: string) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function pcmToWav(pcm16: Int16Array, sampleRate: number) {
  const buffer = new ArrayBuffer(44 + pcm16.length * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length
  view.setUint32(4, 36 + pcm16.length * 2, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (1 = PCM)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, pcm16.length * 2, true);

  // Write PCM samples
  let index = 44;
  for (let i = 0; i < pcm16.length; i++) {
    view.setInt16(index, pcm16[i], true);
    index += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'ops' | 'fan'>('ops');
  const [selectedVenue, setSelectedVenue] = useState(VENUES[0]);
  const [currentMatch, setCurrentMatch] = useState(VENUES[0].match);
  const [showGuide, setShowGuide] = useState(true);
  
  // API Key management states
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('gemini_api_key') || (import.meta.env.VITE_GEMINI_API_KEY || '') as string);
  const [showSettings, setShowSettings] = useState(false);
  const [tempKey, setTempKey] = useState(geminiApiKey);
  const [showKeyText, setShowKeyText] = useState(false);

  // Real-time operations stats simulation
  const [crowdCapacityPercent, setCrowdCapacityPercent] = useState(74);
  const [averageWaitTime, setAverageWaitTime] = useState(12);
  const [sustainabilityIndex, setSustainabilityIndex] = useState(91);
  const [activeAlertCount, setActiveAlertCount] = useState(2);
  
  // Custom interactive systems state
  const [selectedMapSector, setSelectedMapSector] = useState('Sector 4 (North Concourse)');
  const [sensorAlerts, setSensorAlerts] = useState([
    { id: 1, type: 'critical', location: 'Gate B', msg: 'Turnstile Scanner Offline', time: '16:01' },
    { id: 2, type: 'warning', location: 'Sec 224 Concourse', msg: 'Elevated Trash Level Detected', time: '15:58' },
    { id: 3, type: 'info', location: 'Main Transit Hub', msg: 'Ramp-up bus fleet dispatch initiated', time: '15:55' }
  ]);
  
  // Custom crisis input / Gemini output for Ops Panel
  const [customIncident, setCustomIncident] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiDispatches, setAiDispatches] = useState({
    title: "Select or input a scenario to generate a dynamic tactical plan",
    plan: "The GenAI Venue Co-Pilot will instantly draft action plans, crowd rerouting alerts, multi-lingual PA scripts, and dispatch guides.",
    bilingualPA: "Welcome to the FIFA World Cup 2026. Please remain calm and proceed carefully to your assigned sections.",
    allocations: [] as { team: string; task: string }[]
  });

  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [ttsVoice, setTtsVoice] = useState('Zephyr'); // Prebuilt voices: Zephyr, Kore, Puck, Fenrir
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [badgePrompt, setBadgePrompt] = useState('A golden futuristic soccer ball hovering over MetLife stadium covered in green solar panels, cyberpunk style digital art');
  const [isBadgeLoading, setIsBadgeLoading] = useState(false);
  const [generatedBadgeUrl, setGeneratedBadgeUrl] = useState<string | null>(null);

  // Fan Mobile App Emulator state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Hi! I am ArenaAI, your FIFA World Cup 2026 Virtual Assistant. Ask me about your seat, green concession options, dynamic transport status, or accessible routes!', timestamp: '16:00' }
  ]);
  const [isFanAiLoading, setIsFanAiLoading] = useState(false);
  const [selectedAccessibility, setSelectedAccessibility] = useState(false);
  const [selectedConcession, setSelectedConcession] = useState<null | 'menu' | 'badge'>(null);
  
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeTab === 'fan' && selectedConcession === null) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isFanAiLoading, activeTab, selectedConcession]);
  
  // Custom UI Notifications to replace browser alert()
  const [notifications, setNotifications] = useState<any[]>([]);

  const addNotification = (title: string, message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Time stamp logic for the 2026 World Cup simulator
  const [currentTimeString, setCurrentTimeString] = useState('16:03:59');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTimeString(now.toTimeString().split(' ')[0]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync current match with selected venue
  const handleVenueChange = (venueId: string) => {
    const ven = VENUES.find(v => v.id === venueId);
    if (ven) {
      setSelectedVenue(ven);
      setCurrentMatch(ven.match);
      addNotification("Venue Configured", `Switched live simulation track to ${ven.name}`, "info");
    }
  };

  const triggerGeminiOpsCall = async (scenarioText: string) => {
    setIsAiLoading(true);
    setAudioUrl(null); // Clear previous generated audio
    const apiKey = geminiApiKey || "";
    
    // Graceful offline simulated mode fallback
    if (!apiKey) {
      setTimeout(() => {
        const matchingPreset = PRESET_INCIDENTS.find(p => p.description === scenarioText) || {
          title: "Operations Alert Resolution",
          description: scenarioText
        };
        
        setAiDispatches({
          title: matchingPreset.title === "Operations Alert Resolution" ? "Incident Reroute Strategy" : matchingPreset.title,
          plan: `1. Dispatching Sector Supervisors to the affected zone immediately.\n2. Rerouting digital signage flow direction.\n3. Translating warnings into Spanish translations on local concourse visual monitors.\n4. Deploying support volunteers for queue control.`,
          bilingualPA: `Attention all ticket holders. Please remain in place. An operational adjustment is underway. Proceed to Gate C when directed. ¡Atención! Por favor, permanezca en su lugar. Un ajuste operativo está en curso. Diríjase a la Puerta C cuando se le indique.`,
          allocations: [
            { team: "Dynamic Signage", task: "Redirect flow towards alternate gateways immediately." },
            { team: "Field Personnel Command", task: "Deploy fresh cooling water reserves to the target coordinates." }
          ]
        });
        setActiveAlertCount(prev => prev + 1);
        setIsAiLoading(false);
        addNotification("Mock Tactical Guide Compiled", "No API key configured. Loaded template dispatch plan.", "info");
      }, 1000);
      return;
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const systemInstruction = `
      You are StadiumGenius, the lead Generative AI Tactical Co-Pilot for FIFA World Cup 2026 Operations.
      Analyze the stadium emergency incident provided. Output a JSON structured response with the following keys strictly formatted:
      - "title": A concise crisis title
      - "immediateAction": A 3-step prioritized list of operations directives for on-site crew.
      - "crowdReroute": Instructions to update dynamic digital wayfinding panels to detour fans.
      - "bilingualPA": An emergency broadcast script written in English and Spanish. Keep it brief, professional, and clear.
      - "resourceLog": Specific dispatches for security, medical teams, or transit.
      Return ONLY valid JSON matching this schema exactly. No Markdown wrappers except JSON keys.
    `;

    try {
      const payload = {
        contents: [{ parts: [{ text: `Generate a full tactical operational dispatch plan for this incident: ${scenarioText}` }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              immediateAction: { type: "ARRAY", items: { type: "STRING" } },
              crowdReroute: { type: "STRING" },
              bilingualPA: { type: "STRING" },
              resourceLog: { type: "STRING" }
            },
            required: ["title", "immediateAction", "crowdReroute", "bilingualPA", "resourceLog"]
          }
        },
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        }
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (rawText) {
        const parsed = JSON.parse(rawText);
        setAiDispatches({
          title: parsed.title || "Tactical Alert Resolution",
          plan: parsed.immediateAction ? parsed.immediateAction.join("\n\n") : "Rerouting operational focus immediately.",
          bilingualPA: parsed.bilingualPA || "",
          allocations: [
            { team: "Dynamic Signage Co-Pilot", task: parsed.crowdReroute || "Detour active" },
            { team: "Field Personnel Command", task: parsed.resourceLog || "Dispatching nearest patrol" }
          ]
        });
        setActiveAlertCount(prev => prev + 1);
        addNotification("New Tactical Guide Generated", parsed.title || "Emergency Response Plan ready.", "warning");
      }
    } catch (error) {
      console.error("Gemini API Error in Ops:", error);
      setAiDispatches({
        title: "Incident Reroute Strategy: " + (scenarioText.substring(0,35)) + "...",
        plan: "1. Dispatching Sector Supervisors to the affected zone immediately.\n2. Rerouting digital signage flow direction.\n3. Translating warnings into Spanish translations on local concourse visual monitors.",
        bilingualPA: "Attention all ticket holders. Please remain in place. An operational adjustment is underway at Sector B. Stand by.",
        allocations: [
          { team: "Dynamic Signage", task: "Redirect flow towards alternate gateways immediately." },
          { team: "Sustainability & Logistics", task: "Deploy fresh cooling water reserves to the target coordinates." }
        ]
      });
      addNotification("Offline Safe Protocol Active", "Operational parameters configured using tactical fallback templates.", "info");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGenerateTts = async () => {
    if (!aiDispatches.bilingualPA) {
      addNotification("Error", "No PA script available to synthesize. Run an incident dispatch first.", "warning");
      return;
    }
    
    setIsTtsLoading(true);
    setAudioUrl(null);
    const apiKey = geminiApiKey || "";

    if (!apiKey) {
      setTimeout(() => {
        setIsTtsLoading(false);
        addNotification("TTS Fallback Active", "No API key configured. Utilizing local Web Speech API synthesis.", "info");
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(aiDispatches.bilingualPA);
          // Standard browser speech synth
          window.speechSynthesis.speak(utterance);
        }
      }, 800);
      return;
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
    const promptText = `Speak this emergency broadcast script with clear, authoritative voice: "${aiDispatches.bilingualPA}"`;

    const payload = {
      contents: [{
        parts: [{ text: promptText }]
      }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: ttsVoice }
          }
        }
      },
      model: "gemini-2.5-flash-preview-tts"
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      const part = result?.candidates?.[0]?.content?.parts?.[0];
      const audioData = part?.inlineData?.data;
      const mimeType = part?.inlineData?.mimeType;

      if (audioData && mimeType && mimeType.startsWith("audio/")) {
        let sampleRate = 24000;
        const rateMatch = mimeType.match(/rate=(\d+)/);
        if (rateMatch) {
          sampleRate = parseInt(rateMatch[1], 10);
        }

        const pcmBuffer = base64ToArrayBuffer(audioData);
        const pcm16 = new Int16Array(pcmBuffer);
        const wavBlob = pcmToWav(pcm16, sampleRate);
        const url = URL.createObjectURL(wavBlob);
        
        setAudioUrl(url);
        addNotification("PA Speech Synthesized", "Multilingual audio broadcast generated via Gemini TTS.", "success");
        
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("Playback interaction deferred", e));
          }
        }, 150);
      } else {
        throw new Error("No binary audio payload located in Gemini response.");
      }
    } catch (error) {
      console.error("Gemini TTS Error:", error);
      addNotification("TTS Integration Issue", "Simulated voice announcement stream fallback under Web Speech API.", "info");
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(aiDispatches.bilingualPA);
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setIsTtsLoading(false);
    }
  };

  const handleGenerateBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgePrompt.trim()) return;

    setIsBadgeLoading(true);
    setGeneratedBadgeUrl(null);
    
    const apiKey = geminiApiKey || ""; 
    
    if (!apiKey) {
      setTimeout(() => {
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#059669" /><stop offset="100%" stop-color="#2563eb" /></linearGradient></defs><circle cx="100" cy="100" r="90" fill="#f0fdf4" stroke="url(#badgeGrad)" stroke-width="6"/><circle cx="100" cy="100" r="75" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/><text x="100" y="55" fill="#047857" font-family="'Outfit', sans-serif" font-weight="900" font-size="12" text-anchor="middle" letter-spacing="2">CLIMATE TOKEN</text><path d="M70 110 L100 80 L130 110 L115 110 L115 140 L85 140 L85 110 Z" fill="#10b981"/><text x="100" y="165" fill="#64748b" font-family="sans-serif" font-weight="bold" font-size="9" text-anchor="middle">${selectedVenue.name.split(' ')[0].toUpperCase()} 2026</text></svg>`;
        const encodedSvg = encodeURIComponent(svgString);
        setGeneratedBadgeUrl(`data:image/svg+xml;charset=utf-8,${encodedSvg}`);
        setIsBadgeLoading(false);
        addNotification("Mock Badge Generated", "Your custom souvenir token is rendered.", "success");
      }, 1200);
      return;
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{
        role: 'user',
        parts: [{ text: `${badgePrompt}. Make it a neat badge icon layout with a circular border, featuring FIFA World Cup aesthetics and high detail.` }]
      }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: { aspectRatio: "1:1" }
      }
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || `API Error: ${response.status}`);
      }
      
      const part = result?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      
      if (part && part.inlineData) {
        const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        setGeneratedBadgeUrl(imageUrl);
        addNotification("Badge Generated Successfully!", "Your custom climate-action token has been compiled.", "success");
      } else {
        throw new Error("Invalid response structure from Image API.");
      }
    } catch (error) {
      console.error("Gemini Image Generation Error:", error);
      addNotification("Image Generation Fallback", "Synthesizing custom vector badge inline.", "info");
      
      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><linearGradient id="fallbackGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#059669" /><stop offset="100%" stop-color="#2563eb" /></linearGradient></defs><circle cx="100" cy="100" r="90" fill="#f0fdf4" stroke="url(#fallbackGrad)" stroke-width="6"/><circle cx="100" cy="100" r="75" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/><text x="100" y="55" fill="#047857" font-family="'Outfit', sans-serif" font-weight="900" font-size="12" text-anchor="middle" letter-spacing="2">GREEN TOKENS</text><path d="M70 110 L100 80 L130 110 L115 110 L115 140 L85 140 L85 110 Z" fill="#10b981"/><text x="100" y="165" fill="#64748b" font-family="sans-serif" font-weight="bold" font-size="9" text-anchor="middle">${selectedVenue.name.split(' ')[0].toUpperCase()} 2026</text></svg>`;
      const encodedSvg = encodeURIComponent(svgString);
      setGeneratedBadgeUrl(`data:image/svg+xml;charset=utf-8,${encodedSvg}`);
    } finally {
      setIsBadgeLoading(false);
    }
  };

  const triggerGeminiFanChat = async (userMsg: string) => {
    setIsFanAiLoading(true);
    const apiKey = geminiApiKey || "";

    if (!apiKey) {
      setTimeout(() => {
        let fallbackText = "I'm routing your request to our MetLife volunteer crew! Meanwhile, check out the nearest ADA elevator located behind Section 112, or try the plant-based options in the East Concourse.";
        const msgLower = userMsg.toLowerCase();
        if (msgLower.includes('seat') || msgLower.includes('where') || msgLower.includes('section')) {
          fallbackText = `Welcome to MetLife Stadium! Your match ticket corresponds to Section 104, Row 12, Seat 4. You can take the West escalator up, which is currently seeing minimal line times (under 5 minutes).`;
        } else if (msgLower.includes('food') || msgLower.includes('eat') || msgLower.includes('hungry') || msgLower.includes('sustainable')) {
          fallbackText = `For a lower environmental impact, check out Section 134's Sustainable Eats Hub! Try the Regen Plant-Based Burger. It uses compostable packaging and saves 85% of carbon compared to traditional beef options!`;
        } else if (msgLower.includes('spanish') || msgLower.includes('sign') || msgLower.includes('traduzca') || msgLower.includes('english')) {
          fallbackText = `Certainly! "Main Exit" translates to "Salida Principal" in Spanish. "Gate Entrance" is "Entrada de la Puerta". Follow the green arrows.`;
        }
        setChatMessages(prev => [...prev, { sender: 'bot', text: fallbackText, timestamp: new Date().toLocaleTimeString().slice(0, 5) }]);
        setIsFanAiLoading(false);
        addNotification("Mock Response Sent", "Virtual Assistant loaded simulated guidelines.", "info");
      }, 1000);
      return;
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const fanAssistantSystemPrompt = `
      You are StadiumGenius, the friendly AI Concierge inside the official FIFA World Cup 2026 App.
      The user is inside ${selectedVenue.name}, currently watching the match: ${currentMatch}.
      Answer their questions thoroughly but keep it concise (under 3 sentences). 
      - Always offer guidance highlighting sustainability (recommending local eco-friendly concessions) and accessibility (accessible ramps, elevators, ADA drop-offs).
      - If requested, provide seamless translations of navigation or stadium rules into Spanish, French, Arabic, German, or Portuguese.
      - Sound upbeat, sport-loving, and helpful!
    `;

    try {
      const payload = {
        contents: [{ parts: [{ text: userMsg }] }],
        systemInstruction: {
          parts: [{ text: fanAssistantSystemPrompt }]
        }
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (aiReply) {
        setChatMessages(prev => [...prev, { sender: 'bot', text: aiReply, timestamp: new Date().toLocaleTimeString().slice(0, 5) }]);
      }
    } catch (error) {
      console.error("Gemini API Error in Chat:", error);
      let fallbackText = "I'm routing your request to our MetLife volunteer crew! Meanwhile, check out the nearest ADA elevator located behind Section 112, or try the plant-based options in the East Concourse.";
      setChatMessages(prev => [...prev, { sender: 'bot', text: fallbackText, timestamp: new Date().toLocaleTimeString().slice(0, 5) }]);
    } finally {
      setIsFanAiLoading(false);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, timestamp: new Date().toLocaleTimeString().slice(0, 5) }]);
    setChatInput('');
    triggerGeminiFanChat(userMsg);
  };

  const crowdArrivalData = [
    { time: '14:00', arriving: 5400, capacity: 15 },
    { time: '14:30', arriving: 12200, capacity: 30 },
    { time: '15:00', arriving: 22800, capacity: 58 },
    { time: '15:30', arriving: 18400, capacity: 81 },
    { time: '16:00', arriving: 6200, capacity: 89 },
    { time: 'Live Now', arriving: 2100, capacity: 94 },
  ];

  const ecoWasteDist = [
    { name: 'Organic Compostable', value: 5800, color: '#10B981' },
    { name: 'Recycled Aluminum/PET', value: 3400, color: '#3B82F6' },
    { name: 'Landfill Diverted', value: 1200, color: '#F59E0B' }
  ];

  const queueTimesData = [
    { name: 'Gate A (South)', wait: 8 },
    { name: 'Gate B (Transit)', wait: 24 },
    { name: 'Gate C (East)', wait: 11 },
    { name: 'Gate D (West)', wait: 6 }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-200 selection:text-slate-900 overflow-x-hidden pb-12">
      
      {/* Toast Notifications Panel */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className={`p-4 rounded-xl shadow-xl border flex items-start gap-3 transition-all transform translate-y-0 animate-in slide-in-from-top-4 duration-300 ${
              n.type === 'warning' 
                ? 'bg-amber-50 border-amber-200 text-amber-900' 
                : n.type === 'info'
                ? 'bg-blue-50 border-blue-200 text-blue-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            {n.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
            {n.type === 'info' && <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />}
            {n.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
            <div className="flex-1">
              <h4 className="font-bold text-sm">{n.title}</h4>
              <p className="text-xs text-slate-600 mt-1 leading-snug">{n.message}</p>
            </div>
            <button 
              onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Gemini API Configuration</h3>
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Configure your Gemini API Key to enable real-time live content generation (incident planning, text-to-speech broadcasts, image generation, and chat responses). 
              The key is saved locally in your browser's <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-[10px]">localStorage</code> and never sent to any external server other than Google's developer API.
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Gemini API Key</label>
                <div className="relative flex items-center">
                  <input
                    type={showKeyText ? "text" : "password"}
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-3.5 pr-10 text-xs focus:outline-none focus:border-emerald-600 text-slate-800 placeholder:text-slate-400 transition-colors shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyText(!showKeyText)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-[10px] leading-normal font-medium">
                  No API Key? No problem! The application runs completely in **Simulated Sandbox mode** by default, using local templates to mimic Gemini actions.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    localStorage.setItem('gemini_api_key', tempKey);
                    setGeminiApiKey(tempKey);
                    setShowSettings(false);
                    addNotification("API Key Saved", tempKey ? "Live Gemini integration activated!" : "Switched to Simulated Sandbox mode.", "success");
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm text-center"
                >
                  Save Configuration
                </button>
                {geminiApiKey && (
                  <button
                    onClick={() => {
                      localStorage.removeItem('gemini_api_key');
                      setTempKey('');
                      setGeminiApiKey('');
                      setShowSettings(false);
                      addNotification("API Key Cleared", "Reverted to Simulated Sandbox mode.", "info");
                    }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors border border-rose-200"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main App Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-600 text-white font-bold p-2.5 rounded-xl shadow-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">FIFA World Cup 2026</span>
                <button
                  onClick={() => setShowSettings(true)}
                  className={`text-[10px] border px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1 transition-all ${
                    geminiApiKey 
                      ? 'bg-emerald-500/10 border-emerald-250 text-emerald-700 hover:bg-emerald-500/20' 
                      : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${geminiApiKey ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                  {geminiApiKey ? 'Live GenAI Active' : 'Simulated AI Mode'}
                </button>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                ArenaAI <span className="text-emerald-600 font-light font-sans">Command & Fan Center</span>
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-slate-105 p-2 rounded-xl border border-slate-200/80">
            <span className="text-xs text-slate-600 px-2 font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Active Arena:
            </span>
            <select 
              value={selectedVenue.id}
              onChange={(e) => handleVenueChange(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg text-xs py-1.5 px-3 focus:outline-none focus:border-emerald-600 text-slate-800 transition-colors cursor-pointer shadow-sm font-semibold"
            >
              {VENUES.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <div className="hidden sm:flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs shadow-sm">
              <span className="font-semibold text-slate-500">Match Context:</span>
              <span className="text-emerald-700 font-bold">{currentMatch}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end lg:self-auto">
            <button
              onClick={() => setShowSettings(true)}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm border-b-2 active:translate-y-0.5 active:border-b"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Settings</span>
            </button>
            
            <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <div className="text-right">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Simulation Clock</p>
                <p className="text-xs font-mono font-bold text-emerald-700 tracking-wider">{currentTimeString}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Interactive Collapsible Instruction Manual */}
      <div className="max-w-7xl w-full mx-auto px-6 mt-6">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <button 
            onClick={() => setShowGuide(!showGuide)}
            className="w-full px-6 py-4 bg-emerald-50/20 hover:bg-emerald-50/40 flex items-center justify-between text-left transition-colors border-b border-slate-100"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">How to Use This System</h3>
                <p className="text-xs text-slate-500 mt-0.5">Explore the operational co-pilot, visual heatmap telemetry, and fan companion portal</p>
              </div>
            </div>
            {showGuide ? <ChevronUp className="w-5 h-5 text-emerald-600" /> : <ChevronDown className="w-5 h-5 text-emerald-600" />}
          </button>
          
          {showGuide && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white animate-in slide-in-from-top-2 duration-300">
              <div className="space-y-3">
                <h4 className="font-bold text-emerald-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" /> 1. Operations Command Hub
                </h4>
                <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5">
                  <li><strong>Run AI tactical simulations:</strong> Select one of the preset alerts (e.g. <em>Gate B Bottleneck</em>) or type a custom scenario in the input box, then press <strong>Run AI</strong>.</li>
                  <li><strong>Synthesize Multilingual PA Broadcasts:</strong> Once the AI generates a response, review the bilingual text and click <strong>Synthesize Broadcast</strong> to hear the voice announcement synthesized via Gemini.</li>
                  <li><strong>Diagnose the Map:</strong> Click on the live sectors of the interactive stadium heatmap blueprint on the left to review automated status telemetry.</li>
                </ul>
              </div>

              <div className="space-y-3 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6">
                <h4 className="font-bold text-emerald-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4" /> 2. Fan Companion App Simulator
                </h4>
                <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5">
                  <li><strong>Switch View:</strong> Tap the "Fan Experience Portal" tab in the sub-header navigation below.</li>
                  <li><strong>Interactive Chatbot:</strong> Ask the AI Assistant concierge about seating directions, transport routes, or rule translation in the virtual smartphone.</li>
                  <li><strong>Filter Accessibility Paths:</strong> Tap the <strong>Accessible</strong> option on the phone screen to turn on dynamic wheelchair-friendly pathway guides.</li>
                  <li><strong>Pre-order Green Foods:</strong> Go to the <strong>Eco Food</strong> tab and pre-order to view the carbon footprint math.</li>
                  <li><strong>Souvenirs:</strong> Tap the <strong>AI Badge</strong> generator inside the phone to design and save circular digital World Cup badges.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subheader view selector navigation */}
      <nav className="bg-white border-b border-slate-200 py-2 sticky top-[81px] z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center sm:justify-between items-center gap-3">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setActiveTab('ops')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                activeTab === 'ops' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Cpu className="w-4 h-4" /> Operational Intelligence Dashboard
            </button>
            <button
              onClick={() => setActiveTab('fan')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                activeTab === 'fan' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-4 h-4" /> Fan Experience Companion
            </button>
          </div>
          
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            <Globe className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span className="font-semibold text-[11px] tracking-wide">Multi-modal GenAI Playground</span>
          </div>
        </div>
      </nav>

      {/* Main Core View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">

        {/* Operational Intelligence Portal View */}
        {activeTab === 'ops' && (
          <div className="space-y-6 animate-in fade-in duration-300">

            {/* Quick Status Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-white to-emerald-50/30 border border-emerald-100/70 rounded-2xl p-5 flex items-center justify-between shadow-sm transition-all hover:border-emerald-300 hover:shadow-md">
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Total Ingress</p>
                  <p className="text-2xl font-black text-slate-800 font-mono tracking-tight">
                    {Math.floor(selectedVenue.capacity * (crowdCapacityPercent/100)).toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{crowdCapacityPercent}% capacity occupied</span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-white to-amber-50/30 border border-amber-100/70 rounded-2xl p-5 flex items-center justify-between shadow-sm transition-all hover:border-amber-300 hover:shadow-md">
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Avg Queue Delays</p>
                  <p className="text-2xl font-black text-slate-800 font-mono tracking-tight">{averageWaitTime} mins</p>
                  <div className="flex items-center gap-1 text-xs text-amber-700 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Dynamic gate adjustments active</span>
                  </div>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                  <MapPin className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-white to-teal-50/30 border border-teal-100/70 rounded-2xl p-5 flex items-center justify-between shadow-sm transition-all hover:border-teal-300 hover:shadow-md">
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Eco Diversion Index</p>
                  <p className="text-2xl font-black text-emerald-700 font-mono tracking-tight">{sustainabilityIndex}%</p>
                  <div className="flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                    <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Compost program on track</span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                  <Leaf className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-white to-red-50/30 border border-red-100/70 rounded-2xl p-5 flex items-center justify-between shadow-sm transition-all hover:border-red-300 hover:shadow-md">
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Field Incidents</p>
                  <p className="text-2xl font-black text-red-600 font-mono tracking-tight">{activeAlertCount}</p>
                  <div className="flex items-center gap-1 text-xs text-red-600 font-semibold">
                    <Shield className="w-3.5 h-3.5" />
                    <span>All units dispatched</span>
                  </div>
                </div>
                <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Interactive Vector Stadium Blueprint */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                      <Layers className="w-4 h-4 text-emerald-600" /> Interactive Crowd Flow Map
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Select a sector to run sensor diagnostics & dispatch tactical staff support</p>
                  </div>
                  <span className="text-[10px] bg-slate-50 border border-slate-200 text-slate-700 font-mono px-3 py-1 rounded-lg">
                    {selectedMapSector}
                  </span>
                </div>

                {/* SVG Visual Stadium Map Grid */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 relative overflow-hidden aspect-[16/10] flex items-center justify-center">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
                  
                  <svg viewBox="0 0 800 480" className="w-full h-full max-w-2xl select-none" style={{ cursor: 'crosshair' }}>
                    {/* Security Perimeter */}
                    <rect x="10" y="10" width="780" height="460" rx="20" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 4" />
                    
                    {/* Stadium Outer Ring (Concourses) */}
                    <path d="M 220 120 A 240 180 0 1 1 580 120 A 240 180 0 1 1 220 120" fill="none" stroke="#e2e8f0" strokeWidth="38" />
                    
                    {/* Central Football Field Pitch */}
                    <rect x="280" y="160" width="240" height="160" rx="8" fill="#f0fdf4" stroke="#10b981" strokeWidth="2" strokeOpacity="0.5" />
                    <line x1="400" y1="160" x2="400" y2="320" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.4" />
                    <circle cx="400" cy="240" r="30" fill="none" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.4" />

                    {/* Live Heatmap hotspots labels */}
                    <text x="560" y="130" fill="#991b1b" fontSize="11" fontWeight="bold" letterSpacing="0.05em" className="pointer-events-none">SECTOR 4 BOTTLENECK</text>
                    <text x="240" y="380" fill="#065f46" fontSize="10" letterSpacing="0.05em" opacity="0.8" className="pointer-events-none">CLEAN SECTOR 102</text>

                    {/* Colored Concourse Sectors representing simulated crowd density */}
                    {/* North-East Zone */}
                    <g className="cursor-pointer group" onClick={() => {
                      setSelectedMapSector("North-East Outer Concourse (High Density)");
                      addNotification("Alert Generated", "Critical congestion bottleneck near food concessions.", "warning");
                    }}>
                      <path d="M 400 30 A 210 150 0 0 1 610 180" fill="none" stroke="transparent" strokeWidth="50" style={{ pointerEvents: 'stroke' }} />
                      <path d="M 400 30 A 210 150 0 0 1 610 180" fill="none" stroke="#f87171" strokeWidth="14" strokeLinecap="round" className="transition-colors group-hover:stroke-red-500 pointer-events-none" />
                    </g>
                    
                    {/* South-East Zone */}
                    <g className="cursor-pointer group" onClick={() => {
                      setSelectedMapSector("South-East Concourse (Clear)");
                      addNotification("Diagnostic Checked", "Zone C-102 flows are regular.", "success");
                    }}>
                      <path d="M 610 300 A 210 150 0 0 1 400 450" fill="none" stroke="transparent" strokeWidth="50" style={{ pointerEvents: 'stroke' }} />
                      <path d="M 610 300 A 210 150 0 0 1 400 450" fill="none" stroke="#34d399" strokeWidth="14" strokeLinecap="round" className="transition-colors group-hover:stroke-emerald-500 pointer-events-none" />
                    </g>
                    
                    {/* West Zone */}
                    <g className="cursor-pointer group" onClick={() => {
                      setSelectedMapSector("West Concourse Area (Moderate Crowd)");
                      addNotification("Observation Active", "Minor queue buildup detected near escalators.", "info");
                    }}>
                      <path d="M 190 180 A 210 150 0 0 1 190 300" fill="none" stroke="transparent" strokeWidth="50" style={{ pointerEvents: 'stroke' }} />
                      <path d="M 190 180 A 210 150 0 0 1 190 300" fill="none" stroke="#fbbf24" strokeWidth="14" strokeLinecap="round" className="transition-colors group-hover:stroke-amber-500 pointer-events-none" />
                    </g>

                    {/* Gate Entrance Indicators */}
                    {/* Gate A */}
                    <g transform="translate(400, 30)" className="cursor-pointer group" onClick={() => {
                      setSelectedMapSector("Gate A Entrance Area (South)");
                      addNotification("Diagnostic Checked", "Gate A sensors normal. Flowing efficiently.", "success");
                    }}>
                      <circle r="40" fill="transparent" style={{ pointerEvents: 'all' }} />
                      <circle r="22" fill="#10b981" fillOpacity="0.08" stroke="#10b981" strokeWidth="1.5" className="transition-all group-hover:fill-opacity-20 pointer-events-none" />
                      <circle r="5" fill="#10b981" className="pointer-events-none" />
                      <text y="-28" fill="#475569" fontSize="10" fontWeight="bold" textAnchor="middle" className="pointer-events-none">GATE A</text>
                    </g>
                    
                    {/* Gate B */}
                    <g transform="translate(740, 240)" className="cursor-pointer group" onClick={() => {
                      setSelectedMapSector("Gate B Transit Terminal (East)");
                      addNotification("Warning Detected", "Gate B is experiencing high-heat congestion.", "warning");
                    }}>
                      <circle r="40" fill="transparent" style={{ pointerEvents: 'all' }} />
                      <circle r="22" fill="#ef4444" fillOpacity="0.12" stroke="#ef4444" strokeWidth="1.5" className="animate-pulse pointer-events-none" />
                      <circle r="5" fill="#ef4444" className="pointer-events-none" />
                      <text y="-28" fill="#b91c1c" fontSize="10" fontWeight="bold" textAnchor="middle" className="pointer-events-none">GATE B (Transit)</text>
                    </g>
                    
                    {/* Gate C */}
                    <g transform="translate(400, 450)" className="cursor-pointer group" onClick={() => {
                      setSelectedMapSector("Gate C Area (North)");
                      addNotification("Diagnostic Checked", "Gate C scanning limits normal.", "success");
                    }}>
                      <circle r="40" fill="transparent" style={{ pointerEvents: 'all' }} />
                      <circle r="22" fill="#f59e0b" fillOpacity="0.08" stroke="#f59e0b" strokeWidth="1.5" className="transition-all group-hover:fill-opacity-20 pointer-events-none" />
                      <circle r="5" fill="#f59e0b" className="pointer-events-none" />
                      <text y="35" fill="#475569" fontSize="10" fontWeight="bold" textAnchor="middle" className="pointer-events-none">GATE C</text>
                    </g>
                    
                    {/* Gate D */}
                    <g transform="translate(60, 240)" className="cursor-pointer group" onClick={() => {
                      setSelectedMapSector("Gate D Parking (West)");
                      addNotification("Diagnostic Checked", "Gate D transport links running smoothly.", "success");
                    }}>
                      <circle r="40" fill="transparent" style={{ pointerEvents: 'all' }} />
                      <circle r="22" fill="#10b981" fillOpacity="0.08" stroke="#10b981" strokeWidth="1.5" className="transition-all group-hover:fill-opacity-20 pointer-events-none" />
                      <circle r="5" fill="#10b981" className="pointer-events-none" />
                      <text y="-28" fill="#475569" fontSize="10" fontWeight="bold" textAnchor="middle" className="pointer-events-none">GATE D</text>
                    </g>
                  </svg>
                </div>

                {/* Simulated live telemetry notifications */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0 animate-pulse"></span>
                    <div>
                      <p className="font-bold text-slate-800">Interactive Display Panels</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Dynamic signs rerouting east-bound traffic to Exit Corridor C-4.</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 flex-shrink-0"></span>
                    <div>
                      <p className="font-bold text-slate-800">Eco-Bin Sensor Framework</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">94.3% sorting compliance achieved across all concourses.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel: Incident Dispatch & TTS Voice Assistant */}
              <div className="lg:col-span-5 flex flex-col gap-5">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex-1 flex flex-col gap-4">
                  <div>
                    <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-emerald-600" /> AI Tactical Co-Pilot
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Deploy instantaneous operational strategies for crowd and transit alerts</p>
                  </div>

                  {/* Preset Quick-Trigger Buttons */}
                  <div className="space-y-2.5">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Predefined Incident Scenarios:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {PRESET_INCIDENTS.map((inc, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setCustomIncident(inc.description);
                            triggerGeminiOpsCall(inc.description);
                          }}
                          className="flex items-start text-left bg-slate-50 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 p-3 rounded-xl transition-all duration-300 group shadow-sm border-b-2 active:translate-y-0.5 active:border-b"
                        >
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{inc.title}</span>
                              <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200/50">{inc.category}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1 leading-snug">{inc.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual Scenario Input */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Or customize live incident log:</p>
                    <div className="flex gap-2">
                      <textarea
                        value={customIncident}
                        onChange={(e) => setCustomIncident(e.target.value)}
                        placeholder="e.g., Gate C ticket printer jam causing delays in section 104..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-600 text-slate-800 resize-none h-20 placeholder:text-slate-400 transition-colors shadow-inner"
                      />
                      <button
                        onClick={() => triggerGeminiOpsCall(customIncident)}
                        disabled={isAiLoading || !customIncident.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 text-white rounded-xl px-4 flex flex-col items-center justify-center gap-1 font-bold text-xs transition-all self-end h-20 w-24 shrink-0 shadow-sm border-b-2 border-emerald-750 active:translate-y-0.5 active:border-b"
                      >
                        {isAiLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
                        ) : (
                          <>
                            <Send className="w-4 h-4 text-white" />
                            <span>Run AI</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Tactical Generative Dispatch Panel Output */}
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 min-h-[220px] shadow-inner">
                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Live Decision Output</span>
                      </div>
                      {isAiLoading && (
                        <span className="text-[10px] text-emerald-700 font-mono animate-pulse">Processing tactical matrices...</span>
                      )}
                    </div>

                    <div className="space-y-3.5 overflow-y-auto max-h-[240px] text-xs pr-1">
                      <div>
                        <p className="font-bold text-slate-800 text-sm mb-1.5">{aiDispatches.title}</p>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-line bg-white p-3 rounded-lg border border-slate-200">
                          {aiDispatches.plan}
                        </p>
                      </div>

                      {/* Multilingual Voice Synth Feature Block */}
                      {aiDispatches.bilingualPA && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-emerald-800 text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                                <Volume2 className="w-3.5 h-3.5" /> PA Broadcast script
                              </p>
                              <p className="text-slate-700 font-sans italic text-[11px] leading-relaxed mt-1">
                                "{aiDispatches.bilingualPA}"
                              </p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-emerald-200/50 flex flex-wrap gap-2 items-center justify-between">
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                              <span>Voice Profile:</span>
                              <select 
                                value={ttsVoice} 
                                onChange={(e) => setTtsVoice(e.target.value)}
                                className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 text-[10px] focus:outline-none"
                              >
                                <option value="Zephyr">Zephyr (Bright)</option>
                                <option value="Kore">Kore (Firm)</option>
                                <option value="Puck">Puck (Upbeat)</option>
                                <option value="Fenrir">Fenrir (Excitable)</option>
                              </select>
                            </div>

                            <button
                              onClick={handleGenerateTts}
                              disabled={isTtsLoading}
                              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold px-3 py-1 rounded text-[10px] flex items-center gap-1.5 shadow-sm"
                            >
                              {isTtsLoading ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  <span>Generating...</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3 h-3" />
                                  <span>Synthesize Broadcast</span>
                                </>
                              )}
                            </button>
                          </div>

                          {audioUrl && (
                            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                              <audio ref={audioRef} src={audioUrl} controls className="w-full h-8 outline-none" />
                            </div>
                          )}
                        </div>
                      )}

                      {aiDispatches.allocations.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">Dynamic Systems Dispatch Matrix:</p>
                          {aiDispatches.allocations.map((alloc, i) => (
                            <div key={i} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200 gap-3 shadow-xs">
                              <span className="font-bold text-emerald-800 text-[10px] uppercase tracking-wider shrink-0">{alloc.team}</span>
                              <span className="text-slate-600 text-[11px] text-right max-w-[200px] line-clamp-2 leading-tight">{alloc.task}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Concourse & Gate Waiting Times */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-amber-500" /> Queue Wait times (Mins)
                  </h3>
                  <span className="text-[9px] bg-slate-105 text-slate-650 font-mono px-2 py-0.5 rounded-md border border-slate-200">Realtime</span>
                </div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={queueTimesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', borderRadius: '12px', fontSize: '11px' }} />
                      <Bar dataKey="wait" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                        {queueTimesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.wait > 15 ? '#ef4444' : '#10b981'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal italic">
                  Transit hub line bottlenecks are updating as shuttle fleets adjust arrival rates.
                </p>
              </div>

              {/* Dynamic Gate Arrival Flows */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-600" /> Hourly Arrival Inflow
                  </h3>
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 font-mono px-2 py-0.5 rounded-md">Dynamic</span>
                </div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={crowdArrivalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', borderRadius: '12px', fontSize: '11px' }} />
                      <Area type="monotone" dataKey="arriving" stroke="#10b981" fill="#10b981" fillOpacity={0.08} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Arrival patterns peaked successfully at 15:00. High turnstile load cleared dynamically.
                </p>
              </div>

              {/* Zero Waste Sustainability Allocation */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Leaf className="w-4 h-4 text-emerald-600" /> Food Waste Sorting (KG)
                  </h3>
                  <span className="text-[9px] bg-slate-105 text-slate-650 font-mono px-2 py-0.5 rounded-md border border-slate-200">Compost</span>
                </div>
                <div className="flex items-center justify-between h-44">
                  <div className="w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ecoWasteDist}
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={56}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {ecoWasteDist.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-1/2 flex flex-col gap-2.5">
                    {ecoWasteDist.map((w, idx) => (
                      <div key={idx} className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{w.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: w.color }}></span>
                          <span className="font-mono text-xs font-bold text-slate-755">{w.value.toLocaleString()} kg</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Match organic compost metrics currently tracking 14% higher than regional baseline values.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* Fan Experience Portal View */}
        {activeTab === 'fan' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto items-start animate-in fade-in duration-300">
            
            {/* Descriptive Left Intro Panel */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">GenAI Fan Companion App</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 leading-tight">
                  Smart Navigation & Wallet Souvenirs
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Provide tournament spectators with direct wayfinding, sustainable concession tracks, custom souvenir generation, and real-time multilingual helper tools.
                </p>
                
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-start gap-3">
                    <Accessibility className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Dynamic Accessibility Routes</p>
                      <p className="text-[11px] text-slate-500 leading-normal mt-0.5">Filter path options to show wheelchair elevators near Sec 112, keeping navigation seamless and dignified.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Image className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">AI Green Badge Generator</p>
                      <p className="text-[11px] text-slate-500 leading-normal mt-0.5">Use the "AI Badge" portal inside the smartphone companion to design custom digital climate cards of the match.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Multilingual Translation Assistant</p>
                      <p className="text-[11px] text-slate-500 leading-normal mt-0.5 font-sans">Leverage the AI Concierge to translate signage, tickets, or transport directives into multiple global languages.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Active Shuttle Status</p>
                    <p className="text-xs font-bold text-emerald-700">MetLife Transit Express Hub</p>
                    <p className="text-[11px] text-slate-500">Buses active every 3 mins with clear wheelchair ramps.</p>
                  </div>
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                    <Bus className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Smartphone Simulator */}
            <div className="lg:col-span-7 flex justify-center w-full">
              <div className="w-full max-w-[420px] bg-slate-100 rounded-[46px] p-3 border-[6px] border-slate-350 shadow-2xl relative overflow-hidden flex flex-col h-[750px] max-h-[85vh]">
                
                {/* Mobile Camera notch indicator (Dynamic Island) */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-full z-50 flex items-center justify-between px-3 border border-slate-800/20">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-800"></span>
                  <div className="w-10 h-1 bg-slate-800 rounded-full"></div>
                  <span className="text-[8px] text-emerald-400 font-mono tracking-tighter">Live ●</span>
                </div>

                {/* Simulated Screen Inner Content */}
                <div className="flex-1 rounded-[38px] bg-white border border-slate-200 overflow-y-auto flex flex-col text-xs pt-8 relative pb-2 select-none">
                  
                  {/* Emulator Header Status Bar */}
                  <div className="px-5 py-2 flex justify-between items-center text-[10px] text-slate-500 font-semibold uppercase tracking-wider bg-slate-50 border-b border-slate-200/50">
                    <span>Arena Companion</span>
                    <span className="text-emerald-700 flex items-center gap-1 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      MetLife Local
                    </span>
                  </div>

                  {/* Mobile Screen Navigation Tabs */}
                  <div className="grid grid-cols-4 gap-1 p-2 bg-slate-50 border-b border-slate-200">
                    <button onClick={() => setSelectedConcession(null)} className={`flex flex-col items-center gap-1.5 py-1 transition-colors ${selectedConcession === null ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-750'}`}>
                      <Compass className="w-4 h-4" />
                      <span className="text-[8px] font-bold tracking-wider">Home</span>
                    </button>
                    <button onClick={() => {
                      setSelectedAccessibility(!selectedAccessibility);
                      addNotification("Accessibility Assist toggled", selectedAccessibility ? "Accessible pathways disabled" : "Navigating via elevator networks enabled", "info");
                    }} className={`flex flex-col items-center gap-1.5 py-1 transition-colors ${selectedAccessibility ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-750'}`}>
                      <Accessibility className="w-4 h-4" />
                      <span className="text-[8px] font-bold tracking-wider">Accessible</span>
                    </button>
                    <button onClick={() => setSelectedConcession('menu')} className={`flex flex-col items-center gap-1.5 py-1 transition-colors ${selectedConcession === 'menu' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-750'}`}>
                      <Utensils className="w-4 h-4" />
                      <span className="text-[8px] font-bold tracking-wider">Eco Food</span>
                    </button>
                    <button onClick={() => setSelectedConcession('badge')} className={`flex flex-col items-center gap-1.5 py-1 transition-colors ${selectedConcession === 'badge' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-750'}`}>
                      <QrCode className="w-4 h-4" />
                      <span className="text-[8px] font-bold tracking-wider">AI Badge</span>
                    </button>
                  </div>

                  {/* Main Emulator Internal View Switcher */}
                  <div className="flex-1 p-3.5 flex flex-col gap-3.5 overflow-y-auto bg-white">
                    
                    {/* ACCESSIBLE ASSIST FLOATING NOTICE */}
                    {selectedAccessibility && (
                      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-start gap-2.5 animate-in fade-in zoom-in-95 duration-200">
                        <Accessibility className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5 animate-bounce" />
                        <div>
                          <p className="font-bold text-slate-800 text-[10px]">Accessible Assist On</p>
                          <p className="text-[9px] text-slate-600 leading-normal mt-0.5">Routing prioritizing Section 112 lift, visual wayfinding signs, and reduced-congestion zones.</p>
                        </div>
                      </div>
                    )}

                    {/* Standard Guide Home view */}
                    {selectedConcession === null && (
                      <div className="space-y-3.5 animate-in fade-in duration-200">
                        
                        {/* Dynamic Interactive Ticket Visualizer */}
                        <div className="bg-gradient-to-br from-slate-50 to-emerald-50/50 border border-emerald-200 rounded-2xl p-4 flex justify-between items-center relative overflow-hidden shadow-sm">
                          <div className="space-y-1.5 z-10">
                            <span className="text-[8px] uppercase tracking-widest text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-250">Admission Ticket</span>
                            <p className="text-sm font-extrabold text-slate-900 leading-tight">{currentMatch}</p>
                            <div className="flex gap-4 text-[10px] text-slate-600 font-mono pt-1">
                              <div>
                                <p className="text-[8px] text-slate-400 font-sans font-bold">SEC</p>
                                <p className="font-bold text-slate-800">104</p>
                              </div>
                              <div>
                                <p className="text-[8px] text-slate-400 font-sans font-bold">ROW</p>
                                <p className="font-bold text-slate-800">12</p>
                              </div>
                              <div>
                                <p className="text-[8px] text-slate-400 font-sans font-bold">SEAT</p>
                                <p className="font-bold text-slate-800">4</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-center gap-1 z-10 shrink-0">
                            <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                              <QrCode className="w-10 h-10 text-slate-800" />
                            </div>
                            <span className="text-[7px] text-slate-500 font-mono uppercase tracking-wider">Pass Active</span>
                          </div>
                        </div>

                        {/* Interactive live directions advice */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                          <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                            <p className="font-bold text-slate-800 text-[10px]">Suggested Entryway</p>
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded-full">Gate D (Clearest)</span>
                          </div>
                          <div className="space-y-1.5 text-[10px]">
                            <div className="flex items-center gap-2">
                              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-slate-600">From Gate D: Proceed through Corridor B-2.</span>
                            </div>
                            <div className="flex items-center gap-2 text-amber-700">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              <span className="text-slate-600">Sector 4 Concourse is experiencing heavy flow.</span>
                            </div>
                          </div>
                        </div>

                        {/* Multilingual AI Chat Interface */}
                        <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex flex-col h-[300px] shrink-0">
                          <div className="bg-slate-100 border-b border-slate-200 px-3.5 py-2 flex items-center justify-between shrink-0">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> ArenaAI Assistant
                            </span>
                            <span className="text-[8px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono uppercase font-bold tracking-wider border border-emerald-250">Interactive</span>
                          </div>

                          <div className="flex-1 p-3 overflow-y-auto space-y-2 flex flex-col bg-white overscroll-contain">
                            {chatMessages.map((msg, i) => (
                              <div
                                key={i}
                                className={`max-w-[90%] rounded-xl p-2.5 flex flex-col gap-0.5 ${
                                  msg.sender === 'user'
                                    ? 'bg-emerald-600 text-white font-bold self-end rounded-tr-none shadow-sm'
                                    : 'bg-slate-100 text-slate-800 border border-slate-200 self-start rounded-tl-none'
                                }`}
                              >
                                <p className="text-[10px] leading-relaxed break-words">{msg.text}</p>
                                <span className={`text-[7px] self-end mt-0.5 ${msg.sender === 'user' ? 'text-emerald-100/80' : 'text-slate-400'}`}>
                                  {msg.timestamp}
                                </span>
                              </div>
                            ))}
                            {isFanAiLoading && (
                              <div className="bg-slate-50 text-slate-500 border border-slate-200 self-start rounded-xl p-2.5 rounded-tl-none flex items-center gap-1.5 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                <span className="text-[9px]">Analyzing query context...</span>
                              </div>
                            )}
                            <div ref={chatEndRef} />
                          </div>

                          {/* Quick seed suggestions for fan */}
                          <div className="px-2 py-1.5 bg-slate-50 border-t border-slate-200 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none shrink-0">
                            <button 
                              onClick={() => {
                                setChatInput("Where is section 104 ADA lift?");
                                triggerGeminiFanChat("Where is section 104 ADA lift?");
                              }}
                              className="bg-white border border-slate-200 text-slate-650 hover:text-slate-900 px-2 py-1 rounded-md text-[9px] transition-colors shadow-sm"
                            >
                              ♿ Sector 104 ADA Lift?
                            </button>
                            <button 
                              onClick={() => {
                                setChatInput("Traduzca 'Main Exit' al español");
                                triggerGeminiFanChat("Traduzca 'Main Exit' al español");
                              }}
                              className="bg-white border border-slate-200 text-slate-650 hover:text-slate-900 px-2 py-1 rounded-md text-[9px] transition-colors shadow-sm"
                            >
                              🌐 Spanish sign translation
                            </button>
                            <button 
                              onClick={() => {
                                setChatInput("Where can I find sustainable foods?");
                                triggerGeminiFanChat("Where can I find sustainable foods?");
                              }}
                              className="bg-white border border-slate-200 text-slate-655 hover:text-slate-900 px-2 py-1 rounded-md text-[9px] transition-colors shadow-sm"
                            >
                              🌱 Plant-based eats?
                            </button>
                          </div>

                          <form onSubmit={handleSendChat} className="bg-slate-50 p-2 border-t border-slate-200 flex gap-1.5">
                            <input
                              type="text"
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              placeholder="Ask ArenaAI..."
                              className="flex-1 bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-[10px] focus:outline-none focus:border-emerald-600 text-slate-800 placeholder:text-slate-400 transition-colors shadow-sm"
                            />
                            <button
                              type="submit"
                              disabled={isFanAiLoading || !chatInput.trim()}
                              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-lg p-1.5 flex items-center justify-center transition-colors shrink-0 shadow-sm"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        </div>

                      </div>
                    )}

                    {/* Eco-friendly Concession Menu view */}
                    {selectedConcession === 'menu' && (
                      <div className="space-y-3.5 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Leaf className="w-4 h-4 text-emerald-600" /> Sustainable Concessions
                          </h3>
                          <button onClick={() => setSelectedConcession(null)} className="text-[10px] uppercase font-extrabold text-emerald-600 hover:underline">
                            Back
                          </button>
                        </div>
                        
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Order food items certified under the FIFA World Cup climate stewardship standards.
                        </p>

                        <div className="space-y-2.5">
                          {ECO_CONCESSIONS.map((item) => (
                            <div key={item.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex justify-between items-start gap-2 hover:border-slate-350 transition-colors shadow-sm">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-800">{item.name}</span>
                                  <span className="text-[8px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold border border-emerald-100">{item.ecoScore} Eco</span>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-normal">{item.description}</p>
                                <p className="text-[9px] text-emerald-700 font-mono tracking-wide mt-0.5">Footprint impact: {item.co2}</p>
                              </div>
                              <div className="text-right flex flex-col gap-2 items-end shrink-0">
                                <span className="font-bold text-slate-800 font-mono">{item.price}</span>
                                <button
                                  onClick={() => {
                                    addNotification(
                                      "Concession Order Received", 
                                      `${item.name} pre-ordered successfully! Proceed directly to express checkout Section 104. Pick-up window: 3 mins.`, 
                                      "success"
                                    );
                                    setSustainabilityIndex(prev => Math.min(prev + 1, 100));
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded font-bold text-[9px] transition-colors shadow-sm"
                                >
                                  Order
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-start gap-2 mt-2">
                          <Leaf className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <p className="text-[9px] text-slate-500 leading-normal">
                            Selecting items rated <strong className="text-slate-800">A/A+</strong> awards tournament carbon offset badges instantly to your mobile ticket pass.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* AI Souvenir Badge Generator View */}
                    {selectedConcession === 'badge' && (
                      <div className="space-y-3.5 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-emerald-600" /> AI Souvenir Badge
                          </h3>
                          <button onClick={() => setSelectedConcession(null)} className="text-[10px] uppercase font-extrabold text-emerald-600 hover:underline">
                            Back
                          </button>
                        </div>
                        
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Input an imaginative prompt to craft a custom, digital souvenir badge celebrating your stadium arrival.
                        </p>

                        <form onSubmit={handleGenerateBadge} className="space-y-2">
                          <label className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Describe your Badge Design:</label>
                          <textarea
                            value={badgePrompt}
                            onChange={(e) => setBadgePrompt(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-55 border border-slate-200 rounded-xl p-2.5 text-[11px] text-slate-800 focus:outline-none focus:border-emerald-600 resize-none shadow-inner"
                            placeholder="e.g. A robotic eagle cleaning plastic bottles at Sofi Stadium, futuristic..."
                          />

                          <button
                            type="submit"
                            disabled={isBadgeLoading || !badgePrompt.trim()}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                          >
                            {isBadgeLoading ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                                <span>Generating Badge...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                <span>Craft Souvenir Token</span>
                              </>
                            )}
                          </button>
                        </form>

                        {/* Image Output Display */}
                        <div className="bg-slate-50 rounded-2xl border border-slate-200 aspect-square flex flex-col items-center justify-center p-4 overflow-hidden relative">
                          {isBadgeLoading && (
                            <div className="flex flex-col items-center gap-2 text-slate-400 text-[10px] animate-pulse">
                              <Sparkles className="w-8 h-8 text-emerald-600 animate-spin" />
                              <span>Rendering visual dimensions...</span>
                            </div>
                          )}

                          {!isBadgeLoading && !generatedBadgeUrl && (
                            <div className="text-center text-slate-400 text-[10px] flex flex-col items-center gap-2">
                              <Image className="w-10 h-10 stroke-[1.5]" />
                              <span>Your generated souvenir token will appear here.</span>
                            </div>
                          )}

                          {!isBadgeLoading && generatedBadgeUrl && (
                            <div className="w-full h-full flex flex-col items-center gap-2 animate-in zoom-in-95 duration-300 bg-white p-2.5 rounded-xl border border-slate-200">
                              <img src={generatedBadgeUrl} alt="AI World Cup Badge" className="w-44 h-44 rounded-full border-4 border-emerald-500 shadow-sm object-cover" />
                              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full mt-1 border border-emerald-100">Verified Souvenir Badge</span>
                              
                              <a 
                                href={generatedBadgeUrl} 
                                download="FIFA26-Souvenir-Badge.png"
                                className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors mt-1"
                              >
                                <Download className="w-3.5 h-3.5" /> Save to Device
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Simulated Mobile Bottom navigation bar */}
                  <div className="pt-2 px-5 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 bg-slate-50">
                    <span className="text-[8px] font-mono text-emerald-600 font-bold">Secure Sync Active</span>
                    <div className="w-20 h-1 bg-slate-300 rounded-full my-1.5 self-center"></div>
                    <span className="text-[8px] font-mono">5G 100%</span>
                  </div>

                </div>

              </div>
            </div>

          </div>
        )}

      </main>

      {/* Dynamic footer detailing integration & challenge features */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-12 text-slate-400 text-xs text-center md:text-left">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-slate-600 font-bold">FIFA World Cup 2026 Smart Stadiums Companion</p>
            <p className="text-[11px] text-slate-400">
              Developed for Challenge 4 (Stadium Operations & Tournament Sustainability). Integrated with Gemini LLM, Image, and TTS APIs.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-[11px] font-medium text-slate-400">
            <span className="font-bold">Stadium Intelligence</span>
            <span>•</span>
            <span className="font-bold">Multilingual Speech Synthesis</span>
            <span>•</span>
            <span className="font-bold">AI Souvenir Generators</span>
          </div>
        </div>
      </footer>

    </div>
  );
}