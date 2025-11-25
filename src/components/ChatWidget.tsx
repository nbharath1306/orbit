'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Send, X, ArrowUpRight, Copy, MapPin, Home, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { motion, AnimatePresence } from 'framer-motion';
import Magnetic from '@/components/ui/Magnetic';

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

const QUICK_ACTIONS = [
    { label: 'Find Properties', value: 'find_properties' },
    { label: 'Check Booking', value: 'How do I check my booking?' },
    { label: 'Support', value: 'Can you help me?' },
    { label: 'About Orbit', value: 'What is Orbit?' },
];

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [propertyContext, setPropertyContext] = useState<PropertyContext | null>(null);
    const [userPreferences, setUserPreferences] = useState<UserPreferences>({});
    const [collectingPreferences, setCollectingPreferences] = useState(false);
    const [showManualLocationInput, setShowManualLocationInput] = useState(false);
    const [manualLocation, setManualLocation] = useState('');
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
            let welcomeContent = 'Welcome to Orbit. I am your personal concierge. How may I assist you with your housing needs today?';

            if (propertyContext) {
                welcomeContent = `I see you are interested in ${propertyContext.title}. I can provide details about amenities, pricing, or schedule a viewing.`;
            }

            const welcomeMessage: Message = {
                id: 'welcome-' + Math.random().toString(36).substring(2, 11),
                role: 'assistant',
                content: welcomeContent,
            };
            setMessages([welcomeMessage]);
        }
    }, [isOpen, propertyContext]);

    const handleQuickAction = async (action: string) => {
        setInput('');

        if (action === 'find_properties') {
            setCollectingPreferences(true);
            const messageId = Math.random().toString(36).substring(2, 11);
            const assistantMessage: Message = {
                id: messageId,
                role: 'assistant',
                content: 'I can certainly help with that. To begin, what is your preferred location?',
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
                content: 'I apologize, but I am unable to process your request at this moment.',
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
                content: 'I apologize, but I am unable to process your request at this moment.',
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // ... (Keep existing helper functions: detectSearchQuery, searchProperties, extractFiltersFromMessage, getFilteredProperties)
    // For brevity in this edit, I'm assuming the logic functions remain the same but I need to include them to make the file valid.
    // I will copy the logic functions from the previous file content but remove the console logs for cleaner code.

    const detectSearchQuery = (text: string): string | null => {
        const lowerText = text.toLowerCase();
        const searchKeywords = ['show', 'find', 'property', 'properties', 'place', 'pg', 'house', 'apartment', 'room', 'search', 'looking for', 'interested in', 'near', 'in', 'at', 'price', 'budget', 'cost', 'amenities', 'wifi', 'gym', 'parking', 'university', 'college', 'area', 'location'];
        if (searchKeywords.some(keyword => lowerText.includes(keyword))) return text;
        return null;
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
        const priceMatch = lowerMsg.match(/(\d+)\s*(?:to|-)\s*(\d+)/);
        if (priceMatch) {
            filters.minPrice = parseInt(priceMatch[1]);
            filters.maxPrice = parseInt(priceMatch[2]);
        }
        
        const locationMap: { [key: string]: string } = {
            'dayananda': 'Harohalli', 'dsu': 'Harohalli', 'harohalli': 'Harohalli',
            'koramangala': 'Koramangala', 'indiranagar': 'Indiranagar', 'whitefield': 'Whitefield',
        };
        for (const [keyword, location] of Object.entries(locationMap)) {
            if (lowerMsg.includes(keyword)) {
                filters.location = location;
                break;
            }
        }
        return filters;
    };

    const getFilteredProperties = async (query: string, filters: PropertyFilter): Promise<any[]> => {
        try {
            const allProperties = await searchProperties(query);
            let filtered = allProperties;

            if (filters.minPrice || filters.maxPrice) {
                filtered = filtered.filter((p: any) => {
                    const price = p.price?.amount || 0;
                    if (filters.minPrice && price < filters.minPrice) return false;
                    if (filters.maxPrice && price > filters.maxPrice) return false;
                    return true;
                });
            }

            if (filters.location) {
                filtered = filtered.filter((p: any) => {
                    const address = (p.location?.address || '').toLowerCase();
                    return address.includes(filters.location!.toLowerCase());
                });
            }
            return filtered;
        } catch (error) {
            return [];
        }
    };

    const handlePreferenceSelection = async (type: string, value: any) => {
        const newPreferences = { ...userPreferences, [type]: value };
        setUserPreferences(newPreferences);

        let displayText = '';
        if (type === 'priceRange') displayText = `Budget: ₹${value.min} - ₹${value.max}`;
        else if (type === 'location') displayText = `Location: ${value}`;
        else if (type === 'amenities') displayText = `Amenities: ${Array.isArray(value) ? value.join(', ') : value}`;

        if (displayText) {
            setMessages((prev) => [...prev, { id: Math.random().toString(36), role: 'user', content: displayText }]);
        }

        setIsLoading(true);
        await showNextPreferenceQuestion(newPreferences);
        setIsLoading(false);
    };

    const showNextPreferenceQuestion = async (prefs: UserPreferences) => {
        const msgId = Math.random().toString(36).substring(2, 11);
        if (!prefs.location) {
            setMessages((prev) => [...prev, { id: msgId, role: 'assistant', content: 'Which location do you prefer?' }]);
        } else if (!prefs.priceRange) {
            setMessages((prev) => [...prev, { id: msgId, role: 'assistant', content: 'What is your monthly budget range?' }]);
        } else {
            await searchWithPreferences(prefs);
        }
    };

    const searchWithPreferences = async (prefs: UserPreferences) => {
        setIsLoading(true);
        try {
            const filters: PropertyFilter = {
                minPrice: prefs.priceRange?.min,
                maxPrice: prefs.priceRange?.max,
                location: prefs.location,
            };
            
            let searchQuery = 'properties';
            if (prefs.location) searchQuery += ` in ${prefs.location}`;

            const foundProperties = await getFilteredProperties(searchQuery, filters);
            
            const msgId = Math.random().toString(36).substring(2, 11);
            let assistantContent = foundProperties.length > 0 
                ? `I found ${foundProperties.length} properties matching your criteria.`
                : `I couldn't find any properties matching your exact criteria in ${prefs.location}.`;

            setMessages((prev) => [...prev, {
                id: msgId,
                role: 'assistant',
                content: assistantContent,
                properties: foundProperties.length > 0 ? foundProperties : undefined,
            }]);
            setCollectingPreferences(false);
        } catch (error) {
            setMessages((prev) => [...prev, { id: Math.random().toString(36), role: 'assistant', content: 'An error occurred while searching.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const PropertyLink = ({ property }: { property: any }) => (
        <a
            href={`/pg/${property.slug || property._id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-3 group"
        >
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg transition-all hover:border-zinc-600 hover:bg-zinc-800/50">
                <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-white text-sm">{property.title}</h4>
                    <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                </div>
                <p className="text-xs text-zinc-400 mb-3 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {property.location?.address}
                </p>
                <div className="flex justify-between items-center border-t border-zinc-800 pt-3">
                    <span className="text-sm font-bold text-white">₹{property.price?.amount}</span>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">{property.price?.period}</span>
                </div>
            </div>
        </a>
    );

    return (
        <div className="fixed bottom-8 right-8 z-50">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <div>
                        <Magnetic>
                            <Button
                                size="icon"
                                className="h-14 w-14 rounded-full bg-white text-black hover:bg-zinc-200 shadow-2xl transition-all hover:scale-105 relative"
                            >
                                <Logo className="text-black" iconClassName="w-6 h-6" showText={false} />
                                <span className="absolute top-0 right-0 flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white"></span>
                                </span>
                            </Button>
                        </Magnetic>
                    </div>
                </PopoverTrigger>
// ... rest of the component ...
                <PopoverContent
                    className="w-[400px] p-0 bg-black border border-zinc-800 shadow-2xl rounded-2xl overflow-hidden mr-4 mb-4"
                    align="end"
                    sideOffset={10}
                >
                    {/* Header */}
                    <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-black">
                        <div className="flex items-center gap-3">
                            <Logo className="text-white" iconClassName="w-5 h-5" showText={false} />
                            <div>
                                <h3 className="font-bold text-white text-sm tracking-wide">CONCIERGE</h3>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Orbit AI System</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-full"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Property Context */}
                    {propertyContext && (
                        <div className="bg-zinc-900/50 border-b border-zinc-900 px-4 py-2 flex items-center justify-between">
                            <span className="text-xs text-zinc-400">Viewing: <span className="text-white">{propertyContext.title}</span></span>
                            <span className="text-xs text-zinc-500">₹{propertyContext.price}</span>
                        </div>
                    )}

                    {/* Messages Area */}
                    <div className="h-[500px] overflow-y-auto p-4 space-y-6 bg-black">
                        {messages.map((m) => (
                            <motion.div 
                                key={m.id} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn('flex flex-col max-w-[85%]', m.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start')}
                            >
                                <div
                                    className={cn(
                                        'px-4 py-3 text-sm leading-relaxed',
                                        m.role === 'user'
                                            ? 'bg-white text-black rounded-2xl rounded-tr-sm'
                                            : 'bg-zinc-900 text-zinc-300 rounded-2xl rounded-tl-sm border border-zinc-800'
                                    )}
                                >
                                    {m.content}
                                </div>
                                
                                {m.properties && (
                                    <div className="w-full mt-2 space-y-2">
                                        {m.properties.map((prop: any) => (
                                            <PropertyLink key={prop._id || prop.slug} property={prop} />
                                        ))}
                                    </div>
                                )}
                                
                                <span className="text-[10px] text-zinc-600 mt-1 uppercase tracking-wider">
                                    {m.role === 'user' ? 'You' : 'Orbit'}
                                </span>
                            </motion.div>
                        ))}
                        
                        {isLoading && (
                            <div className="flex items-center gap-2 text-zinc-500 text-xs ml-2">
                                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
                                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-75" />
                                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-150" />
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Actions */}
                    {!collectingPreferences && messages.length <= 1 && !isLoading && (
                        <div className="px-4 pb-4 bg-black">
                            <div className="grid grid-cols-2 gap-2">
                                {QUICK_ACTIONS.map((action) => (
                                    <button
                                        key={action.value}
                                        onClick={() => handleQuickAction(action.value)}
                                        className="text-xs text-zinc-400 border border-zinc-800 p-2 rounded hover:bg-zinc-900 hover:text-white transition-colors text-left"
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Preference Selectors */}
                    {collectingPreferences && !isLoading && (
                        <div className="px-4 pb-4 bg-black space-y-3">
                            {!userPreferences.location && (
                                <div className="grid grid-cols-2 gap-2">
                                    {['Harohalli', 'Koramangala', 'Indiranagar', 'Whitefield'].map((loc) => (
                                        <button
                                            key={loc}
                                            onClick={() => handlePreferenceSelection('location', loc)}
                                            className="text-xs text-zinc-300 bg-zinc-900 p-2 rounded hover:bg-zinc-800 transition-colors"
                                        >
                                            {loc}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {userPreferences.location && !userPreferences.priceRange && (
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: '₹3K - ₹5K', min: 3000, max: 5000 },
                                        { label: '₹5K - ₹8K', min: 5000, max: 8000 },
                                        { label: '₹8K - ₹12K', min: 8000, max: 12000 },
                                        { label: '₹12K+', min: 12000, max: 20000 },
                                    ].map((range) => (
                                        <button
                                            key={range.label}
                                            onClick={() => handlePreferenceSelection('priceRange', { min: range.min, max: range.max })}
                                            className="text-xs text-zinc-300 bg-zinc-900 p-2 rounded hover:bg-zinc-800 transition-colors"
                                        >
                                            {range.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 bg-black border-t border-zinc-900">
                        <form onSubmit={handleFormSubmit} className="relative">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message..."
                                className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 pr-10 focus:border-zinc-700 focus:ring-0 rounded-xl"
                                disabled={isLoading}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                variant="ghost"
                                disabled={isLoading || !input.trim()}
                                className="absolute right-1 top-1 h-8 w-8 text-zinc-400 hover:text-white hover:bg-transparent"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

