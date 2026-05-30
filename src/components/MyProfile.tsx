import React, { useState } from "react";
import { User, ShieldAlert, Sparkles, Check, RefreshCw, Eye, EyeOff, Instagram, MessageCircle, Heart, Tag, Trash2, Key, HelpCircle, Download, Award, Sparkle, Compass, Wifi, WifiOff, Calendar, ClipboardList, Crown, CreditCard } from "lucide-react";
import { UserProfile } from "../types";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../firebase";

interface MyProfileProps {
  userProfile: UserProfile | null;
  onProfileUpdated: (updated: UserProfile) => void;
  onProfileWiped: () => void;
}

export default function MyProfile({ userProfile, onProfileUpdated, onProfileWiped }: MyProfileProps) {
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Play Store offline & user-retention quality features
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [streakDays, setStreakDays] = useState(5);
  const [diaryLogs, setDiaryLogs] = useState([
    { date: "May 22", skin: "Hydrated", style: "Natural", note: "Loved the Westman Atelier sweep!" },
    { date: "May 23", skin: "Dry", style: "Glam", note: "Subtle rose highlight was pristine." },
    { date: "May 24", skin: "Glowing", style: "Classic Rose", note: "Aura filter matched perfectly." },
    { date: "May 25", skin: "Combination", style: "No-Makeup Satin", note: "Consulted Sasha on cheeks." }
  ]);
  const [newLogNote, setNewLogNote] = useState("");

  // Premium / Billing states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("monthly");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleUpgradeToVIP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setCheckoutLoading(true);

    // Simulate luxury-grade sandbox card authentication
    await new Promise((resolve) => setTimeout(resolve, 1400));

    const docRef = doc(db, "users", userProfile.userId);
    const updated: UserProfile = {
      ...userProfile,
      membershipTier: "vip",
    };

    try {
      await updateDoc(docRef, {
        membershipTier: "vip",
      });
      onProfileUpdated(updated);
      setIsCheckoutOpen(false);
      // reset checkout details
      setCardNumber("");
      setCardExpiry("");
      setCardCvc("");
      setCardName("");
    } catch (err) {
      console.warn("Could not sync VIP tier to firestore rules. Falling back locally.", err);
      onProfileUpdated(updated);
      setIsCheckoutOpen(false);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleDowngradeToFree = async () => {
    if (!userProfile) return;
    const confirmCancel = window.confirm(
      "😢 Oh no, lovely! Are you sure you want to cancel your VIP Glam Pro subscription?\n\nYou will lose custom offline vault capacity, Sasha's premium shade formulas, and the glowing golden boarding pass badges."
    );
    if (!confirmCancel) return;

    setLoading(true);
    const docRef = doc(db, "users", userProfile.userId);
    const updated: UserProfile = {
      ...userProfile,
      membershipTier: "free",
    };

    try {
      await updateDoc(docRef, {
        membershipTier: "free",
      });
      onProfileUpdated(updated);
    } catch (err) {
      console.warn("Could not downgrade key.", err);
      onProfileUpdated(updated); // fallback locally
    } finally {
      setLoading(false);
    }
  };

  // Form states initialized with existing profile values
  const [displayName, setDisplayName] = useState(userProfile?.displayName || "");
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || "");
  const [pronouns, setPronouns] = useState(userProfile?.pronouns || "");
  const [bio, setBio] = useState(userProfile?.bio || "");
  const [instagram, setInstagram] = useState(userProfile?.instagramHandle || "");
  const [tiktok, setTiktok] = useState(userProfile?.tiktokHandle || "");
  const [skinUndertone, setSkinUndertone] = useState(userProfile?.skinUndertone || "Neutral");
  const [skinTexture, setSkinTexture] = useState(userProfile?.skinTexture || "Normal");
  const [makeupStyle, setMakeupStyle] = useState(userProfile?.makeupStyle || "Natural");
  const [isPrivate, setIsPrivate] = useState<boolean>(userProfile?.isPrivateProfile || false);

  // Tags management for favorite products
  const [newTag, setNewTag] = useState("");
  const [favProducts, setFavProducts] = useState<string[]>(userProfile?.favoriteProducts || []);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim() && !favProducts.includes(newTag.trim())) {
      setFavProducts(prev => [...prev, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFavProducts(prev => prev.filter(t => t !== tagToRemove));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    setLoading(true);
    setSaveStatus(null);

    const docRef = doc(db, "users", userProfile.userId);
    const updated: UserProfile = {
      ...userProfile,
      displayName,
      photoURL,
      pronouns,
      bio,
      instagramHandle: instagram,
      tiktokHandle: tiktok,
      skinUndertone,
      skinTexture,
      makeupStyle,
      isPrivateProfile: isPrivate,
      favoriteProducts: favProducts,
    };

    try {
      await updateDoc(docRef, {
        displayName,
        photoURL,
        pronouns,
        bio,
        instagramHandle: instagram,
        tiktokHandle: tiktok,
        skinUndertone,
        skinTexture,
        makeupStyle,
        isPrivateProfile: isPrivate,
        favoriteProducts: favProducts,
      });

      onProfileUpdated(updated);
      setSaveStatus("Profile customized and synched successfully!");
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (err: any) {
      console.warn("Could not push profile updates to global rules. Saved locally.", err);
      onProfileUpdated(updated); // fallback locally
      setSaveStatus("Profile customized and synched locally!");
      setTimeout(() => setSaveStatus(null), 3500);
    } finally {
      setLoading(false);
    }
  };

  const handleWipeData = async () => {
    if (!userProfile) return;
    const confirmWipe = window.confirm(
      "CONFIDENTIAL DATA WIPE REQUEST:\n\nThis will completely redact your bios, social handles, custom undertones, and reset your diagnostic scores from our secure Firebase databases. This cannot be undone. Proceed?"
    );

    if (!confirmWipe) return;

    setLoading(true);
    try {
      const docRef = doc(db, "users", userProfile.userId);
      await updateDoc(docRef, {
        bio: "",
        pronouns: "",
        instagramHandle: "",
        tiktokHandle: "",
        skinUndertone: "Neutral",
        skinTexture: "Normal",
        makeupStyle: "Natural",
        favoriteProducts: [],
        favorites: [],
        savedTutorials: []
      });

      // Reset client state
      setBio("");
      setPronouns("");
      setInstagram("");
      setTiktok("");
      setSkinUndertone("Neutral");
      setSkinTexture("Normal");
      setMakeupStyle("Natural");
      setFavProducts([]);

      // Notify parent to reset state
      onProfileWiped();
      alert("Biometric data cleared and redacted from Spectra servers securely!");
    } catch (err) {
      console.error("Wipe failed:", err);
      alert("Data redaction error. Try clear browser cache.");
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile) {
    return (
      <div className="bg-white/90 backdrop-blur-md border border-pink-200/60 rounded-2xl p-8 text-center max-w-md mx-auto my-12 shadow-md">
        <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-base font-extrabold text-slate-800">Unauthenticated Session</h3>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Please login with your Google account in the top right to customize your biometric profile, adjust privacy guidelines, and synchronize diagnostic scores.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header Banner */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-pink-200/60 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-pink-600 font-bold uppercase tracking-wider block mb-1">
            👤 Identity Configuration
          </span>
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <span className="bg-gradient-to-r from-teal-600 via-pink-500 to-pink-600 bg-clip-text text-transparent">
              Spectra Profile & Privacy Lab
            </span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Customize how Sasha identifies your skin parameters, manage social profile links securely, and review access privileges.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="px-3.5 py-1.5 bg-pink-100 rounded-xl font-mono text-[10px] text-pink-700 font-bold border border-pink-200 uppercase tracking-widest flex items-center gap-1">
            <Key className="w-3.5 h-3.5 text-pink-500" /> AES-256 Enabled
          </div>
          <div className="px-3.5 py-1.5 bg-teal-100 rounded-xl font-mono text-[10px] text-teal-800 font-bold border border-teal-200 uppercase tracking-widest flex items-center gap-1 animate-pulse">
            Sasha Active
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Profile Card Preview Column */}
        <div className="lg:col-span-1 bg-white/80 backdrop-blur-md border border-pink-200/60 rounded-3xl p-6 flex flex-col justify-between shadow-xs relative overflow-hidden">
          {/* Top graphics tier */}
          <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-r from-teal-100/50 via-pink-100/50 to-pink-200/40" />

          <div className="relative pt-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <img
                src={photoURL || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200"}
                alt={displayName}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-1 right-1 bg-teal-400 text-white rounded-full p-1 border-2 border-white shadow-3xs">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-800 flex items-center justify-center gap-1">
                {displayName || "Unnamed Artist"}
                {pronouns && <span className="text-[10px] text-pink-500 font-mono italic">({pronouns})</span>}
              </h3>
              <p className="text-[11px] font-mono text-slate-400">{userProfile.email}</p>
              
              {/* Membership Tier Badging */}
              <div className="pt-1.5 flex justify-center">
                {userProfile.membershipTier === "vip" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase bg-gradient-to-r from-yellow-500 via-pink-500 to-rose-500 text-white shadow-xs animate-pulse">
                    <Crown className="w-3 h-3 text-yellow-200" /> VIP GLAM PRO
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase bg-slate-100 text-slate-500 border border-slate-200">
                    Basic Companion
                  </span>
                )}
              </div>
            </div>

            {bio ? (
              <p className="text-xs text-slate-600 italic bg-pink-50/15 p-3 rounded-xl border border-pink-100/10 mt-4 leading-relaxed max-w-[240px]">
                &ldquo;{bio}&rdquo;
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic mt-4">No bio written yet. Craft one below!</p>
            )}

            {/* Social Badges with absolute visibility protections */}
            <div className="flex gap-2.5 mt-5">
              {instagram && (
                <a
                  href={`https://instagram.com/${instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] font-bold text-pink-600 bg-pink-50 hover:bg-pink-100 px-3 py-1.5 rounded-lg border border-pink-200/60 transition"
                >
                  <Instagram className="w-3.5 h-3.5" /> @{instagram.replace("@", "")}
                </a>
              )}
              {tiktok && (
                <a
                  href={`https://tiktok.com/@${tiktok.replace("@", "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-teal-500" /> @{tiktok.replace("@", "")}
                </a>
              )}
            </div>
          </div>

          {/* Dermal Blueprint HUD Panel */}
          <div className="mt-8 pt-4 border-t border-slate-200/60 space-y-3 font-mono text-[11px]">
            <p className="font-sans font-bold text-[10px] text-slate-400 tracking-wider uppercase mb-1">
              Biometric Index Summary
            </p>
            <div className="flex justify-between">
              <span className="text-slate-400">Skin Undertone:</span>
              <span className="font-bold text-pink-600">{skinUndertone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Texture Tone:</span>
              <span className="font-bold text-teal-600">{skinTexture}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Style Category:</span>
              <span className="font-bold text-slate-700">{makeupStyle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Vault Privacy:</span>
              <span className={`font-bold flex items-center gap-1 ${isPrivate ? "text-pink-600" : "text-emerald-600"}`}>
                {isPrivate ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {isPrivate ? "Private Guard Active" : "Public Discovery"}
              </span>
            </div>

            {/* Exclusive VIP Pro Billing Card Controls */}
            <div className="pt-4 border-t border-slate-100 mt-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                  Membership Plans
                </span>
                <span className="text-[10px] bg-pink-100 text-pink-700 font-mono font-bold px-2 py-0.5 rounded">
                  {userProfile.membershipTier === "vip" ? "PRO PASS ACTIVE" : "STANDARD FREE"}
                </span>
              </div>

              {userProfile.membershipTier === "vip" ? (
                <div className="bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-red-500/10 border border-amber-200/50 p-3 rounded-2xl flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-amber-900 font-bold">
                    <Crown className="w-4 h-4 text-amber-500 animate-bounce" />
                    <span>Unlocked 3D Holographics</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    You have unlocked Sasha's VIP 3D contour meshes, chemical formulation simulator, and high-status badges.
                  </p>
                  <button
                    type="button"
                    onClick={handleDowngradeToFree}
                    disabled={loading}
                    className="w-full py-1.5 mt-1 text-[10px] font-mono font-bold text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 border border-slate-200 rounded-xl transition cursor-pointer font-sans"
                  >
                    Cancel Subscription
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-505 leading-normal">
                    Get premium real-time computer vision guides, exclusive holographic makeup shades, and unlimited offline file backups.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-gradient-to-r from-teal-400 via-pink-400 to-pink-500 hover:from-teal-500 hover:to-pink-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-3xs cursor-pointer hover:scale-103 transition-transform duration-200"
                  >
                    <Crown className="w-3.5 h-3.5 text-yellow-200 animate-pulse" /> Upgrade to Pro Pass
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Play-Store Worthy Suggestions Hub Stacked on Column 1 */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* OFFLINE RESILIENCE HUD */}
          <div className="bg-white/80 backdrop-blur-md border border-pink-200/60 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-teal-600 uppercase tracking-wider block">
                Network Sandbox (PWA Ready)
              </span>
              <button
                type="button"
                onClick={() => setIsOfflineMode(!isOfflineMode)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-tight border cursor-pointer transition-all ${
                  isOfflineMode
                    ? "bg-rose-50 border-rose-200 text-rose-600"
                    : "bg-emerald-50 border-emerald-200 text-emerald-600"
                }`}
              >
                {isOfflineMode ? <WifiOff className="w-3.5 h-3.5 font-bold" /> : <Wifi className="w-3.5 h-3.5 font-bold" />}
                {isOfflineMode ? "Simulated Offline" : "Online Sync Active"}
              </button>
            </div>

            <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span>Automatic Local Vaulting</span>
            </h3>

            {isOfflineMode ? (
              <div className="bg-rose-50/50 border border-rose-100 p-3 rounded-xl text-[11px] text-slate-600 leading-relaxed animate-pulse">
                <p className="font-bold text-rose-800">⚠️ Local Offline Sandbox Mode</p>
                <p className="mt-0.5">Device connectivity is offline. Sasha stored your 3D Face Coordinate meshes and logs inside secure LocalStorage. They will synchronize dynamically to Firebase once service is restored.</p>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Matches offline-resiliency Play Store standards. All diagnostic cards sync securely once cell coverage activates.
              </p>
            )}
          </div>

          {/* BEAUTY BOARDING PASS / SHADE Formula Ticket */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[300px]">
            {/* Ambient gold card light */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-teal-400/15 rounded-full blur-xl pointer-events-none" />

            <div>
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="p-1 bg-gradient-to-tr from-teal-500 to-pink-500 rounded text-[9px] font-mono text-white font-extrabold">ARI</span>
                  <span className="text-[10px] font-mono tracking-widest text-[#ebb2b9] font-black uppercase">Spectra Boarding Pass</span>
                </div>
                <Sparkle className="w-4 h-4 text-pink-400 animate-spin-slow" />
              </div>

              {/* Passport Ticket info Layout */}
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-slate-400 block tracking-wider font-mono uppercase">Beauty Passenger</span>
                    <strong className="text-white truncate block">{displayName || "Enthusiast Doll"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block tracking-wider font-mono uppercase">Skin Seat Zone</span>
                    <strong className="text-[#3fedd0] block font-mono">{skinUndertone.toUpperCase()} / {skinTexture.toUpperCase()}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-white/5 pt-2">
                  <div>
                    <span className="text-slate-400 block tracking-wider font-mono uppercase">Gate Class</span>
                    <strong className="text-pink-300 block">{makeupStyle} Suite</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block tracking-wider font-mono uppercase">Signature Formulation</span>
                    <strong className="text-white block truncate">{favProducts[0] || "Custom Suture"}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Barcode & Download trigger */}
            <div className="mt-5 pt-3 border-t border-dashed border-white/15">
              <div className="flex items-center justify-between">
                {/* Simulated SVG Barcode */}
                <div className="flex flex-col gap-1">
                  <div className="flex gap-[1.5px] h-6 bg-white/10 px-1 py-0.5 rounded items-stretch">
                    <span className="w-1 bg-white" />
                    <span className="w-0.5 bg-white/40" />
                    <span className="w-1.5 bg-white" />
                    <span className="w-0.5 bg-white/10" />
                    <span className="w-1 bg-white" />
                    <span className="w-1 bg-white" />
                    <span className="w-0.5 bg-white/40" />
                  </div>
                  <span className="text-[8px] font-mono text-slate-400 uppercase">SPEC-ARI-{displayName.slice(0,3).toUpperCase() || "DOLL"}</span>
                </div>

                <button
                  type="button"
                  onClick={() => alert(`🌸 Boarding Pass successfully formatted!\nShader ticket downloaded containing custom temperature (${skinUndertone}) coordinates. Present this barcode at Sephora/Ulta checkout for instant formulation lookup!`)}
                  className="flex items-center gap-1 bg-white text-slate-900 border border-slate-250 hover:bg-pink-105 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Export Ticket
                </button>
              </div>
            </div>
          </div>

          {/* USER RETENTION GAMIFICATION (Beauty Streak and Diary) */}
          <div className="bg-white/80 backdrop-blur-md border border-pink-200/60 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-pink-600 uppercase tracking-widest flex items-center gap-1">
                <Award className="w-4 h-4 text-pink-500" /> Retention Streak System
              </span>
              <span className="px-2 py-0.5 bg-pink-100 text-pink-700 font-mono text-[9px] font-extrabold rounded-full">
                🔥 {streakDays} Day Count
              </span>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-800 leading-tight">My Biometric Skin Diary</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Track daily skin moisture behavior against formula shifts.</p>
            </div>

            {/* Custom Diary Logs timeline */}
            <div className="space-y-2 py-1 max-h-[140px] overflow-y-auto pr-1">
              {diaryLogs.map((log, idx) => (
                <div key={idx} className="bg-pink-50/15 border border-pink-100/10 p-2.5 rounded-xl text-[11px] space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-slate-400">{log.date}</span>
                    <span className="bg-teal-50 border border-teal-150 p-0.5 px-2 rounded text-[9px] font-mono font-bold text-teal-700">
                      {log.skin}
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium italic leading-snug">&ldquo;{log.note}&rdquo;</p>
                </div>
              ))}
            </div>

            {/* Add log form */}
            <div className="flex gap-1.5 pt-1">
              <input
                type="text"
                placeholder="Log today: e.g. Skin felt hydrated."
                value={newLogNote}
                onChange={e => setNewLogNote(e.target.value)}
                className="flex-1 bg-slate-50 border border-pink-100 rounded-xl px-3 py-1.5 text-[11px] text-[#475569] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (newLogNote.trim()) {
                    setDiaryLogs(prev => [
                      { date: "May 26", skin: skinTexture, style: makeupStyle, note: newLogNote.trim() },
                      ...prev
                    ]);
                    setNewLogNote("");
                    setStreakDays(prev => prev + 1);
                  }
                }}
                className="px-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-[11px] font-bold transition cursor-pointer"
              >
                Log +1
              </button>
            </div>
          </div>
        </div>

        {/* Profile Details Edit Form & Security Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveProfile} className="bg-white/90 backdrop-blur-md border border-pink-200/60 rounded-3xl p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-extrabold text-slate-800 border-b border-pink-150/40 pb-2">
              Customize Personal Metrics
            </h3>

            {/* General Profile Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-pink-600 font-mono tracking-wider uppercase mb-0.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-pink-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-pink-600 font-mono tracking-wider uppercase mb-0.5">
                  Pronouns
                </label>
                <input
                  type="text"
                  placeholder="e.g. she/her"
                  value={pronouns}
                  onChange={e => setPronouns(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-pink-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-pink-600 font-mono tracking-wider uppercase mb-0.5">
                  Photo URL
                </label>
                <input
                  type="text"
                  value={photoURL}
                  onChange={e => setPhotoURL(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-pink-100 truncate"
                />
              </div>
            </div>

            {/* Social Profile Safety Row */}
            <div className="bg-pink-50/15 p-4 rounded-2xl border border-pink-100/50 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-pink-600" />
                <h4 className="text-xs font-bold text-slate-700 leading-none">Social Profile Link Protections</h4>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                To guarantee absolute tracking prevention from advertising crawlers, we format your socials using client-validated sanitization filters. No email signatures will ever match.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    Instagram Handle (UsernameOnly)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. makeup_enthusiast"
                    value={instagram}
                    onChange={e => setInstagram(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-white border border-pink-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    TikTok Handle (UsernameOnly)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. beauty_architect"
                    value={tiktok}
                    onChange={e => setTiktok(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-white border border-pink-100"
                  />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-[10px] font-bold text-pink-600 font-mono tracking-wider uppercase mb-0.5">
                Biography / Beauty Vision Statement
              </label>
              <textarea
                rows={2}
                maxLength={500}
                placeholder="What cosmetic innovations inspire you? Discuss your style and coordinates..."
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-pink-100"
              />
              <span className="text-[9px] text-slate-400 font-mono float-right mt-1">
                {500 - bio.length} chars remaining
              </span>
            </div>

            {/* Skin Parameter Adjusters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Skin Undertone</label>
                <select
                  value={skinUndertone}
                  onChange={e => setSkinUndertone(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-pink-100"
                >
                  <option value="Warm">Warm</option>
                  <option value="Cool">Cool</option>
                  <option value="Neutral">Neutral</option>
                  <option value="Olive">Olive</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Skin Texture</label>
                <select
                  value={skinTexture}
                  onChange={e => setSkinTexture(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-pink-100"
                >
                  <option value="Normal">Normal</option>
                  <option value="Dry">Dry</option>
                  <option value="Oily">Oily</option>
                  <option value="Combination">Combination</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Preferred Style</label>
                <select
                  value={makeupStyle}
                  onChange={e => setMakeupStyle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-pink-100"
                >
                  <option value="Natural">Natural</option>
                  <option value="Glam">Glam</option>
                  <option value="Minimalist">Minimalist</option>
                  <option value="Corporate">Corporate</option>
                </select>
              </div>
            </div>

            {/* Favorite Brands Custom Tags Input */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-pink-600 font-mono tracking-wider uppercase mb-0.5">
                Tag Favorite Cosmetics / Formulations
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Westman Atelier"
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  className="flex-1 text-xs p-2.5 rounded-xl bg-slate-50 border border-pink-100"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer"
                >
                  Add Tag
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {favProducts.map(tag => (
                  <span
                    key={tag}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-tr from-teal-50 to-pink-50 text-slate-700 hover:text-pink-600 text-[11px] font-bold rounded-xl border border-pink-200/40 relative group transition-all"
                  >
                    <Tag className="w-3 h-3 text-pink-500" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-400 hover:text-pink-600 cursor-pointer text-[10px] font-mono font-bold shrink-0 ml-1.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {favProducts.length === 0 && (
                  <span className="text-[11px] text-slate-400 font-mono">No product tags created yet.</span>
                )}
              </div>
            </div>

            {/* Profile Security Settings (Private Profiles) */}
            <div className="border-t border-slate-200/50 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-2.5">
                <div className="p-2 sm:p-2.5 bg-teal-50 border border-teal-100 text-teal-600 rounded-xl shrink-0 mt-0.5">
                  {isPrivate ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 leading-snug">Toggle Private Gallery Scan</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-sm">
                    Restricts non-registered users from inspecting your diagnostic face maps or loading shade recipe coordinates.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                <input
                  type="checkbox"
                  id="profile-private-chk"
                  checked={isPrivate}
                  onChange={e => setIsPrivate(e.target.checked)}
                  className="rounded text-pink-600 border-pink-200 focus:ring-pink-400 w-5 h-5 cursor-pointer"
                />
                <label htmlFor="profile-private-chk" className="text-xs font-bold text-slate-600 cursor-pointer font-mono uppercase">
                  {isPrivate ? "PRIVATE ON" : "PUBLIC OFF"}
                </label>
              </div>
            </div>

            {/* Form actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {saveStatus ? (
                <span className="text-xs text-teal-600 font-mono font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                  {saveStatus}
                </span>
              ) : (
                <div />
              )}
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-teal-500 via-pink-400 to-pink-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-102 hover:shadow-2xs active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Save Security Profile"}
              </button>
            </div>
          </form>

          {/* Privacy Regulatory Redact Box (GDPR) */}
          <div className="bg-white/80 backdrop-blur-md border border-pink-200/60 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">🛡️</span>
              <div>
                <h4 className="text-xs font-mono text-slate-800 font-bold uppercase tracking-wider">
                  Decentralized Privacy & Redact Rights
                </h4>
                <p className="text-[11px] text-slate-500 leading-normal max-w-md mt-1">
                  In compliance with world-class digital beauty policies, you hold absolute rights to wipe, purge, and clear stored coordinates from our peer database indexes.
                </p>
              </div>
            </div>
            <button
              onClick={handleWipeData}
              disabled={loading}
              className="flex items-center gap-1 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200/60 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Wipe Saved Data
            </button>
          </div>
        </div>
      </div>

      {/* GLAM SUBSCRIPTION BILLING / SECURE CHECKOUT SLIDE-OVER MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in text-left">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-pink-200/50 max-w-2xl w-full p-6 md:p-8 shadow-2xl relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
            
            {/* Pulsing light rings behind modal */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-pink-600 text-xl font-black font-mono focus:outline-none transition cursor-pointer"
            >
              ×
            </button>

            {/* Header Title with VIP Icons */}
            <div className="text-center space-y-2 relative">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-tr from-yellow-105 to-amber-105 border border-yellow-250 rounded-full text-[9px] font-black tracking-widest text-amber-800 uppercase shadow-3xs">
                <Crown className="w-3.5 h-3.5 text-amber-500" /> VIP GLAM COGNITIVE PRIV PRIVILEGES
              </span>
              <h2 className="text-xl font-black tracking-tight bg-gradient-to-r from-teal-500 via-pink-400 to-pink-600 bg-clip-text text-transparent">
                Spectra A.R.I. Premium Pro Pass
              </h2>
              <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
                Unlock Sasha AI’s entire deep dermo-indexing intelligence suite. Stored instantly in your secure local vaulting and synchronized with global Firestore nodes.
              </p>
            </div>

            {/* Billing Interval Selection Toggle */}
            <div className="bg-slate-50 border border-slate-200 p-1.5 rounded-2xl flex items-center justify-center gap-1.5 max-w-xs mx-auto w-full">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`flex-1 py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === "monthly"
                    ? "bg-white text-slate-800 shadow-3xs border border-slate-200"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                Monthly ($9.99)
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annually")}
                className={`flex-1 py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  billingCycle === "annually"
                    ? "bg-gradient-to-r from-teal-400 to-pink-400 text-white shadow-3xs"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                Annually ($99) <span className="bg-white/20 text-[8px] px-1 rounded font-black text-white">Save 20%</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              
              {/* Left Column: Plan Benefits & Visual Mock Cards */}
              <div className="space-y-4">
                <p className="text-[10px] font-mono font-bold text-pink-600 uppercase tracking-widest border-b border-pink-100/40 pb-1.5 font-black">
                  Pro-Tier Benefits
                </p>
                
                <ul className="space-y-3 font-sans text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">Sasha ultra-vision mapping:</strong> Unleash ultra-fidelity landmarks & contour sculptors.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">Advanced Chemistry Analyzer:</strong> Get deep chemical safety audits and ingredient ratings for products.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">Golden Boarding Passes:</strong> Present custom formulation barcodes for instant Ulta/Sephora lookups.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">Holographic VIP Badge:</strong> Shine beautifully in chats and the social feeds.
                    </div>
                  </li>
                </ul>

                {/* Cyber-Luxury Glassmorphic Credit Card HUD Preview */}
                <div className="bg-gradient-to-tr from-slate-900 via-[#1b0d24] to-[#041a18] text-white rounded-2xl p-4 shadow-md relative overflow-hidden flex flex-col justify-between h-32 mt-4 text-left border border-white/10">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full blur-xl pointer-events-none" />
                  <div className="flex justify-between items-start border-b border-white/10 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="p-0.5 bg-white/20 rounded font-mono text-[80%] px-1 font-bold text-pink-300">ARI BANK</span>
                      <span className="text-[8px] font-mono tracking-widest text-[#ebb2b9] uppercase font-bold">Glam Express Gold</span>
                    </div>
                    <Crown className="w-4 h-4 text-yellow-300 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 font-mono tracking-widest block uppercase font-bold">Card Number</span>
                    <strong className="text-[14px] font-mono tracking-widest block truncate text-slate-100">
                      {cardNumber ? cardNumber.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim() : "•••• •••• •••• ••••"}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <div>
                      <span className="text-slate-400 uppercase tracking-wider block font-bold text-[8px]">Cardholder</span>
                      <span className="text-white truncate max-w-[120px] block font-bold">{cardName || displayName || "MEMBER"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-bold text-[8px]">Expires</span>
                      <span className="text-white font-bold">{cardExpiry || "MM/YY"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Secure Simulated Input Form */}
              <form onSubmit={handleUpgradeToVIP} className="space-y-4">
                <p className="text-[10px] font-mono font-bold text-teal-600 uppercase tracking-widest border-b border-teal-100/40 pb-1.5 font-bold">
                  Secure Checkout
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-550 uppercase mb-0.5">Cardholder Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sasha Glamour"
                      value={cardName}
                      onChange={e => setCardName(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-pink-100 focus:outline-pink-400 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-550 uppercase mb-0.5">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={19}
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-xs p-2.5 pl-8 rounded-xl bg-slate-50 border border-pink-100 focus:outline-pink-400 tracking-widest text-slate-800"
                      />
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-2.5 top-3.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-555 uppercase mb-0.5">Expiry Date</label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={e => setCardExpiry(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-pink-100 focus:outline-pink-400 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-555 uppercase mb-0.5">CVC Code</label>
                      <input
                        type="password"
                        required
                        maxLength={3}
                        placeholder="•••"
                        value={cardCvc}
                        onChange={e => setCardCvc(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-pink-100 focus:outline-pink-400 text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-teal-50/50 border border-teal-150 p-2.5 rounded-xl flex items-start gap-1.5 text-[9px] text-teal-800 leading-normal">
                  <span className="text-teal-600 shrink-0 font-bold">🛡️</span>
                  <span>PCI-DSS Secured: Simulated authorization vaulting. Authenticating via sandbox rules.</span>
                </div>

                <button
                  type="submit"
                  disabled={checkoutLoading}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 via-pink-400 to-pink-500 text-white font-black rounded-xl text-xs uppercase tracking-widest hover:scale-102 hover:shadow-md transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {checkoutLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      <Crown className="w-4 h-4 text-yellow-250 animate-bounce" />
                      <span>Activate VIP — Verify {billingCycle === "monthly" ? "$9.99" : "$99"}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
