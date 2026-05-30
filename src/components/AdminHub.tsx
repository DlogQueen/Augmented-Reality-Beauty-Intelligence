import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  CreditCard, 
  Wallet, 
  Terminal, 
  Settings, 
  Database, 
  Users, 
  TrendingUp, 
  Coins, 
  Webhook, 
  Activity, 
  Check, 
  Crown, 
  Sparkles, 
  ArrowRight, 
  Eye, 
  Copy, 
  Lock, 
  RefreshCw,
  Search
} from "lucide-react";
import { UserProfile } from "../types";
import { collection, getDocs, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db, auth } from "../firebase";

interface AdminHubProps {
  userProfile: UserProfile | null;
  onProfileUpdated?: (updated: UserProfile) => void;
}

export default function AdminHub({ userProfile, onProfileUpdated }: AdminHubProps) {
  const [activeSubTab, setActiveSubTab] = useState<"pipeline" | "database" | "logs">("pipeline");
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Simulated live telemetry metrics
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "syncing" | "stale">("connected");
  const [telemetryTime, setTelemetryTime] = useState<string>(new Date().toLocaleTimeString());

  // High-fidelity sandbox users in case the backend Firestore is empty or rules block listing
  const mockPlatformUsers: UserProfile[] = [
    {
      userId: "user_aisha",
      displayName: "Sasha AI Premium Tutor",
      email: "sasha.neural.assistant@spectra.ari",
      photoURL: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150",
      skinUndertone: "Neutral",
      skinTexture: "Glowing",
      makeupStyle: "Glam",
      favoriteProducts: ["Westman Atelier Contour Stick", "Dior Backstage Highlight"],
      membershipTier: "vip",
      onboardingCompleted: true
    },
    {
      userId: "user_fleur",
      displayName: "Fleur de Lys",
      email: "fleur.delight@gmail.com",
      photoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
      skinUndertone: "Cool",
      skinTexture: "Dry",
      makeupStyle: "Natural",
      favoriteProducts: ["Merit Tinted Lip Oil", "Chanel Les Beiges"],
      membershipTier: "free",
      onboardingCompleted: true
    },
    {
      userId: "user_caroline",
      displayName: "Caroline V.",
      email: "caro.vance@ycombinator.com",
      photoURL: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=150",
      skinUndertone: "Olive",
      skinTexture: "Oily",
      makeupStyle: "Minimalist",
      favoriteProducts: ["Rare Beauty Blush", "Supergoop Glow Screen"],
      membershipTier: "vip",
      onboardingCompleted: true
    },
    {
      userId: "user_ryleigh",
      displayName: "Ryleigh Maloy (Admin)",
      email: "ryleighxmaloy@gmail.com",
      photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
      skinUndertone: "Neutral",
      skinTexture: "Normal",
      makeupStyle: "Natural",
      favoriteProducts: ["Saie Liquid Blush", "Ilia Super Serum Skin Tint"],
      membershipTier: "vip",
      onboardingCompleted: true
    }
  ];

  // Refresh clock telemetry
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetryTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch registered users from Firestore
  const fetchFirestoreUsers = async () => {
    setLoadingUsers(true);
    setConnectionStatus("syncing");
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const users: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        users.push(doc.data() as UserProfile);
      });

      // Merge mock users so they always have realistic demo profiles even if they are testing locally
      const merged = [...users];
      mockPlatformUsers.forEach(mu => {
        if (!merged.some(u => u.userId === mu.userId)) {
          merged.push(mu);
        }
      });
      setUsersList(merged);
      setConnectionStatus("connected");
    } catch (err) {
      console.warn("Could not query whole users database via generic client rules. Using fallback.", err);
      setUsersList(mockPlatformUsers);
      setConnectionStatus("stale");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchFirestoreUsers();
  }, []);

  const handleToggleUserTier = async (targetUser: UserProfile) => {
    const nextTier = targetUser.membershipTier === "vip" ? "free" : "vip";
    setLoadingUsers(true);
    
    // Update target local profile representation
    const updatedList = usersList.map(u => {
      if (u.userId === targetUser.userId) {
        return { ...u, membershipTier: nextTier as any };
      }
      return u;
    });
    setUsersList(updatedList);

    // If the target is the currently loggedin user, inform the App!
    if (userProfile && targetUser.userId === userProfile.userId) {
      const updatedProfile = { ...userProfile, membershipTier: nextTier as any };
      if (onProfileUpdated) {
        onProfileUpdated(updatedProfile);
      }
    }

    try {
      const userRef = doc(db, "users", targetUser.userId);
      await updateDoc(userRef, {
        membershipTier: nextTier
      });
      showStatus(`Manually adjusted ${targetUser.displayName} to VIP ${nextTier.toUpperCase()}`);
    } catch (err) {
      console.warn("Writing to Firestore database was blocked or completed in sandbox mode.", err);
      showStatus(`Updated ${targetUser.displayName} locally in Sandbox. (Firestore connection rules isolated)`);
    } finally {
      setLoadingUsers(false);
    }
  };

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Filter users list based on display name or email search query
  const filteredUsers = usersList.filter(u => {
    const nameMatch = u.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || emailMatch;
  });

  return (
    <div id="admin-hub-tab" className="space-y-8 animate-fade-in text-slate-800">
      
      {/* GLAM ADMIN PORTAL HEADER WITH METRICS */}
      <div className="bg-gradient-to-tr from-[#142d32] via-[#10192e] to-[#281a33] text-white p-6 md:p-8 rounded-3xl border border-pink-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
              <span className="bg-gradient-to-r from-teal-400 to-pink-500 text-white text-[9px] font-mono font-black px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
                🔐 Administrator Mode Fully Unlocked
              </span>
              <span className="bg-white/10 text-slate-300 text-[9px] font-mono px-2 py-1 rounded border border-white/5">
                Version 1.5.0-Release-Cloud
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-teal-300 font-mono">
                <span className={`w-2 h-2 rounded-full ${connectionStatus === "connected" ? "bg-teal-400" : connectionStatus === "syncing" ? "bg-amber-400 animate-ping" : "bg-rose-400"}`} />
                {connectionStatus === "connected" ? "Firestore Nodes Operational" : connectionStatus === "syncing" ? "Broadcasting Core Metadata..." : "Sandbox Emulated Link"}
              </span>
            </div>
            
            <h2 className="text-2xl font-black tracking-tight leading-tight">
              Spectra A.R.I. Payment Pipeline & User Directory
            </h2>
            <p className="text-slate-350 text-xs mt-1 max-w-2xl leading-relaxed">
              Hey Ryleigh, bad ass tech architect! This control deck gives you direct read-write access to subscription tickets, Firestore record variables, and fully details where real-world cash registers flow.
            </p>
          </div>

          {/* Quick HUD Scoreboard metrics */}
          <div className="grid grid-cols-3 gap-3 bg-black/35 p-3.5 rounded-2xl border border-white/10 shrink-0">
            <div className="text-center">
              <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider block font-bold">VIP Ratio</span>
              <strong className="text-sm font-black text-amber-300 font-mono">
                {usersList.length ? Math.round((usersList.filter(u => u.membershipTier === "vip").length / usersList.length) * 10) * 10 : 50}%
              </strong>
            </div>
            <div className="text-center px-4 border-x border-white/10">
              <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider block font-bold">Total Hubs</span>
              <strong className="text-sm font-black text-teal-300 font-mono">{usersList.length || 4}</strong>
            </div>
            <div className="text-center">
              <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider block font-bold">Sim Revenue</span>
              <strong className="text-sm font-black text-pink-300 font-mono">
                ${(usersList.filter(u => u.membershipTier === "vip").length * 9.99).toFixed(2)}/mo
              </strong>
            </div>
          </div>
        </div>

        {/* Global Action Banner Status Message Toast */}
        {statusMessage && (
          <div className="mt-4 p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-center text-xs font-black select-none animate-bounce">
            🎉 {statusMessage}
          </div>
        )}
      </div>

      {/* SUB-MENU CONTROLS */}
      <div className="flex border-b border-pink-100/50 pb-2">
        {[
          { id: "pipeline", label: "Where Payments Go (Production Stripe Map)", icon: CreditCard },
          { id: "database", label: "User Accounts Database Manager", icon: Database },
          { id: "logs", label: "Express Engine Webhook Setup", icon: Terminal }
        ].map((sub) => {
          const Icon = sub.icon;
          const isSel = activeSubTab === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id as any)}
              className={`flex items-center gap-1.5 py-2 px-4 border-b-2 font-black text-[11px] tracking-wider uppercase transition cursor-pointer ${
                isSel
                  ? "border-pink-500 text-pink-600"
                  : "border-transparent text-slate-450 hover:text-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {sub.label}
            </button>
          );
        })}
      </div>

      {/* COMPONENT BODY CONDITIONAL */}
      
      {/* 1. WHERE PAYMENTS GO TAB */}
      {activeSubTab === "pipeline" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main payment flow chart layout */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-xs space-y-4 text-left">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-teal-500" />
                <h3 className="text-base font-black tracking-tight text-slate-800">
                  Real-World Payment Routing System
                </h3>
              </div>
              
              <p className="text-xs text-slate-600 leading-relaxed">
                Right now, the app uses a luxury-grade simulated card modal on the <strong className="text-pink-600">My Profile</strong> page. Since you have full admin access and you're deploying this to the public, here is exactly how money gets routed from clients' beauty apps directly to your pockets! Let's examine the pipeline.
              </p>

              {/* Graphical Visual Map of Stripe Pipeline */}
              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                  <div className="bg-gradient-to-tr from-pink-500 to-rose-500 text-white p-3 rounded-xl border border-pink-400">
                    <strong className="block text-white">1. CLIENT CLICK</strong>
                    <span>Pushes card values to Stripe.js Elements</span>
                  </div>
                  <div className="flex flex-col justify-center items-center text-slate-400">
                    <ArrowRight className="w-5 h-5 animate-pulse text-pink-500" />
                    <span>Secure Token</span>
                  </div>
                  <div className="bg-slate-900 text-teal-300 p-3 rounded-xl border border-slate-850">
                    <strong className="block text-teal-200">2. STRIPE API</strong>
                    <span>Charges real dollars ($9.99/mo)</span>
                  </div>
                </div>

                <div className="flex justify-center flex-col items-center py-1">
                  <div className="h-8 w-0.5 bg-dashed bg-slate-450" />
                  <span className="text-[10px] font-mono text-slate-400 font-bold">Instant Webhook Call</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                  <div className="bg-gradient-to-tr from-emerald-500 to-teal-600 text-white p-3 rounded-xl border border-emerald-400">
                    <strong className="block text-white">3. EXPRESS SERVER</strong>
                    <span>Validates signature at `/api/stripe-webhook`</span>
                  </div>
                  <div className="flex flex-col justify-center items-center text-slate-400">
                    <ArrowRight className="w-5 h-5 animate-pulse text-indigo-500" />
                    <span>Synchronize DB</span>
                  </div>
                  <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 text-white p-3 rounded-xl border border-indigo-500">
                    <strong className="block text-white">4. FIRESTORE</strong>
                    <span>Flips `membershipTier` to `"vip"`</span>
                  </div>
                </div>
              </div>

              {/* Instructions on Merchant Options */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Top Recommended Checkout Integrations:
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border border-slate-150 p-3.5 rounded-2xl space-y-1 bg-slate-50/40">
                    <span className="text-xs font-black text-slate-800 block">💳 Option A: Stripe Checkout</span>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Easiest to implement. Stripe hosts the entire beautiful payment webpage, handles custom Apple Pay & Google Pay, and securely redirects the user back to the Spectra portal.
                    </p>
                  </div>
                  <div className="border border-slate-150 p-3.5 rounded-2xl space-y-1 bg-slate-50/40">
                    <span className="text-xs font-black text-slate-800 block">📱 Option B: RevenueCat</span>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Perfect if you launch Spectra on the Apple App Store or Google Play Store. RevenueCat manages local mobile store receipts and links premium accounts back to web profiles automatically.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick deployment instructions with mock env variables */}
            <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-pink-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#ebb2b9]">
                    System Environment Declarations
                  </span>
                </div>
                <span className="text-[9px] font-mono text-xs text-slate-400">Config: `.env.example`</span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                To replace our sandbox and connect the API routes, add these variables in your workspace settings. We will lazy initialize Stripe server-side without crashing deployment if the keys are missing!
              </p>

              <div className="bg-[#0b1320] p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-teal-300 space-y-2 relative">
                <button
                  type="button"
                  onClick={() => handleCopy("STRIPE_SECRET_KEY=sk_live_...\nVITE_STRIPE_PUBLISHABLE_KEY=pk_live_...\nSTRIPE_WEBHOOK_SECRET=whsec_...", "env")}
                  className="absolute top-2.5 right-2.5 bg-white/10 hover:bg-white/15 px-2 py-1 rounded text-[10px] text-white flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" /> {copiedKey === "env" ? "Copied!" : "Copy Snippet"}
                </button>
                <div className="text-slate-500"># Stripe API Credentials (Server Private + Client Public)</div>
                <div>STRIPE_SECRET_KEY=<span className="text-pink-300">sk_live_51Pxy00...</span></div>
                <div>VITE_STRIPE_PUBLISHABLE_KEY=<span className="text-teal-300">pk_live_51Pxy00...</span></div>
                <div>STRIPE_WEBHOOK_SECRET=<span className="text-indigo-300 font-bold">whsec_e346b0...</span></div>
              </div>
            </div>

          </div>

          {/* Sidebar specs: Merchant verification checklist */}
          <div className="space-y-6">
            <div className="bg-gradient-to-tr from-[#1b1c31] to-[#341d3a] text-white p-6 rounded-3xl border border-pink-400/20 space-y-4 text-left">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-pink-300" />
                <h4 className="text-xs font-black tracking-widest uppercase text-white font-mono">
                  Production Steps
                </h4>
              </div>

              <p className="text-[11px] text-slate-300 leading-normal">
                Ready to wire real bank deposits? Here is Ryleigh's senior checklist to activate real processing:
              </p>

              <ul className="space-y-3.5 text-xs text-slate-200">
                <li className="flex items-start gap-2">
                  <div className="bg-white/10 rounded-full p-0.5 mt-0.5 shrink-0">
                    <Check className="w-3 h-3 text-teal-300" />
                  </div>
                  <div>
                    <strong className="block text-white">Create Stripe Account</strong>
                    <span className="text-[10px] text-slate-400">Visit stripe.com and set up your merchant details.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="bg-white/10 rounded-full p-0.5 mt-0.5 shrink-0">
                    <Check className="w-3 h-3 text-teal-300" />
                  </div>
                  <div>
                    <strong className="block text-white">Generate Pricing API ID</strong>
                    <span className="text-[10px] text-slate-400">Configure a recurring product ("VIP Glam Pro") of $9.99USD.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="bg-white/10 rounded-full p-0.5 mt-0.5 shrink-0">
                    <Check className="w-3 h-3 text-teal-300" />
                  </div>
                  <div>
                    <strong className="block text-white">Configure Dashboard Secrets</strong>
                    <span className="text-[10px] text-slate-400">Input `STRIPE_SECRET_KEY` in environment config dashboard.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="bg-white/10 rounded-full p-0.5 mt-0.5 shrink-0">
                    <Check className="w-3 h-3 text-teal-300" />
                  </div>
                  <div>
                    <strong className="block text-white">Test using webhook command</strong>
                    <span className="text-[10px] text-slate-400">Test locally using Stripe CLI triggers.</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Quick server route preview snippet code */}
            <div className="bg-white/90 border border-slate-200 rounded-3xl p-5 text-left space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                <Settings className="w-4 h-4 text-emerald-500 animate-spin" style={{ animationDuration: "12s" }} />
                <span>Backend Route Blueprint</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Stripe handles checkout redirects instantly. Our Node.js Express server is built to handle this seamlessly inside `server.ts`!
              </p>
              
              <div className="bg-slate-900 border border-slate-800 text-teal-300 rounded-xl p-2.5 font-mono text-[9px] leading-tight select-all">
                {`app.post('/api/checkout-session', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price: 'price_X', quantity: 1 }],
    mode: 'subscription',
    success_url: 'https://mysite.com/profile?success=1',
    cancel_url: 'https://mysite.com/profile?cancel=1',
  });
  res.json({ id: session.id });
});`}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 2. DIRECT DATA MODIFICATION PANEL */}
      {activeSubTab === "database" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-xs space-y-6 text-left">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-pink-50 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-pink-100 p-2 rounded-2xl">
                <Users className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-slate-800">
                  Global User Roster
                </h3>
                <p className="text-[11px] text-slate-500">
                  Perform real-time directory lookups on active community nodes. Toggle membership tiers instantly.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Users by email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-48 text-[11px] p-2 pl-7 border border-pink-100 focus:outline-pink-300 rounded-xl bg-slate-50 text-slate-800"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              <button
                type="button"
                onClick={fetchFirestoreUsers}
                className="p-2 bg-pink-50 hover:bg-pink-100 rounded-xl transition text-pink-700 cursor-pointer"
                title="Synchronize live user catalog"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* User Roster Table Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-pink-100/45 text-slate-450 uppercase font-mono text-[9px] tracking-wider">
                  <th className="py-2.5 px-3">Cosmetic Specialist</th>
                  <th className="py-2.5 px-3">E-Mail Identity</th>
                  <th className="py-2.5 px-3">Skin Bio-Data</th>
                  <th className="py-2.5 px-3 text-center">Membership Class</th>
                  <th className="py-2.5 px-3 text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400 font-mono italic">
                      No matching user records detected in database grid.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((item, idx) => (
                    <tr key={item.userId || idx} className="hover:bg-pink-50/15 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={item.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"}
                            alt={item.displayName}
                            className="w-8 h-8 rounded-full border border-pink-100 object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="font-extrabold text-slate-800 block leading-tight">{item.displayName}</span>
                            <span className="text-[9px] font-mono text-slate-400">UID: {item.userId ? `${item.userId.substring(0, 9)}...` : `temp_${idx}`}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px] truncate max-w-[150px]">
                        {item.email || "unlinked@spectra"}
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        {item.skinUndertone || item.skinTexture ? (
                          <div className="flex flex-wrap gap-1">
                            {item.skinUndertone && (
                              <span className="bg-teal-50 text-teal-800 text-[8px] px-1.5 py-0.5 rounded-full border border-teal-100/50 font-bold">
                                {item.skinUndertone}
                              </span>
                            )}
                            {item.skinTexture && (
                              <span className="bg-pink-50 text-pink-800 text-[8px] px-1.5 py-0.5 rounded-full border border-pink-100/50 font-bold">
                                {item.skinTexture}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">Undetected</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {item.membershipTier === "vip" ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black tracking-wider uppercase shadow-3xs animate-pulse">
                            <Crown className="w-2.5 h-2.5 text-yellow-105" /> VIP PRO
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] bg-slate-100 text-slate-500 font-bold uppercase border border-slate-250">
                            STANDARD
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleUserTier(item)}
                          className={`text-[10px] py-1 px-3.5 rounded-xl font-bold transition-all cursor-pointer ${
                            item.membershipTier === "vip"
                              ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                              : "bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200"
                          }`}
                        >
                          {item.membershipTier === "vip" ? "Downgrade Standard" : "Grant VIP Access"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-amber-50/50 border border-amber-200 p-3.5 rounded-2xl flex items-start gap-2 text-[11px] text-amber-900 leading-normal">
            <span className="text-sm">💡</span>
            <p>
              <strong>Security Protocol:</strong> Granting VIP Access via this administrative button updates the user's document database parameters directly. If they are signed into their device, they will immediately unlock premium landmarks, Sasha's chemical analyzers, and VIP profile status tags across the peer community feed!
            </p>
          </div>

        </div>
      )}

      {/* 3. EXPRESS ENGINE WEBHOOK / WEB REVENUE ROUTING INFO */}
      {activeSubTab === "logs" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-xs space-y-6 text-left">
          
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <Webhook className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">
                Stripe Signature Verification & Webhooks
              </h3>
              <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                Webhooks are async notifications sent by Stripe to notify Spectra that a client successfully completed a purchase. Real developers verify headers to block malicious fake signals.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              When a charge succeeds, Stripe hits an Express server route `/api/stripe-webhook`. The server extracts the payload raw buffer and reads the cryptographic signature to make sure it genuinely came from Stripe.
            </p>

            <div className="space-y-1.5 font-mono text-xs">
              <span className="text-slate-450 block font-bold text-[10px] uppercase">Example Express webhook handler code:</span>
              <div className="bg-[#0b1320] text-slate-200 p-4 rounded-xl border border-slate-850 overflow-x-auto text-[10px] leading-relaxed max-h-72 overflow-y-auto w-full select-all">
{`import express from 'express';
import Stripe from 'stripe';
import { db } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (request, response) => {
  const sig = request.headers['stripe-signature']!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err: any) {
    return response.status(400).send(\`Webhook Error: \${err.message}\`);
  }

  // Handle successful subscriptions or checkouts
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Custom client ID parsed inside client metadata parameters
    const userId = session.metadata?.userId;
    if (userId) {
      await updateDoc(doc(db, "users", userId), {
        membershipTier: "vip"
      });
      console.log(\`Successfully upgraded client \${userId} to VIP\`);
    }
  }

  response.json({ received: true });
});`}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              *Note: Always remember to parse the request body as a raw buffer (using `express.raw`) before sending it to Stripe. Stripe needs the unmodified request body to cryptographically verify signatures.*
            </p>
          </div>

        </div>
      )}

    </div>
  );
}
