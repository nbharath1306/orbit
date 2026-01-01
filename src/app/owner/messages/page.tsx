'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageCircle, User, Clock, ShieldCheck, Loader2, Check, CheckCheck, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Message {
  _id: string;
  threadId: string;
  message: string;
  senderRole: 'student' | 'owner';
  studentId: { _id: string; name: string; email?: string };
  ownerId: { _id: string; name: string };
  createdAt: string;
  read: boolean;
  delivered: boolean;
}

interface Conversation {
  threadId: string;
  studentName: string;
  studentId: string;
  propertyTitle?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
  studentOnline?: boolean;
}

export default function OwnerMessagesPage() {
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [studentOnlineStatus, setStudentOnlineStatus] = useState<{ [key: string]: boolean }>({});

  // Update online status
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
    const interval = setInterval(updateOnlineStatus, 30000);

    const handleBeforeUnload = () => {
      navigator.sendBeacon('/api/users/online-status', JSON.stringify({ isOnline: false }));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      fetch('/api/users/online-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: false }),
      }).catch(() => {});
    };
  }, []);

  // Fetch student online status
  useEffect(() => {
    if (selectedThread) {
      const conv = conversations.find(c => c.threadId === selectedThread);
      if (conv?.studentId) {
        const fetchStudentStatus = async () => {
          try {
            const res = await fetch(`/api/users/online-status?userId=${conv.studentId}`);
            if (res.ok) {
              const data = await res.json();
              setStudentOnlineStatus(prev => ({
                ...prev,
                [conv.studentId]: data.isOnline
              }));
            }
          } catch (err) {
            console.error('Failed to fetch student status:', err);
          }
        };

        fetchStudentStatus();
        const interval = setInterval(fetchStudentStatus, 10000);
        return () => clearInterval(interval);
      }
    }
  }, [selectedThread, conversations]);

  // Auto-select thread from URL parameter
  useEffect(() => {
    const threadParam = searchParams.get('thread');
    if (threadParam && conversations.length > 0) {
      const threadExists = conversations.find(c => c.threadId === threadParam);
      if (threadExists) {
        selectConversation(threadParam);
      } else {
        // Thread doesn't exist yet - create it by setting as selected
        setSelectedThread(threadParam);
      }
    }
  }, [searchParams, conversations]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  async function fetchMessages() {
    try {
      const res = await fetch('/api/owner/messages');
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      const grouped = groupMessagesByThread(data.messages || [], data.ownerId);
      setConversations(grouped);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }

  function groupMessagesByThread(messages: Message[], currentOwnerId: string): Conversation[] {
    const threadsMap = new Map<string, Conversation>();

    messages.forEach((msg) => {
      const threadId = msg.threadId;
      
      // Always show the student's name (the other person in the conversation)
      // For owners, we want to see who (which student) is messaging them
      const studentName = msg.studentId?.name || 'Unknown Student';
      const studentId = msg.studentId?._id || '';
      
      if (!threadsMap.has(threadId)) {
        threadsMap.set(threadId, {
          threadId,
          studentName: studentName,
          studentId: studentId,
          propertyTitle: 'Property Inquiry',
          lastMessage: msg.message,
          lastMessageTime: msg.createdAt,
          unreadCount: 0,
          messages: [],
        });
      }

      const conv = threadsMap.get(threadId)!;
      conv.messages.push(msg);
      
      // Update last message if newer
      if (new Date(msg.createdAt) > new Date(conv.lastMessageTime)) {
        conv.lastMessage = msg.message;
        conv.lastMessageTime = msg.createdAt;
      }

      // Count unread: messages from the OTHER person (student) that we haven't read
      if (msg.senderRole === 'student' && !msg.read) {
        conv.unreadCount++;
      }
    });

    return Array.from(threadsMap.values()).sort(
      (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
  }

  async function handleSendMessage() {
    if (!newMessage.trim() || !selectedThread) return;

    const conv = conversations.find(c => c.threadId === selectedThread);
    if (!conv) return;

    try {
      setSending(true);
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: selectedThread,
          message: newMessage.trim(),
          ownerId: conv.messages[0]?.ownerId._id,
          propertyId: selectedThread.split('-')[0],
        }),
      });

      if (!res.ok) throw new Error('Failed to send');
      
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  }

  // Mark messages as read when selecting a conversation
  async function selectConversation(threadId: string) {
    setSelectedThread(threadId);
    
    // Immediately update UI to show as read
    setConversations(prev => prev.map(conv => 
      conv.threadId === threadId ? { ...conv, unreadCount: 0 } : conv
    ));
    
    // Mark all student messages in this thread as read
    try {
      await fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId }),
      });
      // Refresh to sync with server
      await fetchMessages();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  const selectedConversation = conversations.find(c => c.threadId === selectedThread);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Encryption Badge */}
      <div className="flex items-center justify-end gap-2 text-emerald-400 text-sm">
        <ShieldCheck className="w-4 h-4" />
        <span>End-to-end encrypted</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
        {/* Conversations List */}
        <div className="md:col-span-1 rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md overflow-hidden flex flex-col">
          <div className="border-b border-white/5 p-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-white">Conversations</h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 p-2">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No messages yet</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.threadId}
                  onClick={() => selectConversation(conv.threadId)}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-colors border flex items-start gap-2 ${
                    selectedThread === conv.threadId
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-white'
                      : 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs truncate">
                      {conv.studentName}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate">
                      {conv.propertyTitle}
                    </p>
                    {conv.lastMessage && (
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                        {conv.lastMessage}
                      </p>
                    )}
                    {conv.unreadCount > 0 && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded-full font-semibold">
                        {conv.unreadCount} unread
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
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
                  {selectedConversation.studentId && studentOnlineStatus[selectedConversation.studentId] && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900 animate-pulse"></div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">
                    {selectedConversation.studentName}
                  </h3>
                  <p className="text-xs text-zinc-400 flex items-center gap-1">
                    {selectedConversation.studentId && studentOnlineStatus[selectedConversation.studentId] ? (
                      <>
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        <span className="text-emerald-400">Online</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        {selectedConversation.propertyTitle}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to end this conversation? You can always start a new one.')) {
                    setSelectedThread(null);
                  }
                }}
                className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 rounded-lg transition-all"
              >
                End Chat
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-zinc-950/30 to-zinc-900/30">
              {selectedConversation.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                    <MessageCircle className="w-10 h-10 text-emerald-400/50" />
                  </div>
                  <p className="text-lg font-medium mb-1">No messages yet</p>
                  <p className="text-sm text-zinc-500">Start the conversation!</p>
                </div>
              ) : (
                selectedConversation.messages
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  .map((msg, index) => {
                    const isMyMessage = msg.senderRole === 'owner';
                    const prevMsg = selectedConversation.messages[index - 1];
                    const prevIsMyMessage = prevMsg && prevMsg.senderRole === 'owner';
                    const showAvatar = !prevMsg || prevIsMyMessage !== isMyMessage;
                    
                    return (
                      <div
                        key={msg._id}
                        className={`flex gap-2 items-end ${
                          isMyMessage ? 'justify-end' : 'justify-start'
                        } ${!showAvatar ? 'ml-10' : ''}`}
                      >
                        {!isMyMessage && showAvatar && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                        {!isMyMessage && !showAvatar && <div className="w-8" />}
                        
                        <div
                          className={`group max-w-[70%] px-4 py-2.5 rounded-2xl shadow-lg transition-all hover:shadow-xl ${
                            isMyMessage
                              ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-br-md'
                              : 'bg-zinc-800/90 text-zinc-100 border border-white/5 rounded-bl-md backdrop-blur-sm'
                          }`}
                        >
                          <p className="text-sm break-words leading-relaxed">{msg.message}</p>
                          <div className={`flex items-center gap-1.5 mt-1 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                            <p className={`text-[10px] ${isMyMessage ? 'text-emerald-200' : 'text-zinc-400'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            {isMyMessage && (
                              <span className="flex items-center">
                                {msg.read ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
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
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                        {isMyMessage && !showAvatar && <div className="w-8" />}
                      </div>
                    );
                  })
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="border-t border-white/5 p-4 bg-gradient-to-r from-zinc-900/80 to-zinc-800/80 backdrop-blur-sm">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    disabled={sending}
                    maxLength={2000}
                    className="w-full px-4 py-3 pr-16 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 disabled:opacity-50 transition-all"
                  />
                  <div className="absolute right-3 bottom-3 text-[10px] text-zinc-600">
                    {newMessage.length}/2000
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-lg hover:shadow-emerald-500/25 disabled:shadow-none"
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Send</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="md:col-span-2 rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md overflow-hidden flex items-center justify-center">
            <div className="text-center p-12">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-10 h-10 text-emerald-400/50" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Conversations Yet</h3>
              <p className="text-zinc-400 mb-4">
                Select a conversation to view messages
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
