export interface User {
  id: string;
  name: string;
  password?: string; // Optional password/PIN property
  status: 'online' | 'offline';
  lastSeen: number;
  isAdmin?: boolean;
}

export interface ChatMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: number;
  read: boolean;
}

export interface PostReaction {
  like: string[]; // List of userIds
  love: string[]; // List of userIds
  haha: string[]; // List of userIds
  wow: string[];  // List of userIds
  sad: string[];  // List of userIds
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: number;
}

export interface UserPost {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: number;
  reactions: PostReaction;
  comments: PostComment[];
  edited?: boolean;
  editedAt?: number;
}

export type WsMessage =
  | { type: 'join'; payload: { userId: string; name: string } }
  | { type: 'message'; payload: { id: string; to: string; content: string } }
  | { type: 'typing'; payload: { to: string; isTyping: boolean } }
  | { type: 'read_receipt'; payload: { from: string } };

