'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, Plus, MessageCircle, Loader2, User, ShieldCheck, Lock, Check, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface Message {
  _id: string;
  message: string;
  senderRole?: string;
  studentId?: string | { _id: string };
  createdAt: string;
  read?: boolean;
  delivered?: boolean;
}

interface Conversation {
  threadId: string;
  lastMessage: Message | null;
  unreadCount: number;
  property?: { title?: string; _id?: string; location?: { address?: string } };
  owner?: { _id: string; name?: string };
}

interface MessagesContentProps {
  initialConversations: Conversation[];
  userId: string;
}

export default function MessagesContent({
  initialConversations,
  userId,
}: MessagesContentProps) {
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [ownerOnlineStatus, setOwnerOnlineStatus] = useState<{ [key: string]: boolean }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const selectedConv = conversations.find((c) => c.threadId === selectedConversation);

  // Update online status when component mounts
  useEffect(() => {
    const updateOnlineStatus = async () => {
      try {
        await fetch('/api/users/online-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isOnline: true }),
        });
      } catch (err) {
        console.error('Failed to update online status:', err);
      }
    };

    updateOnlineStatus();

    // Update online status every 30 seconds
    const interval = setInterval(updateOnlineStatus, 30000);

    // Set offline when leaving
    const handleBeforeUnload = () => {
      navigator.sendBeacon('/api/users/online-status', JSON.stringify({ isOnline: false }));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Set offline
      fetch('/api/users/online-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: false }),
      }).catch(() => { });
    };
  }, []);

  // Fetch owner online status
  useEffect(() => {
    if (selectedConversation && selectedConv?.owner?._id) {
      const ownerId = selectedConv.owner._id;
      const fetchOwnerStatus = async () => {
        try {
          const res = await fetch(`/api/users/online-status?userId=${ownerId}`);
          if (res.ok) {
            const data = await res.json();
            setOwnerOnlineStatus(prev => ({
              ...prev,
              [ownerId]: data.isOnline
            }));
          }
        } catch (err) {
          console.error('Failed to fetch owner status:', err);
        }
      };

      fetchOwnerStatus();
      const interval = setInterval(fetchOwnerStatus, 10000); // Check every 10 seconds
      return () => clearInterval(interval);
    }
  }, [selectedConversation, selectedConv]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages.length, isLoading]);

  // Auto-select thread from URL parameter (only once)
  useEffect(() => {
    if (isInitialized) return;

    const threadParam = searchParams.get('thread');
    const propertyParam = searchParams.get('property');

    if (threadParam) {
      const existingConv = conversations.find(c => c.threadId === threadParam);
      if (existingConv) {
        setSelectedConversation(threadParam);
      } else {
        // Thread doesn't exist yet - create a placeholder conversation (avoid duplicates)
        const [propertyId, ownerId] = threadParam.split('-');
        const newConv: Conversation = {
          threadId: threadParam,
          lastMessage: null,
          unreadCount: 0,
          property: { title: propertyParam || 'New Conversation', _id: propertyId },
          owner: { _id: ownerId, name: 'Owner' }
        };
        setConversations(prev => {
          // Check if already exists
          if (prev.some(c => c.threadId === threadParam)) {
            return prev;
          }
          return [newConv, ...prev];
        });
        setSelectedConversation(threadParam);
      }
      setIsInitialized(true);
    }
  }, [searchParams, isInitialized, conversations]);

  // Load messages with optimized polling
  const loadMessages = useCallback(async (silent = false) => {
    if (!selectedConversation) return;

    if (!silent) setIsLoading(true);
    try {
      const response = await fetch(
        `/api/messages?threadId=${selectedConversation}`
      );

      const data = await response.json();
      if (data.success) {
        setMessages(prev => {
          // Only update if messages actually changed
          if (JSON.stringify(prev) !== JSON.stringify(data.messages)) {
            return data.messages;
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [selectedConversation]);

  // Mark messages as read when viewing
  const markAsRead = useCallback(async (threadId: string) => {
    // Immediately update UI
    setConversations(prev => prev.map(conv =>
      conv.threadId === threadId ? { ...conv, unreadCount: 0 } : conv
    ));

    try {
      await fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId }),
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, []);

  // Manage polling
  useEffect(() => {
    if (selectedConversation) {
      // Initial load
      loadMessages(false);

      // Mark messages as read
      markAsRead(selectedConversation);

      // Start polling after initial load
      pollingIntervalRef.current = setInterval(() => {
        if (!isSending) {
          loadMessages(true); // Silent updates during polling
        }
      }, 3000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [selectedConversation, loadMessages, isSending, markAsRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !selectedConversation || isSending) return;

    const tempMessage = messageInput;
    setMessageInput(''); // Clear input immediately for better UX
    setIsSending(true);

    try {
      const [propertyId, ownerId] = selectedConversation.split('-');

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId: selectedConversation,
          message: tempMessage,
          ownerId,
          propertyId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Immediately fetch messages after sending
        await loadMessages(false);
      } else {
        toast.error(data.error || 'Failed to send message');
        setMessageInput(tempMessage); // Restore message on error
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setMessageInput(tempMessage); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  if (conversations.length === 0) {
    return (
      <div className="relative rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-12 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
        <div className="relative z-10">
          <div className="text-5xl mb-4">💬</div>
          <h3 className="text-lg font-semibold text-white mb-2">No Conversations Yet</h3>
          <p className="text-zinc-400 mb-4">
            Start a conversation with property owners when you make a booking!
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-all"
          >
            <Plus size={16} />
            Browse Properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Encryption Badge */}
      <div className="flex items-center justify-end gap-2 text-emerald-400 text-sm">
        <Lock className="w-4 h-4" />
        <span>End-to-end encrypted</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
        {/* Conversations List */}
        <div className="md:col-span-1 rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md overflow-hidden flex flex-col">
          <div className="border-b border-white/5 p-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white">Conversations</h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 p-2">
            {conversations.map((conv) => (
              <button
                key={conv.threadId}
                onClick={() => setSelectedConversation(conv.threadId)}
                className={`w-full text-left px-3 py-2 rounded-xl transition-colors border flex items-start gap-2 ${selectedConversation === conv.threadId
                  ? 'bg-blue-500/20 border-blue-500/30 text-white'
                  : 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10 hover:border-white/10'
                  }`}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs truncate">
                    {conv.owner?.name || 'Property Owner'}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate">
                    {conv.property?.title || 'Unknown Property'}
                  </p>
                  {conv.lastMessage && (
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                      {conv.lastMessage.message}
                    </p>
                  )}
                  {conv.unreadCount > 0 && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded-full font-semibold">
                      {conv.unreadCount} unread
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConversation ? (
          <div className="md:col-span-2 rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md overflow-hidden flex flex-col">
            {/* Chat Header */}
            <div className="border-b border-white/5 p-4 flex items-center justify-between bg-gradient-to-r from-zinc-900/50 to-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  {selectedConv?.owner?._id && ownerOnlineStatus[selectedConv.owner._id] && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900 animate-pulse"></div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">
                    {selectedConv?.property?.title}
                  </h3>
                  <p className="text-xs text-zinc-400 flex items-center gap-1">
                    {selectedConv?.owner?._id && ownerOnlineStatus[selectedConv.owner._id] ? (
                      <>
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        <span className="text-emerald-400">Online</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        {selectedConv?.property?.location?.address || 'Encrypted chat'}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to end this conversation? You can always start a new one.')) {
                    setSelectedConversation(null);
                    toast.success('Conversation closed');
                  }
                }}
                className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 rounded-lg transition-all"
              >
                End Chat
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-zinc-950/30 to-zinc-900/30">
              {isLoading && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-2" />
                    <p className="text-sm text-zinc-400">Loading messages...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                  <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                    <MessageCircle className="w-10 h-10 text-blue-400/50" />
                  </div>
                  <p className="text-lg font-medium mb-1">No messages yet</p>
                  <p className="text-sm text-zinc-500">Start the conversation!</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, index) => {
                    const getStudentIdStr = (sid: string | { _id: string } | undefined) => {
                      if (!sid) return null;
                      return typeof sid === 'string' ? sid : sid._id;
                    };

                    const msgStudentId = getStudentIdStr(msg.studentId);
                    const isMyMessage = msgStudentId === userId;

                    const prevMsg = messages[index - 1];
                    const prevMsgStudentId = prevMsg ? getStudentIdStr(prevMsg.studentId) : null;
                    const prevIsMyMessage = prevMsg && (prevMsgStudentId === userId);
                    const showAvatar = !prevMsg || prevIsMyMessage !== isMyMessage;

                    return (
                      <div
                        key={msg._id}
                        className={`flex gap-2 items-end ${isMyMessage ? 'justify-end' : 'justify-start'
                          } ${!showAvatar ? 'ml-10' : ''}`}
                      >
                        {!isMyMessage && showAvatar && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                        {!isMyMessage && !showAvatar && <div className="w-8" />}

                        <div
                          className={`group max-w-[70%] px-4 py-2.5 rounded-2xl shadow-lg transition-all hover:shadow-xl ${isMyMessage
                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md'
                            : 'bg-zinc-800/90 text-zinc-100 border border-white/5 rounded-bl-md backdrop-blur-sm'
                            }`}
                        >
                          <p className="text-sm break-words leading-relaxed">{msg.message}</p>
                          <div className={`flex items-center gap-1.5 mt-1 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                            <p className={`text-[10px] ${isMyMessage ? 'text-blue-200' : 'text-zinc-400'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            {isMyMessage && (
                              <span className="flex items-center">
                                {msg.read ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-blue-300" />
                                ) : msg.delivered ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-zinc-400" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-zinc-400" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        {isMyMessage && showAvatar && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                        {isMyMessage && !showAvatar && <div className="w-8" />}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="border-t border-white/5 p-4 bg-gradient-to-r from-zinc-900/80 to-zinc-800/80 backdrop-blur-sm">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isSending}
                    maxLength={2000}
                    className="w-full px-4 py-3 pr-16 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 disabled:opacity-50 transition-all"
                  />
                  <div className="absolute right-3 bottom-3 text-[10px] text-zinc-600">
                    {messageInput.length}/2000
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSending || !messageInput.trim()}
                  className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-lg hover:shadow-blue-500/25 disabled:shadow-none"
                >
                  {isSending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span className="hidden sm:inline">Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span className="hidden sm:inline">Send</span>
                    </>
                  )}
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                <Lock className="w-3 h-3 text-emerald-500" />
                <span>Messages are end-to-end encrypted</span>
              </div>
            </form>
          </div>
        ) : (
          <div className="md:col-span-2 rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md flex items-center justify-center">
            <div className="text-center text-zinc-400 p-12">
              <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-6">
                <MessageCircle size={48} className="text-blue-400/50" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No conversation selected</h3>
              <p className="text-zinc-500">Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
