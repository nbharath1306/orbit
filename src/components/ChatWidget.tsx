'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Send, X, Sparkles, MapPin, Home, ExternalLink, ArrowUpRight, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { AnimatePresence, motion } from 'framer-motion';
import { useSession } from 'next-auth/react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    properties?: any[];
}

interface PropertyContext {
    slug: string;
    title: string;
    location: string;
    price: number;
    period: string;
}

interface PropertyFilter {
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    amenities?: string[];
}

interface UserPreferences {
    priceRange?: { min: number; max: number };
    location?: string;
    amenities?: string[];
    availability?: string;
}

const STUDENT_QUICK_ACTIONS = [
    { label: 'Find Properties', value: 'find_properties', icon: Home },
    { label: 'Check Booking', value: 'How do I check my booking?', icon: MapPin },
    { label: 'Support', value: 'Can you help me?', icon: MessageSquare },
];

const ADMIN_QUICK_ACTIONS = [
    { label: 'User Management', value: 'How do I manage users?', icon: MessageSquare },
    { label: 'Platform Stats', value: 'Show me platform statistics', icon: ArrowUpRight },
    { label: 'Approve Properties', value: 'What properties need approval?', icon: Home },
];

export function ChatWidget({ userRole = 'student' }: { userRole?: string }) {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');

    // Determine quick actions based on role
    const QUICK_ACTIONS = userRole === 'admin' ? ADMIN_QUICK_ACTIONS : STUDENT_QUICK_ACTIONS;
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [propertyContext, setPropertyContext] = useState<PropertyContext | null>(null);
    const [showTooltip, setShowTooltip] = useState(true);
    const [userPreferences, setUserPreferences] = useState<UserPreferences>({});
    const [collectingPreferences, setCollectingPreferences] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    // Extract property info from URL and fetch property details
    useEffect(() => {
        const extractPropertySlug = () => {
            const match = pathname.match(/\/pg\/([^/]+)/);
            if (match) {
                const slug = match[1];
                fetchPropertyDetails(slug);
            } else {
                setPropertyContext(null);
            }
        };

        extractPropertySlug();
    }, [pathname]);

    const fetchPropertyDetails = async (slug: string) => {
        try {
            const response = await fetch(`/api/properties/${slug}`);
            if (response.ok) {
                const property = await response.json();
                setPropertyContext({
                    slug,
                    title: property.title || 'Property',
                    location: property.location?.address || 'Unknown location',
                    price: property.price?.amount || 0,
                    period: property.price?.period || 'month',
                });
            }
        } catch (error) {
            console.error('Failed to fetch property details:', error);
        }
    };

    // Show welcome message on first open
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            let welcomeContent = '';
            const userName = session?.user?.name?.split(' ')[0] || '';
            const hour = new Date().getHours();
            const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
            const personalizedGreeting = userName ? `${greeting}, ${userName}.` : greeting + '.';

            if (userRole === 'admin') {
                welcomeContent = `${personalizedGreeting} I'm ready to assist with administrative tasks.`;
            } else if (propertyContext) {
                welcomeContent = `I see you're interested in ${propertyContext.title}. How can I help you with this property?`;
            } else {
                welcomeContent = `${personalizedGreeting} Welcome to Orbit. How can I help you find your ideal space today?`;
            }

            const welcomeMessage: Message = {
                id: 'welcome-' + Math.random().toString(36).substring(2, 11),
                role: 'assistant',
                content: welcomeContent,
            };
            setMessages([welcomeMessage]);
        }
    }, [isOpen, propertyContext, userRole, session]);

    const handleQuickAction = async (action: string) => {
        setInput('');

        if (action === 'find_properties') {
            setCollectingPreferences(true);
            const messageId = Math.random().toString(36).substring(2, 11);
            const assistantMessage: Message = {
                id: messageId,
                role: 'assistant',
                content: 'I can help with that. What are your preferences?',
            };
            setMessages((prev) => [...prev, assistantMessage]);
            return;
        }

        const messageId = Math.random().toString(36).substring(2, 11);
        const userMessage: Message = {
            id: messageId,
            role: 'user',
            content: action,
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const searchQuery = detectSearchQuery(action);
            let foundProperties: any[] = [];

            if (searchQuery) {
                const filters = extractFiltersFromMessage(action);
                foundProperties = await getFilteredProperties(action, filters);
            }

            const contextInfo = propertyContext
                ? `User is currently viewing property: "${propertyContext.title}" at "${propertyContext.location}", priced at ₹${propertyContext.price}/${propertyContext.period}. `
                : '';

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    context: contextInfo,
                    foundPropertiesCount: foundProperties.length,
                    userRole: userRole,
                }),
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            if (!data.content) throw new Error('Empty response from server');

            const assistantId = Math.random().toString(36).substring(2, 11);
            const assistantMessage: Message = {
                id: assistantId,
                role: 'assistant',
                content: data.content,
                properties: foundProperties.length > 0 ? foundProperties : undefined,
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorId = Math.random().toString(36).substring(2, 11);
            const errorMessage: Message = {
                id: errorId,
                role: 'assistant',
                content: 'I encountered an issue. Please try again.',
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim()) return;

        const messageId = Math.random().toString(36).substring(2, 11);
        const userMessage: Message = {
            id: messageId,
            role: 'user',
            content: input,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const searchQuery = detectSearchQuery(input);
            let foundProperties: any[] = [];

            if (searchQuery) {
                const filters = extractFiltersFromMessage(input);
                foundProperties = await getFilteredProperties(input, filters);
            }

            const contextInfo = propertyContext
                ? `User is currently viewing property: "${propertyContext.title}" at "${propertyContext.location}", priced at ₹${propertyContext.price}/${propertyContext.period}. `
                : '';

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    context: contextInfo,
                    foundPropertiesCount: foundProperties.length,
                    userRole: userRole,
                }),
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            if (!data.content) throw new Error('Empty response from server');

            const assistantId = Math.random().toString(36).substring(2, 11);
            const assistantMessage: Message = {
                id: assistantId,
                role: 'assistant',
                content: data.content,
                properties: foundProperties.length > 0 ? foundProperties : undefined,
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorId = Math.random().toString(36).substring(2, 11);
            const errorMessage: Message = {
                id: errorId,
                role: 'assistant',
                content: 'I encountered an issue. Please try again.',
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper functions (simplified for brevity, logic remains similar but cleaner)
    const detectSearchQuery = (text: string): string | null => {
        const keywords = ['find', 'property', 'pg', 'room', 'search', 'looking', 'near', 'price', 'budget'];
        return keywords.some(k => text.toLowerCase().includes(k)) ? text : null;
    };

    const searchProperties = async (query: string): Promise<any[]> => {
        try {
            const response = await fetch(`/api/properties?search=`);
            if (response.ok) {
                const properties = await response.json();
                return Array.isArray(properties) ? properties : [];
            }
        } catch (error) {
            console.error('Failed to search properties:', error);
        }
        return [];
    };

    const extractFiltersFromMessage = (message: string): PropertyFilter => {
        const filters: PropertyFilter = {};
        const lowerMsg = message.toLowerCase();

        // Basic extraction logic (can be enhanced)
        if (lowerMsg.includes('harohalli')) filters.location = 'Harohalli';
        if (lowerMsg.includes('koramangala')) filters.location = 'Koramangala';

        return filters;
    };

    const getFilteredProperties = async (query: string, filters: PropertyFilter): Promise<any[]> => {
        try {
            const allProperties = await searchProperties(query);
            let filtered = allProperties;

            if (filters.location) {
                filtered = filtered.filter((p: any) =>
                    (p.location?.address || '').toLowerCase().includes(filters.location!.toLowerCase())
                );
            }
            return filtered;
        } catch (error) {
            return [];
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
                <PopoverTrigger asChild>
                    <div className="relative group">
                        <Button
                            size="icon"
                            className="h-14 w-14 rounded-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 shadow-2xl transition-all hover:scale-105 group"
                        >
                            <Logo showText={false} iconClassName="w-6 h-6 text-white" />
                            <span className="absolute top-0 right-0 h-3 w-3 bg-emerald-500 rounded-full border-2 border-black"></span>
                        </Button>
                    </div>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[380px] p-0 bg-zinc-950 border border-zinc-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col h-auto max-h-[600px] min-h-[200px]"
                    align="end"
                    sideOffset={16}
                >
                    {/* Header */}
                    <div className="bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 p-4 flex justify-between items-center sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
                                <Logo showText={false} iconClassName="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-sm">Orbit Assistant</h3>
                                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                                    {propertyContext ? 'Context Active' : 'Online'}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-lg"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth min-h-[150px] max-h-[400px]">
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "flex flex-col max-w-[85%] space-y-2",
                                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "p-3 rounded-2xl text-sm leading-relaxed",
                                        msg.role === 'user'
                                            ? "bg-white text-black rounded-tr-sm"
                                            : "bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-tl-sm"
                                    )}
                                >
                                    {msg.content}
                                </div>

                                {/* Property Cards in Chat */}
                                {msg.properties && msg.properties.length > 0 && (
                                    <div className="flex gap-3 overflow-x-auto w-full pb-2 snap-x">
                                        {msg.properties.map((prop: any) => (
                                            <a
                                                key={prop._id}
                                                href={`/pg/${prop.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="min-w-[220px] bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors snap-center"
                                            >
                                                <div className="h-24 bg-zinc-800 relative">
                                                    {/* Placeholder for image if needed */}
                                                    <div className="absolute inset-0 flex items-center justify-center text-zinc-700">
                                                        <Home className="w-8 h-8 opacity-20" />
                                                    </div>
                                                </div>
                                                <div className="p-3">
                                                    <h4 className="text-white font-medium text-sm truncate">{prop.title}</h4>
                                                    <p className="text-zinc-500 text-xs truncate mb-2">{prop.location?.address}</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-white font-bold text-sm">₹{prop.price?.amount}</span>
                                                        <ExternalLink className="w-3 h-3 text-zinc-500" />
                                                    </div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        ))}

                        {isLoading && (
                            <div className="flex items-center gap-2 text-zinc-500 text-xs ml-2">
                                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
                                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-75" />
                                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-150" />
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Actions (if empty state) */}
                    {messages.length < 2 && (
                        <div className="px-4 pb-4">
                            <p className="text-xs text-zinc-500 mb-3 font-medium uppercase tracking-wider">Suggested</p>
                            <div className="grid grid-cols-1 gap-2">
                                {QUICK_ACTIONS.map((action) => {
                                    const Icon = action.icon;
                                    return (
                                        <button
                                            key={action.value}
                                            onClick={() => handleQuickAction(action.value)}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 transition-all text-left group"
                                        >
                                            <div className="p-2 rounded-lg bg-zinc-950 text-zinc-400 group-hover:text-white transition-colors">
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{action.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 bg-zinc-950 border-t border-zinc-800 mt-auto">
                        <form onSubmit={handleFormSubmit} className="relative">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask anything..."
                                className="pr-12 bg-zinc-900 border-zinc-800 focus:border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl h-12"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-1 top-1 h-10 w-10 bg-white text-black hover:bg-zinc-200 rounded-lg transition-colors"
                            >
                                <ArrowUpRight className="h-5 w-5" />
                            </Button>
                        </form>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
