import React, { useState } from "react";
import { Sparkles, Terminal, FileJson, Cpu, Play, Copy, Check, Info, HelpCircle, Download, BookOpen, Send, Search, Sliders, RefreshCw } from "lucide-react";

interface DatasetPreset {
  name: string;
  source: string;
  description: string;
  sizeInfo: string;
  focusArea: string;
  samplePrompt: string;
  samplePayload: string;
}

const RESEARCH_DATASETS: DatasetPreset[] = [
  {
    name: "YouMakeup Dataset",
    source: "YouMakeup / YouTube instructional corpus",
    description: "Contains 2,000+ top-tier instructional makeup videos with frame-by-frame structural temporal annotations and step transitions.",
    sizeInfo: "2,000+ videos with multi-modal alignment",
    focusArea: "Ocular makeup, foundation transitions, setting spray layers with exact start/end timestamps",
    samplePrompt: "Generate a synthetic 3-step YouMakeup sequence for a graphic eyeliner application, including normalized timestamps.",
    samplePayload: `{\n  "dataset_source": "YouMakeup",\n  "segment_id": "ym_oc_029",\n  "anchor_points": ["outer_v_eye", "brow_bone_crease"],\n  "brush_type": "Soft Tapered Blending Brush",\n  "pigment_hex": "#a18e81",\n  "target_effect": "Graphic deep set crease line symmetry"\n}`
  },
  {
    name: "HT-Step (wikiHow Alignment)",
    source: "NeurIPS / wikiHow Multi-Modal alignment",
    description: "Includes 116,500+ temporal step annotations mapped directly to wikiHow procedural guidelines. Extremely dense semantic taxonomy.",
    sizeInfo: "116,000+ annotations across 20k instructional videos",
    focusArea: "Universal step-by-step beauty workflows, logical hierarchy, and physical tools usage mapping",
    samplePrompt: "Extract 3 logical procedural steps from wikiHow's 'How to Apply Blush' and write them in instructor instructional JSON format.",
    samplePayload: `{\n  "dataset_source": "HT-Step-wiki",\n  "hierarchy": "Prep -> Color Placement -> Blend",\n  "tools_required": ["Fluffy Angled Blush Brush", "Setting powder"],\n  "temporal_resolution_seconds": 90,\n  "action_label": "High-point cheek zygomatic sweep"\n}`
  },
  {
    name: "iMakeup Procedural Snippets",
    source: "iMakeup Beauty Corpus",
    description: "Specifically focuses on the fine-grained beauty domain with 12,800+ segmented video clips categorizing specific makeup procedures.",
    sizeInfo: "2,000 videos across 50 fine-grained cosmetic topics",
    focusArea: "High-precision blush contouring, blending brush speeds, and skin finish categorization",
    samplePrompt: "Create a training sample demonstrating how to blend dry blush versus liquid blush based on iMakeup procedural logic.",
    samplePayload: `{\n  "dataset_source": "iMakeup-Pro",\n  "fine_grained_topic": "Dry vs Liquid blush layering",\n  "ideal_stipple_speed": "80 taps per minute",\n  "skin_finish_category": "Velvety Matte Finish"\n}`
  },
  {
    name: "MTF Face Feminization & Tone Correction",
    source: "Advanced Cosmetics & Color-Theory Science",
    description: "Specialized styling guidelines centering beard shadow neutralization via custom orange color correction and strategic bone structure sculpting.",
    sizeInfo: "Feminine alignment procedural logic",
    focusArea: "Orange-peach color theory, temple softening, nose slimming, and visual vertical compression vectors",
    samplePrompt: "Generate a detailed face-feminization training instruction for neutralizing gray-blue beard shadows using color correction.",
    samplePayload: `{\n  "dataset_source": "MTF-Trans-Feminization",\n  "color_corrector": "Burnet Orange Cream (#e07a5f)",\n  "target_follicle_neutralization": "Blue-gray 5 o\\'clock beard shadow",\n  "mandible_softening_vector": "Shade slightly above inferior mandibular border to pull focus upward"\n}`
  }
];

export default function GroqTrainingStudio() {
  const [selectedDataset, setSelectedDataset] = useState<DatasetPreset>(RESEARCH_DATASETS[3]); // Default to Feminization focus
  const [model, setModel] = useState("llama-3.3-70b-versatile");
  const [customPrompt, setCustomPrompt] = useState(RESEARCH_DATASETS[3].samplePrompt);
  const [temperature, setTemperature] = useState(0.7);
  const [loading, setLoading] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    "System: Initializing A.R.I. Research and Fine-Tuning Studio...",
    "System: Groq connection handler loaded successfully."
  ]);
  const [generatedResult, setGeneratedResult] = useState<string>("");
  const [synthesizedEntries, setSynthesizedEntries] = useState<any[]>([]);
  const [copiedText, setCopiedText] = useState(false);
  const [isSimulatedMode, setIsSimulatedMode] = useState(true);

  // Active Interactive Chat Mode
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: "Hello fabulous engineer sister! 👩‍💻✨ I'm ARI, running in our Groq Model Fine-Tuning Laboratory. Pick your target dataset from the left, customized my prompt guidelines, or chat with me here to see how my reasoning parameters adapt. Let's design gorgeous models!"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const addLog = (msg: string) => {
    setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleDatasetChange = (data: DatasetPreset) => {
    setSelectedDataset(data);
    setCustomPrompt(data.samplePrompt);
    addLog(`Switched baseline dataset to: ${data.name}`);
  };

  // Inject a dataset record's context or JSON payload into the sandbox input or system prompt
  const handleInjectPrompt = (data: DatasetPreset) => {
    setCustomPrompt((prev) => 
      prev + `\n\nBaseline Payload context from ${data.name}:\n` + data.samplePayload
    );
    addLog(`Injected ${data.name} payload template into the Sandbox Prompt.`);
  };

  const handleInjectChat = (data: DatasetPreset) => {
    setChatInput((prev) => 
      prev + `Evaluate this training segment context inside your response:\n${data.samplePayload}`
    );
    addLog(`Injected ${data.name} payload template into the Chat Playground.`);
  };

  const executeGroqCall = async (promptOverride?: string) => {
    setLoading(true);
    const finalPrompt = promptOverride || customPrompt;
    addLog(`Sending sandbox task parameters to Groq endpoints using ${model}...`);
    
    try {
      const resp = await fetch("/api/groq/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          temperature,
          messages: [
            {
              role: "user",
              content: `You are aiding a high-end beauty application developer in compiling fine-tuning data for 'A.R.I. Beauty Optimizer'.
              Use the following baseline dataset information if relevant:
              - Target Dataset Schema: ${selectedDataset.name} (${selectedDataset.source})
              - Focus Domain: ${selectedDataset.focusArea}

              Task: ${finalPrompt}
              
              Format the response beautifully and return high quality instruction tuning outputs. If the user wants a JSON format dataset, wrap it in a markdown JSON block.`
            }
          ]
        })
      });

      if (!resp.ok) {
        throw new Error(`API error: status code ${resp.status}`);
      }

      const data = await resp.json();
      setIsSimulatedMode(!!data.isSimulated);
      setGeneratedResult(data.reply);
      addLog(`Metadata returned. Model compiled: ${data.modelUsed}. (Simulated fallback: ${data.isSimulated ? "YES" : "NO"})`);

      // Attempt to extract JSON from markdown if JSON block is present
      try {
        const jsonMatch = data.reply.match(/```json([\s\S]*?)```/);
        if (jsonMatch && jsonMatch[1]) {
          const parsed = JSON.parse(jsonMatch[1].trim());
          if (Array.isArray(parsed)) {
            setSynthesizedEntries(parsed);
            addLog(`Successfully parsed ${parsed.length} synthesized training schema rows!`);
          } else if (parsed.instruction || parsed.steps || parsed.dataset || parsed.dataset_source) {
            setSynthesizedEntries([parsed]);
            addLog(`Successfully parsed custom synthesized layout schemas!`);
          }
        }
      } catch (e) {
        // Not a direct JSON parse, ignore
      }

    } catch (err: any) {
      console.error(err);
      addLog(`Error executing sandbox prompt: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendChatPlayground = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    const updatedMessages = [...chatMessages, { role: "user" as const, content: userMessage }];
    setChatMessages(updatedMessages);
    setChatInput("");
    setChatLoading(true);
    addLog(`Sending conversational query to Groq-integrated model workspace...`);

    try {
      const resp = await fetch("/api/groq/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          temperature,
          messages: updatedMessages
        })
      });

      if (!resp.ok) {
        throw new Error(`Chat API error: status ${resp.status}`);
      }

      const resData = await resp.json();
      setIsSimulatedMode(!!resData.isSimulated);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: resData.reply || "No reply returned." }
      ]);
      addLog(`Replied from ${resData.modelUsed} successfully.`);
    } catch (err: any) {
      console.error(err);
      addLog(`Interactive chat failed: ${err.message}`);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: `❌ Connection error while contacting Groq route: ${err.message}` }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSynthesizeRows = () => {
    const prompt = `Synthesize exactly 3 training data rows in clean Alpaca format (consisting of 'instruction', 'input', and 'output') that perfectly mimics the ${selectedDataset.name} style for training.
    Focus strongly on "${selectedDataset.focusArea}".
    Return the result as a raw JSON array inside a \`\`\`json markdown block. Example schema to follow:
    [
      {
        "instruction": "Explain how to apply custom peach color correction to neutralize a cool grayish beard shadow.",
        "input": "User has cool undertone, dry skin, visible 5 o'clock shadow",
        "output": "1. Prep area with rich moisturizer to combat dryness. 2. Dab a high-pigment cream orange/peach color corrector directly onto gray-blue shadows. 3. Pat gently, do not drag, until the cool slate hue is neutralized. 4. Layer a medium-to-full coverage warm undertone foundation on top to lock in a seamless feminine, soft skin canvas."
      }
    ]`;
    executeGroqCall(prompt);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedResult || JSON.stringify(synthesizedEntries, null, 2));
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
    addLog("Copied generated compile output to clipboard.");
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(synthesizedEntries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${selectedDataset.name.replace(/\s+/g, "_")}_synthesized_tuning.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addLog("Downloaded synthesized dataset file.");
  };

  const handleClearConversations = () => {
    setChatMessages([
      {
        role: "assistant",
        content: "Chat playground cleared! Feed me detailed dataset parameters to begin our research analysis."
      }
    ]);
  };

  return (
    <div id="groq-integrated-studio" className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in text-left">
      {/* EXPLANATORY HEADER BANNER */}
      <div className="lg:col-span-12 bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-pink-200/50 shadow-3xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-teal-700 font-bold uppercase tracking-widest bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/40">
            📊 CO-RESEARCH & TUNING DECK
          </span>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight mt-1">
            ARI Virtual Makeup AI - Dataset Alignment Studio
          </h2>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed max-w-4xl">
            This workspace acts as a synthetic compilation engine. We bridge high-resolution human cosmetic procedural data 
            such as <strong>YouMakeup</strong>, <strong>YMU</strong>, and <strong>wikiHow HT-Step</strong> with our custom prompt weights. 
            Test latency speeds using high-throughput Groq models (or optimized Gemini fallbacks) below.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2 bg-pink-50/50 p-3 rounded-xl border border-pink-100">
          <span className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-ping" />
          <div className="text-[10px] font-mono">
            <p className="font-extrabold text-teal-700 uppercase leading-none">Inference System Live</p>
            <p className="text-slate-400 mt-1 leading-none">V1.4 Fast-Route Proxy</p>
          </div>
        </div>
      </div>

      {/* LEFT COLUMN: Controls & Dataset Presets (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* Model Params */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-pink-200/50 p-5 shadow-3xs">
          <h3 className="text-xs font-mono font-bold text-teal-700 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-pink-50 pb-2">
            <Cpu className="w-4 h-4 text-teal-500" />
            <span>Select Groq Pipeline Engine</span>
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                Target Language Model
              </label>
              <select
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  addLog(`Selected target model: ${e.target.value}`);
                }}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl p-2.5 font-mono focus:ring-1 focus:ring-teal-400 outline-none"
              >
                <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Powerful Deep Reasoner)</option>
                <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Sub-100ms Latency)</option>
                <option value="mixtral-8x7b-32768">mixtral-8x7b-32768 (Sparse MoE)</option>
                <option value="gemma2-9b-it">gemma2-9b-it (Google Optimized Core)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex justify-between">
                <span>Creativity Temperature</span>
                <span className="text-teal-600 font-extrabold">{temperature.toFixed(2)}</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.1"
                  max="1.2"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Training Corpus Presets */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-pink-200/50 p-5 shadow-3xs flex-1 flex flex-col gap-4">
          <h3 className="text-xs font-mono font-bold text-purple-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-pink-50 pb-2">
            <BookOpen className="w-4 h-4 text-purple-500" />
            <span>Beauty Target Training Corpus</span>
          </h3>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
            {RESEARCH_DATASETS.map((data) => {
              const isSelected = selectedDataset.name === data.name;
              return (
                <button
                  key={data.name}
                  onClick={() => handleDatasetChange(data)}
                  className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex flex-col gap-1 cursor-pointer ${
                    isSelected
                      ? "bg-purple-50/40 border-purple-300 shadow-3xs"
                      : "bg-slate-50/70 border-slate-200/60 hover:bg-pink-50/20 hover:border-pink-200"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-slate-800">{data.name}</span>
                    <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-mono font-bold ${isSelected ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-500'}`}>
                      {data.name.includes("Feminization") ? "Inclusive" : "Research"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal mb-1">{data.description}</p>
                  
                  <div className="flex flex-wrap gap-1.5 text-[9px] font-mono mt-1 pt-1.5 border-t border-slate-100">
                    <span className="text-teal-600 font-bold uppercase">📐 {data.focusArea}</span>
                  </div>
                </button>
              );
            })}
          </div>

          Selected Item Payload Inspect Area
          <div className="bg-slate-950 text-slate-200 rounded-xl p-3 text-[10.5px] font-mono flex flex-col justify-between relative mt-auto">
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-800 mb-2">
              <span className="text-[9px] font-bold text-teal-400 uppercase">
                ⚙️ Schema Payload Context
              </span>
              <span className="text-[9.5px] text-slate-400">JSON Format</span>
            </div>
            
            <pre className="max-h-[145px] overflow-auto text-left text-teal-300 leading-snug whitespace-pre scrollbar-thin">
              {selectedDataset.samplePayload}
            </pre>

            <div className="flex gap-2 mt-3 pt-2.5 border-t border-slate-800">
              <button
                onClick={() => handleInjectPrompt(selectedDataset)}
                className="flex-1 py-1.5 px-2 bg-pink-700/80 hover:bg-pink-700 text-white rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 transition uppercase tracking-wider text-center"
                title="Incorporate payload structure into prompt sandbox"
              >
                Inject to Sandbox
              </button>
              <button
                onClick={() => handleInjectChat(selectedDataset)}
                className="flex-1 py-1.5 px-2 bg-teal-600/80 hover:bg-teal-600 text-white rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 transition uppercase tracking-wider text-center"
                title="Incorporate payload structure into chat playground"
              >
                Inject to Chat
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Chat Playground & Synthesis Terminal (7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        
        {/* INTERACTIVE CHAT GROUND */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-pink-200/50 p-5 shadow-3xs flex flex-col gap-3 min-h-[310px]">
          <div className="flex items-center justify-between border-b border-pink-50 pb-2">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-pink-500 animate-pulse" />
              <span>Interactive Model Testing Playground</span>
            </h3>
            <button
              onClick={handleClearConversations}
              className="text-[9.5px] px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-bold uppercase rounded-lg border border-slate-200 transition"
            >
              Clear Chat
            </button>
          </div>

          <div className="flex-1 max-h-[190px] overflow-y-auto space-y-3 pr-1">
            {chatMessages.map((m, i) => {
              const isUser = m.role === "user";
              return (
                <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs text-left ${
                    isUser
                      ? "bg-slate-900 text-white rounded-tr-xs"
                      : "bg-slate-100 text-slate-800 rounded-tl-xs"
                  }`}>
                    <div className="whitespace-pre-wrap font-medium leading-relaxed">
                      {m.content}
                    </div>
                  </div>
                </div>
              );
            })}

            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl rounded-tl-xs p-3 text-xs text-slate-500 flex items-center gap-2 animate-pulse">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                  <span className="font-mono text-[9px] uppercase font-bold text-slate-400">Evaluating dataset vectors...</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSendChatPlayground} className="flex gap-2 pt-2 border-t border-slate-100">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask ARI anything or inject custom training parameters..."
              disabled={chatLoading}
              className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-pink-400"
            />
            <button
              type="submit"
              disabled={chatLoading}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-pink-500 text-white rounded-xl font-bold text-xs hover:scale-102 transition flex items-center gap-1 uppercase tracking-wider cursor-pointer"
            >
              <Send className="w-3 h-3" /> Chat
            </button>
          </form>
        </div>

        {/* alpaca DATASET SYNTHESIZER AND PROMPT SANDBOX */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-pink-200/50 p-5 shadow-3xs flex-1 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b border-pink-50 pb-2.5 mb-3">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-teal-600" />
                  <span>Sandbox Prompt & Dataset Synthesizer</span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {isSimulatedMode ? (
                  <span className="text-[9px] bg-amber-50 text-amber-700 px-2.5 py-1 border border-amber-250/30 rounded-lg font-mono font-bold uppercase flex items-center gap-1">
                    <Info className="w-3 h-3" /> Simulated fallback Active
                  </span>
                ) : (
                  <span className="text-[9px] bg-teal-550 text-white px-2.5 py-1 rounded-lg font-mono font-bold uppercase flex items-center gap-1">
                    <Check className="w-3 h-3" /> Groq V1 Active
                  </span>
                )}
              </div>
            </div>

            {/* REALISTIC DEBUG TERMINAL LOGS */}
            <div className="bg-slate-900 border border-slate-950 text-teal-300 font-mono text-[9px] px-3 py-2 rounded-xl overflow-y-auto max-h-[80px] mb-3.5 space-y-0.5 scrollbar-thin text-left opacity-90">
              {consoleLogs.map((log, i) => (
                <div key={i} className="truncate leading-relaxed">{log}</div>
              ))}
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-mono text-slate-400 font-black uppercase">Sandbox Instruct Task</span>
                  <button
                    onClick={() => {
                      setCustomPrompt(selectedDataset.samplePrompt);
                      addLog("Reset template prompt.");
                    }}
                    className="text-[9.5px] text-pink-600 font-extrabold uppercase hover:underline"
                  >
                    Reset template
                  </button>
                </div>
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-teal-400 font-sans"
                  placeholder="Enter custom validation task..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => executeGroqCall()}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-black text-white text-[10.5px] tracking-wider uppercase font-bold rounded-xl shadow-3xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" /> {loading ? "Analyzing..." : "Run Sandbox Prompt"}
                </button>
                <button
                  onClick={handleSynthesizeRows}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-pink-500 text-white text-[10.5px] tracking-wider uppercase font-bold rounded-xl shadow-3xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" /> {loading ? "Synthesizing..." : "Synthesize alpaca Dataset"}
                </button>
              </div>
            </div>

            {/* Response Output Console */}
            <div className="border border-pink-100 rounded-xl bg-slate-50/50 p-3.5 relative">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">
                  📡 Synthesized Compile Output
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    disabled={!generatedResult}
                    className="p-1 px-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-[10px] uppercase font-bold flex items-center gap-1 transition disabled:opacity-35 cursor-pointer shadow-3xs"
                  >
                    {copiedText ? <Check className="w-3 h-3 text-teal-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedText ? "Copied" : "Copy"}</span>
                  </button>
                  {synthesizedEntries.length > 0 && (
                    <button
                      onClick={handleDownloadJSON}
                      className="p-1 px-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-teal-600 rounded-lg text-[10px] uppercase font-bold flex items-center gap-1 transition cursor-pointer shadow-3xs"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export JSON ({synthesizedEntries.length})</span>
                    </button>
                  )}
                </div>
              </div>

              {generatedResult ? (
                <div className="text-[11px] text-slate-700 leading-relaxed font-mono max-h-[160px] overflow-y-auto whitespace-pre-wrap p-3.5 bg-white rounded-xl border border-slate-100 text-left">
                  {generatedResult}
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-8 text-center tracking-wide font-medium">
                  Your compiled training guides, alpaca instruction arrays, or fine-tuning models will display here when generated.
                </div>
              )}
            </div>
          </div>

          {/* Female engineer footer helper note */}
          <div className="mt-4 pt-3 border-t border-pink-100/60 bg-pink-50/25 rounded-xl p-3 flex gap-2.5">
            <Info className="w-4.5 h-4.5 text-pink-500 shrink-0 mt-0.5 animate-pulse" />
            <p className="text-[10.5px] text-slate-600 leading-normal font-medium text-left">
              <span className="font-extrabold text-pink-600">Creator Note:</span> Make sure you create or configure the <code className="bg-white border px-1 py-0.5 rounded text-blue-600 font-mono font-bold">GROQ_API_KEY</code> in your environment variables for pure hardware-accelerated speeds! Without it, our backend safely proxies queries through Gemini so you can continue sandbox development seamlessly. Let's make engineering glamorous! 💄💻
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
