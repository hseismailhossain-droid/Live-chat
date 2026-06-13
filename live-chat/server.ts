import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface User {
  id: string;
  name: string;
  password?: string; // Secure passcode/PIN setup to avoid unauthorized access
  status: 'online' | 'offline';
  lastSeen: number;
  isAdmin?: boolean;
}

interface ChatMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: number;
  read: boolean;
}

interface PostReaction {
  like: string[];
  love: string[];
  haha: string[];
  wow: string[];
  sad: string[];
}

interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: number;
}

interface UserPost {
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

// In-memory data store
const users = new Map<string, User>();
// Pre-register Admin
users.set('admin_ismail', {
  id: 'admin_ismail',
  name: 'Admin',
  password: 'hseismailhossain@gmail.com', // Pre-registered Admin credential
  status: 'offline',
  lastSeen: Date.now(),
  isAdmin: true,
});

const activeConnections = new Map<string, WebSocket>(); // userId -> WebSocket
const messages: ChatMessage[] = [];
const posts: UserPost[] = [];

// Dynamic Advertising Configuration Store
interface AdsConfig {
  showInChatBackdrop: boolean;
  showInFeedSidebar: boolean;
  showInFeedHeader: boolean;
  adsterraScript: string;
  googleAdsenseClientId: string;
  googleAdsenseSlotId: string;
  customHtml: string;
  activeAdNetwork: 'none' | 'adsterra' | 'google_adsense' | 'custom_html';
}

let adsConfig: AdsConfig = {
  showInChatBackdrop: false,
  showInFeedSidebar: false,
  showInFeedHeader: false,
  adsterraScript: '',
  googleAdsenseClientId: '',
  googleAdsenseSlotId: '',
  customHtml: '',
  activeAdNetwork: 'none',
};


async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // Set up WebSocket server
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws: WebSocket) => {
    let currentUserId: string | null = null;

    ws.on('message', (data: string) => {
      try {
        const message = JSON.parse(data);
        const { type, payload } = message;

        if (type === 'join') {
          const { userId, name, isAdmin, password } = payload;
          currentUserId = userId;

          // Check if user already exists
          let existingUser = users.get(userId);
          if (!existingUser) {
            existingUser = Array.from(users.values()).find(
              (u) => u && u.name && u.name.trim().toLowerCase() === name.trim().toLowerCase()
            );
          }

          // Safe login take-over if logged in elsewhere
          const oldSocket = activeConnections.get(userId);
          if (oldSocket && oldSocket !== ws) {
            try {
              oldSocket.close(1001, 'duplicate_session');
            } catch (e) {
              // ignore socket close errors
            }
          }

          const isUserAdmin = isAdmin || userId === 'admin_ismail';
          const updatedUser: User = {
            id: userId,
            name: name,
            password: existingUser?.password || password,
            status: 'online',
            lastSeen: Date.now(),
            isAdmin: isUserAdmin,
          };
          users.set(userId, updatedUser);
          activeConnections.set(userId, ws);

          // Return welcome pack with other users and historical messages involving this user (or all messages for Admin)
          const recentMessages = isUserAdmin
            ? messages
            : messages.filter((msg) => msg.from === userId || msg.to === userId);

          // Strip password from the users list sent to clients
          const sanitizedUsers = Array.from(users.values()).map(u => ({
            id: u.id,
            name: u.name,
            status: u.status,
            lastSeen: u.lastSeen,
            isAdmin: u.isAdmin
          }));

          // Send welcome data to joining client
          ws.send(JSON.stringify({
            type: 'welcome',
            payload: {
              currentUser: {
                id: updatedUser.id,
                name: updatedUser.name,
                status: updatedUser.status,
                lastSeen: updatedUser.lastSeen,
                isAdmin: updatedUser.isAdmin,
              },
              users: sanitizedUsers,
              messages: recentMessages,
              posts: posts,
              adsConfig: adsConfig,
            },
          }));

          // Broadcast user status update to everyone else (excluding password field for privacy)
          broadcast({
            type: 'user_status',
            payload: {
              id: updatedUser.id,
              name: updatedUser.name,
              status: updatedUser.status,
              lastSeen: updatedUser.lastSeen,
              isAdmin: updatedUser.isAdmin,
            },
          }, userId);
        }

        else if (type === 'message') {
          if (!currentUserId) return;
          const { id, to, content } = payload;

          const chatMsg: ChatMessage = {
            id,
            from: currentUserId,
            to,
            content,
            timestamp: Date.now(),
            read: false,
          };

          messages.push(chatMsg);

          // Keep history bounded to avoid memory exhaustion
          if (messages.length > 2000) {
            messages.shift();
          }

          // Send to recipient if online
          const recipientSocket = activeConnections.get(to);
          if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
            recipientSocket.send(JSON.stringify({
              type: 'message',
              payload: chatMsg,
            }));
          }

          // Echo back to sender for confirmation & consistency
          ws.send(JSON.stringify({
            type: 'message',
            payload: chatMsg,
          }));
        }

        else if (type === 'typing') {
          if (!currentUserId) return;
          const { to, isTyping } = payload;

          const recipientSocket = activeConnections.get(to);
          if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
            recipientSocket.send(JSON.stringify({
              type: 'typing',
              payload: {
                from: currentUserId,
                isTyping,
              },
            }));
          }
        }

        else if (type === 'read_receipt') {
          if (!currentUserId) return;
          const { from } = payload;

          // Mark all messages from 'from' to 'currentUserId' as read
          messages.forEach((msg) => {
            if (msg.from === from && msg.to === currentUserId) {
              msg.read = true;
            }
          });

          // Notify sender that their messages to current user were read
          const senderSocket = activeConnections.get(from);
          if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
            senderSocket.send(JSON.stringify({
              type: 'read_receipt',
              payload: {
                byUserId: currentUserId,
                fromUserId: from,
              },
            }));
          }
        }

        else if (type === 'create_post') {
          if (!currentUserId) return;
          const { id, content } = payload;
          const user = users.get(currentUserId);
          if (!user) return;

          const newPost: UserPost = {
            id,
            authorId: currentUserId,
            authorName: user.name,
            content,
            timestamp: Date.now(),
            reactions: {
              like: [],
              love: [],
              haha: [],
              wow: [],
              sad: []
            },
            comments: []
          };

          posts.unshift(newPost); // Add at the start so newer posts appear first

          // Keep posts bounded to avoid memory exhaustion
          if (posts.length > 500) {
            posts.pop();
          }

          // Broadcast to everyone (including sender)
          broadcast({
            type: 'post_created',
            payload: newPost
          });
        }

        else if (type === 'delete_post') {
          if (!currentUserId) return;
          const { postId } = payload;
          const user = users.get(currentUserId);
          if (!user) return;

          const postIndex = posts.findIndex(p => p.id === postId);
          if (postIndex !== -1) {
            const post = posts[postIndex];
            // Allow deletion only if the user is author or is Admin
            if (post.authorId === currentUserId || user.isAdmin) {
              posts.splice(postIndex, 1);
              broadcast({
                type: 'post_deleted',
                payload: { postId }
              });
            }
          }
        }

        else if (type === 'edit_post') {
          if (!currentUserId) return;
          const { postId, content } = payload;
          const user = users.get(currentUserId);
          if (!user) return;

          const post = posts.find(p => p.id === postId);
          if (post) {
            // Allow edit only if the user is author or is Admin
            if (post.authorId === currentUserId || user.isAdmin) {
              post.content = content;
              post.edited = true;
              post.editedAt = Date.now();
              broadcast({
                type: 'post_edited',
                payload: {
                  postId,
                  content,
                  edited: true,
                  editedAt: post.editedAt
                }
              });
            }
          }
        }

        else if (type === 'add_reaction') {
          if (!currentUserId) return;
          const { postId, reactionType } = payload; // reactionType can be 'like', 'love', 'haha', 'wow', 'sad'

          const post = posts.find(p => p.id === postId);
          if (post) {
            // Remove user's previous reaction from all categories to ensure one reaction per post per user
            const keys: (keyof PostReaction)[] = ['like', 'love', 'haha', 'wow', 'sad'];
            let alreadyReactedThisWay = false;

            keys.forEach(k => {
              if (post.reactions[k]) {
                const existed = post.reactions[k].includes(currentUserId);
                if (existed && k === reactionType) {
                  alreadyReactedThisWay = true;
                }
                // filter out the user
                post.reactions[k] = post.reactions[k].filter(uid => uid !== currentUserId);
              } else {
                post.reactions[k] = [];
              }
            });

            // If they didn't click the exact same reaction (which acts as toggle off), add it
            if (!alreadyReactedThisWay) {
              if (post.reactions[reactionType as keyof PostReaction]) {
                post.reactions[reactionType as keyof PostReaction].push(currentUserId);
              }
            }

            broadcast({
              type: 'reaction_updated',
              payload: {
                postId,
                reactions: post.reactions
              }
            });
          }
        }

        else if (type === 'add_comment') {
          if (!currentUserId) return;
          const { id, postId, content } = payload;
          const user = users.get(currentUserId);
          if (!user) return;

          const post = posts.find(p => p.id === postId);
          if (post) {
            const newComment: PostComment = {
              id,
              postId,
              authorId: currentUserId,
              authorName: user.name,
              content,
              timestamp: Date.now()
            };

            post.comments.push(newComment);

            broadcast({
              type: 'comment_added',
              payload: {
                postId,
                comment: newComment
              }
            });
          }
        }

        else if (type === 'update_ads') {
          if (!currentUserId) return;
          const user = users.get(currentUserId);
          if (user && user.isAdmin) {
            adsConfig = { ...adsConfig, ...payload };
            broadcast({
              type: 'ads_updated',
              payload: adsConfig
            });
          }
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      if (currentUserId) {
        const user = users.get(currentUserId);
        if (user) {
          user.status = 'offline';
          user.lastSeen = Date.now();
          users.set(currentUserId, user);

          // Broadcast status update with full user details
          broadcast({
            type: 'user_status',
            payload: user,
          });
        }
        activeConnections.delete(currentUserId);
      }
    });

    // Helper to broadcast to active connections (excluding optional senderId)
    function broadcast(msg: any, excludeId?: string) {
      const payloadString = JSON.stringify(msg);
      activeConnections.forEach((sock, uid) => {
        if (uid !== excludeId && sock.readyState === WebSocket.OPEN) {
          sock.send(payloadString);
        }
      });
    }
  });

  // REST endpoints if needed in future, currently none needed but good to have a diagnostic one
  app.get('/api/check-username', (req, res) => {
    const name = (req.query.name as string || '').trim();
    const password = (req.query.password as string || '').trim();

    if (!name) {
      return res.json({ available: false, error: 'নাম খালি রাখা যাবে না।' });
    }

    const nameLower = name.toLowerCase();
    if (nameLower === 'admin' || nameLower === 'administrator') {
      return res.json({ available: false, error: 'এই নামটি সাধারণ ক্লায়েন্ট হিসেবে ব্যবহার করা যাবে না।' });
    }

    if (!password) {
      return res.json({ available: false, error: 'আপনার অ্যাকাউন্ট সুরক্ষিত করতে অবশ্যই একটি ৫-সংখ্যার পিন বা পাসওয়ার্ড দিতে হবে।' });
    }

    // Find if user already exists
    const existingUser = Array.from(users.values()).find(
      (u) => u && u.name && typeof u.name === 'string' && u.name.trim().toLowerCase() === nameLower
    );

    if (existingUser) {
      // Validate password
      if (existingUser.password && existingUser.password !== password) {
        return res.json({
          available: false,
          error: 'ভুল পাসওয়ার্ড/পিন! এই নামটি ইতিমধ্যেই অন্য কোনো ব্যবহারকারী পাসওয়ার্ড দিয়ে সুরক্ষিত করেছেন। দয়া করে সঠিক পাসওয়ার্ড দিন অথবা ভিন্ন একটি নাম নিয়ে নতুন অ্যাকাউন্ট খুলুন।'
        });
      }

      // If matches, they can log in
      return res.json({ available: true, userId: existingUser.id, name: existingUser.name });
    }

    // New name, available to register
    res.json({ available: true, userId: null, name: null });
  });

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      usersConnected: activeConnections.size,
      totalUsers: users.size,
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Live Chat full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Error starting full-stack live chat server:', error);
});
