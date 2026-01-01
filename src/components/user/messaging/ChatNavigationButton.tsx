'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useEffect, useState } from 'react';

interface ChatNavigationButtonProps {
  propertyId: string;
  ownerId: string;
  propertyTitle: string;
  ownerName?: string;
}

export default function ChatNavigationButton({
  propertyId,
  ownerId,
  propertyTitle,
  ownerName = 'Owner',
}: ChatNavigationButtonProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      setIsAuthenticated(!!data.user);
      setUserRole(data.user?.role || null);
    } catch (err) {
      console.error('Auth check error:', err);
      setIsAuthenticated(false);
      setUserRole(null);
    }
  };

  const handleChatClick = () => {
    if (isAuthenticated === false) {
      toast.error('Please sign in to message the owner');
      router.push('/auth/signin');
      return;
    }

    if (isAuthenticated === null) {
      toast.error('Checking authentication...');
      return;
    }

    // Create threadId in the same format as DockableChat
    const threadId = `${propertyId}-${ownerId}`;
    
    // Navigate to appropriate messages page based on user role
    const messagesPath = userRole === 'owner' || userRole === 'admin' 
      ? '/owner/messages' 
      : '/dashboard/messages';
    
    router.push(`${messagesPath}?thread=${threadId}&property=${encodeURIComponent(propertyTitle)}`);
  };

  return (
    <Button
      onClick={handleChatClick}
      className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      Chat with {ownerName}
    </Button>
  );
}
