'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MessageCircle,
  Send,
  Loader2,
  AlertCircle,
  X,
  Minimize2,
  Shield,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Message {
  _id: string;
  message: string;
  senderRole: 'student' | 'owner';
  createdAt: string;
}

interface DockableChatProps {
  propertyId: string;
  propertyTitle: string;
  ownerId: string;
  ownerName?: string;
  bookingId?: string;
}

export default function DockableChat({
  propertyId,
  propertyTitle,
  ownerId,
  ownerName = 'Owner',
  bookingId = '',
}: DockableChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [threadId, setThreadId] = useState<string>('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (!data.user) {
        setAuthError(true);
      } else {
        setAuthError(false);
      }
    } catch (err) {
      console.error('Auth check error:', err);
    }
  }, []);

  const initializeThread = useCallback(() => {
    const id = `${propertyId}-${ownerId}`;
    setThreadId(id);
  }, [propertyId, ownerId]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      checkAuth();
      initializeThread();
    }
  }, [isOpen, isMinimized, checkAuth, initializeThread]);

  const fetchMessages = useCallback(async () => {
    if (!threadId) return;
    try {
      setFetching(true);
      const res = await fetch(`/api/messages?threadId=${threadId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const newMsgs = data.messages || [];

      // Count new messages if minimized
      if (isMinimized && newMsgs.length > messages.length) {
        setUnreadCount(prev => prev + (newMsgs.length - messages.length));
      }

      setMessages(newMsgs);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setFetching(false);
    }
  }, [threadId, isMinimized, messages.length]);

  useEffect(() => {
    if (isOpen && threadId && !isMinimized) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen, threadId, isMinimized, fetchMessages]);

  useEffect(() => {
    if (!isMinimized) {
      scrollToBottom();
      setUnreadCount(0);
    }
  }, [messages, isMinimized]);





  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !threadId || authError) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          message: newMessage.trim(),
          propertyId,
          ownerId,
          bookingId: bookingId || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setAuthError(true);
          throw new Error('Please log in');
        }
        throw new Error(errorData.error || 'Failed to send');
      }

      const data = await res.json();
      setMessages([...messages, data.message]);
      setNewMessage('');

      window.dispatchEvent(new CustomEvent('newMessage', {
        detail: { ownerId, property: propertyTitle, threadId },
      }));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (isMinimized) {
      setUnreadCount(0);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setUnreadCount(0);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        <MessageCircle className="w-4 h-4" />
        Chat with Owner
      </Button>
    );
  }

  return (
    <>
      {/* Floating Chat Window */}
      <div
        className={`fixed z-50 transition-all duration-300 ease-in-out ${isMinimized
          ? 'bottom-4 right-4 w-80'
          : 'bottom-4 right-4 w-96 h-[600px]'
          }`}
        style={{ maxHeight: isMinimized ? 'auto' : 'calc(100vh - 2rem)' }}
      >
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-t-lg shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{ownerName}</h3>
                <p className="text-xs text-emerald-100 truncate">{propertyTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div title="End-to-End Encrypted">
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
              </div>
              {unreadCount > 0 && isMinimized && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
              <button
                onClick={handleMinimize}
                className="hover:bg-emerald-500 rounded p-1 transition-colors"
              >
                <Minimize2 className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={handleClose}
                className="hover:bg-emerald-500 rounded p-1 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Chat Body (hidden when minimized) */}
        {!isMinimized && (
          <div className="bg-zinc-900 rounded-b-lg shadow-2xl flex flex-col h-[calc(100%-60px)] border border-emerald-500/20">
            {authError ? (
              <div className="flex items-center justify-center h-full p-6">
                <div className="text-center">
                  <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                  <p className="text-white font-medium mb-2">Please Log In</p>
                  <p className="text-zinc-400 text-sm mb-4">You need to be logged in to chat</p>
                  <Button
                    onClick={() => window.location.href = '/login'}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Log In Now
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-950/50">
                  {messages.length === 0 && !fetching && (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                      <Shield className="w-12 h-12 mb-3 text-emerald-500/50" />
                      <p className="text-sm text-center">
                        Start a secure conversation
                        <br />
                        <span className="text-xs text-emerald-400">🔒 End-to-end encrypted</span>
                      </p>
                    </div>
                  )}

                  {messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`flex ${msg.senderRole === 'student' ? 'justify-end' : 'justify-start'
                        }`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-lg ${msg.senderRole === 'student'
                          ? 'bg-emerald-600 text-white rounded-br-sm'
                          : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
                          }`}
                      >
                        <p className="text-sm break-words">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {fetching && (
                    <div className="flex justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 bg-zinc-900 border-t border-zinc-800">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={loading}
                      className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-emerald-500"
                    />
                    <Button
                      type="submit"
                      disabled={loading || !newMessage.trim()}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 px-4"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </form>
                  <p className="text-xs text-zinc-600 mt-2 text-center flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    End-to-end encrypted
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
