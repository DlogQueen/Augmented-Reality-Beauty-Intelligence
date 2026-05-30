import React, { useState, useEffect } from "react";
import { MessageSquare, Heart, Sparkles, Send, Plus, Eye, Share2, Clipboard, Camera } from "lucide-react";
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { CommunityPost, UserProfile } from "../types";

interface CommunityFeedProps {
  userProfile: UserProfile | null;
  onSelectUserForDM: (userId: string, userName: string) => void;
  onImportShades: (shades: any) => void;
}

const SAMPLE_POSTS = [
  {
    postId: "sample_post_1",
    authorId: "user_aisha",
    authorName: "Aisha Glow",
    authorPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
    imageUrl: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=600",
    caption: "Trying out my new holographic golden highlight vectors matched by A.R.I.! Absolutely loving the dual hydration results. What do we think?",
    likesCount: 24,
    likes: [] as string[],
    shadesUsed: {
      foundationName: "Golden Honey 340",
      foundationHex: "#c68e62",
      blushName: "Tangerine Sunset Blush",
      blushHex: "#e28761",
      highlighterName: "Gilded Gold",
      highlighterHex: "#f1d4ab"
    },
    comments: [
      {
        commentId: "c1",
        authorId: "user_clara",
        authorName: "Clara Rose",
        authorPhoto: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400",
        text: "The blush blending is pristine! Staggering the contour lines really elevated your cheeks.",
        createdAt: new Date().toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    postId: "sample_post_2",
    authorId: "user_clara",
    authorName: "Clara Rose",
    authorPhoto: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400",
    imageUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=600",
    caption: "Sunset blush cocktail style ✨ I let A.R.I. map my micro-texture before sculpting. Adoring the velvet finish rose pigments!",
    likesCount: 18,
    likes: [] as string[],
    shadesUsed: {
      foundationName: "Alabaster Rose 110",
      foundationHex: "#ebd1bc",
      blushName: "Petal Pink Cream Blush",
      blushHex: "#e090a2",
      highlighterName: "Ice Opal Glow",
      highlighterHex: "#fcebf3"
    },
    comments: [],
    createdAt: new Date(Date.now() - 7200000).toISOString()
  }
];

export default function CommunityFeed({ userProfile, onSelectUserForDM, onImportShades }: CommunityFeedProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [caption, setCaption] = useState("");
  const [postImagePreset, setPostImagePreset] = useState("https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=450");
  const [fName, setFName] = useState("Warm Cocoa");
  const [fHex, setFHex] = useState("#8d5d3d");
  const [bName, setBName] = useState("Plum Berry");
  const [bHex, setBHex] = useState("#9d4f61");
  const [hName, setHName] = useState("Opal Pearl");
  const [hHex, setHHex] = useState("#fae8eb");

  // Comment input state dictionary matching postId -> text string
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Real-time listener for database posts
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsData: CommunityPost[] = [];
      snapshot.forEach(doc => {
        docsData.push({ id: doc.id, ...doc.data() } as any);
      });
      // Merge db posts with samples to guarantee initial beautiful visuals in clean previews!
      setPosts([...docsData, ...SAMPLE_POSTS]);
    }, (error) => {
      console.warn("Could not retrieve real-time posts (unauthenticated is expected):", error);
      // Fallback to sample posts gracefully
      setPosts(SAMPLE_POSTS);
    });

    return () => unsubscribe();
  }, []);

  const handleLike = async (post: CommunityPost) => {
    const user = auth.currentUser;
    if (!user) {
      alert("Authenticate using Google Sign-In inside your Profile tab to leave real likes!");
      return;
    }

    const postRef = doc(db, "posts", post.postId || (post as any).id);
    const hasLiked = post.likes.includes(user.uid);
    const docPath = `posts/${post.postId}`;

    try {
      if (hasLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid),
          likesCount: Math.max(0, post.likesCount - 1)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid),
          likesCount: post.likesCount + 1
        });
      }
    } catch (error) {
       console.warn("Saving to cloud ignored for preset samples. Incrementing visually.");
       // Local state update for sample items
       setPosts(prev => prev.map(p => {
         if (p.postId === post.postId) {
           const nextLikes = hasLiked ? p.likes.filter(id => id !== user.uid) : [...p.likes, user.uid];
           return {
             ...p,
             likes: nextLikes,
             likesCount: hasLiked ? p.likesCount - 1 : p.likesCount + 1
           };
         }
         return p;
       }));
    }
  };

  const handleAddComment = async (postId: string) => {
    const user = auth.currentUser;
    if (!user) {
      alert("Log in with Google underneath the Profile setup to interact and write comments!");
      return;
    }

    const commentText = commentInputs[postId];
    if (!commentText || !commentText.trim()) return;

    const newComment = {
      commentId: "c_" + Date.now(),
      authorId: user.uid,
      authorName: user.displayName || "Beauty Fan",
      authorPhoto: user.photoURL || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=450",
      text: commentText.trim(),
      createdAt: new Date().toISOString()
    };

    const targetPost = posts.find(p => p.postId === postId || (p as any).id === postId);
    if (!targetPost) return;

    const docPath = `posts/${postId}`;
    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });
      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
    } catch (error) {
      console.warn("Post is a local preset template or database is unauthenticated. Incrementing locally.");
      setPosts(prev => prev.map(p => {
        if (p.postId === postId || (p as any).id === postId) {
          return {
            ...p,
            comments: [...(p.comments || []), newComment]
          };
        }
        return p;
      }));
      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      alert("Please authenticate using the Google button in the Profile tab before publishing looks!");
      return;
    }

    if (!caption.trim()) return;

    setLoading(true);
    const freshPostId = "post_" + Date.now();
    const docPath = `posts/${freshPostId}`;

    const newPostData = {
      postId: freshPostId,
      authorId: user.uid,
      authorName: user.displayName || "Cosmetics Architect",
      authorPhoto: user.photoURL || "",
      imageUrl: postImagePreset,
      caption: caption,
      likesCount: 0,
      likes: [],
      shadesUsed: {
        foundationName: fName,
        foundationHex: fHex,
        blushName: bName,
        blushHex: bHex,
        highlighterName: hName,
        highlighterHex: hHex
      },
      comments: [],
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, "posts"), newPostData);
      setCaption("");
      setShowCreatorModal(false);
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, docPath);
    } finally {
      setLoading(false);
    }
  };  return (
    <div id="community-feed" className="space-y-6 animate-fade-in">
      {/* Feed Header */}
      <div className="flex items-center justify-between bg-white/80 backdrop-blur-md rounded-2xl border border-pink-200/60 p-5 shadow-xs">
        <div>
          <span className="text-xs font-mono text-teal-600 font-bold uppercase tracking-wider block mb-1">
            👯 Peer Feedback Hub
          </span>
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <span className="bg-gradient-to-r from-teal-600 via-pink-500 to-pink-600 bg-clip-text text-transparent">A.R.I. Social Lookbook</span>
            <Sparkles className="w-5 h-5 text-pink-500 animate-pulse" />
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Showcase your sculpted contours, exchange peer reviews, inspect used cosmetics shade HEXs, and foster beauty confidence.
          </p>
        </div>
        <button
          id="btn-create-post"
          onClick={() => {
            if (!auth.currentUser) {
              alert("Sign in using the login tab to post creations to our beautiful database feed!");
            } else {
              setShowCreatorModal(true);
            }
          }}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-pink-500 text-white rounded-xl font-bold text-xs hover:scale-103 hover:shadow-md cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" /> Share Creation
        </button>
      </div>

      {/* CREATOR MODAL Drawer */}
      {showCreatorModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-pink-100 shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <h3 className="text-lg font-black bg-gradient-to-r from-teal-600 to-pink-600 bg-clip-text text-transparent mb-1">Publish Makeup Creation</h3>
            <p className="text-xs text-slate-500 mb-4 font-medium">Join our wonderful global cosmetics developer circle and get feedback on your contours!</p>

            <form onSubmit={handleSubmitPost} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-teal-700 font-mono mb-1">CAPTION</label>
                <textarea
                  required
                  rows={2}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Tell us about your diagnostic results or sculpted themes..."
                  className="w-full text-xs p-3 rounded-xl border border-pink-100 focus:outline-pink-400 focus:ring-1 focus:ring-pink-400 bg-slate-50/50"
                />
              </div>

              {/* Photo presets picker */}
              <div>
                <label className="block text-xs font-bold text-teal-700 font-mono mb-2">CHOOSE SNAPSHOT PRESET</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=450",
                    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=450",
                    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=450"
                  ].map(url => (
                    <img
                      key={url}
                      src={url}
                      onClick={() => setPostImagePreset(url)}
                      className={`h-20 object-cover rounded-xl cursor-pointer border-2 transition-all duration-200 ${
                        postImagePreset === url ? "border-pink-500 scale-[1.03]" : "border-transparent opacity-85"
                      }`}
                      referrerPolicy="no-referrer"
                    />
                  ))}
                </div>
              </div>

              {/* COSMETIC SHADES RECIPE */}
              <div className="bg-pink-50/25 p-3.5 rounded-xl border border-pink-100/60 space-y-3">
                <p className="text-[10px] font-mono font-bold text-pink-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  💄 Cosmetic Shades Config
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 mb-0.5">Foundation Name</label>
                    <input
                      type="text"
                      value={fName}
                      onChange={e => setFName(e.target.value)}
                      className="w-full text-xs p-2 bg-white rounded-lg border border-pink-100/30"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-0.5">Foundation HEX</label>
                    <input
                      type="color"
                      value={fHex}
                      onChange={e => setFHex(e.target.value)}
                      className="w-full h-8 cursor-pointer rounded"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-0.5">Blush Name</label>
                    <input
                      type="text"
                      value={bName}
                      onChange={e => setBName(e.target.value)}
                      className="w-full text-xs p-2 bg-white rounded-lg border border-pink-100/30"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-0.5">Blush HEX</label>
                    <input
                      type="color"
                      value={bHex}
                      onChange={e => setBHex(e.target.value)}
                      className="w-full h-8 cursor-pointer rounded"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreatorModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 rounded-xl cursor-pointer transition disabled:opacity-50"
                >
                  {loading ? "Publishing..." : "Publish Look"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FEED LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => {
          const isLiked = auth.currentUser ? post.likes.includes(auth.currentUser.uid) : false;
          return (
            <div
              key={post.postId || (post as any).id}
              className="bg-white/90 backdrop-blur-md rounded-2xl border border-pink-200/60 overflow-hidden shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-pink-300 transition-all duration-300"
            >
              <div>
                {/* Author Info */}
                <div className="flex items-center gap-2.5 p-4 border-b border-pink-100/40">
                  <img
                    src={post.authorPhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"}
                    alt={post.authorName}
                    className="w-9 h-9 rounded-full object-cover border-2 border-teal-400"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-extrabold text-slate-800 leading-none">{post.authorName}</p>
                      {((post.authorId === auth.currentUser?.uid && userProfile?.membershipTier === "vip") || post.authorId === "user_aisha") && (
                        <span className="text-[8px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded font-black font-mono tracking-wider flex items-center gap-0.5">
                          👑 VIP
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 capitalize font-semibold font-mono mt-1">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {auth.currentUser && post.authorId !== auth.currentUser.uid && (
                    <button
                      onClick={() => onSelectUserForDM(post.authorId, post.authorName)}
                      className="ml-auto text-[10px] uppercase font-bold tracking-widest text-pink-700 bg-pink-50 hover:bg-pink-100 hover:scale-102 px-3 py-1.5 rounded-lg transitioncursor-pointer"
                    >
                      📩 Chat DM
                    </button>
                  )}
                </div>

                {/* Post Portrait */}
                <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden border-b border-pink-100/40">
                  <img
                    src={post.imageUrl}
                    alt="Selfie beauty snap"
                    className="w-full h-full object-cover hover:scale-102 transition duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Likes / Actions Panel */}
                <div className="p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <button
                      onClick={() => handleLike(post)}
                      className={`flex items-center gap-1.5 text-xs font-bold ${
                        isLiked ? "text-pink-600 scale-102" : "text-slate-500 hover:text-pink-600"
                      } transition cursor-pointer`}
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? "fill-current text-pink-600 animate-pulse" : ""}`} />
                      {post.likesCount} {post.likesCount === 1 ? "Like" : "Likes"}
                    </button>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MessageSquare className="w-4 h-4 text-teal-600" />
                      {post.comments?.length || 0} peer reviews
                    </span>
                  </div>

                  <p className="text-slate-700 text-xs leading-relaxed mb-4 font-semibold">
                    {post.caption}
                  </p>

                  {/* INSPECT SHADES ACCORDION */}
                  {post.shadesUsed && (
                    <div className="bg-pink-50/20 rounded-xl p-3 border border-pink-100/50 mb-4">
                      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-pink-100/30">
                        <span className="text-[10px] font-mono font-bold text-pink-500 uppercase tracking-widest">
                          💄 Diagnostic Shades Recipe
                        </span>
                        <button
                          onClick={() => {
                            onImportShades(post.shadesUsed);
                            alert("Pigments imported into your Try-On Simulator Studio! Select the Try-On tab to view placement!");
                          }}
                          className="flex items-center gap-1 text-[9px] uppercase font-bold text-teal-600 hover:text-pink-600 cursor-pointer transition-colors"
                        >
                          <Clipboard className="w-3 h-3" /> Import Shades
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                        {post.shadesUsed.foundationHex && (
                          <div className="flex items-center gap-1.5 p-1 bg-white rounded-lg border border-pink-100/30">
                            <span className="w-3 h-3 rounded-full shrink-0 border border-slate-200" style={{ backgroundColor: post.shadesUsed.foundationHex }} />
                            <span className="truncate text-slate-600 font-bold">{post.shadesUsed.foundationName || "Fdn"}</span>
                          </div>
                         )}
                        {post.shadesUsed.blushHex && (
                          <div className="flex items-center gap-1.5 p-1 bg-white rounded-lg border border-pink-100/30">
                            <span className="w-3 h-3 rounded-full shrink-0 border border-slate-200" style={{ backgroundColor: post.shadesUsed.blushHex }} />
                            <span className="truncate text-slate-600 font-bold">{post.shadesUsed.blushName || "Blsh"}</span>
                          </div>
                        )}
                        {post.shadesUsed.highlighterHex && (
                          <div className="flex items-center gap-1.5 p-1 bg-white rounded-lg border border-pink-100/30">
                            <span className="w-3 h-3 rounded-full shrink-0 border border-slate-200" style={{ backgroundColor: post.shadesUsed.highlighterHex }} />
                            <span className="truncate text-slate-600 font-bold">{post.shadesUsed.highlighterName || "Hgh"}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* COMMENTS LOGS */}
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {post.comments?.map((comment) => (
                      <div key={comment.commentId} className="flex gap-2 items-start text-xs bg-teal-50/10 p-2.5 rounded-xl border border-teal-100/20">
                        <img
                          src={comment.authorPhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"}
                          alt={comment.authorName}
                          className="w-6 h-6 rounded-full object-cover border-2 border-pink-300 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="font-extrabold text-slate-800 leading-tight flex items-center gap-1">
                            {comment.authorName}
                            {((comment.authorId === auth.currentUser?.uid && userProfile?.membershipTier === "vip") || comment.authorId === "user_aisha") && (
                              <span className="text-[7.5px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-black font-mono tracking-wider scale-95">
                                👑 VIP
                              </span>
                            )}
                          </p>
                          <p className="text-slate-600 mt-0.5 text-[11px] leading-tight">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* WRITE COMMENT INPUT */}
              <div className="p-4 border-t border-pink-100/40 bg-pink-50/5 flex gap-2">
                <input
                  type="text"
                  placeholder="Provide peer feedback, ask questions..."
                  value={commentInputs[post.postId || (post as any).id] || ""}
                  onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.postId || (post as any).id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddComment(post.postId || (post as any).id);
                  }}
                  className="flex-1 bg-white border border-pink-150 p-2.5 rounded-xl text-xs focus:outline-pink-400 focus:ring-1 focus:ring-pink-450"
                />
                <button
                  onClick={() => handleAddComment(post.postId || (post as any).id)}
                  className="p-2.5 bg-gradient-to-r from-teal-500 to-pink-500 text-white rounded-xl hover:shadow-2xs cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

