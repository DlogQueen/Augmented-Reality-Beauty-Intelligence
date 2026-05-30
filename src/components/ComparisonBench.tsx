import { Check, X, ShieldAlert, Zap, Globe, Sliders, Users, Heart } from "lucide-react";

interface CompetitiveItem {
  name: string;
  creator: string;
  pros: string[];
  cons: string[];
  ariAdvantage: string;
}

const MARKET_RESEARCH: CompetitiveItem[] = [
  {
    name: "Virtual Artist",
    creator: "Sephora",
    pros: [
      "Direct integration with retail e-commerce inventory catalogs",
      "Immediate lip shade virtual tries using color libraries",
      "Robust high capacity camera coordinate tracking"
    ],
    cons: [
      "No custom bone-shadow contouring diagnostic guides",
      "Lacks interactive voice tutorials for hands-free bathroom application",
      "Restricted strictly to store brand lists instead of physical undertone calculations"
    ],
    ariAdvantage: "A.R.I. is a conversational beauty guide. Our bone-structure face mapping teaches you precisely how and where to brush products tailored to your skull anatomy, rather than simply slapping flat overlay filters on top."
  },
  {
    name: "YouCam & Perfect365",
    creator: "Perfect Corp",
    pros: [
      "Impressive instantaneous pixel shading filters",
      "Large global cosmetic brand integrations"
    ],
    cons: [
      "Focuses heavily on virtual plastic surgery style 'face warping' instead of authentic self-expression",
      "No supportive community feed with peer feedback on real recipes",
      "No voice/speech guided tutorials"
    ],
    ariAdvantage: "A.R.I. empowers women and builds confidence. We map skin micro-texture and undertones for accurate finish matching, with a secure social peer network to inspire support."
  }
];

export default function ComparisonBench() {
  return (
    <div id="comparison-bench" className="bg-white/80 backdrop-blur-md rounded-2xl border border-pink-200/60 p-6 shadow-xs animate-fade-in">
      <div className="border-b border-pink-100 pb-4 mb-6">
        <span className="text-xs font-mono text-teal-600 font-bold uppercase tracking-wider block mb-1">
          📊 Competitive Market Research
        </span>
        <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-1.5">
          <span className="bg-gradient-to-r from-teal-600 via-pink-500 to-pink-600 bg-clip-text text-transparent">Industry Benchmarks & The A.R.I. Difference</span>
        </h2>
        <p className="text-slate-500 text-xs mt-1 leading-relaxed">
          A strategic breakdown analyzing what works in existing beauty applications and how our Augmented Reality Intelligence establishes the next generation of cosmetics tech.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {MARKET_RESEARCH.map((app) => (
          <div key={app.name} className="bg-white/60 hover:bg-white border border-pink-100/40 rounded-2xl p-5 flex flex-col justify-between hover:shadow-xs transition-all duration-300">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-extrabold text-slate-800 text-sm">{app.name} <span className="text-xs text-slate-400 font-normal">by {app.creator}</span></h3>
                <span className="text-[9px] bg-amber-50 text-amber-700 px-2.5 py-1 border border-amber-250/30 rounded-lg font-mono font-bold uppercase">
                  Major Competitor
                </span>
              </div>

              <div className="space-y-2.5 mb-4 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-teal-600 font-bold uppercase tracking-wider block mb-1">👍 What they do well:</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-650 font-medium">
                    {app.pros.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
                <div className="pt-2">
                  <span className="text-[10px] font-mono text-pink-600 font-bold uppercase tracking-wider block mb-1">⚠️ Where they fall short:</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-655 font-medium">
                    {app.cons.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-pink-50/20 border-l-4 border-pink-500 p-3.5 rounded-r-xl text-xs mt-3 shadow-3xs">
              <span className="font-extrabold text-pink-600 block mb-1 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-current animate-pulse text-pink-500" /> How A.R.I. Sets Itself Apart:
              </span>
              <p className="text-slate-650 leading-relaxed font-semibold italic">&ldquo;{app.ariAdvantage}&rdquo;</p>
            </div>
          </div>
        ))}
      </div>

      {/* COMPARATIVE MATRIX TABLE */}
      <h3 className="font-bold text-teal-700 text-xs uppercase tracking-widest mb-4 font-mono text-center">
        🏆 Technical Feature Comparison Matrix
      </h3>
      <div className="overflow-x-auto rounded-xl border border-pink-100/50">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-teal-50 to-pink-50 text-slate-800 font-bold font-mono text-[10px] uppercase border-b border-pink-150">
              <th className="p-3.5 border-r border-pink-100">Feature Capabilities</th>
              <th className="p-3.5 border-r border-pink-100 text-center">Retail Shop Apps</th>
              <th className="p-3.5 border-r border-pink-100 text-center">Warper Filter Apps</th>
              <th className="p-3 text-center bg-pink-100/60 font-black text-pink-700 uppercase tracking-wide border-l border-pink-205">A.R.I. Beauty (Ours)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pink-100/30">
            <tr>
              <td className="p-3 border-r border-pink-100 font-bold text-slate-700">Skin Undertone Temperature Test</td>
              <td className="p-3 border-r border-pink-100 text-center"><X className="w-4 h-4 mx-auto text-red-400" /></td>
              <td className="p-3 border-r border-pink-100 text-center"><Check className="w-4 h-4 mx-auto text-teal-500" /></td>
              <td className="p-3 text-center bg-pink-50/30 font-extrabold text-pink-750 border-x border-pink-105"><Check className="w-4 h-4 mx-auto text-pink-600 inline mr-1" /> AI Vision</td>
            </tr>
            <tr>
              <td className="p-3 border-r border-pink-100 font-bold text-slate-700">Contour Skull Shadow Bone Mapping</td>
              <td className="p-3 border-r border-pink-100 text-center"><X className="w-4 h-4 mx-auto text-red-400" /></td>
              <td className="p-3 border-r border-pink-100 text-center"><X className="w-4 h-4 mx-auto text-red-400" /></td>
              <td className="p-3 text-center bg-pink-50/30 font-extrabold text-pink-755 border-x border-pink-105"><Check className="w-4 h-4 mx-auto text-pink-600 inline mr-1" /> Complete</td>
            </tr>
            <tr>
              <td className="p-3 border-r border-pink-100 font-bold text-slate-700">Hands-Free Audio Tutorial Voice Control</td>
              <td className="p-3 border-r border-pink-100 text-center"><X className="w-4 h-4 mx-auto text-red-400" /></td>
              <td className="p-3 border-r border-pink-100 text-center"><X className="w-4 h-4 mx-auto text-red-400" /></td>
              <td className="p-3 text-center bg-pink-50/30 font-extrabold text-pink-755 border-x border-pink-105"><Check className="w-4 h-4 mx-auto text-pink-600 inline mr-1" /> TTS & STT</td>
            </tr>
            <tr>
              <td className="p-3 border-r border-pink-100 font-bold text-slate-700">Encouraging Global Community Feed</td>
              <td className="p-3 border-r border-pink-100 text-center"><Check className="w-4 h-4 mx-auto text-teal-500" /></td>
              <td className="p-3 border-r border-pink-100 text-center"><X className="w-4 h-4 mx-auto text-red-400" /></td>
              <td className="p-3 text-center bg-pink-50/30 font-extrabold text-pink-755 border-x border-pink-105"><Check className="w-4 h-4 mx-auto text-pink-600 inline mr-1" /> Secure Rules</td>
            </tr>
            <tr>
              <td className="p-3 border-r border-pink-100 font-bold text-slate-700">Secure Direct P2P Messenger chats</td>
              <td className="p-3 border-r border-pink-100 text-center"><X className="w-4 h-4 mx-auto text-red-400" /></td>
              <td className="p-3 border-r border-pink-100 text-center"><X className="w-4 h-4 mx-auto text-red-400" /></td>
              <td className="p-3 text-center bg-pink-50/30 font-extrabold text-pink-755 border-x border-pink-105"><Check className="w-4 h-4 mx-auto text-pink-600 inline mr-1" /> Firestore</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
