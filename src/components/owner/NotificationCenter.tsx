'use client';

import { useState, useEffect } from 'react';
import { Bell, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'message';
  from: string;
  property: string;
  timestamp: Date;
  bookingId: string;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    // Listen for new message events
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleNewMessage = (event: any) => {
      const { from, property, bookingId } = event.detail;

      const newNotif: Notification = {
        id: `${Date.now()}`,
        type: 'message',
        from: from || 'Student',
        property: property || 'Property',
        timestamp: new Date(),
        bookingId,
      };

      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Auto-remove notification after 5 seconds if not opened
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== newNotif.id));
      }, 8000);
    };

    window.addEventListener('newMessage', handleNewMessage);
    return () => window.removeEventListener('newMessage', handleNewMessage);
  }, []);

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
      {/* Notification Popups */}
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="bg-zinc-900 border border-blue-500/30 rounded-lg p-4 shadow-lg shadow-blue-500/10 max-w-sm animate-in slide-in-from-right-4 fade-in duration-300"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <MessageCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">{notif.from} messaged you</p>
                <p className="text-xs text-zinc-500 mt-0.5">{notif.property}</p>
                <Link
                  href={`/owner/dashboard?bookingId=${notif.bookingId}`}
                  className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block font-medium"
                >
                  View Message →
                </Link>
              </div>
            </div>
            <button
              onClick={() => dismissNotification(notif.id)}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {/* Notification Bell Icon */}
      {unreadCount > 0 && (
        <div className="relative">
          <Button
            onClick={() => setShowPanel(!showPanel)}
            size="icon"
            className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {/* Notification Panel */}
          {showPanel && (
            <div className="absolute bottom-20 right-0 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg max-w-sm w-80 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="font-semibold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-xs text-zinc-500 hover:text-white"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-zinc-500 text-sm">No new notifications</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-2 p-2">
                  {notifications.map((notif) => (
                    <Link
                      key={notif.id}
                      href={`/owner/dashboard?bookingId=${notif.bookingId}`}
                      onClick={() => {
                        setShowPanel(false);
                        dismissNotification(notif.id);
                      }}
                      className="block p-3 hover:bg-zinc-800/50 rounded-lg transition-colors"
                    >
                      <p className="text-sm font-medium text-white">{notif.from}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{notif.property}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
