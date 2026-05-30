import React, { useState, useEffect, useRef, FormEvent } from "react";
import { Play, Volume2, Mic, CheckCircle, RefreshCcw, Sparkles, ChevronRight, HelpCircle, Send, Radio, MessageSquare, VolumeX } from "lucide-react";
import { MakeupLookTutorial } from "../types";

const MAKEUP_PLAYLISTS: MakeupLookTutorial[] = [
  {
    id: "playlist_1",
    name: "Hollywood Classic Glam",
    difficulty: "Intermediate",
    description: "Symmetrical precision contour framing with velvet matte red pigments and hyper-sculpted temples.",
    shades: { foundation: "#c68e62", blush: "#c87884", highlighter: "#fbead2" },
    steps: [
      "Prep your face barrier with deep dewy hydration serum. Let set for 60 seconds.",
      "Draw custom cheekbone contour starting from the top ears down, tracing a vector matching the zygomatic hollow.",
      "Sweep a dusty orchid blush precisely across the high apples of your cheek, blending upwards into your temple hair lines.",
      "Dab ice champagne highlight pigments directly along the bridge of your nose and cheek bones to draw natural lighting refraction.",
      "Complete the luxury look with a rich matte crimson outline, shaping a symmetrical cupid's arch."
    ]
  },
  {
    id: "playlist_2",
    name: "No-Makeup Satin Daily",
    difficulty: "Beginner",
    description: "Satin skin glow mapping utilizing delicate highlighting points and soft cream pigments.",
    shades: { foundation: "#ebd1bc", blush: "#e090a2", highlighter: "#fcebf3" },
    steps: [
      "Blend foundation lightly with a wet blender outwards from the T-zone for sheer cover.",
      "Lightly touch your cheek cheeks with a warm peach contour line, keeping brush lines soft and natural.",
      "Dab minimal cream blush directly onto the laugh line cheeks and blend outwards.",
      "Stipple high opal highlights to the forehead center and chin points for a dew-glow finish."
    ]
  }
];

export default function VoiceGuide() {
  const [activeLook, setActiveLook] = useState<MakeupLookTutorial>(MAKEUP_PLAYLISTS[0]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [sttListening, setSttListening] = useState(false);
  const [vocalStatus, setVocalStatus] = useState("Sasha is ready to guide you step-by-step...");
  const [spokenTranscript, setSpokenTranscript] = useState<string>("");

  // Dialogue panel with Sasha AI
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "Hi! I'm Sasha, your top-of-the-line AI beauty guide. Ask me any question about cosmetic chemistry, foundation match points, or hands-free contouring tricks!" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Audio elements
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Stop sound if any is running
  const cancelAllVoices = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
    setVocalStatus("Voices stopped.");
  };

  // Speak text using high-fidelity Gemini TTS route or premium local browser synthesis
  const speakText = async (text: string) => {
    cancelAllVoices();
    setSpeaking(true);
    setVocalStatus("Sasha is speaking...");

    try {
      const response = await fetch("/api/gemini/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textToSpeak: text })
      });

      if (!response.ok) {
        throw new Error("TTS Route unavailable. Merging vocal backup synthesis.");
      }

      const data = await response.json();
      if (!data.audioBase64) throw new Error("Could not construct audio base64 payload");

      const audioUrl = `data:audio/wav;base64,${data.audioBase64}`;
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      audio.onended = () => {
        setSpeaking(false);
        setVocalStatus("Standby...");
      };
      await audio.play();

    } catch (err: any) {
      console.warn("Using high-fidelity Web Speech Synthesis local fallback.", err);
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        // Search for a beautiful premium feminine sounding voice
        const voices = window.speechSynthesis.getVoices();
        const idealVoice = voices.find(v => v.lang.includes("en") && (v.name.includes("Google US English") || v.name.includes("Feminine") || v.name.includes("Zira")));
        if (idealVoice) {
          utterance.voice = idealVoice;
        }
        utterance.pitch = 1.15; // Set bright feminine accent
        utterance.onend = () => {
          setSpeaking(false);
          setVocalStatus("Standby...");
        };
        utterance.onerror = () => {
          setSpeaking(false);
          setVocalStatus("Vocal synthesis ready.");
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setSpeaking(false);
        setVocalStatus("Audio synthesizer fallback unsupported in iframe container.");
      }
    }
  };

  const speakCurrentStep = () => {
    const text = `Step ${currentStepIndex + 1}: ${activeLook.steps[currentStepIndex]}`;
    speakText(text);
  };

  // Trigger step navigation handles
  const handleNextStep = () => {
    if (currentStepIndex < activeLook.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      speakText("Perfect! You've masterfully finished your entire contour sculpt. Let Sasha review your symmetry!");
      setVocalStatus("Tutorial routine finished!");
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // Real-time microphone listening via WebSpeech API
  const activateRealSTT = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVocalStatus("Speech capture not supported natively in this browser version. Triggering simulation fallback!");
      triggerSimulatedHandsFree();
      return;
    }

    if (sttListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setSttListening(false);
      return;
    }

    cancelAllVoices();
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setSttListening(true);
      setSpokenTranscript("");
      setVocalStatus("🎙️ Sasha is listening... Say 'Next', 'Back', or 'Repeat'");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSpokenTranscript(transcript);
      const cleanText = transcript.toLowerCase().trim();

      if (cleanText.includes("next") || cleanText.includes("continue") || cleanText.includes("forward")) {
        setVocalStatus(`🎤 Action triggered: "Next step"`);
        handleNextStep();
      } else if (cleanText.includes("back") || cleanText.includes("previous") || cleanText.includes("return")) {
        setVocalStatus(`🎤 Action triggered: "Back step"`);
        handlePrevStep();
      } else if (cleanText.includes("repeat") || cleanText.includes("say again") || cleanText.includes("read")) {
        setVocalStatus(`🎤 Action triggered: "Repeat step"`);
        speakCurrentStep();
      } else {
        setVocalStatus(`🎤 Heard: "${transcript}". Ask: Next, Back, or Repeat!`);
      }
    };

    recognition.onerror = (e: any) => {
      console.warn("SpeechRecognition reported error state:", e);
      setVocalStatus("Speech error: Retrying with simulated Hands-free controls...");
      setSttListening(false);
      triggerSimulatedHandsFree();
    };

    recognition.onend = () => {
      setSttListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error(e);
      setSttListening(false);
    }
  };

  // Simulated control fallback when hardware permissions block inside iframe
  const triggerSimulatedHandsFree = () => {
    setSttListening(true);
    setVocalStatus("🎤 Simulated mic active (Say 'Next', 'Repeat', or 'Back')");
    
    setTimeout(() => {
      const commands = ["Next", "Repeat", "Back"];
      const simulatedCmd = commands[Math.floor(Math.random() * commands.length)];
      setSttListening(false);
      
      if (simulatedCmd === "Next") {
        setVocalStatus("🎤 Simulated action: 'Next'");
        handleNextStep();
      } else if (simulatedCmd === "Repeat") {
        setVocalStatus("🎤 Simulated action: 'Repeat'");
        speakCurrentStep();
      } else {
        setVocalStatus("🎤 Simulated action: 'Back'");
        handlePrevStep();
      }
    }, 2500);
  };

  // Core chat with Sasha using server-side Gemini mind
  const handleSendChat = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatHistory(prev => [...prev, { role: "user", content: userMessage }]);
    setChatLoading(true);

    try {
      const response = await fetch("/api/gemini/ari-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...chatHistory.map(h => ({ role: h.role, content: h.content })),
            { role: "user", content: userMessage }
          ],
          userPreferences: {
            undertone: "Custom",
            texture: "Combination"
          }
        })
      });

      if (!response.ok) throw new Error("Sasha's smart mind is taking a refreshing aesthetic break!");
      
      const data = await response.json();
      const sashaReply = data.reply || "I am processing your beauty guidelines right now!";
      
      setChatHistory(prev => [...prev, { role: "assistant", content: sashaReply }]);
      
      // Instantly speak Sasha's reply aloud!
      // Take first 150 characters to keep speech swift and delightful
      const shortReply = sashaReply.split("\n")[0].substring(0, 155);
      speakText(shortReply);

    } catch (err: any) {
      console.error(err);
      setChatHistory(prev => [...prev, {
        role: "assistant",
        content: "Oops doll! My server-side connection drifted, but remember: clean blush templates are brushed with high apples, while bronzers carve structural lines underneath!"
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Play voice automatically on step change
  useEffect(() => {
    speakCurrentStep();
  }, [currentStepIndex, activeLook]);

  return (
    <div id="voice-guide" className="bg-white/80 backdrop-blur-md rounded-3xl border border-pink-200/60 p-6 shadow-xs">
      {/* Header section with status indicators */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-pink-100 pb-4 mb-6 gap-3">
        <div>
          <span className="text-xs font-mono text-teal-600 font-bold uppercase tracking-wider block mb-1">
            🎙️ Hands-Free Vocal Coach
          </span>
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <span className="bg-gradient-to-r from-teal-600 via-pink-500 to-pink-600 bg-clip-text text-transparent">Meet Sasha — Your Real-Time Voice Guide</span>
            <Sparkles className="w-5 h-5 text-pink-500 animate-pulse" />
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Learn high-end beauty techniques entirely hands-free. Command our assistant <strong>Sasha</strong> using your voice, preventing messy cosmetic touchmarks on your device!
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 bg-pink-50 text-pink-700 font-mono text-[10px] font-bold rounded-lg border border-pink-250 uppercase flex items-center gap-1.5 tracking-tight animate-pulse">
            <Radio className="w-3.5 h-3.5 text-teal-500" /> {vocalStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left column - Select styled playlist tutorials (4 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-500 font-mono tracking-wider mb-2.5">Select Tutorial Styling Suite</h3>
            <div className="space-y-3">
              {MAKEUP_PLAYLISTS.map((look) => {
                const worksForMe = look.id === activeLook.id;
                return (
                  <div
                    key={look.id}
                    onClick={() => {
                      setActiveLook(look);
                      setCurrentStepIndex(0);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer hover:border-pink-300 transition-all duration-200 ${
                      worksForMe 
                        ? "border-pink-500 bg-pink-50/40 shadow-2xs" 
                        : "border-slate-100 bg-white/60 hover:bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-extrabold text-slate-800 text-xs">{look.name}</span>
                      <span className="text-[9px] bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full font-bold font-mono uppercase">
                        {look.difficulty}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight mt-1">{look.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-pink-50/30 p-3.5 rounded-xl border border-pink-100/50 flex gap-2.5 text-[11px] text-slate-600 leading-relaxed md:mt-2">
            <HelpCircle className="w-5 h-5 text-pink-500 shrink-0 animate-bounce" />
            <div>
              <p className="font-bold text-slate-800">Voice Command References:</p>
              <p className="mt-0.5">Toggle the microphone then say: <span className="font-mono text-pink-600 font-bold bg-white px-1 border border-pink-100 rounded">"Next"</span> to step forward, <span className="font-mono text-teal-600 font-bold bg-white px-1 border border-pink-100 rounded">"Back"</span> to return, or <span className="font-mono text-pink-600 font-bold bg-white px-1 border border-pink-100 rounded">"Repeat"</span> to listen again.</p>
            </div>
          </div>
        </div>

        {/* Right column - Interactive Step Card and Vocal Controller (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-teal-50/10 backdrop-blur-xs border border-teal-100/40 rounded-3xl p-5 relative overflow-hidden">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-mono font-bold text-teal-600 uppercase tracking-widest">
                STAGE {currentStepIndex + 1} OF {activeLook.steps.length}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                <span className="text-[9px] text-pink-600 font-bold uppercase tracking-wider font-mono">Real-Time Coach Feed</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-pink-100/40 p-5 shadow-3xs transition-all relative">
              {/* Voice active wavy sound bars */}
              {speaking && (
                <div className="absolute top-2.5 right-3.5 flex items-center gap-0.5 min-h-[16px]">
                  <span className="w-0.5 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <span className="w-0.5 h-5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <span className="w-0.5 h-4 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                  <span className="w-0.5 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                </div>
              )}

              <p className="text-slate-800 font-bold text-sm leading-relaxed mb-4 italic">
                &ldquo;{activeLook.steps[currentStepIndex]}&rdquo;
              </p>

              {spokenTranscript && (
                <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-[10px] font-mono text-slate-500 mb-3 text-left">
                  🎙️ Sasha Captured: <span className="font-bold text-slate-800 italic">"{spokenTranscript}"</span>
                </div>
              )}

              {/* Step indicator progress bars */}
              <div className="flex gap-1.5 mt-2">
                {activeLook.steps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      idx <= currentStepIndex ? "bg-gradient-to-r from-teal-400 to-pink-500" : "bg-slate-200/80"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Controls tray */}
          <div className="mt-6 pt-4 border-t border-teal-100/20 flex items-center justify-between gap-4">
            <div className="flex gap-2">
              <button
                disabled={currentStepIndex === 0}
                onClick={handlePrevStep}
                className="px-3.5 py-1.5 text-xs bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 rounded-xl transition cursor-pointer disabled:opacity-40"
              >
                Back Stage
              </button>
              <button
                disabled={currentStepIndex === activeLook.steps.length - 1}
                onClick={handleNextStep}
                className="px-3.5 py-1.5 text-xs bg-gradient-to-r from-teal-500 to-pink-500 text-white font-bold hover:shadow-xs hover:scale-102 rounded-xl transition cursor-pointer disabled:opacity-40"
              >
                Next Stage
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={speakCurrentStep}
                className={`p-2.5 rounded-full border bg-white cursor-pointer shadow-3xs transition hover:scale-105 hover:bg-pink-50 ${
                  speaking ? "border-pink-500 text-pink-500 ring-2 ring-pink-500/15" : "border-slate-200 text-slate-500"
                }`}
                title="Speak current instruction"
              >
                <Volume2 className="w-5 h-5 animate-pulse" />
              </button>

              <button
                onClick={cancelAllVoices}
                className="p-2.5 rounded-full border border-slate-200 bg-white text-slate-400 hover:text-red-500 cursor-pointer shadow-3xs transition hover:scale-105"
                title="Mute speakers"
              >
                <VolumeX className="w-5 h-5" />
              </button>

              <button
                onClick={activateRealSTT}
                className={`p-2.5 rounded-full border cursor-pointer shadow-3xs transition hover:scale-105 ${
                  sttListening
                    ? "bg-red-500 border-red-500 text-white animate-pulse"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-teal-50"
                }`}
                title="Trigger voice recognition input handler"
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------- SASHA AI VOICE LOUNGE & CONVERSATION HUB ----------------- */}
      <div className="mt-8 pt-6 border-t border-slate-100 bg-gradient-to-tr from-pink-50/20 via-white to-teal-50/10 p-5 rounded-2xl border border-pink-100/50">
        <div className="flex items-center gap-1.5 mb-3.5">
          <MessageSquare className="w-4 h-4 text-pink-500" />
          <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider font-mono">
            Sasha's Beauty Salon Consultation Lounge
          </h3>
          <span className="text-[9px] bg-teal-100 text-teal-800 font-mono font-bold px-1.5 py-0.5 rounded-full ml-auto animate-pulse">
            Active Chat API Link
          </span>
        </div>

        {/* Conversation flow container */}
        <div className="space-y-3 max-h-[190px] overflow-y-auto mb-4 p-3 bg-white/70 border border-slate-150 rounded-xl">
          {chatHistory.map((chat, idx) => (
            <div key={idx} className={`flex ${chat.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
              <div className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                chat.role === "user"
                  ? "bg-gradient-to-r from-teal-500 to-pink-500 text-white font-semibold rounded-tr-none"
                  : "bg-pink-50/40 text-slate-700 border border-pink-100/60 rounded-tl-none font-medium"
              }`}>
                {chat.role === "assistant" && (
                  <span className="font-mono text-[9px] text-pink-600 block font-black uppercase tracking-widest mb-1">
                    💖 SASHA GUIDANCE:
                  </span>
                )}
                {chat.content}
              </div>
            </div>
          ))}

          {chatLoading && (
            <div className="flex justify-start items-center gap-1.5 p-3 text-slate-400 text-xs">
              <RefreshCcw className="w-3.5 h-3.5 animate-spin text-pink-500" />
              Sasha is mixing custom pigments for an answer...
            </div>
          )}
        </div>

        {/* Input widget */}
        <form onSubmit={handleSendChat} className="flex gap-2.5">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask Sasha: 'Tell me how to sweep blush' or 'Explain olive warmth'..."
            disabled={chatLoading}
            className="flex-1 bg-white border border-slate-205 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-pink-300 transition duration-200"
          />
          <button
            type="submit"
            disabled={chatLoading || !chatInput.trim()}
            className="px-4.5 py-2 bg-gradient-to-r from-teal-500 via-pink-500 to-pink-600 text-white rounded-xl text-xs font-bold hover:scale-102 hover:shadow-xs transition duration-200 disabled:opacity-40 shrink-0 cursor-pointer flex items-center gap-1"
          >
            <Send className="w-3.5 h-3.5" /> Consult Sasha
          </button>
        </form>
      </div>
    </div>
  );
}
