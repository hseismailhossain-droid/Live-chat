import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  MessageSquare, 
  User as UserIcon, 
  Search, 
  Circle, 
  LogOut, 
  Volume2, 
  VolumeX, 
  Check, 
  CheckCheck, 
  ArrowLeft,
  Smile,
  Users,
  Languages,
  Trash2,
  Cpu,
  Flame
} from 'lucide-react';
import { User, ChatMessage } from './types';
import { translations } from './translations';

// Web Audio synthesizer for premium notification sounds
const playSynthSound = (type: 'send' | 'recv') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'send') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12); // G5
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(523.25, ctx.currentTime + 0.18); // C5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    }
  } catch (e) {
    console.warn('Audio Context not allowed or failed:', e);
  }
};

// Dynamic Advertisement Renderer
const AdSlotRenderer = ({ adConfig, placement }: { adConfig: any, placement: string }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear initial markup
    containerRef.current.innerHTML = '';

    // Verify if this placement is enabled
    const isEnabled = 
      (placement === 'chat_backdrop' && adConfig.showInChatBackdrop) ||
      (placement === 'feed_sidebar' && adConfig.showInFeedSidebar) ||
      (placement === 'feed_header' && adConfig.showInFeedHeader);

    if (!isEnabled || adConfig.activeAdNetwork === 'none') {
      return;
    }

    if (adConfig.activeAdNetwork === 'google_adsense') {
      const clientId = adConfig.googleAdsenseClientId;
      const slotId = adConfig.googleAdsenseSlotId;
      if (!clientId || !slotId) return;

      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', clientId);
      ins.setAttribute('data-ad-slot', slotId);
      ins.setAttribute('data-ad-format', 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');

      const wrapper = document.createElement('div');
      wrapper.className = 'w-full max-w-lg mx-auto p-2 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center min-h-[90px] text-center relative overflow-hidden';
      
      const label = document.createElement('span');
      label.className = 'text-[8px] font-mono tracking-[0.12em] text-slate-400 font-bold uppercase block mb-1.5';
      label.innerText = 'ADVERTISEMENT';

      wrapper.appendChild(label);
      wrapper.appendChild(ins);
      containerRef.current.appendChild(wrapper);

      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (e) {
        console.warn('Google AdSense push caught safety check:', e);
      }
    } 
    
    else if (adConfig.activeAdNetwork === 'adsterra' || adConfig.activeAdNetwork === 'custom_html') {
      const scriptCode = adConfig.activeAdNetwork === 'adsterra' ? adConfig.adsterraScript : adConfig.customHtml;
      if (!scriptCode || !scriptCode.trim()) return;

      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '110px';
      iframe.style.border = 'none';
      iframe.style.overflow = 'hidden';
      
      const wrapper = document.createElement('div');
      wrapper.className = 'w-full max-w-lg mx-auto p-1.5 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center min-h-[110px] relative overflow-hidden text-center';
      
      const label = document.createElement('span');
      label.className = 'text-[8px] font-mono tracking-[0.12em] text-slate-400 font-bold uppercase block mb-1.5';
      label.innerText = 'SPONSORED ADVERTISEMENT';
      
      wrapper.appendChild(label);
      wrapper.appendChild(iframe);
      containerRef.current.appendChild(wrapper);

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 90px; overflow: hidden; font-family: system-ui, sans-serif; }
              </style>
            </head>
            <body>
              ${scriptCode}
            </body>
          </html>
        `);
        doc.close();
      }
    }
  }, [adConfig, placement]);

  return <div ref={containerRef} className="w-full flex justify-center py-2" />;
};

// Color palettes for avatar initials
const AVATAR_COLORS = [
  'bg-indigo-500 text-white',
  'bg-emerald-500 text-white',
  'bg-amber-500 text-white',
  'bg-rose-500 text-white',
  'bg-sky-500 text-white',
  'bg-violet-500 text-white',
  'bg-teal-500 text-white',
];

const getAvatarStyle = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

export default function App() {
  // Language Support State
  const [lang, setLang] = useState<'bn' | 'en'>(() => {
    const cached = localStorage.getItem('chat_language');
    return (cached === 'en' || cached === 'bn') ? cached : 'bn';
  });

  const toggleLanguage = () => {
    const nextLang = lang === 'bn' ? 'en' : 'bn';
    setLang(nextLang);
    localStorage.setItem('chat_language', nextLang);
  };

  const t = (key: keyof typeof translations.bn) => {
    return translations[lang][key];
  };

  // Custom Delete Warning State
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  // Local storage properties
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('chat_current_user');
    return cached ? JSON.parse(cached) : null;
  });
  
  const [inputName, setInputName] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  
  // Advertisements Config persistence state
  const [adsConfig, setAdsConfig] = useState<{
    showInChatBackdrop: boolean;
    showInFeedSidebar: boolean;
    showInFeedHeader: boolean;
    adsterraScript: string;
    googleAdsenseClientId: string;
    googleAdsenseSlotId: string;
    customHtml: string;
    activeAdNetwork: 'none' | 'adsterra' | 'google_adsense' | 'custom_html';
  }>({
    showInChatBackdrop: false,
    showInFeedSidebar: false,
    showInFeedHeader: false,
    adsterraScript: '',
    googleAdsenseClientId: '',
    googleAdsenseSlotId: '',
    customHtml: '',
    activeAdNetwork: 'none'
  });
  const [showAdminAdsModal, setShowAdminAdsModal] = useState(false);
  
  // Real-time server states
  const [usersList, setUsersList] = useState<User[]>([]);
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [typingMap, setTypingMap] = useState<Record<string, boolean>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmojiRecipient, setSelectedEmojiRecipient] = useState(false);
  
  // Input fields
  const [messageInput, setMessageInput] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  // Social Feed States
  const [activeTab, setActiveTab] = useState<'chat' | 'feed'>('chat');
  const [posts, setPosts] = useState<any[]>([]);
  const [postInput, setPostInput] = useState('');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedCommentsMap, setExpandedCommentsMap] = useState<Record<string, boolean>>({});
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');

  // References
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const typingEmitterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-reconnect sequence
  useEffect(() => {
    if (!currentUser) return;
    
    let reconnectTimeout: NodeJS.Timeout;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}`;
      
      console.log('Connecting to WebSocket server:', wsUrl);
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        // Announce identity immediately on connect
        ws.send(JSON.stringify({
          type: 'join',
          payload: {
            userId: currentUser.id,
            name: currentUser.name,
            isAdmin: currentUser.isAdmin,
            password: currentUser.password,
          },
        }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const { type, payload } = msg;

          if (type === 'welcome') {
            const { users, messages, posts: welcomePosts, adsConfig: welcomeAds } = payload;
            setUsersList(users);
            setAllMessages(messages);
            if (welcomePosts) setPosts(welcomePosts);
            if (welcomeAds) setAdsConfig(welcomeAds);
          } 
          
          else if (type === 'user_status') {
            const statusUser: User = payload;
            setUsersList((prev) => {
              const clone = [...prev];
              const idx = clone.findIndex((u) => u.id === statusUser.id);
              if (idx !== -1) {
                clone[idx] = { ...clone[idx], ...statusUser };
              } else {
                clone.push(statusUser);
              }
              return clone;
            });
          } 
          
          else if (type === 'message') {
            const incomingMsg: ChatMessage = payload;
            
            setAllMessages((prev) => {
              // Deduplicate
              if (prev.some((m) => m.id === incomingMsg.id)) return prev;
              
              const next = [...prev, incomingMsg];
              return next;
            });

            // Trigger recipient receipt if viewing that partner
            if (incomingMsg.to === currentUser.id && selectedPartnerId === incomingMsg.from) {
              ws.send(JSON.stringify({
                type: 'read_receipt',
                payload: { from: incomingMsg.from },
              }));
            }

            // Synthesize audio
            if (soundEnabled) {
              const isFromMe = incomingMsg.from === currentUser.id;
              playSynthSound(isFromMe ? 'send' : 'recv');
            }
          } 
          
          else if (type === 'typing') {
            const { from, isTyping } = payload;
            setTypingMap((prev) => ({ ...prev, [from]: isTyping }));
          } 
          
          else if (type === 'read_receipt') {
            const { byUserId } = payload;
            setAllMessages((prev) =>
              prev.map((m) => {
                if (m.from === currentUser.id && m.to === byUserId) {
                  return { ...m, read: true };
                }
                return m;
              })
            );
          }

          else if (type === 'post_created') {
            const newPost = payload;
            setPosts((prev) => {
              if (prev.some((p) => p.id === newPost.id)) return prev;
              return [newPost, ...prev];
            });
          }

          else if (type === 'post_deleted') {
            const { postId } = payload;
            setPosts((prev) => prev.filter((p) => p.id !== postId));
          }

          else if (type === 'post_edited') {
            const { postId, content, edited, editedAt } = payload;
            setPosts((prev) =>
              prev.map((p) => {
                if (p.id === postId) {
                  return { ...p, content, edited, editedAt };
                }
                return p;
              })
            );
          }

          else if (type === 'reaction_updated') {
            const { postId, reactions } = payload;
            setPosts((prev) =>
              prev.map((p) => {
                if (p.id === postId) {
                  return { ...p, reactions };
                }
                return p;
              })
            );
          }

          else if (type === 'comment_added') {
            const { postId, comment } = payload;
            setPosts((prev) =>
              prev.map((p) => {
                if (p.id === postId) {
                  const exist = p.comments.some((c) => c.id === comment.id);
                  return {
                    ...p,
                    comments: exist ? p.comments : [...p.comments, comment]
                  };
                }
                return p;
              })
            );
          }
          
          else if (type === 'ads_updated') {
            setAdsConfig(payload);
          }
        } catch (err) {
          console.error('Error processing received websocket payload:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt reconnect in 3s
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (e) => {
        console.error('WebSocket encountered an error:', e);
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [currentUser, selectedPartnerId, soundEnabled]);

  // Autoscroll chat window
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages, selectedPartnerId]);

  // Issue read status changes when changing chat users
  useEffect(() => {
    if (!selectedPartnerId || !currentUser || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    
    // Send read actions
    socketRef.current.send(JSON.stringify({
      type: 'read_receipt',
      payload: { from: selectedPartnerId },
    }));

    // Update locally as well
    setAllMessages((prev) =>
      prev.map((m) => {
        if (m.from === selectedPartnerId && m.to === currentUser.id) {
          return { ...m, read: true };
        }
        return m;
      })
    );
  }, [selectedPartnerId, currentUser, allMessages.length]);

  // Handle local user setup
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputName.trim();
    const trimmedPass = password.trim();

    if (!trimmed) return;

    if (!trimmedPass || trimmedPass.length < 4) {
      setLoginError(t('loginPinError'));
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    try {
      if (trimmed === 'hseismailhossain@gmail.com') {
        if (trimmedPass !== 'hseismailhossain@gmail.com') {
          setLoginError(t('loginWrongPass'));
          setIsLoggingIn(false);
          return;
        }
        
        const adminUserId = 'admin_ismail';
        const mockUser: User = {
          id: adminUserId,
          name: 'Admin',
          password: trimmedPass,
          status: 'online',
          lastSeen: Date.now(),
          isAdmin: true,
        };
        
        localStorage.setItem('chat_current_user', JSON.stringify(mockUser));
        setCurrentUser(mockUser);
        setLoginError('');
        setPassword('');
      } else {
        // Query server to check if name is online or verify credentials
        const res = await fetch(`/api/check-username?name=${encodeURIComponent(trimmed)}&password=${encodeURIComponent(trimmedPass)}`);
        const data = await res.json();

        if (!data.available) {
          setLoginError(data.error || (lang === 'bn' ? 'এই নামের একজন ইউজার ইতিমধ্যেই অনলাইনে আছেন! দয়া করে অন্য কোনো নাম ব্যবহার করুন।' : 'A user with this name is already online! Please use a different name.'));
          setIsLoggingIn(false);
          return;
        }

        const uniqueId = data.userId || ('usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6));
        const mockUser: User = {
          id: uniqueId,
          name: data.name || trimmed,
          password: trimmedPass,
          status: 'online',
          lastSeen: Date.now(),
        };
        
        localStorage.setItem('chat_current_user', JSON.stringify(mockUser));
        setCurrentUser(mockUser);
        setLoginError('');
      }
    } catch (err) {
      console.error(err);
      setLoginError(t('serverErrorMsg'));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    localStorage.removeItem('chat_current_user');
    setCurrentUser(null);
    setSelectedPartnerId(null);
    setUsersList([]);
    setAllMessages([]);
    setInputName('');
    setPassword('');
    setLoginError('');
  };

  // Keyboard live typing notifications
  const handleMessageInputChange = (val: string) => {
    setMessageInput(val);
    
    if (!selectedPartnerId || !currentUser || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    if (typingEmitterTimeoutRef.current) {
      clearTimeout(typingEmitterTimeoutRef.current);
    } else {
      // Emitters to server
      socketRef.current.send(JSON.stringify({
        type: 'typing',
        payload: { to: selectedPartnerId, isTyping: true },
      }));
    }

    typingEmitterTimeoutRef.current = setTimeout(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN && selectedPartnerId) {
        socketRef.current.send(JSON.stringify({
          type: 'typing',
          payload: { to: selectedPartnerId, isTyping: false },
        }));
      }
      typingEmitterTimeoutRef.current = null;
    }, 2000);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = messageInput.trim();
    if (!trimmed || !selectedPartnerId || !socketRef.current) return;

    const msgPayload = {
      id: 'msg_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      to: selectedPartnerId,
      content: trimmed,
    };

    // Emit live typing cancel immediately
    if (typingEmitterTimeoutRef.current) {
      clearTimeout(typingEmitterTimeoutRef.current);
      typingEmitterTimeoutRef.current = null;
    }
    socketRef.current.send(JSON.stringify({
      type: 'typing',
      payload: { to: selectedPartnerId, isTyping: false },
    }));

    // Ship message package
    socketRef.current.send(JSON.stringify({
      type: 'message',
      payload: msgPayload,
    }));

    setMessageInput('');
  };

  const triggerEmoji = (emoji: string) => {
    setMessageInput((prev) => prev + emoji);
    setSelectedEmojiRecipient(false);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    const content = postInput.trim();
    if (!content || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    socketRef.current.send(JSON.stringify({
      type: 'create_post',
      payload: {
        id: 'post_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        content,
      },
    }));

    setPostInput('');
  };

  const handleSaveAds = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    socketRef.current.send(JSON.stringify({
      type: 'update_ads',
      payload: adsConfig,
    }));

    setShowAdminAdsModal(false);
  };

  const handleDeletePost = (postId: string) => {
    setDeletingPostId(postId);
  };

  const confirmDeletePost = () => {
    if (!deletingPostId || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({
      type: 'delete_post',
      payload: { postId: deletingPostId },
    }));
    setDeletingPostId(null);
  };

  const handleUpdatePost = (postId: string, content: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    const trimmed = content.trim();
    if (!trimmed) return;

    socketRef.current.send(JSON.stringify({
      type: 'edit_post',
      payload: { postId, content: trimmed },
    }));

    setEditingPostId(null);
    setEditingContent('');
  };

  const handleToggleReaction = (postId: string, reactionType: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    socketRef.current.send(JSON.stringify({
      type: 'add_reaction',
      payload: { postId, reactionType },
    }));
  };

  const handleAddComment = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const commentText = (commentInputs[postId] || '').trim();
    if (!commentText || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    socketRef.current.send(JSON.stringify({
      type: 'add_comment',
      payload: {
        id: 'cmt_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        postId,
        content: commentText,
      },
    }));

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  // Chat partners list computation
  const otherUsers = usersList.filter((u) => u && u.id && u.id !== currentUser?.id);
  const filteredUsers = otherUsers.filter((u) =>
    u.name && typeof u.name === 'string' && u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (a.id === 'admin_ismail') return -1;
    if (b.id === 'admin_ismail') return 1;
    if (a.status === 'online' && b.status !== 'online') return -1;
    if (a.status !== 'online' && b.status === 'online') return 1;
    const nameA = a.name || '';
    const nameB = b.name || '';
    return nameA.localeCompare(nameB);
  });

  // Group messages by dates for convenient visual markers
  const getGroupedMessages = () => {
    if (!selectedPartnerId || !currentUser) return [];
    
    const partnerMessages = allMessages.filter(
      (m) =>
        (m.from === currentUser.id && m.to === selectedPartnerId) ||
        (m.from === selectedPartnerId && m.to === currentUser.id)
    );

    return partnerMessages;
  };

  const activeConversations = getGroupedMessages();
  const selectedPartner = usersList.find((u) => u.id === selectedPartnerId);

  // Count unread records
  const getUnreadCount = (partnerId: string) => {
    if (!currentUser) return 0;
    return allMessages.filter(
      (m) => m.from === partnerId && m.to === currentUser.id && !m.read
    ).length;
  };

  const getLastMessage = (partnerId: string) => {
    if (!currentUser) return null;
    const conversation = allMessages.filter(
      (m) =>
        (m.from === currentUser.id && m.to === partnerId) ||
        (m.from === partnerId && m.to === currentUser.id)
    );
    if (conversation.length === 0) return null;
    return conversation[conversation.length - 1];
  };

  // Quick Chat Suggestive Bubbles
  const QUICK_REPLIES = [
    'সালাম, কেমন আছেন? 👋',
    'আই এম ফ্রি নাউ, চ্যাট করুন! 💬',
    'ঠিক আছে, বুঝলাম 👍',
    'আজকে কী কী করলেন? 😊',
    'ধন্যবাদ! ❤️',
  ];

  if (!currentUser) {
    return (
      <div id="login-layout" className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          
          <div className="absolute top-4 right-4 z-10">
            <button
              type="button"
              onClick={toggleLanguage}
              className="p-1.5 px-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-100 text-slate-500 rounded-xl flex items-center gap-1.5 hover:text-slate-800 transition cursor-pointer font-medium text-[11px]"
            >
              <Languages className="w-3.5 h-3.5 text-indigo-500" />
              <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>
          </div>

          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-100">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-display font-medium text-slate-800 tracking-tight">{t('appTitle')}</h1>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">
              {t('loginSub')}
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-6">
            <div>
              <label htmlFor="user-name-input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {t('nameLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-5 h-5" />
                </div>
                <input
                  id="user-name-input"
                  type="text"
                  required
                  maxLength={40}
                  value={inputName}
                  onChange={(e) => {
                    setInputName(e.target.value);
                    setLoginError('');
                  }}
                  placeholder={t('namePlaceholder')}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder-slate-400 text-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="user-password-input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {inputName.trim() === 'hseismailhossain@gmail.com' ? t('passLabelAdmin') : t('passLabelUser')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="user-password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLoginError('');
                  }}
                  placeholder={inputName.trim() === 'hseismailhossain@gmail.com' ? t('passPlaceholderAdmin') : t('passPlaceholderUser')}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder-slate-400 text-sm font-medium"
                />
              </div>
              {inputName.trim() !== 'hseismailhossain@gmail.com' && (
                <p className="text-[10.5px] text-indigo-500 mt-1.5 font-medium leading-normal bg-indigo-50/50 p-2 px-3 rounded-xl border border-indigo-100/40">
                  {t('pinWarning')}
                </p>
              )}
            </div>

            {loginError && (
              <p className="text-xs text-rose-500 font-semibold text-center bg-rose-50 py-2.5 px-4 rounded-xl border border-rose-100">
                {loginError}
              </p>
            )}

            <button
              id="login-btn"
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer text-sm disabled:opacity-50"
            >
              {isLoggingIn ? t('verifying') : (inputName.trim() === 'hseismailhossain@gmail.com' ? t('btnAdminLogin') : t('btnGetStarted'))}
              {!isLoggingIn && <Send className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
              ● REALTIME ENGINE ONLINE
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans">
      {/* Upper Navigation Rail */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-40">
        <div id="header-identity" className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-100">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold text-slate-800">
                {currentUser?.isAdmin ? t('adminPanel') : t('liveChat')}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`} />
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                  {isConnected ? `${t('connectedUsers')} • ${otherUsers.length + 1} ${lang === 'bn' ? 'জন ইউজার' : 'Users'}` : t('connecting')}
                </span>
              </div>
            </div>
          </div>
 
          {/* Quick Tab control for tiny mobile view inside brand drawer if needed */}
          <div className="md:hidden flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('chat')}
            </button>
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'feed'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('feed')}
            </button>
          </div>
        </div>
 
        {/* Dedicated Desktop/Middle Segmented Control Switcher */}
        <div id="view-tabs" className="hidden md:flex bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {t('liveChatroom')}
          </button>
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'feed'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            {t('communityFeed')}
          </button>
        </div>
 
        <div id="header-actions" className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Language Switcher Toggle */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-slate-500 hover:text-indigo-600 transition cursor-pointer flex items-center gap-1.5 font-medium text-xs shadow-sm"
            title={lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
          >
            <Languages className="w-4 h-4 text-indigo-500" />
            <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
          </button>

          {/* Sound Control Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition cursor-pointer"
            title={soundEnabled ? t('soundOn') : t('soundOff')}
          >
            {soundEnabled ? <Volume2 className="w-4" /> : <VolumeX className="w-4" />}
          </button>
 
          <button
            onClick={() => handleLogout()}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100/70 text-rose-600 rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t('logout')}
          </button>
        </div>
      </header>

      {/* Primary Workspace layout */}
      <main id="chat-workspace" className="flex-1 max-w-7xl w-full mx-auto p-4 flex gap-4 overflow-hidden relative" style={{ height: 'calc(100vh - 73px)' }}>
        
        {activeTab === 'chat' && (
          <>
            {/* SIDEBAR: Users Directory */}
            <section 
              id="chat-users-directory"
              className={`flex-col bg-white border border-slate-100 rounded-3xl w-full md:w-80 lg:w-96 overflow-hidden flex shadow-sm shrink-0
                ${mobileView === 'list' ? 'flex' : 'hidden md:flex'}`}
            >
              {/* Admin Stats Header */}
              {currentUser?.isAdmin && (
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4 text-white border-b border-indigo-900/40">
                  <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    {t('adminPanel')}
                  </h3>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                    <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                      <span className="block text-[9px] text-indigo-200">{t('totalUsersStats')}</span>
                      <span className="text-sm font-bold font-mono text-white leading-tight">
                        {usersList.length}
                      </span>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                      <span className="block text-[9px] text-indigo-200">{t('onlineUsersStats')}</span>
                      <span className="text-sm font-bold font-mono text-emerald-400 leading-tight">
                        {usersList.filter(u => u.status === 'online').length}
                      </span>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                      <span className="block text-[9px] text-indigo-200">{t('messagesCountStats')}</span>
                      <span className="text-sm font-bold font-mono text-violet-300 leading-tight">
                        {allMessages.length}
                      </span>
                    </div>
                  </div>
                  
                  {/* Admin Ads Settings trigger button */}
                  <button
                    onClick={() => setShowAdminAdsModal(true)}
                    className="w-full mt-3 py-2 px-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm border border-amber-300 font-sans cursor-pointer active:scale-[0.98]"
                  >
                    <Flame className="w-4.5 h-4.5 text-slate-950 animate-pulse animate-bounce" />
                    <span>বিজ্ঞাপন নিয়ন্ত্রণ করুন (Ads Configuration)</span>
                  </button>
                </div>
              )}

              {/* Sidebar Search Bar */}
              <div className="p-4 border-b border-slate-50">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  {t('usersListLabel')} ({filteredUsers.length})
                </h3>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchQueryPlaceholder')}
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-9 pr-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Users List viewport */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                <AnimatePresence initial={false}>
                  {sortedUsers.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <UserIcon className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-xs font-semibold text-slate-400">{t('noUserFound')}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{t('noUserFoundSub')}</p>
                    </div>
                  ) : (
                    sortedUsers.map((user) => {
                      const unreadCount = getUnreadCount(user.id);
                      const isSelected = selectedPartnerId === user.id;
                      const lastMsg = getLastMessage(user.id);
                      const isTyping = typingMap[user.id];

                      return (
                        <motion.button
                          layoutId={`user-row-${user.id}`}
                          key={user.id}
                          onClick={() => {
                            setSelectedPartnerId(user.id);
                            setMobileView('chat');
                          }}
                          className={`w-full p-3.5 rounded-2xl flex items-center gap-3 transition-all text-left group border relative cursor-pointer
                            ${isSelected 
                              ? 'bg-indigo-50/50 border-indigo-100 shadow-sm shadow-indigo-100/20' 
                              : 'bg-white border-transparent hover:bg-slate-50/80 hover:border-slate-100'
                            }`}
                        >
                          {/* Avatar initial */}
                          <div className="relative shrink-0">
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm tracking-wider shadow-sm ${getAvatarStyle(user.name)}`}>
                              {user.name.trim().charAt(0).toUpperCase()}
                            </div>
                            {/* Status notification dot */}
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center
                              ${user.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'}`}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-semibold text-slate-800 truncate pr-2 flex items-center gap-1.5">
                                {user.name}
                                {user.id === 'admin_ismail' && (
                                  <span className="shrink-0 bg-amber-500 text-white font-bold text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-sm">
                                    {t('adminBadge')}
                                  </span>
                                )}
                              </h4>
                              {lastMsg && (
                                <span className="text-[9px] font-mono text-slate-400 whitespace-nowrap">
                                  {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>

                            {/* Subtext describing online status or message snippet */}
                            <div className="mt-0.5 flex items-center justify-between">
                              {isTyping ? (
                                <span className="text-[10px] text-indigo-500 font-medium animate-pulse">{t('typingLabel')}</span>
                              ) : (
                                <span className="text-[10px] text-slate-400 truncate pr-4 leading-normal">
                                  {lastMsg 
                                    ? (lastMsg.from === currentUser.id ? `${t('youLabel')}: ` : '') + lastMsg.content 
                                    : (user.status === 'online' ? t('onlineBadge') : t('offlineBadge'))}
                                </span>
                              )}

                              {unreadCount > 0 && (
                                <span className="bg-rose-500 text-white font-bold text-[9px] min-w-4.5 h-4.5 leading-none px-1.5 rounded-full flex items-center justify-center shadow-sm">
                                  {unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>

              {/* Current self profile section */}
              <div className="p-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${getAvatarStyle(currentUser.name)}`}>
                      {currentUser.name.trim().charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white bg-emerald-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] font-semibold text-slate-700 truncate max-w-[140px] leading-tight">{currentUser.name}</p>
                    <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider">{lang === 'bn' ? 'আপনার প্রোফাইল' : 'Your Profile'}</span>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-semibold">
                  {lang === 'bn' ? 'ফ্রি চ্যাট' : 'Free Chat'}
                </div>
              </div>
            </section>

            {/* CHAT WORKSPACE: Conversational stage */}
            <section 
              id="chat-screen"
              className={`flex-1 bg-white border border-slate-100 rounded-3xl overflow-hidden flex flex-col shadow-sm relative
                ${mobileView === 'chat' ? 'flex' : 'hidden md:flex'}`}
            >
              {selectedPartner ? (
                <>
                  {/* Target User Top Info Bar */}
                  <div className="p-4 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white z-25">
                    <div className="flex items-center gap-3">
                      {/* Mobile Back navigation */}
                      <button
                        onClick={() => setMobileView('list')}
                        className="md:hidden p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 mr-1"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>

                      <div className="relative">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm select-none shadow-inner ${getAvatarStyle(selectedPartner.name)}`}>
                          {selectedPartner.name.trim().charAt(0).toUpperCase()}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white
                          ${selectedPartner.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'}`}
                        />
                      </div>

                      <div className="text-left">
                        <h4 className="text-sm font-semibold text-slate-800 leading-tight">
                          {selectedPartner.name}
                        </h4>
                        
                        {typingMap[selectedPartner.id] ? (
                          <span className="text-[10px] text-indigo-500 font-semibold flex items-center gap-1">
                            <span className="flex gap-0.5 items-center">
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </span>
                            {t('typingLabel')}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">
                            {selectedPartner.status === 'online' 
                              ? (lang === 'bn' ? 'অনলাইন আছেন' : 'Online now') 
                              : `${lang === 'bn' ? 'সর্বশেষ সক্রিয়' : 'Last active'}: ${new Date(selectedPartner.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right text-[10px] font-mono text-slate-400 hidden sm:block">
                      {`ID: ${selectedPartner.id.substring(4, 9)}...`}
                    </div>
                  </div>

                  {/* Chat conversations portal */}
                  <div 
                    className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/30 space-y-4"
                  >
                    {activeConversations.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 text-indigo-500 shadow-inner">
                          <MessageSquare className="w-8 h-8" />
                        </div>
                        <h3 className="text-sm font-semibold text-indigo-600">{lang === 'bn' ? 'চ্যাটিং শুরু করুন' : 'Start Chatting'}</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm">
                          {lang === 'bn' ? 'নিচে মেসেজ লিখে পাঠান। লাইভ কানেকশন থাকায় অপর প্রান্তের ইউজার সাথে সাথে মেসেজ দেখতে পাবেন।' : 'Type your message below. Thanks to live connection, they will receive it instantly.'}
                        </p>
                      </div>
                    ) : (
                      activeConversations.map((msg, idx) => {
                        const isMe = msg.from === currentUser.id;
                        const prevMsg = activeConversations[idx - 1];
                        const showTime = !prevMsg || (msg.timestamp - prevMsg.timestamp > 120000); // 2 minutes gap

                        return (
                          <div key={msg.id} className="space-y-1">
                            {showTime && (
                              <div className="flex justify-center my-3">
                                <span className="bg-slate-200/50 text-[9px] font-mono text-slate-500 px-2 py-0.5 rounded-full">
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            )}
                            
                            <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs relative group shadow-sm
                                ${isMe 
                                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                                  : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                                }`}
                              >
                                <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                                
                                <div className={`flex items-center gap-1 justification-end mt-1 text-[8px] font-mono opacity-80
                                  ${isMe ? 'text-indigo-100' : 'text-slate-400'}`}
                                >
                                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                                  {isMe && (
                                    <span className="ml-[2px]">
                                      {msg.read ? (
                                        <CheckCheck className="w-3 h-3 text-emerald-300" />
                                      ) : (
                                        <Check className="w-3 h-3 text-slate-300" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <AdSlotRenderer adConfig={adsConfig} placement="chat_backdrop" />
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Preset suggest chats & write actions container */}
                  <div className="border-t border-slate-100 p-3 md:p-4 bg-white space-y-3">
                    {/* Suggest chats */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 select-none">
                      {QUICK_REPLIES.map((text) => (
                        <button
                          key={text}
                          onClick={() => handleMessageInputChange(text)}
                          className="whitespace-nowrap px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-full text-[10px] font-medium transition cursor-pointer shrink-0 border border-slate-100"
                        >
                          {text}
                        </button>
                      ))}
                    </div>

                    <form onSubmit={sendMessage} className="flex gap-2 items-center relative">
                      {/* Emoji helper button toggle */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setSelectedEmojiRecipient(!selectedEmojiRecipient)}
                          className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
                          title="ইমোজি চয়ন করুন"
                        >
                          <Smile className="w-5 h-5" />
                        </button>
                        {selectedEmojiRecipient && (
                          <div className="absolute bottom-12 left-0 bg-white border border-slate-100 p-2.5 rounded-2xl shadow-xl z-50 flex gap-2">
                            {['😊', '😂', '👍', '❤️', '👋', '🎉', '🔥'].map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => triggerEmoji(emoji)}
                                className="text-lg hover:scale-12 w-8 h-8 flex items-center justify-center transition cursor-pointer"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => handleMessageInputChange(e.target.value)}
                        placeholder={`${selectedPartner.name}-কে মেসেজ খসড়া করুন...`}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all text-slate-800 placeholder-slate-400"
                      />
                      <button
                        type="submit"
                        disabled={!messageInput.trim()}
                        className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-2xl transition shadow-lg shadow-indigo-100 flex items-center justify-center cursor-pointer shrink-0"
                      >
                        <Send className="w-4.5 h-4.5" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/10">
                  <div className="max-w-md space-y-4">
                    <div className="mx-auto w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-500 shadow-md shadow-indigo-50">
                      <MessageSquare className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-display font-medium text-slate-700">চ্যাটিং পার্টনার সিলেক্ট করুন</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      বামদিকের তালিকা থেকে যেকোনো ব্যবহারকারী নির্বাচন করে তার সাথে ১-টু-১ সিঙ্গেল চ্যাটিং শুরু করুন। লাইভ মেসেজিঙে যেকোনো সময় আপনি একে অপরের টাইপিং অবস্থা এবং মেসেজ পড়া হয়েছে কিনা তা দেখতে পাবেন।
                    </p>
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">
                        ● Realtime Synchronization Enabled
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'feed' && (
          <div id="social-feed-container" className="flex-1 flex flex-col lg:flex-row gap-4 h-full overflow-hidden">
            {/* Sidebar with helpful tips/stats */}
            <div className="hidden lg:flex flex-col gap-4 w-80 shrink-0">
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Cpu className="w-5 h-5" />
                  <h3 className="font-semibold text-sm">{t('communityGuidelinesTitle')}</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t('communityGuidelinesSub')}
                </p>
                <div className="pt-2 border-t border-slate-50 text-[10px] text-slate-400 space-y-1.5 leading-normal">
                  <p>{lang === 'bn' ? '🔒 আপনার অ্যাকাউন্ট একটি ৪ সংখ্যার পিন দিয়ে সুরক্ষিত।' : '🔒 Your account is secured with a 4-digit PIN.'}</p>
                  <p>{lang === 'bn' ? '💬 গঠনমূলক এবং সম্মানজনক আলোচনা বজায় রাখুন।' : '💬 Keep conversations respectful and constructive.'}</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-505/10 via-purple-500/5 to-transparent border border-indigo-100/40 rounded-3xl p-5 shadow-inner">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                  <Flame className="w-4 h-4 animate-pulse" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">{lang === 'bn' ? 'রিয়েল-টাইম ফিড স্ট্যাটাস' : 'Real-time Feed Status'}</h4>
                </div>
                <div className="space-y-2 mt-3">
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>{lang === 'bn' ? 'মোট সংগৃহীত পোস্ট:' : 'Total Posts:'}</span>
                    <span className="font-bold text-slate-800 font-mono">{posts.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>{lang === 'bn' ? 'অনলাইন ব্যবহারকারী:' : 'Online Users:'}</span>
                    <span className="font-bold text-emerald-600 font-mono">
                      {usersList.filter(u => u.status === 'online').length}{lang === 'bn' ? ' জন' : ''}
                    </span>
                  </div>
                </div>
              </div>
              
              <AdSlotRenderer adConfig={adsConfig} placement="feed_sidebar" />
            </div>

            {/* Main feed columns */}
            <div className="flex-1 flex flex-col h-full bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              {/* Feed Header */}
              <div className="p-4 border-b border-slate-50 bg-white sticky top-0 z-10 flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-500" />
                    {lang === 'bn' ? 'সোশ্যাল ফিড' : 'Social Feed'}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{lang === 'bn' ? 'সবাই কি ভাবছেন এখানে জানুন এবং রিয়্যাক্ট ও মন্তব্য করুন' : 'Find out what everyone has to say, react and comment'}</p>
                </div>
                <div className="text-[10px] text-emerald-500 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Circle className="w-1.5 h-1.5 fill-emerald-500 animate-pulse" />
                  {lang === 'bn' ? 'লাইভ' : 'LIVE'}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/20">
                <AdSlotRenderer adConfig={adsConfig} placement="feed_header" />
                
                {/* Create post form */}
                <form onSubmit={handleCreatePost} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-3">
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm tracking-wider shrink-0 ${getAvatarStyle(currentUser.name)}`}>
                      {currentUser.name.trim().charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={postInput}
                        onChange={(e) => setPostInput(e.target.value)}
                        placeholder={lang === 'bn' ? 'আজকে আপনার মনে কী চলছে? লিখে ফেলুন...' : "What's on your mind today? Write it down..."}
                        rows={4}
                        className="w-full bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all text-slate-800 placeholder-slate-400 resize-none border-dashed"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {lang === 'bn' ? `মোট অক্ষর সংখ্যা: ${postInput.length}` : `Total character count: ${postInput.length}`}
                    </span>
                    <button
                      type="submit"
                      disabled={!postInput.trim()}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition hover:shadow-indigo-100 cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {lang === 'bn' ? 'পোস্ট করুন' : 'Post'}
                    </button>
                  </div>
                </form>

                {/* Posts mapping */}
                {posts.length === 0 ? (
                  <div className="text-center py-12 px-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                      <MessageSquare className="w-8 h-8" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-600">{lang === 'bn' ? 'ফিডে কোনো পোস্ট নেই' : 'No posts in feed'}</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      {lang === 'bn' ? 'প্রথম ব্যক্তি হিসেবে আপনার মনের কোনো চিন্তা বা সুন্দর স্ট্যাটাস লিখে উপরে পোস্ট করে দিন!' : 'Be the first one to post your thoughts and status on the feed!'}
                    </p>
                  </div>
                ) : (
                  posts.map((post) => {
                    const cleanReactions = post.reactions || { like: [], love: [], haha: [], wow: [], sad: [] };
                    const hasReacted = {
                      like: cleanReactions.like?.includes(currentUser.id),
                      love: cleanReactions.love?.includes(currentUser.id),
                      haha: cleanReactions.haha?.includes(currentUser.id),
                      wow: cleanReactions.wow?.includes(currentUser.id),
                      sad: cleanReactions.sad?.includes(currentUser.id),
                    };

                    const totalReactsCount = 
                      (cleanReactions.like?.length || 0) + 
                      (cleanReactions.love?.length || 0) + 
                      (cleanReactions.haha?.length || 0) + 
                      (cleanReactions.wow?.length || 0) + 
                      (cleanReactions.sad?.length || 0);

                    const expandedComments = expandedCommentsMap[post.id];

                    return (
                      <div key={post.id} className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 md:p-5 space-y-4">
                        {/* Post Author Box */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm tracking-wider shadow-sm ${getAvatarStyle(post.authorName)}`}>
                              {post.authorName.trim().charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left">
                              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                {post.authorName}
                                {post.authorId === 'admin_ismail' && (
                                  <span className="bg-amber-500 text-white font-bold text-[8px] px-1 rounded">এডমিন</span>
                                )}
                              </h4>
                              <span className="text-[9px] font-mono text-slate-400">
                                {new Date(post.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                              </span>
                            </div>
                          </div>

                          {/* Edit / Delete options if author or admin */}
                          {(post.authorId === currentUser.id || currentUser.isAdmin) && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              {editingPostId !== post.id && (
                                <button
                                  onClick={() => {
                                    setEditingPostId(post.id);
                                    setEditingContent(post.content);
                                  }}
                                  className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-lg hover:bg-indigo-100/80 transition cursor-pointer"
                                >
                                  {lang === 'bn' ? 'সম্পাদনা' : 'Edit'}
                                </button>
                              )}
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="text-[10px] text-rose-500 font-semibold bg-rose-50 px-2.5 py-1 rounded-lg hover:bg-rose-100/80 transition cursor-pointer"
                              >
                                {lang === 'bn' ? 'মুছুন' : 'Delete'}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Post Content */}
                        {editingPostId === post.id ? (
                          <div className="space-y-2 text-left pl-1">
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              rows={3}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all font-medium text-slate-800"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdatePost(post.id, editingContent)}
                                className="px-3 py-1.5 bg-indigo-600 text-white font-medium rounded-lg text-[10px] hover:bg-indigo-700 transition cursor-pointer"
                              >
                                {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save'}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingPostId(null);
                                  setEditingContent('');
                                }}
                                className="px-3 py-1.5 bg-slate-100 text-slate-600 font-medium rounded-lg text-[10px] hover:bg-slate-200 transition cursor-pointer"
                              >
                                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-755 whitespace-pre-wrap break-words leading-relaxed text-left pl-1">
                            {post.content}
                            {post.edited && (
                              <span className="text-[10px] text-indigo-400 font-medium italic block mt-1">
                                ({lang === 'bn' ? 'সম্পাদিত' : 'Edited'})
                              </span>
                            )}
                          </p>
                        )}

                        {/* Reactions and Commments summary */}
                        <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-b border-slate-50 py-2">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-slate-500">
                              {totalReactsCount > 0 
                                ? `👍❤️ ${totalReactsCount} ${lang === 'bn' ? 'টি রিয়্যাকশন' : 'reactions'}` 
                                : (lang === 'bn' ? 'কোনো রিয়্যাকশন নেই' : 'No reactions yet')}
                            </span>
                          </div>
                          <div>
                            <button
                              onClick={() => setExpandedCommentsMap(prev => ({ ...prev, [post.id]: !expandedComments }))}
                              className="hover:text-indigo-600 transition font-semibold cursor-pointer"
                            >
                              {post.comments?.length || 0} {lang === 'bn' ? 'টি মন্তব্য' : 'comments'}
                            </button>
                          </div>
                        </div>

                        {/* Reaction Actions Bar */}
                        <div className="flex items-center justify-around gap-1 overflow-x-auto py-1">
                          {[
                            { type: 'like', emoji: '👍', label: lang === 'bn' ? 'লাইক' : 'Like' },
                            { type: 'love', emoji: '❤️', label: lang === 'bn' ? 'লাভ' : 'Love' },
                            { type: 'haha', emoji: '😂', label: lang === 'bn' ? 'হা হা' : 'Haha' },
                            { type: 'wow', emoji: '😮', label: lang === 'bn' ? 'ওয়াও' : 'Wow' },
                            { type: 'sad', emoji: '😢', label: lang === 'bn' ? 'স্যাড' : 'Sad' }
                          ].map((react) => {
                            const active = hasReacted[react.type as keyof typeof hasReacted];
                            return (
                              <button
                                key={react.type}
                                onClick={() => handleToggleReaction(post.id, react.type)}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition text-[11px] font-medium cursor-pointer shrink-0 border border-slate-50/50 ${
                                  active 
                                    ? 'bg-indigo-50/70 text-indigo-600 scale-105 shadow-inner border-indigo-100' 
                                    : 'text-slate-500 hover:bg-slate-50 bg-white'
                                }`}
                              >
                                <span>{react.emoji}</span>
                                <span className="hidden sm:inline">{react.label}</span>
                                {cleanReactions[react.type as any]?.length > 0 && (
                                  <span className="font-mono text-[9px] bg-slate-100 font-bold text-slate-500 px-1.5 py-0.2 rounded-full ml-1">
                                    {cleanReactions[react.type as any].length}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Expandable comments drawer */}
                        {expandedComments && (
                          <div className="border-t border-slate-50 pt-4 space-y-4">
                            {/* Comments listing */}
                            <div className="space-y-2 max-h-56 overflow-y-auto">
                              {(!post.comments || post.comments.length === 0) ? (
                                <p className="text-[10.5px] text-slate-400 text-center italic py-2">
                                  {lang === 'bn' ? 'কোনো মন্তব্য করা হয়নি এখনো। প্রথম মন্তব্যটি করুন!' : 'No comments yet. Be the first to comment!'}
                                </p>
                              ) : (
                                post.comments.map((comment: any) => (
                                  <div key={comment.id} className="bg-slate-50/60 p-3 rounded-2xl flex items-start gap-2 text-left border border-slate-100/40">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${getAvatarStyle(comment.authorName)}`}>
                                      {comment.authorName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10.5px] font-bold text-slate-700">{comment.authorName}</span>
                                        <span className="text-[8px] font-mono text-slate-400 font-medium">
                                          {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-600 mt-1 break-words whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Submit comments form */}
                            <form onSubmit={(e) => handleAddComment(e, post.id)} className="flex gap-2">
                              <input
                                type="text"
                                value={commentInputs[post.id] || ''}
                                onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                placeholder={lang === 'bn' ? 'একটি গঠনমূলক মন্তব্য লিখুন...' : 'Write a constructive comment...'}
                                maxLength={200}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all text-slate-800 placeholder-slate-400"
                              />
                              <button
                                type="submit"
                                disabled={!(commentInputs[post.id] || '').trim()}
                                className="px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-xs font-semibold disabled:opacity-40 transition cursor-pointer"
                              >
                                {lang === 'bn' ? 'মন্তব্য দিন' : 'Comment'}
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Custom Post Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {deletingPostId && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col p-6 space-y-4 border border-rose-100"
            >
              <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-left space-y-1">
                <h3 className="text-sm font-bold text-slate-800">
                  {lang === 'bn' ? 'মুছে ফেলার নিশ্চিতকরণ' : 'Confirm Deletion'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {lang === 'bn' 
                    ? 'আপনি কি নিশ্চিত যে আপনি এই পোস্টটি স্থায়ীভাবে মুছে ফেলতে চান?' 
                    : 'Are you sure you want to permanently delete this post? This operation is irreversible.'}
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setDeletingPostId(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer text-center"
                >
                  {lang === 'bn' ? 'বাতিল করুন' : 'Cancel'}
                </button>
                <button
                  onClick={confirmDeletePost}
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl transition cursor-pointer text-center shadow-lg shadow-rose-100"
                >
                  {lang === 'bn' ? 'হ্যাঁ, মুছুন' : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Ads Settings Control Modal */}
      <AnimatePresence>
        {showAdminAdsModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col border border-slate-100 max-h-[90vh]"
            >
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex justify-between items-center border-b border-indigo-900">
                <div className="flex items-center gap-2.5">
                  <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                  <div>
                    <h3 className="text-sm font-bold text-white">মনো-বিজ্ঞাপন নিয়ন্ত্রণ প্যানেল (Ads Engine)</h3>
                    <p className="text-[10px] text-slate-300 mt-0.5">গুগল অ্যাডসেন্স এবং অ্যাডস্টেরা ব্যানার চ্যাট রুমে যুক্ত করুন</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdminAdsModal(false)}
                  className="bg-white/10 hover:bg-white/20 text-white rounded-full p-1.5 focus:outline-none transition text-[11px] font-semibold w-7 h-7 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveAds} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700">
                {/* Placement options */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 text-[11px] tracking-wider uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    ১. বিজ্ঞাপন দেখানোর স্থানসমূহ (Ad Placements)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    <label className={`border rounded-2xl p-3.5 flex items-start gap-2.5 cursor-pointer transition select-none ${adsConfig.showInChatBackdrop ? 'border-indigo-200 bg-indigo-50/20' : 'border-slate-100 bg-white'}`}>
                      <input
                        type="checkbox"
                        checked={adsConfig.showInChatBackdrop}
                        onChange={(e) => setAdsConfig(prev => ({ ...prev, showInChatBackdrop: e.target.checked }))}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="font-bold block text-slate-800 text-[10px]">চ্যাট ব্যাকড্রপ</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">চ্যাট স্ক্রিনের ভেতরে একদম নিচে</span>
                      </div>
                    </label>

                    <label className={`border rounded-2xl p-3.5 flex items-start gap-2.5 cursor-pointer transition select-none ${adsConfig.showInFeedHeader ? 'border-indigo-200 bg-indigo-50/20' : 'border-slate-100 bg-white'}`}>
                      <input
                        type="checkbox"
                        checked={adsConfig.showInFeedHeader}
                        onChange={(e) => setAdsConfig(prev => ({ ...prev, showInFeedHeader: e.target.checked }))}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="font-bold block text-slate-800 text-[10px]">ফিড হেডার</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">সোশ্যাল ফিড তালিকার সবার উপরে</span>
                      </div>
                    </label>

                    <label className={`border rounded-2xl p-3.5 flex items-start gap-2.5 cursor-pointer transition select-none ${adsConfig.showInFeedSidebar ? 'border-indigo-200 bg-indigo-50/20' : 'border-slate-100 bg-white'}`}>
                      <input
                        type="checkbox"
                        checked={adsConfig.showInFeedSidebar}
                        onChange={(e) => setAdsConfig(prev => ({ ...prev, showInFeedSidebar: e.target.checked }))}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="font-bold block text-slate-800 text-[10px]">ফিড সাইডবার</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">ডেস্কটপ স্ক্রিনে বাম সাইডবারে</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Ad network activation options */}
                <div className="space-y-3 pt-3 border-t border-slate-50">
                  <h4 className="font-bold text-slate-800 text-[11px] tracking-wider uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    ২. বিজ্ঞাপন নেটওয়ার্ক নির্বাচন করুন (Ad Network)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {[
                      { value: 'none', label: 'নিষ্ক্রিয় রাখব', desc: 'No Ads' },
                      { value: 'adsterra', label: 'Adsterra Tag', desc: 'অ্যাডস্টেরা স্ক্রিপ্ট' },
                      { value: 'google_adsense', label: 'Google AdSense', desc: 'এডসেন্স কোড' },
                      { value: 'custom_html', label: 'Custom HTML', desc: 'কাস্টম কোড/আইফ্রেম' },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setAdsConfig(prev => ({ ...prev, activeAdNetwork: item.value as any }))}
                        className={`p-3 rounded-2xl border text-center transition flex flex-col justify-center items-center gap-1 cursor-pointer select-none ${adsConfig.activeAdNetwork === item.value ? 'border-amber-400 bg-amber-50/25 ring-2 ring-amber-400/20 font-bold' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
                      >
                        <span className="text-[10px] text-slate-800">{item.label}</span>
                        <span className="text-[8px] text-slate-400 block font-normal">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional Fields depending on active network */}
                {adsConfig.activeAdNetwork === 'google_adsense' && (
                  <div className="space-y-3.5 bg-amber-50/20 border border-amber-100/50 p-4 rounded-2xl">
                    <h5 className="font-bold text-amber-950 text-[10px]">গুগল এডসেন্স কনফিগার করতে নিম্নোক্ত আইডিগুলো প্রদান করুন:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Publisher ID (ca-pub-xxx)</label>
                        <input
                          type="text"
                          value={adsConfig.googleAdsenseClientId}
                          onChange={(e) => setAdsConfig(prev => ({ ...prev, googleAdsenseClientId: e.target.value }))}
                          placeholder="e.g. ca-pub-xxxxxxxxxxxxxxxx"
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ad Slot ID</label>
                        <input
                          type="text"
                          value={adsConfig.googleAdsenseSlotId}
                          onChange={(e) => setAdsConfig(prev => ({ ...prev, googleAdsenseSlotId: e.target.value }))}
                          placeholder="e.g. 1234567890"
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {adsConfig.activeAdNetwork === 'adsterra' && (
                  <div className="space-y-2 bg-indigo-50/20 border border-indigo-100/50 p-4 rounded-2xl">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] text-indigo-950 font-bold uppercase tracking-wider">Adsterra Script বা ব্যানার ট্যাগ কোড:</label>
                      <span className="text-[8px] text-slate-400 font-mono">Supports script/iframe</span>
                    </div>
                    <textarea
                      value={adsConfig.adsterraScript}
                      onChange={(e) => setAdsConfig(prev => ({ ...prev, adsterraScript: e.target.value }))}
                      placeholder="<!-- Paste your Adsterra native banner script or iframe code snippet here -->"
                      rows={5}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 resize-none"
                    />
                  </div>
                )}

                {adsConfig.activeAdNetwork === 'custom_html' && (
                  <div className="space-y-2 bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] text-slate-700 font-bold uppercase tracking-wider font-sans font-medium">কাস্টম HTML/আইফ্রেম বা অন্যান্য ৩য় পক্ষ কোড:</label>
                      <span className="text-[8px] text-slate-400 font-mono">Any HTML allowed</span>
                    </div>
                    <textarea
                      value={adsConfig.customHtml}
                      onChange={(e) => setAdsConfig(prev => ({ ...prev, customHtml: e.target.value }))}
                      placeholder="e.g. <a href='https://example.com'><img src='https://ad-image-url.png' /></a>"
                      rows={5}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 resize-none"
                    />
                  </div>
                )}
              </form>

              <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[9px] text-slate-400 italic">বিজ্ঞাপন সেভ করার সাথে সাথে সকল ইউজারের কাছে লাইভ হয়ে যাবে।</span>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAdminAdsModal(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer text-center"
                  >
                    বাতিল
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAds}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm active:scale-95"
                  >
                    বিজ্ঞাপন সেভ করুন ✨
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
