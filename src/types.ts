export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  photoURL: string;
  skinUndertone?: string; // Warm, Cool, Neutral, Olive
  skinTexture?: string; // Dry, Oily, Combination, Normal
  makeupStyle?: string; // Glam, Minimalist, Corporate, Natural
  favorites?: string[];
  savedTutorials?: string[];
  onboardingCompleted?: boolean;
  isPrivateProfile?: boolean;
  pronouns?: string;
  bio?: string;
  instagramHandle?: string;
  tiktokHandle?: string;
  favoriteProducts?: string[];
  membershipTier?: "free" | "vip";
}

export interface SavedLook {
  id: string;
  name: string;
  userId: string;
  undertone: string;
  texture: string;
  contourPoints: {
    forehead: string;
    cheeks: string;
    jawline: string;
    nose: string;
  };
  shades: {
    foundation: string; // HEX code
    foundationName: string;
    concealer: string;
    concealerName: string;
    blush: string;
    blushName: string;
    highlighter: string;
    highlighterName: string;
  };
  notes?: string;
  createdAt: string;
}

export interface CommunityComment {
  commentId: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  text: string;
  createdAt: string;
}

export interface CommunityPost {
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  imageUrl: string;
  caption: string;
  likesCount: number;
  likes: string[]; // array of userIds
  shadesUsed?: {
    foundationName?: string;
    foundationHex?: string;
    blushName?: string;
    blushHex?: string;
    highlighterName?: string;
    highlighterHex?: string;
  };
  comments: CommunityComment[];
  createdAt: string;
}

export interface DirectMessage {
  messageId: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  content: string;
  createdAt: string;
}

export interface MakeupLookTutorial {
  id: string;
  name: string;
  difficulty: "Beginner" | "Intermediate" | "Pro";
  description: string;
  steps: string[];
  shades: {
    foundation: string;
    blush: string;
    highlighter: string;
  };
}
