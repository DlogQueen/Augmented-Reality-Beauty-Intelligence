import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, ShieldCheck, Heart, Compass, Cpu, Info, User, BookOpen, AlertCircle, RefreshCw, Layers } from "lucide-react";
import { UserProfile } from "../types";
import { doc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";

interface OnboardingModalProps {
  userProfile: UserProfile;
  onCompleted: (updatedProfile: UserProfile) => void;
}

export default function OnboardingModal({ userProfile, onCompleted }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Preference setup step form state
  const [skinUndertone, setSkinUndertone] = useState<string>("Neutral");
  const [skinTexture, setSkinTexture] = useState<string>("Normal");
  const [makeupStyle, setMakeupStyle] = useState<string>("Natural");
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [favoriteProducts, setFavoriteProducts] = useState<string>("");

  const steps = [
    {
      title: "Welcome to Spectra A.R.I.",
      subtitle: "Augmented Reality Intelligence & Sculpt Lab",
      description: "You're entering a beauty ecosystem designed differently. Built by Ryleigh, a female senior software engineer with a top-tier passion for high-tech cosmetic chemistry, Spectra is design-optimized to help women. Meet Sasha, our top-of-the-line AI guide who will lead your personalized tutorials.",
      content: (
        <div className="space-y-3.5">
          {/* Clarification on WHAT IS A.R.I. */}
          <div className="bg-gradient-to-tr from-pink-500/10 via-teal-500/5 to-pink-500/5 p-4 rounded-2xl border border-pink-200/70 text-left">
            <h4 className="text-[11px] font-mono text-pink-600 font-extrabold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <span className="p-1 px-1.5 bg-pink-100 rounded text-pink-700 text-[10px] font-bold">Q&A</span> Let's decode: "What is A.R.I.?"
            </h4>
            <p className="text-xs text-slate-700 font-bold leading-snug">
              A.R.I. stands for <span className="text-pink-600 font-black underline decoration-teal-400">Augmented Reality Intelligence</span>.
            </p>
            <div className="mt-2 text-[11px] text-slate-600 space-y-1.5">
              <p>
                <strong className="text-slate-800">✨ Augmented Reality:</strong> We don't just give text advice. Spectra fits a coordinate framework directly onto your facial contours (3D Face map) so you can visually see exactly where to sculpt.
              </p>
              <p>
                <strong className="text-teal-600 font-bold">🧠 Deep Intelligence:</strong> Rather than generic web quizzes, our dermal neural engine scans actual skin pigment patterns, warmth index, and undertone balances.
              </p>
            </div>
          </div>

          <div className="flex gap-2.5 items-center p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-500 text-left">
            <Layers className="w-5 h-5 text-teal-500 shrink-0" />
            <p className="leading-snug">
              No more guesswork. A.R.I. merges advanced software engineering with cosmetic chemistry to create professional-grade shadow guides just for you.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Hi, I'm Sasha!",
      subtitle: "Your AI Senior Makeup Coach & Cosmetics Architect",
      description: "My goal is to empower women through technical transparency. Here are the core modules we offer inside Spectra to help expand your beauty repertoire:",
      content: (
        <div className="grid grid-cols-2 gap-2.5 text-left text-xs">
          <div className="p-3 bg-white border border-pink-100/60 rounded-xl hover:border-pink-300 transition-colors">
            <Compass className="w-4 h-4 text-teal-500 mb-1" />
            <span className="font-extrabold text-slate-800 block">Skin Test Scanner</span>
            <span className="text-[10px] text-slate-400">Deep, real-time image & webcam skin analysis.</span>
          </div>
          <div className="p-3 bg-white border border-pink-100/60 rounded-xl hover:border-pink-300 transition-colors">
            <Sparkles className="w-4 h-4 text-pink-500 mb-1" />
            <span className="font-extrabold text-slate-800 block">3D Try-On Studio</span>
            <span className="text-[10px] text-slate-400">Interactive holographic face placement guidelines.</span>
          </div>
          <div className="p-3 bg-white border border-pink-100/60 rounded-xl hover:border-pink-300 transition-colors">
            <Cpu className="w-4 h-4 text-pink-600 mb-1" />
            <span className="font-extrabold text-slate-800 block">Voice Speech Coach</span>
            <span className="text-[10px] text-slate-400">Play hands-free tutorials or talk to Sasha directly!</span>
          </div>
          <div className="p-3 bg-white border border-pink-100/60 rounded-xl hover:border-pink-300 transition-colors">
            <Heart className="w-4 h-4 text-teal-600 mb-1" />
            <span className="font-extrabold text-slate-800 block">Social Lookbook</span>
            <span className="text-[10px] text-slate-400">Share shade recipes and collaborate safely.</span>
          </div>
        </div>
      )
    },
    {
      title: "Security & Social Bio Safety",
      subtitle: "Zero-Trust Privacy Filters Implemented",
      description: "Your trust is our absolute priority. Unlike platforms that trade your personal image data, we build decentralized, secure social constructs.",
      content: (
        <div className="space-y-3 text-xs">
          <div className="p-3.5 bg-teal-50/40 rounded-xl border border-teal-150">
            <p className="font-bold text-slate-800 mb-1 flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-teal-600" /> Private Profiles
            </p>
            <p className="text-[11px] text-slate-500 leading-normal">
              Toggle your profile private to restrict random users from querying your profile on peer feeds or initiating direct DMs. Your biometric records are secure.
            </p>
          </div>
          <div className="p-3.5 bg-pink-50/40 rounded-xl border border-pink-150">
            <p className="font-bold text-slate-800 mb-1 flex items-center gap-1.5 text-xs">
              <AlertCircle className="w-4 h-4 text-pink-600" /> Safe Communications
            </p>
            <p className="text-[11px] text-slate-500 leading-normal">
              Direct messenger chats utilize secure Firestore sandboxes. You choose when to reply. We do not expose PII or email, even on public channels!
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Quick-Start Cosmetics Setup",
      subtitle: "Pre-configure your skin benchmarks for Sasha's AI guide",
      description: "Let's setup your beautiful baseline preferences. You can customize these details anytime on your profile tab.",
      content: (
        <div className="space-y-3.5 text-left text-xs bg-white p-2.5 rounded-xl border border-pink-100/30">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-pink-600 font-mono tracking-wider uppercase mb-1">
                Skin Undertone
              </label>
              <select
                value={skinUndertone}
                onChange={(e) => setSkinUndertone(e.target.value)}
                className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-pink-100"
              >
                <option value="Warm">Warm (Golden, Yellowish)</option>
                <option value="Cool">Cool (Rosy, Pinkish)</option>
                <option value="Neutral">Neutral (Balanced Undertones)</option>
                <option value="Olive">Olive (Greenish Hue)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-pink-600 font-mono tracking-wider uppercase mb-1">
                Skin Texture
              </label>
              <select
                value={skinTexture}
                onChange={(e) => setSkinTexture(e.target.value)}
                className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-pink-100"
              >
                <option value="Normal">Normal</option>
                <option value="Dry">Dry</option>
                <option value="Oily">Oily</option>
                <option value="Combination">Combination</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-pink-600 font-mono tracking-wider uppercase mb-1">
                Preferred Makeup Style
              </label>
              <select
                value={makeupStyle}
                onChange={(e) => setMakeupStyle(e.target.value)}
                className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-pink-100"
              >
                <option value="Natural">Natural / No-Makeup</option>
                <option value="Glam">Glam / Intense Sculpt</option>
                <option value="Minimalist">Minimalist / Clean</option>
                <option value="Corporate">Corporate / High Definition</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-pink-600 font-mono tracking-wider uppercase mb-1">
                Profile Visibility
              </label>
              <div className="flex items-center gap-2 h-9">
                <input
                  type="checkbox"
                  id="onb-private-toggle"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded text-teal-600 border-pink-200 focus:ring-pink-400 w-4.5 h-4.5 cursor-pointer"
                />
                <label htmlFor="onb-private-toggle" className="text-[11px] font-bold text-slate-600 cursor-pointer">
                  Private Profile Security
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-pink-600 font-mono tracking-wider uppercase mb-1">
              Favorite Makeup Products / Brands (Comma Separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Rare Beauty, Tower 28, Fenty Glow"
              value={favoriteProducts}
              onChange={(e) => setFavoriteProducts(e.target.value)}
              className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-pink-100"
            />
          </div>
        </div>
      )
    }
  ];

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setLoading(true);
      // Process favorite products array
      const prodArray = favoriteProducts
        ? favoriteProducts.split(",").map((s) => s.trim()).filter((s) => s.length > 0)
        : [];

      const docRef = doc(db, "users", userProfile.userId);
      const updatedProfile: UserProfile = {
        ...userProfile,
        skinUndertone,
        skinTexture,
        makeupStyle,
        isPrivateProfile: isPrivate,
        favoriteProducts: prodArray,
        onboardingCompleted: true
      };

      try {
        await updateDoc(docRef, {
          skinUndertone,
          skinTexture,
          makeupStyle,
          isPrivateProfile: isPrivate,
          favoriteProducts: prodArray,
          onboardingCompleted: true
        });
        onCompleted(updatedProfile);
      } catch (err) {
        // Fallback locally if network rules or Firestore config is setting up
        console.warn("Writing onboarding fields failed, calling localized state completion option.", err);
        onCompleted(updatedProfile);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white/95 rounded-3xl border border-pink-150 shadow-2xl relative overflow-hidden text-center flex flex-col justify-between"
      >
        {/* Header graphics tie-dye bar */}
        <div className="h-2 bg-gradient-to-r from-teal-400 via-pink-400 to-pink-600" />

        {/* Floating Sasha Avatar Icon */}
        <div className="mt-6 flex justify-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-300 to-teal-300 p-0.5 shadow-md flex items-center justify-center animate-pulse">
              <img
                src={userProfile.photoURL || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150"}
                alt="Sasha"
                className="w-full h-full object-cover rounded-full border border-white"
              />
            </div>
            <div className="absolute -bottom-1.5 -right-1 bg-teal-500 text-white rounded-full p-1 border border-white shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <div className="px-6 pt-4">
          <p className="text-[10px] font-mono font-bold text-pink-600 tracking-widest uppercase">
            {steps[currentStep].subtitle}
          </p>
          <h2 className="text-xl font-black text-slate-800 tracking-tight mt-1">
            {steps[currentStep].title}
          </h2>
          <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
            {steps[currentStep].description}
          </p>
        </div>

        {/* Content Container */}
        <div className="px-6 py-5 min-h-[220px] flex items-center justify-center">
          <div className="w-full">
            {steps[currentStep].content}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-5 bg-pink-50/20 border-t border-pink-100/50 flex items-center justify-between">
          {/* Progress Markers */}
          <div className="flex gap-1.5">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentStep === idx ? "w-5 bg-pink-500" : "w-1.5 bg-slate-200"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-bold font-mono uppercase tracking-widest cursor-pointer"
              >
                Back
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={loading}
              className="flex items-center gap-1.5 px-6 py-2 bg-gradient-to-r from-teal-500 to-pink-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:scale-102 hover:shadow-2xs active:scale-[0.99] cursor-pointer transition-all disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : currentStep === steps.length - 1 ? (
                "Settle In & Explore Sasha"
              ) : (
                <>
                  Next <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
