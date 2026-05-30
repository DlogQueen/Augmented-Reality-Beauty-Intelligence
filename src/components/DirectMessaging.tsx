import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, CheckCheck, Sparkles, Smile, MessageSquareLock } from "lucide-react";
import { collection, query, where, orderBy, onSnapshot, addDoc } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { DirectMessage, UserProfile } from "../types";

interface DirectMessagingProps {
  userProfile: UserProfile | null;
  activeRecipientId: string | null;
  activeRecipientName: string | null;
  onClearRecipient: () => void;
}

const SIMULATED_CONVERSATIONS = [
  {
    peerId: "user_aisha",
    peerName: "Aisha Glow",
    peerObj: {
      photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
      greeting: "Hey lovely! Let me know if you want any tips on achieving that dewy bronze makeup look using A.R.I.!"
    },
    messages: [
      {
        messageId: "m1",
        senderId: "user_aisha",
        senderName: "Aisha Glow",
        recipientId: "current_user",
        recipientName: "Me",
        content: "Hello beautiful cosmetics partner! The A.R.I. diagnostics actually recommended their Warm Honey honey-bronzer layout for me too!",
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        messageId: "m2",
        senderId: "current_user",
        senderName: "Me",
        recipientId: "user_aisha",
        recipientName: "Aisha Glow",
        content: "OMG really?! Did you try sculpting under your cheek structure? Let me know how the highlight lines blended for you!",
        createdAt: new Date(Date.now() - 1800000).toISOString()
      }
    ]
  },
  {
    peerId: "user_clara",
    peerName: "Clara Rose",
    peerObj: {
      photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=150",
      greeting: "Hi babe! I simply love how our peer community matches shade codes to real products!"
    },
    messages: [
      {
        messageId: "m3",
        senderId: "user_clara",
        senderName: "Clara Rose",
        recipientId: "current_user",
        recipientName: "Me",
        content: "Your cool-toned alabaster blush recipe in the community timeline was gorgeous! Did you use a wet blender?",
        createdAt: new Date(Date.now() - 5400000).toISOString()
      }
    ]
  }
];

export default function DirectMessaging({ userProfile, activeRecipientId, activeRecipientName, onClearRecipient }: DirectMessagingProps) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [peersList, setPeersList] = useState(SIMULATED_CONVERSATIONS);
  const [selectedPeerId, setSelectedPeerId] = useState<string>("user_aisha");

  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeRecipientId) {
      setSelectedPeerId(activeRecipientId);
      // Ensure we have a placeholder conversation if not already added
      const exists = peersList.some(p => p.peerId === activeRecipientId);
      if (!exists) {
        setPeersList(prev => [
          {
            peerId: activeRecipientId,
            peerName: activeRecipientName || "Cosmetics Partner",
            peerObj: {
              photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150",
              greeting: "Hello, let's explore beautiful styles together!"
            },
            messages: []
          },
          ...prev
        ]);
      }
    }
  }, [activeRecipientId, activeRecipientName]);

  // Handle dynamic real-time Firestore database messaging loading
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const messagesQuery = query(
      collection(db, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const dbMsgs: DirectMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as DirectMessage;
        // Client-side secure Filter matching security rules enforcers:
        if (
          (data.senderId === user.uid && data.recipientId === selectedPeerId) ||
          (data.senderId === selectedPeerId && data.recipientId === user.uid)
        ) {
          dbMsgs.push(data);
        }
      });

      if (dbMsgs.length > 0) {
        setMessages(dbMsgs);
      }
    }, (error) => {
       console.warn("Messages snapshot denied (expected when unauthenticated). Switched to secure simulations.", error);
    });

    return () => unsubscribe();
  }, [selectedPeerId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedPeerId, peersList]);

  const activePeer = peersList.find(p => p.peerId === selectedPeerId) || peersList[0];

  // Load appropriate messages depending on active state
  const displayedMessages = auth.currentUser ? messages : activePeer.messages;

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const user = auth.currentUser;
    if (!user) {
      // Simulate reply visually in preview
      const userMessage: any = {
        messageId: "my_" + Date.now(),
        senderId: "current_user",
        senderName: "Me",
        recipientId: selectedPeerId,
        recipientName: activePeer.peerName,
        content: inputText,
        createdAt: new Date().toISOString()
      };

      setPeersList(prev => prev.map(p => {
        if (p.peerId === selectedPeerId) {
          return {
             ...p,
             messages: [...p.messages, userMessage]
          };
        }
        return p;
      }));
      setInputText("");

      // Simulate a nice best-friend cosmetics reply
      setTimeout(() => {
        const responses = [
          "Aww darling! That sounds so flawless! Let me know if you tried combining that with our dewy highlighters!",
          "Yes! Staggering the shading works perfectly for oval structures! You should post a snap to our Lookbook feed!",
          "I fully agree. That is why A.R.I. is so much better than static store apps! The diagnostic is hyper-focused!"
        ];
        const randomReply = responses[Math.floor(Math.random() * responses.length)];
        const systemReply = {
          messageId: "sys_" + Date.now(),
          senderId: selectedPeerId,
          senderName: activePeer.peerName,
          recipientId: "current_user",
          recipientName: "Me",
          content: randomReply,
          createdAt: new Date().toISOString()
        };
        setPeersList(prev => prev.map(p => {
          if (p.peerId === selectedPeerId) {
            return {
               ...p,
               messages: [...p.messages, systemReply]
            };
          }
          return p;
        }));
      }, 1500);
      return;
    }

    const payload: DirectMessage = {
      messageId: "msg_" + Date.now(),
      senderId: user.uid,
      senderName: user.displayName || "Cosmetics Professional",
      recipientId: selectedPeerId,
      recipientName: activePeer.peerName,
      content: inputText,
      createdAt: new Date().toISOString()
    };

    const docPath = `messages/${payload.messageId}`;
    try {
      await addDoc(collection(db, "messages"), payload);
      // Update local state visually
      setMessages(prev => [...prev, payload]);
      setInputText("");
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  };

  return (
    <div id="direct-messaging" className="bg-white/80 backdrop-blur-md rounded-2xl border border-pink-200/60 overflow-hidden shadow-sm flex h-[500px] animate-fade-in">
      {/* Left Sidebar: Conversational Peers */}
      <div className="w-1/3 border-r border-pink-100 flex flex-col bg-pink-50/10">
        <div className="p-4 border-b border-pink-150">
          <span className="text-[10px] font-mono text-teal-600 font-bold uppercase tracking-wider block mb-1">
            💬 Private Chats
          </span>
          <h3 className="font-extrabold text-slate-800 text-xs">Inbox Correspondence</h3>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-pink-105/20">
          {peersList.map((peer) => {
            const isSelected = peer.peerId === selectedPeerId;
            return (
              <div
                key={peer.peerId}
                onClick={() => setSelectedPeerId(peer.peerId)}
                className={`p-3.5 flex items-center gap-3 cursor-pointer transition ${
                  isSelected ? "bg-pink-50/45 border-l-3 border-pink-500" : "hover:bg-white"
                }`}
              >
                <img
                  src={peer.peerObj.photo}
                  alt={peer.peerName}
                  className="w-10 h-10 rounded-full object-cover border border-pink-200"
                  referrerPolicy="no-referrer"
                />
                <div className="hidden md:block overflow-hidden">
                  <p className="text-xs font-extrabold text-slate-800 truncate leading-tight">{peer.peerName}</p>
                  <p className="text-[10px] text-slate-500 mt-1 truncate">{peer.peerObj.greeting}</p>
                </div>
              </div>
            );
          })}
        </div>
        {!auth.currentUser && (
          <div className="bg-pink-50/60 p-3 border-t border-pink-100 text-[10px] text-pink-700 font-bold">
            💡 Authenticate with Google (Profile Tab) to trigger real-time Cloud sync chats!
          </div>
        )}
      </div>

      {/* Right Chat Grid */}
      <div className="flex-1 flex flex-col justify-between bg-slate-50/30">
        {/* Chat partner header */}
        <div className="p-4 bg-white border-b border-pink-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={activePeer.peerObj.photo}
              alt={activePeer.peerName}
              className="w-9 h-9 rounded-full object-cover border-2 border-pink-300"
              referrerPolicy="no-referrer"
            />
            <div>
              <p className="text-xs font-extrabold text-slate-800 leading-tight">{activePeer.peerName}</p>
              <span className="text-[9px] text-teal-600 font-mono flex items-center gap-1 mt-0.5 font-extrabold pb-0.5 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" /> SECURE MESSAGING ROOM
              </span>
            </div>
          </div>
          <span className="text-pink-500 animate-pulse">
            <MessageSquareLock className="w-4 h-4" />
          </span>
        </div>

        {/* MESSAGES LOG BODY */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {displayedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <Sparkles className="w-8 h-8 text-pink-500 animate-pulse mb-2" />
              <p className="text-slate-800 font-bold text-xs">A Secure Connection Established</p>
              <p className="text-slate-500 text-[11px] mt-1 max-w-xs">{activePeer.peerObj.greeting}</p>
            </div>
          ) : (
            displayedMessages.map((msg) => {
              const isOwn = msg.senderId === "current_user" || (auth.currentUser && msg.senderId === auth.currentUser.uid);
              return (
                <div
                  key={msg.messageId}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed ${
                      isOwn
                        ? "bg-gradient-to-tr from-teal-500 via-pink-400 to-pink-500 text-white rounded-tr-none shadow-xs font-medium"
                        : "bg-white text-slate-700 border border-pink-100/55 rounded-tl-none shadow-3xs font-medium"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <div className={`flex items-center gap-1 justify-end text-[8px] mt-1 ${isOwn ? "text-pink-100" : "text-slate-400"}`}>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isOwn && <CheckCheck className="w-3 h-3 text-pink-200" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* INPUT TRAY */}
        <form onSubmit={sendMessage} className="p-3 bg-white border-t border-pink-100/45 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type an encouraging comment or style inquiry..."
            className="flex-1 bg-slate-50/50 border border-pink-100/60 px-3.5 py-2.5 rounded-xl text-xs focus:outline-pink-400 focus:bg-white focus:ring-1 focus:ring-pink-300 transition"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-teal-500 to-pink-500 text-white p-2.5 rounded-xl flex items-center justify-center cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
