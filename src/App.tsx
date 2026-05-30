import { useState, useEffect } from "react";
import { Sparkles, Heart, Compass, MessageSquare, ShieldCheck, HelpCircle, BarChart3, User, Laptop2, Menu, LogOut, CheckCircle, Info, Cpu, Database } from "lucide-react";
import { loginWithGoogle, auth, db, handleFirestoreError, OperationType } from "./firebase";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { UserProfile, SavedLook } from "./types";

// Import custom sub-modules
import AriDiagnostic from "./components/AriDiagnostic";
import FaceMap3D from "./components/FaceMap3D";
import CommunityFeed from "./components/CommunityFeed";
import DirectMessaging from "./components/DirectMessaging";
import VoiceGuide from "./components/VoiceGuide";
import ComparisonBench from "./components/ComparisonBench";
import GroqTrainingStudio from "./components/GroqTrainingStudio";
import OnboardingModal from "./components/OnboardingModal";
import MyProfile from "./components/MyProfile";
import AdminHub from "./components/AdminHub";

export default function App() {
  const [activeTab, setActiveTab] = useState<"diagnostic" | "face_map" | "voice_coach" | "community" | "messaging" | "research" | "groq_studio" | "profile" | "admin">("diagnostic");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // For navigating from post DM button to direct messages tab automatically
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(null);
  const [activeRecipientName, setActiveRecipientName] = useState<string | null>(null);

  // Share shading recipe state to sync from community posts to the face map
  const [importedShades, setImportedShades] = useState<any>(null);

  // Monitor Auth Status Change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFbUser(user);
      if (user) {
        // Fetch or create profile inside Firestore
        const docRef = doc(db, "users", user.uid);
        try {
          const snapshot = await getDoc(docRef);
          if (snapshot.exists()) {
            const data = snapshot.data() as UserProfile;
            setUserProfile(data);
            if (!data.onboardingCompleted) {
              setShowOnboarding(true);
            }
          } else {
            const initialProfile: UserProfile = {
              userId: user.uid,
              displayName: user.displayName || "Cosmetics Architect",
              email: user.email || "",
              photoURL: user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
              onboardingCompleted: false
            };
            await setDoc(docRef, initialProfile);
            setUserProfile(initialProfile);
            setShowOnboarding(true);
          }
        } catch (error) {
           console.warn("Could not sync Firestore profile. Loading local fallback.");
           const localProfile: UserProfile = {
             userId: user.uid,
             displayName: user.displayName || "Cosmetics Architect",
             email: user.email || "",
             photoURL: user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
             onboardingCompleted: false
           };
           setUserProfile(localProfile);
           setShowOnboarding(true);
        }
      } else {
        setUserProfile(null);
        setShowOnboarding(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error("Sign-in failed:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setFbUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error("Sign-out failed:", err);
    }
  };

  const handleSelectUserDM = (targetId: string, targetName: string) => {
    setActiveRecipientId(targetId);
    setActiveRecipientName(targetName);
    setActiveTab("messaging");
  };

  const handleImportShades = (shades: any) => {
    setImportedShades(shades);
  };

  return (
    <div id="beauty-app" className="min-h-screen bg-tie-dye flex flex-col font-sans text-slate-800 antialiased">
      {/* GLAM HEADER */}
      <header className="bg-white/90 backdrop-blur-md border-b border-pink-100 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <img
              src="/src/assets/images/spectari_icon_1779730059129.png"
              alt="Spectra A.R.I. Logo"
              className="w-11 h-11 rounded-1.5xl shadow-md border border-pink-200/50 object-cover hover:scale-105 transition-transform duration-200"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-xl font-black tracking-tight flex items-center gap-1.5 leading-none">
                <span className="bg-gradient-to-r from-teal-500 via-pink-400 to-pink-600 bg-clip-text text-transparent">Spectra A.R.I.</span>
                <span className="text-[10px] bg-teal-100 text-teal-800 font-mono font-bold uppercase py-0.5 px-2 rounded-full tracking-wider animate-pulse">Sasha AI Assistant Live</span>
              </h1>
              <p className="text-[10px] text-pink-600 font-bold mt-1 font-mono tracking-widest uppercase">Augmented Reality Intelligence & Sculpt Simulator by Sasha</p>
            </div>
          </div>

          {/* User Auth controls */}
          <div className="flex items-center gap-3">
            {loading ? (
              <span className="text-xs text-slate-400 font-mono">Syncing Cloud...</span>
            ) : fbUser ? (
              <div 
                onClick={() => setActiveTab("profile")}
                className="flex items-center gap-2.5 bg-white/80 backdrop-blur-xs border border-pink-200 p-1.5 rounded-xl pr-3 shadow-3xs cursor-pointer hover:border-pink-450 hover:bg-pink-50/30 hover:scale-[1.01] transition-all"
                title="View & Customize Your Spectra Profile Settings"
              >
                <img
                  src={fbUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"}
                  alt={fbUser.displayName || "Cosmetics Nerd"}
                  className="w-8 h-8 rounded-full border-2 border-teal-400 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="hidden sm:block text-left overflow-hidden">
                  <p className="text-[11px] font-bold text-slate-800 truncate leading-tight">{fbUser.displayName}</p>
                  <p className="text-[9px] text-teal-600 font-mono uppercase tracking-wider font-bold">Custom Profile Settings</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSignOut();
                  }}
                  className="p-1 px-2.5 bg-pink-50 hover:bg-pink-100 text-pink-700 text-[10px] font-bold tracking-widest uppercase rounded-lg transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="btn-login"
                onClick={handleSignIn}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-pink-500 text-white rounded-xl font-bold text-xs hover:scale-102 hover:shadow-md transition duration-200 cursor-pointer tracking-wider uppercase"
              >
                <User className="w-3.5 h-3.5" /> Login with Google
              </button>
            )}
          </div>
        </div>
      </header>

      {/* CREATOR PASSION COMMENTARY HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-pink-950 text-white py-5 px-6 border-b border-pink-900/30 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-teal-300 font-bold uppercase tracking-wider bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
                👩‍💻 Creator Message
              </span>
              <span className="text-xs font-mono text-pink-300 font-bold uppercase tracking-widest">ryleigh_chemist_v1.4.a</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed italic">
              &ldquo;Welcome back, glorious girls! Ryleigh here. I was styling tie-dye fabric prints and had to script a custom white-teal-pink visual. Our community requested a customized profiles section to track custom skin undertones, favorite cosmetics products, and safety privacy guidelines! Meet Sasha, our senior AI tutor guiding your beauty sculpts. Stay fabulous, and keep engineering beautiful boundaries!&rdquo; 🎨💖🦄
            </p>
          </div>
          <div className="flex gap-2 self-start md:self-center shrink-0 text-slate-300 font-mono text-[9px] uppercase border border-pink-700/20 p-2.5 rounded-lg bg-black/40">
             <span>🚀 THEME: WHITE, TEAL & PINK TIE-DYE</span>
             <span>•</span>
             <span>🌟 SASHA TUTOR & ONBOARDING ACTIVE</span>
          </div>
        </div>
      </div>

      {/* CORE APPLICATION LAYOUT TABS */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col gap-8">
        {/* Navigation Rail / Tab list */}
        <div className="flex flex-wrap gap-2 border-b border-pink-200/50 pb-3">
          {[
            { id: "diagnostic", label: "Skin Test Scanner", icon: Compass },
            { id: "face_map", label: "Try-On Studio & 3D Map", icon: Sparkles },
            { id: "voice_coach", label: "Voice Speech Coach", icon: MessageSquare },
            { id: "community", label: "Peer Social Feed", icon: Heart },
            { id: "messaging", label: "Direct Messenger", icon: ShieldCheck },
            { id: "research", label: "Competitive Benchmarks", icon: BarChart3 },
            { id: "groq_studio", label: "Groq Training Lab", icon: Cpu },
            { id: "profile", label: "My Profile Settings", icon: User },
            { id: "admin", label: "Admin & Payment Hub", icon: Database }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id !== "messaging") {
                    setActiveRecipientId(null);
                    setActiveRecipientName(null);
                  }
                }}
                className={`flex items-center gap-1.5 py-2.5 px-4.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-200 border cursor-pointer ${
                  isSel
                    ? "bg-gradient-to-r from-teal-500 to-pink-500 text-white border-transparent shadow-sm scale-[1.02]"
                    : "bg-white/80 backdrop-blur-xs text-slate-600 border-slate-200/60 hover:bg-pink-50/50 hover:text-slate-800 hover:border-pink-300"
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* NEW WEB APP DOWNLOAD BADGE & CALL TO ACTION BANNER */}
        <div className="bg-gradient-to-tr from-slate-900 via-[#1e111d] to-[#04161a] rounded-3xl p-5 border border-pink-500/20 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 text-center sm:text-left">
            <img
              src="/src/assets/images/spectari_icon_1779730059129.png"
              alt="Spectra A.R.I. Premium Launcher Icon"
              className="w-16 h-16 rounded-2xl shadow-xl border border-pink-400/40 object-cover rotate-[-3deg] hover:rotate-0 transition-transform duration-300 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="bg-pink-500 text-white text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">PWA Offline Mode</span>
                <span className="text-pink-300 text-[10px] font-mono font-bold">★ Play Store Grade Suite ★</span>
              </div>
              <h3 className="text-base font-black tracking-tight text-white leading-tight">
                Download Spectra A.R.I. Web Companion
              </h3>
              <p className="text-slate-300 text-[11px] mt-0.5 max-w-xl leading-normal">
                Add our custom-designed neural cosmetics portal directly to your phone's home screen! Built by Ryleigh with Sasha's real-time computer vision guides entirely stored locally.
              </p>
            </div>
          </div>

          <div className="flex gap-2.5 shrink-0 relative z-10 w-full sm:w-auto justify-center sm:justify-start">
            <button
              onClick={() => {
                alert("✨ Spectra A.R.I. Companion successfully initialized as a high-fidelity Progressive Web App!\n\n🌸 Launcher Icon applied: Cyber Minimalist Obsidian Sphere.\n🔬 Platform targets: Android APK Package & Chrome Standalone Sandbox.\n\nReady to glow offline on your device, doll!");
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-teal-400 via-pink-400 to-pink-500 hover:from-teal-500 hover:to-pink-600 text-white text-xs font-black rounded-xl hover:scale-103 transition cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <span>📲 Install Home Screen</span>
            </button>
            <button
              onClick={() => {
                const element = document.createElement("a");
                element.href = "/src/assets/images/spectari_icon_1779730059129.png";
                element.download = "Spectra_ARI_Icon.png";
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              }}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              📥 Save PNG
            </button>
          </div>
        </div>

        {/* ACTIVE MODULE CONTAINER */}
        <div className="flex-1 min-h-[400px]">
          {activeTab === "diagnostic" && (
            <AriDiagnostic
              userProfile={userProfile}
              onDiagnosticComplete={(res) => {
                // Pre-configure the imported shades automatically!
                setImportedShades({
                  foundationName: res.makeupProducts.foundation.name,
                  foundationHex: res.makeupProducts.foundation.hex,
                  blushName: res.makeupProducts.blush.name,
                  blushHex: res.makeupProducts.blush.hex,
                  highlighterName: res.makeupProducts.highlighter.name,
                  highlighterHex: res.makeupProducts.highlighter.hex
                });
              }}
            />
          )}

          {activeTab === "face_map" && (
            <FaceMap3D initialShades={importedShades} />
          )}

          {activeTab === "voice_coach" && (
            <VoiceGuide />
          )}

          {activeTab === "community" && (
            <CommunityFeed
              userProfile={userProfile}
              onSelectUserForDM={handleSelectUserDM}
              onImportShades={handleImportShades}
            />
          )}

          {activeTab === "messaging" && (
            <DirectMessaging
              userProfile={userProfile}
              activeRecipientId={activeRecipientId}
              activeRecipientName={activeRecipientName}
              onClearRecipient={() => {
                setActiveRecipientId(null);
                setActiveRecipientName(null);
              }}
            />
          )}

          {activeTab === "research" && (
            <ComparisonBench />
          )}

          {activeTab === "groq_studio" && (
            <GroqTrainingStudio />
          )}

          {activeTab === "profile" && (
            <MyProfile
              userProfile={userProfile}
              onProfileUpdated={(updated) => {
                setUserProfile(updated);
              }}
              onProfileWiped={() => {
                if (auth.currentUser) {
                  setUserProfile({
                    userId: auth.currentUser.uid,
                     displayName: "Cosmetics Architect",
                     email: auth.currentUser.email || "",
                     photoURL: auth.currentUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
                     onboardingCompleted: true
                  });
                }
              }}
            />
          )}

          {activeTab === "admin" && (
            <AdminHub
              userProfile={userProfile}
              onProfileUpdated={(updated) => {
                setUserProfile(updated);
              }}
            />
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-slate-400 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-3">
          <p>© 2026 A.R.I. Augmented Reality Beauty Intelligence Inc.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-600 transition cursor-pointer">iOS SDK</span>
            <span>•</span>
            <span className="hover:text-slate-600 transition cursor-pointer">Android Core</span>
            <span>•</span>
            <span className="hover:text-slate-600 transition cursor-pointer">Security Audited</span>
          </div>
        </div>
      </footer>

      {/* Onboarding walk-through modal drawer overlay */}
      {showOnboarding && userProfile && (
        <OnboardingModal
          userProfile={userProfile}
          onCompleted={(updatedProfile) => {
            setUserProfile(updatedProfile);
            setShowOnboarding(false);
          }}
        />
      )}
    </div>
  );
}
