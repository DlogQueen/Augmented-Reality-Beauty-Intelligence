import { useState, useRef, useEffect } from "react";
import { Sparkles, Trash2, Eye, ShieldCheck, Palette, Compass, Camera, VideoOff, Layers, Activity, Sparkle } from "lucide-react";

interface FaceMap3DProps {
  initialShades?: {
    foundation: string;
    blush: string;
    highlighter: string;
  };
}

const SHADE_PALETTES = {
  bronzers: [
    { name: "Cool Taupe", hex: "#a4806a", zone: "contour" },
    { name: "Warm Honey", hex: "#ab7f5f", zone: "contour" },
    { name: "Golden Bronze", hex: "#8d5d3d", zone: "contour" },
    { name: "Rich Cacao", hex: "#5b3c20", zone: "contour" }
  ],
  blushes: [
    { name: "Soft Coral", hex: "#e28766", zone: "blush" },
    { name: "Dusty Blossom", hex: "#c87884", zone: "blush" },
    { name: "Plum Berry", hex: "#9d4f61", zone: "blush" },
    { name: "Vibrant Rose", hex: "#e05874", zone: "blush" }
  ],
  highlighters: [
    { name: "Champagne Ice", hex: "#fbead2", zone: "highlight" },
    { name: "Rose Gold", hex: "#eecfb7", zone: "highlight" },
    { name: "Gilded Honey", hex: "#f0d592", zone: "highlight" },
    { name: "Opal Pearl", hex: "#fae8eb", zone: "highlight" }
  ],
  lips: [
    { name: "Crimson Silk", hex: "#ab1f2c", zone: "lips" },
    { name: "Dusty Rosewood", hex: "#b86a6c", zone: "lips" },
    { name: "Velvet Peach", hex: "#d57960", zone: "lips" },
    { name: "Bare Nude", hex: "#c4927f", zone: "lips" }
  ]
};

export default function FaceMap3D({ initialShades }: FaceMap3DProps) {
  // Configured shades on the map zones
  const [activeContourColor, setActiveContourColor] = useState("#a4806a"); // Cool Taupe
  const [activeBlushColor, setActiveBlushColor] = useState("#c87884"); // Dusty Blossom
  const [activeHighlightColor, setActiveHighlightColor] = useState("#fbead2"); // Champagne Ice
  const [activeLipColor, setActiveLipColor] = useState("#b86a6c");

  // State mapping currently selected tool
  const [selectedBrushType, setSelectedBrushType] = useState<"contour" | "blush" | "highlight" | "lips">("contour");
  const [appliedZones, setAppliedZones] = useState<Record<string, string>>({
    forehead_contour: "#a4806a",
    cheeks_contour: "#a4806a",
    nose_contour: "#a4806a",
    blush_apples: "#c87884",
    nose_bridge_high: "#fbead2",
    cheek_high: "#fbead2",
    lips: "#b86a6c"
  });

  const [rotationAngle, setRotationAngle] = useState(0); // in degrees to simulate the 3D rotation feel

  // Augmented Reality Camera States
  const [arCameraActive, setArCameraActive] = useState(false);
  const [arFilterMode, setArFilterMode] = useState<"cyber_contours" | "aura_projection" | "minimal_sculpt">("cyber_contours");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    return () => {
      stopArCamera();
    };
  }, []);

  const startArCamera = async () => {
    setCameraError(null);
    setArCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn("Could not acquire lock on webcam telemetry:", err);
      setCameraError("Webcam permissions unavailable. Showing our majestic interactive AR holographic outline fallback simulation!");
      setArCameraActive(false);
    }
  };

  const stopArCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setArCameraActive(false);
  };

  const pickShade = (hex: string, zone: "contour" | "blush" | "highlight" | "lips") => {
    if (zone === "contour") {
      setActiveContourColor(hex);
      setSelectedBrushType("contour");
    } else if (zone === "blush") {
      setActiveBlushColor(hex);
      setSelectedBrushType("blush");
    } else if (zone === "highlight") {
      setActiveHighlightColor(hex);
      setSelectedBrushType("highlight");
    } else if (zone === "lips") {
      setActiveLipColor(hex);
      setSelectedBrushType("lips");
    }
  };

  const applyBrushToZone = (zoneKey: string) => {
    let targetColor = "";
    if (selectedBrushType === "contour") targetColor = activeContourColor;
    if (selectedBrushType === "blush") targetColor = activeBlushColor;
    if (selectedBrushType === "highlight") targetColor = activeHighlightColor;
    if (selectedBrushType === "lips") targetColor = activeLipColor;

    setAppliedZones(prev => ({
      ...prev,
      [zoneKey]: targetColor
    }));
  };

  const clearCanvas = () => {
    setAppliedZones({
      forehead_contour: "transparent",
      cheeks_contour: "transparent",
      nose_contour: "transparent",
      blush_apples: "transparent",
      nose_bridge_high: "transparent",
      cheek_high: "transparent",
      lips: "transparent"
    });
  };

  return (
    <div id="face-map-3d" className="bg-white/80 backdrop-blur-md rounded-2xl border border-pink-200/60 p-6 shadow-xs">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-pink-100 pb-4 mb-6 gap-3">
        <div>
          <span className="text-xs font-mono text-teal-600 font-bold uppercase tracking-wider block mb-1">
            🗺️ Sasha's Vision
          </span>
          <h2 className="text-xl font-extrabold flex items-center gap-1.5">
            <span className="bg-gradient-to-r from-teal-600 via-pink-500 to-pink-600 bg-clip-text text-transparent">Camera Try-On & Contour Mesh</span>
            <Compass className="w-5 h-5 text-pink-500 animate-pulse" />
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Pick cosmetic colors, then tap coordinate regions on the face map vector to project cheek shadows, highlights, and blush in real-time camera AR.
          </p>
        </div>

        <div className="flex gap-2">
          {!arCameraActive ? (
            <button
              onClick={startArCamera}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-pink-500 px-4 py-2 rounded-xl hover:scale-103 transition cursor-pointer shadow-3xs"
            >
              <Camera className="w-4 h-4" /> Toggle Live AR Mirror
            </button>
          ) : (
            <button
              onClick={stopArCamera}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-150 hover:bg-slate-200 px-4 py-2 rounded-xl transition cursor-pointer"
            >
              <VideoOff className="w-4 h-4" /> Turn Mirror Off
            </button>
          )}

          <button
            onClick={clearCanvas}
            className="flex items-center gap-1 text-xs font-bold text-pink-700 hover:text-white bg-pink-50 hover:bg-gradient-to-r hover:from-teal-500 hover:to-pink-500 border border-pink-200 hover:border-transparent px-3 py-2 rounded-xl transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Map
          </button>
        </div>
      </div>

      {cameraError && (
        <div className="bg-pink-50/55 p-3 rounded-xl text-slate-700 text-xs mb-4 border border-pink-200/50">
          ⚠️ {cameraError}
        </div>
      )}

      {/* AR CONFIGURATOR TRAY (displays when camera active) */}
      {arCameraActive && (
        <div className="bg-teal-50/25 border border-teal-150 p-3.5 rounded-xl mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in text-xs">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2 bg-teal-500 text-white rounded text-[10px] font-mono font-bold uppercase tracking-widest animate-pulse">
              AR Active
            </span>
            <p className="text-slate-700 font-extrabold max-w-sm">
              Sasha's smart tracking overlays active. Alter your shader filters below:
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setArFilterMode("cyber_contours")}
              className={`px-3 py-1.5 rounded-lg border text-[10px] uppercase font-bold tracking-wider cursor-pointer ${
                arFilterMode === "cyber_contours"
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              🌌 Cyber Mesh Glimmer
            </button>
            <button
              onClick={() => setArFilterMode("aura_projection")}
              className={`px-3 py-1.5 rounded-lg border text-[10px] uppercase font-bold tracking-wider cursor-pointer ${
                arFilterMode === "aura_projection"
                  ? "bg-pink-600 text-white border-pink-600"
                  : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              🦄 Aura Shade Glow
            </button>
            <button
              onClick={() => setArFilterMode("minimal_sculpt")}
              className={`px-3 py-1.5 rounded-lg border text-[10px] uppercase font-bold tracking-wider cursor-pointer ${
                arFilterMode === "minimal_sculpt"
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              💄 Soft Touch Filter
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side: Palette controls */}
        <div className="flex-1 space-y-5">
          {/* Active Brush tool indicators */}
          <div className="bg-pink-50/20 border border-pink-100 p-4 rounded-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-2.5 font-mono flex items-center gap-1.5">
              <Activity className="w-4 h-4 animate-pulse" /> Active Sculpting Brush
            </h3>
            <div className="grid grid-cols-4 gap-1.5">
              {(["contour", "blush", "highlight", "lips"] as const).map(brush => (
                <button
                  key={brush}
                  onClick={() => setSelectedBrushType(brush)}
                  className={`py-2 px-1 text-[10px] uppercase font-bold tracking-widest rounded-lg border cursor-pointer transition ${
                    selectedBrushType === brush
                      ? "bg-gradient-to-r from-teal-500 to-pink-500 text-white border-transparent shadow-xs scale-[1.02]"
                      : "bg-white text-slate-600 border-slate-200/60 hover:bg-slate-50"
                  }`}
                >
                  {brush}
                </button>
              ))}
            </div>
          </div>

          {/* PALETTES */}
          <div>
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest mb-2 flex items-center gap-1 font-mono">
              <Palette className="w-3.5 h-3.5 text-teal-600" /> Bronzer & Contour
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {SHADE_PALETTES.bronzers.map(shade => (
                <div
                  key={shade.name}
                  onClick={() => pickShade(shade.hex, "contour")}
                  className={`p-2 bg-white/90 rounded-xl border cursor-pointer hover:scale-[1.03] transition flex flex-col items-center justify-center ${
                    activeContourColor === shade.hex ? "border-pink-500 ring-2 ring-pink-500/15" : "border-slate-100"
                  }`}
                >
                  <div className="w-7 h-7 rounded-full border border-slate-200/60 shadow-inner animate-pulse" style={{ backgroundColor: shade.hex }} />
                  <span className="text-[9px] text-slate-600 font-bold truncate max-w-full text-center mt-1 leading-tight">{shade.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest mb-2 flex items-center gap-1 font-mono">
              <Palette className="w-3.5 h-3.5 text-pink-500" /> Apples Blush
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {SHADE_PALETTES.blushes.map(shade => (
                <div
                  key={shade.name}
                  onClick={() => pickShade(shade.hex, "blush")}
                  className={`p-2 bg-white/90 rounded-xl border cursor-pointer hover:scale-[1.03] transition flex flex-col items-center justify-center ${
                    activeBlushColor === shade.hex ? "border-pink-500 ring-2 ring-pink-500/15" : "border-slate-100"
                  }`}
                >
                  <div className="w-7 h-7 rounded-full border border-slate-200/60 shadow-inner" style={{ backgroundColor: shade.hex }} />
                  <span className="text-[9px] text-slate-600 font-bold truncate max-w-full text-center mt-1 leading-tight">{shade.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest mb-2 flex items-center gap-1 font-mono">
              <Palette className="w-3.5 h-3.5 text-teal-600" /> Highlighters
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {SHADE_PALETTES.highlighters.map(shade => (
                <div
                  key={shade.name}
                  onClick={() => pickShade(shade.hex, "highlight")}
                  className={`p-2 bg-white/90 rounded-xl border cursor-pointer hover:scale-[1.03] transition flex flex-col items-center justify-center ${
                    activeHighlightColor === shade.hex ? "border-pink-500 ring-2 ring-pink-500/15" : "border-slate-100"
                  }`}
                >
                  <div className="w-7 h-7 rounded-full border border-slate-200/60 shadow-inner" style={{ backgroundColor: shade.hex }} />
                  <span className="text-[9px] text-slate-600 font-bold truncate max-w-full text-center mt-1 leading-tight">{shade.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest mb-2 flex items-center gap-1 font-mono">
              <Palette className="w-3.5 h-3.5 text-pink-500" /> Lip Liners & Pigments
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {SHADE_PALETTES.lips.map(shade => (
                <div
                  key={shade.name}
                  onClick={() => pickShade(shade.hex, "lips")}
                  className={`p-2 bg-white/90 rounded-xl border cursor-pointer hover:scale-[1.03] transition flex flex-col items-center justify-center ${
                    activeLipColor === shade.hex ? "border-pink-500 ring-2 ring-pink-500/15" : "border-slate-100"
                  }`}
                >
                  <div className="w-7 h-7 rounded-full border border-slate-200/60 shadow-inner" style={{ backgroundColor: shade.hex }} />
                  <span className="text-[9px] text-slate-600 font-bold truncate max-w-full text-center mt-1 leading-tight">{shade.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Visual vector face map with isometric controls */}
        <div className="flex-1 flex flex-col items-center justify-center bg-teal-50/10 backdrop-blur-xs border border-teal-100/40 rounded-3xl p-6 relative overflow-hidden min-h-[380px]">
          {/* Simulation Angle Controller */}
          <div className="absolute top-4 left-4 z-10 bg-white/95 border border-pink-100 p-2.5 rounded-xl flex flex-col gap-1 shadow-2xs">
            <span className="text-[9px] font-mono font-bold text-teal-600 uppercase">3D Perspective</span>
            <input
              type="range"
              min="-45"
              max="45"
              value={rotationAngle}
              onChange={(e) => setRotationAngle(Number(e.target.value))}
              className="w-24 accent-pink-600 cursor-pointer"
            />
            <span className="text-[10px] font-bold text-slate-500 text-center font-mono">{rotationAngle}° Y-Orbit</span>
          </div>

          {/* Active Filter HUD indicator */}
          <div className="absolute top-4 right-4 z-10 bg-black/80 backdrop-blur-xs p-1.5 px-3 rounded-lg text-[9px] font-mono text-pink-300 border border-pink-700/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
            FILTER: {arCameraActive ? arFilterMode.toUpperCase() : "STATIC FRAME MESH"}
          </div>

          {/* Holographic camera simulation frame & elements */}
          <div
            className="w-full max-w-[280px] aspect-square relative rounded-full overflow-hidden"
            style={{
              transform: `perspective(400px) rotateY(${rotationAngle}deg)`,
              transition: "transform 100ms ease-out"
            }}
          >
            {/* Live Camera element background */}
            {arCameraActive ? (
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1] z-0"
                playsInline
                muted
              />
            ) : (
              <div className="absolute inset-0 bg-slate-100/80 flex items-center justify-center text-center z-0">
                <div className="max-w-[150px] space-y-1 z-10">
                  <span className="text-3xl">🤖</span>
                  <p className="text-[10px] text-slate-400 font-bold">A.R.I. Hologram Live</p>
                  <p className="text-[8px] text-slate-300 leading-tight">Turn live mirror feed on above or paint the coordinate coordinates directly!</p>
                </div>
              </div>
            )}

            {/* Custom Interactive AR Filters based on mode */}
            {arCameraActive && arFilterMode === "aura_projection" && (
              <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/20 via-teal-400/10 to-transparent pointer-events-none z-1 flex items-center justify-center animate-pulse">
                <Sparkle className="w-8 h-8 text-white/40 absolute top-8 right-8 animate-spin-slow" />
              </div>
            )}

            {arCameraActive && arFilterMode === "cyber_contours" && (
              <div 
                className="absolute inset-0 bg-teal-500/5 mix-blend-color-dodge pointer-events-none z-1" 
                style={{
                  backgroundImage: "radial-gradient(circle, rgba(20,250,220,0.1) 1px, transparent 1px)",
                  backgroundSize: "8px 8px"
                }}
              />
            )}

            {/* SVG Interactive Beauty Model face wireframe overlayed */}
            <svg
              viewBox="0 0 200 200"
              className="absolute inset-0 w-full h-full fill-none stroke-pink-400/50 stroke-[0.8] z-10 pointer-events-auto"
            >
              {/* Outer structural hairline mesh background */}
              {!arCameraActive && (
                <path d="M 100,20 C 130,20 160,40 160,80 C 160,110 145,150 100,180 C 55,150 40,110 40,80 C 40,40 70,20 100,20 Z" className="fill-slate-100/30" />
              )}
              
              {/* Mesh grid contours */}
              <path d="M 45,70 Q 100,60 155,70" className="stroke-teal-400/30" />
              <path d="M 40,90 Q 100,85 160,90" className="stroke-pink-400/30" />
              <path d="M 43,110 Q 100,110 157,110" className="stroke-teal-400/30" />
              <path d="M 50,130 Q 100,135 150,130" className="stroke-pink-400/30" />
              <path d="M 100,20 L 100,180" strokeDasharray="2 3" className="stroke-slate-400/45" />

              {/* Forehead contour path zone */}
              <path
                d="M 60,30 C 80,24 120,24 140,30 C 130,42 70,42 60,30 Z"
                onClick={() => applyBrushToZone("forehead_contour")}
                className="cursor-pointer hover:stroke-pink-400 hover:stroke-[1.8] transition fill-current"
                style={{
                  color: appliedZones.forehead_contour || "transparent",
                  fillOpacity: appliedZones.forehead_contour !== "transparent" ? (arFilterMode === "minimal_sculpt" ? 0.35 : 0.65) : 0
                }}
              />

              {/* Cheek contour left & right zones */}
              <path
                d="M 45,100 C 50,115 70,125 85,125 C 75,115 55,105 45,100 Z"
                onClick={() => applyBrushToZone("cheeks_contour")}
                className="cursor-pointer hover:stroke-pink-400 hover:stroke-[1.8] transition fill-current"
                style={{
                  color: appliedZones.cheeks_contour || "transparent",
                  fillOpacity: appliedZones.cheeks_contour !== "transparent" ? (arFilterMode === "minimal_sculpt" ? 0.4 : 0.70) : 0
                }}
              />
              <path
                d="M 155,100 C 150,115 130,125 115,125 C 125,115 145,105 155,100 Z"
                onClick={() => applyBrushToZone("cheeks_contour")}
                className="cursor-pointer hover:stroke-pink-400 hover:stroke-[1.8] transition fill-current"
                style={{
                  color: appliedZones.cheeks_contour || "transparent",
                  fillOpacity: appliedZones.cheeks_contour !== "transparent" ? (arFilterMode === "minimal_sculpt" ? 0.4 : 0.70) : 0
                }}
              />

              {/* Nose profile contour */}
              <path
                d="M 94,80 L 94,120 L 106,120 L 106,80 Z"
                onClick={() => applyBrushToZone("nose_contour")}
                className="cursor-pointer hover:stroke-pink-400 hover:stroke-[1.8] transition fill-current"
                style={{
                  color: appliedZones.nose_contour || "transparent",
                  fillOpacity: appliedZones.nose_contour !== "transparent" ? (arFilterMode === "minimal_sculpt" ? 0.3 : 0.55) : 0
                }}
              />

              {/* Blush Apples Left & Right */}
              <circle
                cx="70"
                cy="95"
                r="14"
                onClick={() => applyBrushToZone("blush_apples")}
                className="cursor-pointer hover:stroke-pink-400 hover:stroke-[1.8] transition fill-current"
                style={{
                  color: appliedZones.blush_apples || "transparent",
                  fillOpacity: appliedZones.blush_apples !== "transparent" ? (arFilterMode === "minimal_sculpt" ? 0.3 : 0.55) : 0
                }}
              />
              <circle
                cx="130"
                cy="95"
                r="14"
                onClick={() => applyBrushToZone("blush_apples")}
                className="cursor-pointer hover:stroke-pink-400 hover:stroke-[1.8] transition fill-current"
                style={{
                  color: appliedZones.blush_apples || "transparent",
                  fillOpacity: appliedZones.blush_apples !== "transparent" ? (arFilterMode === "minimal_sculpt" ? 0.3 : 0.55) : 0
                }}
              />

              {/* Cheek Highlights */}
              <ellipse
                cx="68"
                cy="80"
                rx="14"
                ry="4"
                onClick={() => applyBrushToZone("cheek_high")}
                className="cursor-pointer hover:stroke-pink-400 hover:stroke-[1.8] transition fill-current"
                style={{
                  color: appliedZones.cheek_high || "transparent",
                  fillOpacity: appliedZones.cheek_high !== "transparent" ? (arFilterMode === "minimal_sculpt" ? 0.45 : 0.75) : 0
                }}
              />
              <ellipse
                cx="132"
                cy="80"
                rx="14"
                ry="4"
                onClick={() => applyBrushToZone("cheek_high")}
                className="cursor-pointer hover:stroke-pink-400 hover:stroke-[1.8] transition fill-current"
                style={{
                  color: appliedZones.cheek_high || "transparent",
                  fillOpacity: appliedZones.cheek_high !== "transparent" ? (arFilterMode === "minimal_sculpt" ? 0.45 : 0.75) : 0
                }}
              />

              {/* Nose Bridge Highlighter */}
              <rect
                x="97"
                y="65"
                width="6"
                height="45"
                rx="3"
                onClick={() => applyBrushToZone("nose_bridge_high")}
                className="cursor-pointer hover:stroke-pink-400 hover:stroke-[1.8] transition fill-current"
                style={{
                  color: appliedZones.nose_bridge_high || "transparent",
                  fillOpacity: appliedZones.nose_bridge_high !== "transparent" ? (arFilterMode === "minimal_sculpt" ? 0.5 : 0.8) : 0
                }}
              />

              {/* Beautiful lips center vector */}
              <path
                d="M 80,140 Q 100,133 120,140 Q 110,154 100,154 Q 90,154 80,140 Z"
                onClick={() => applyBrushToZone("lips")}
                className="cursor-pointer hover:stroke-pink-400 hover:stroke-[1.8] transition fill-current"
                style={{
                  color: appliedZones.lips || "transparent",
                  fillOpacity: appliedZones.lips !== "transparent" ? (arFilterMode === "minimal_sculpt" ? 0.55 : 0.85) : 0
                }}
              />
            </svg>
          </div>

          <div className="mt-4 flex gap-3 text-[10px] bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-500 shadow-2xs">
            <span className="flex items-center gap-1 font-mono">
              <span className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: activeContourColor }} /> Active Bronzer
            </span>
            <span className="flex items-center gap-1 font-mono">
              <span className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: activeBlushColor }} /> Active Blush
            </span>
            <span className="flex items-center gap-1 font-mono">
              <span className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: activeHighlightColor }} /> Active Tint
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

