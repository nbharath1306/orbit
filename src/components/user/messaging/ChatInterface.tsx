'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Loader2, AlertCircle, LogOut } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Message {
  _id: string;
  message: string;
  senderRole: 'student' | 'owner';
  createdAt: string;
}

interface ChatInterfaceProps {
  propertyId: string;
  propertyTitle: string;
  ownerId: string;
  ownerName?: string;
  bookingId?: string;
  trigger?: React.ReactNode;
}

export default function ChatInterface({
  propertyId,
  propertyTitle,
  ownerId,
  ownerName = 'Owner',
  bookingId = '',
  trigger,
}: ChatInterfaceProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [authError, setAuthError] = useState(false);
  const [threadId, setThreadId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open) {
      checkAuth();
      initializeThread();
    }
  }, [open]);

  useEffect(() => {
    if (open && threadId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 2000);
      return () => clearInterval(interval);
    }
  }, [open, threadId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (!data.user) {
        setAuthError(true);
        toast.error('🔒 Please sign in to send messages to property owners', { duration: 4000 });
      } else {
        setAuthError(false);
      }
    } catch (err) {
      console.error('Auth check error:', err);
    }
  };

  const initializeThread = () => {
    // Create unique thread ID: property_owner_student
    const id = `${propertyId}-${ownerId}`;
    setThreadId(id);
  };

  const fetchMessages = async () => {
    if (!threadId) return;
    try {
      setFetching(true);
      const res = await fetch(`/api/messages?threadId=${threadId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setFetching(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) {
      toast.error('✏️ Please type a message before sending', { duration: 2000 });
      return;
    }
    if (!threadId) {
      toast.error('⚠️ Chat not ready. Please refresh the page and try again.', { duration: 3000 });
      return;
    }
    if (authError) {
      toast.error('🔒 Please sign in to send messages', { duration: 3000 });
      return;
    }

    try {
      setLoading(true);
      setError('');
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
      toast.success('✅ Message sent!', { duration: 2000 });

      window.dispatchEvent(new CustomEvent('newMessage', {
        detail: { ownerId, property: propertyTitle, threadId },
      }));
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to send message';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <MessageCircle className="w-4 h-4" />
            Chat with Owner
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col bg-gradient-to-br from-zinc-950 to-black border-emerald-500/20">
        <DialogHeader className="border-b border-emerald-500/10 pb-4">
          <DialogTitle className="text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-400" />
            {ownerName}
          </DialogTitle>
          <p className="text-xs text-zinc-500 mt-2">{propertyTitle}</p>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
          {authError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
                <p className="text-white font-medium">Please Log In</p>
                <Button 
                  onClick={() => window.location.href = '/login'}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                >
                  Log In Now
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-zinc-900/30 rounded-lg">
                {messages.length === 0 && !fetching && (
                  <div className="flex items-center justify-center h-full text-zinc-500">
                    <p className="text-sm">Start the conversation...</p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div key={msg._id} className={`flex ${msg.senderRole === 'student' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2 rounded-xl ${
                      msg.senderRole === 'student'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-800 text-zinc-200'
                    }`}>
                      <p className="text-sm break-words">{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}

                {fetching && <Loader2 className="w-4 h-4 animate-spin text-emerald-400 mx-auto" />}
                <div ref={messagesEndRef} />
              </div>

              {error && <div className="text-xs text-red-400 px-3">{error}</div>}

              {/* Input */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={loading}
                  className="flex-1 bg-zinc-800 border-zinc-700 text-white"
                />
                <Button type="submit" disabled={loading || !newMessage.trim()} size="sm" className="bg-emerald-600">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
