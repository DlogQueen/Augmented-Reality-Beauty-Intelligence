import React, { useState, useRef, useEffect } from "react";
import { Camera, Sparkles, RefreshCw, Layers, Sliders, ShieldCheck, Heart, ArrowRight, Upload, X, FileImage } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { UserProfile } from "../types";

interface DiagnosticResult {
  undertone: "Warm" | "Cool" | "Neutral" | "Olive" | string;
  texture: "Dry" | "Oily" | "Combination" | "Normal" | string;
  diagnosticSummary: string;
  makeupProducts: {
    foundation: { name: string; hex: string };
    concealer: { name: string; hex: string };
    blush: { name: string; hex: string };
    highlighter: { name: string; hex: string };
  };
  contourGuides: {
    forehead: string;
    cheeks: string;
    jawline: string;
    nose: string;
  };
}

interface AriDiagnosticProps {
  userProfile: UserProfile | null;
  onDiagnosticComplete: (result: DiagnosticResult) => void;
}

const DEMO_PROFILES = [
  {
    name: "Aisha (Warm Honey / Glow)",
    undertone: "Warm",
    texture: "Combination",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
    summary: "Radiant golden-bronze undertones with subtle cheek highlights and combination hydration along the T-zone.",
    products: {
      foundation: { name: "Golden Honey 340", hex: "#c68e62" },
      concealer: { name: "Warm Amber 12", hex: "#d9a073" },
      blush: { name: "Tangerine Sunset Blush", hex: "#e28761" },
      highlighter: { name: "Gilded Gold Highlighter", hex: "#f1d4ab" }
    },
    guides: {
      forehead: "Apply contour upward into the hairline to blend the forehead seamlessly.",
      cheeks: "Brush contour from the top of the ear downward, fading out before the laugh lines.",
      jawline: "Define from behind the ear lobe down to the chin, blending downward over the neck.",
      nose: "Run slender lines down both sides of the nose bridge, meeting in a delicate tip-V."
    }
  },
  {
    name: "Emilia (Olive Tan / Silk)",
    undertone: "Olive",
    texture: "Normal",
    photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400",
    summary: "Flawless neutral-olive skin undertone with very balanced natural barrier protection and satin-like reflectivity.",
    products: {
      foundation: { name: "Olive Sand 210", hex: "#d5ac88" },
      concealer: { name: "Buff Beige 05", hex: "#e7c2a4" },
      blush: { name: "Dusty Plum Blush", hex: "#b87070" },
      highlighter: { name: "Champagne Frost Highlighter", hex: "#eedab8" }
    },
    guides: {
      forehead: "Shade along the temples to create a classic soft-oval structural shadow.",
      cheeks: "Contour deeply under the zygomatic arch, lifting the cheekbones visually.",
      jawline: "Brush contour under the jaw bone to conceal soft curves and enhance angular lines.",
      nose: "Keep bridge lines narrow and blend thoroughly outwards for a natural filter finish."
    }
  },
  {
    name: "Clara (Cool Rose / Ivory)",
    undertone: "Cool",
    texture: "Dry",
    photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400",
    summary: "Delicate pink-porcelaine undertones with light moisture depletion, calling for rich dewy-hydrate cosmetics.",
    products: {
      foundation: { name: "Alabaster Rose 110", hex: "#ebd1bc" },
      concealer: { name: "Cool Fair 02", hex: "#f3dfd0" },
      blush: { name: "Petal Pink Cream Blush", hex: "#e090a2" },
      highlighter: { name: "Ice Opal Glow Highlighter", hex: "#fcebf3" }
    },
    guides: {
      forehead: "Dust blush light along the upper hair forehead points for full face cohesion.",
      cheeks: "Hollow out cheek contours slightly higher up to lift light and fair structures.",
      jawline: "Trace the underside of the jaw with cool shadow tones to avoid warmer staining.",
      nose: "Softly taper the nose tip with a delicate horizontal smudge of highlights."
    }
  }
];

export default function AriDiagnostic({ userProfile, onDiagnosticComplete }: AriDiagnosticProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanStep, setScanStep] = useState("");
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [diagnosedInfo, setDiagnosedInfo] = useState<DiagnosticResult | null>(null);

  // File Upload Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setErrorStatus(null);
    setUploadedPreview(null);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera permissions ignored/failed:", err);
      setErrorStatus("Could not fetch camera feed. Using our beautiful Drag-and-Drop Uploader below or select a diagnostic preset models instead!");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const selectDemo = (demo: typeof DEMO_PROFILES[0]) => {
    setLoading(true);
    setUploadedPreview(demo.photo);
    setScanStep("Reading skin pigmentation indexes...");
    setTimeout(() => {
      setScanStep("Synthesizing dermal micro-texture parameters...");
      setTimeout(() => {
        const result: DiagnosticResult = {
          undertone: demo.undertone,
          texture: demo.texture,
          diagnosticSummary: demo.summary,
          makeupProducts: demo.products,
          contourGuides: demo.guides
        };
        setDiagnosedInfo(result);
        onDiagnosticComplete(result);
        setLoading(false);
        setScanStep("");
      }, 1000);
    }, 1000);
  };

  // Generalized image analysis connector
  const analyzeImageContent = async (base64Image: string, mimeType: string = "image/jpeg") => {
    setLoading(true);
    setErrorStatus(null);
    setScanStep("Consulting A.R.I. Vision Diagnostic Neural Engine...");

    try {
      const response = await fetch("/api/gemini/analyze-skin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Image, mimeType })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Vision Analysis API failed. Let's try uploading another premium image portrait!");
      }

      const data: DiagnosticResult = await response.json();
      setDiagnosedInfo(data);
      onDiagnosticComplete(data);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "An unexpected error occurred during cloud diagnosis.");
    } finally {
      setLoading(false);
      setScanStep("");
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setLoading(true);
    setScanStep("Capturing face vector coordinate frames...");

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not acquire 2D canvas frame context");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const base64Image = canvas.toDataURL("image/jpeg", 0.85);
      setUploadedPreview(base64Image);
      stopCamera();

      await analyzeImageContent(base64Image, "image/jpeg");
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "An unexpected error occurred during camera frame analysis.");
      setLoading(false);
      setScanStep("");
    }
  };

  // Drag and Drop File Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorStatus("A.R.I. Diagnostics exclusively analyzes image portraits (JPEG/PNG/HEIC). Please choose a correct image file!");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Result = event.target?.result as string;
      if (base64Result) {
        setUploadedPreview(base64Result);
        // Turn off camera if running
        stopCamera();
        // Send base64 to api
        await analyzeImageContent(base64Result, file.type);
      }
    };
    reader.onerror = () => {
      setErrorStatus("Failed to correctly encode portrait as base64 stream.");
    };
    reader.readAsDataURL(file);
  };

  const saveToProfile = async () => {
    if (!diagnosedInfo) return;
    const user = auth.currentUser;
    if (!user) {
      alert("Please authenticate using the login option in the profile tab to synchronize saved looks!");
      return;
    }
    setLoading(true);
    const docPath = `users/${user.uid}`;
    try {
      await setDoc(doc(db, "users", user.uid), {
        userId: user.uid,
        email: user.email || "",
        displayName: user.displayName || "Cosmetics Enthusiast",
        photoURL: user.photoURL || "",
        skinUndertone: diagnosedInfo.undertone,
        skinTexture: diagnosedInfo.texture,
        makeupStyle: "Glam",
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert("Gorgeous! Your personalized undertone diagnostics are safely synchronized with your Cloud Profile!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="ari-diagnostic" className="bg-white/80 backdrop-blur-md rounded-2xl border border-pink-200/60 p-6 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-pink-100 pb-5 mb-6">
        <div>
          <span className="text-xs font-mono text-teal-600 font-bold tracking-wider uppercase block mb-1">
            🦄 Core Diagnostic System
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <span className="bg-gradient-to-r from-teal-600 via-pink-500 to-pink-600 bg-clip-text text-transparent">A.R.I. Neural Face Scanner</span>
            <Sparkles className="w-5 h-5 text-pink-500 animate-pulse" />
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Real-time biometric analysis mapping structural bone shadows, undertone temperature, and skin moisture metrics.
          </p>
        </div>
        <div className="flex gap-2">
          {!cameraActive ? (
            <button
              id="btn-start-camera"
              onClick={startCamera}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-pink-500 font-bold text-white rounded-xl text-sm hover:scale-103 hover:shadow-md transition cursor-pointer"
            >
              <Camera className="w-4 h-4" /> Start Face Scanner
            </button>
          ) : (
            <button
              id="btn-stop-camera"
              onClick={stopCamera}
              className="px-5 py-2.5 bg-slate-600 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition cursor-pointer"
            >
              Cancel Camera
            </button>
          )}
        </div>
      </div>

      {errorStatus && (
        <div className="bg-pink-50/50 backdrop-blur-xs border border-pink-200 rounded-xl p-4 text-slate-700 text-sm mb-6 flex flex-col gap-2">
          <p className="font-bold text-pink-700">Notice for Dev Testing:</p>
          <p>{errorStatus}</p>
        </div>
      )}

      {/* RENDER ACTIVE CAMERA OR DRAG & DROP FILE ZONE */}
      {cameraActive ? (
        <div className="relative mb-6 mx-auto max-w-md aspect-[4/3] rounded-2xl overflow-hidden bg-black border-2 border-pink-400 shadow-lg">
          <video
            ref={videoRef}
            className="w-full h-full object-cover scale-x-[-1]"
            playsInline
            muted
          />
          {/* Diagnostic Overlay Lines */}
          <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-teal-400/40 m-6 rounded-full flex items-center justify-center">
            <div className="text-center text-white/50 text-[10px] uppercase tracking-widest font-mono">
              Align Face In Center Vector
            </div>
          </div>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center animate-pulse">
            <button
              onClick={captureAndAnalyze}
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-pink-500 text-white rounded-xl font-semibold shadow-md border border-white/20 hover:scale-105 transition disabled:opacity-50"
            >
              {loading ? "Analyzing face..." : "Snap & Match Shades"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch text-left">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById("portrait-file-input")?.click()}
            className={`min-h-[220px] rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
              isDragging
                ? "bg-pink-50/40 border-pink-500 scale-[0.99] shadow-inner"
                : "bg-white/90 border-pink-200/60 hover:border-teal-400 hover:bg-pink-50/10 hover:shadow-2xs"
            }`}
          >
            <input
              id="portrait-file-input"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-teal-100 to-pink-100 flex items-center justify-center mb-3 text-pink-500 shadow-3xs">
              <Upload className="w-6 h-6 text-pink-600" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-800 leading-tight">
              Drag & Drop Portrait Photo
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[280px]">
              Or <span className="text-teal-600 font-extrabold underline">browse device files</span> to run real-time dermal vector scanning.
            </p>
            <p className="text-[9px] font-mono text-pink-500 font-bold uppercase tracking-widest mt-2">
              Gemini Multimodal V3.5 Active
            </p>
          </div>

          {/* Uploaded Portrait Preview / Biometric HUD */}
          <div className="rounded-2xl border border-pink-100/60 bg-white/65 p-4 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[220px]">
            {uploadedPreview ? (
              <div className="w-full h-full flex flex-col items-center justify-between">
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-teal-400 shadow-md">
                  <img
                    src={uploadedPreview}
                    alt="Uploaded Biometric Frame"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end justify-center pb-1">
                    <span className="text-[8px] font-mono text-teal-300 font-bold tracking-widest uppercase">
                      HUD Frame
                    </span>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-xs font-bold text-slate-700">Identified Portrait Active</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Ready for automated contour guides</p>
                  
                  <button
                    onClick={() => {
                      setUploadedPreview(null);
                      setDiagnosedInfo(null);
                    }}
                    className="mt-2.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-mono font-bold uppercase rounded-lg border border-slate-200 transition-all flex items-center gap-1 mx-auto"
                  >
                    <X className="w-3 h-3" /> Clear Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-4">
                <FileImage className="w-10 h-10 text-slate-300 mb-3" />
                <h5 className="text-xs font-bold text-slate-500">No Image Uploaded Yet</h5>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[240px]">
                  Use the uploader, launch the camera feed, or tap any testing preset model below.
                </p>
              </div>
            )}
            
            {/* Background absolute tie-dye auras */}
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-teal-400/5 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -top-8 -left-8 w-24 h-24 bg-pink-400/5 rounded-full blur-xl pointer-events-none" />
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* SCANNING LOADING SCREEN */}
      {loading && (
        <div className="flex flex-col items-center justify-center p-12 bg-white/90 backdrop-blur-sm rounded-2xl border border-pink-100 mb-6 shadow-xs">
          <RefreshCw className="w-10 h-10 text-pink-500 animate-spin mb-4" />
          <p className="text-slate-800 font-semibold text-lg">{scanStep}</p>
          <p className="text-slate-400 text-xs mt-1">Refining matching hues using cosmetics physics...</p>
        </div>
      )}

      {/* DIAGNOSIS RESULTS SHOWN HERE */}
      {diagnosedInfo && !loading && (
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-pink-150 p-6 mb-6 shadow-xs animate-fade-in">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4 border-b border-pink-100/50 pb-3">
                <ShieldCheck className="w-6 h-6 text-teal-500" />
                <h3 className="text-lg font-bold text-slate-800">Dermal Diagnostics Completed</h3>
              </div>

              {/* Badges */}
              <div className="flex gap-2 mb-4">
                <span className="px-3 py-1 bg-pink-100/50 text-pink-700 text-xs font-bold rounded-full border border-pink-200/50 uppercase font-mono">
                  Undertone: {diagnosedInfo.undertone}
                </span>
                <span className="px-3 py-1 bg-teal-100/50 text-teal-800 text-xs font-bold rounded-full border border-teal-200/50 uppercase font-mono">
                  Texture: {diagnosedInfo.texture}
                </span>
              </div>

              <p className="text-slate-600 leading-relaxed text-sm bg-pink-50/20 backdrop-blur-xs p-4 rounded-xl border border-pink-100/50 italic mb-5">
                &ldquo;{diagnosedInfo.diagnosticSummary}&rdquo;
              </p>

              {/* Product Match Grid */}
              <h4 className="font-extrabold text-slate-800 text-sm mb-3 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-pink-500" /> Data-Driven Shade Matches
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(diagnosedInfo.makeupProducts).map(([key, item]) => {
                  const value = item as { name: string; hex: string };
                  return (
                    <div key={key} className="p-3 bg-white/90 rounded-xl border border-pink-100/40 flex items-center gap-3 hover:shadow-xs transition duration-200">
                      <div
                        className="w-10 h-10 rounded-full border border-slate-200/60 shrink-0 shadow-inner"
                        style={{ backgroundColor: value.hex }}
                      />
                      <div>
                        <p className="text-[10px] text-pink-500 uppercase tracking-wider font-bold font-mono">{key}</p>
                        <p className="text-xs font-bold text-slate-700 leading-tight">{value.name}</p>
                        <p className="text-[10px] font-mono text-slate-400 font-semibold">{value.hex}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {auth.currentUser && (
                <button
                  onClick={saveToProfile}
                  className="mt-6 flex items-center gap-2 text-xs font-bold text-pink-600 hover:text-pink-700 cursor-pointer underline uppercase font-mono"
                >
                  <Sparkles className="w-4 h-4 animate-bounce" /> Sync results to your cloud profile
                </button>
              )}
            </div>

            <div className="flex-1 bg-teal-50/10 backdrop-blur-xs rounded-xl p-5 border border-teal-100/40 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-1.5 border-b border-teal-100/40 pb-2">
                  <Sliders className="w-4 h-4 text-teal-600" /> Dynamic Contouring Vectors
                </h4>
                <div className="space-y-4 text-xs text-slate-600">
                  <div className="bg-white/60 p-2.5 rounded-lg border border-teal-100/20">
                    <span className="font-bold text-teal-800 block mb-1">👤 Forehead Guide</span>
                    <p>{diagnosedInfo.contourGuides.forehead}</p>
                  </div>
                  <div className="bg-white/60 p-2.5 rounded-lg border border-teal-100/20">
                    <span className="font-bold text-teal-800 block mb-1">✨ Cheekbone Sculpting</span>
                    <p>{diagnosedInfo.contourGuides.cheeks}</p>
                  </div>
                  <div className="bg-white/60 p-2.5 rounded-lg border border-teal-100/20">
                    <span className="font-bold text-teal-800 block mb-1">📐 Jaw Tapering</span>
                    <p>{diagnosedInfo.contourGuides.jawline}</p>
                  </div>
                  <div className="bg-white/60 p-2.5 rounded-lg border border-teal-100/20">
                    <span className="font-bold text-teal-800 block mb-1">👃 Nose Shader</span>
                    <p>{diagnosedInfo.contourGuides.nose}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SAMPLE MODELS FOR QUICK IN-PREVIEW CHAT DEPLOYMENT */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-pink-100/60 p-5 shadow-xs">
        <h3 className="font-black text-slate-800 text-sm mb-2 flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-pink-500 fill-pink-500/30" /> Simulated Face Presets for Fast Testing
        </h3>
        <p className="text-slate-500 text-xs mb-4 leading-relaxed">
          For quick evaluation in the live container without requesting webcam telemetry permissions, select one of Ryleigh's prepared skin profiles:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DEMO_PROFILES.map((demo) => (
            <div
              key={demo.name}
              onClick={() => selectDemo(demo)}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-pink-300 hover:bg-pink-100/20 cursor-pointer transition-all duration-200 shadow-2xs group hover:scale-102"
            >
              <img
                src={demo.photo}
                alt={demo.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition"
                referrerPolicy="no-referrer"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 leading-tight truncate group-hover:text-pink-600">
                  {demo.name}
                </p>
                <div className="flex gap-1.5 mt-1">
                  <span className="text-[9px] bg-pink-100/80 text-pink-700 px-1.5 py-0.5 rounded font-bold font-mono">
                    {demo.undertone}
                  </span>
                  <span className="text-[9px] bg-teal-100/80 text-teal-800 px-1.5 py-0.5 rounded font-bold font-mono">
                    {demo.texture}
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 ml-auto text-slate-300 group-hover:translate-x-1 group-hover:text-pink-500 transition shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

