'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { MessageCircle, Map, AlertTriangle, Phone } from 'lucide-react';

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        size="icon"
                        className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-transform hover:scale-105"
                    >
                        <MessageCircle className="h-6 w-6 text-white" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 bg-zinc-900 border-zinc-800" align="end" sideOffset={10}>
                    <div className="p-4 bg-zinc-800/50 border-b border-zinc-800 rounded-t-lg">
                        <h3 className="font-bold text-white">Orbit Assistant</h3>
                        <p className="text-sm text-zinc-400">I&apos;m Orbit AI. Ask me anything about PGs!</p>
                    </div>
                    <div className="p-2 grid gap-2">
                        <Button variant="ghost" className="justify-start h-auto py-3 px-4 hover:bg-zinc-800" onClick={() => window.open('https://maps.google.com', '_blank')}>
                            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center mr-3">
                                <Map className="h-4 w-4 text-blue-500" />
                            </div>
                            <div className="text-left">
                                <div className="font-medium">I&apos;m Lost</div>
                                <div className="text-xs text-zinc-500">Get directions & help</div>
                            </div>
                        </Button>

                        <Button variant="ghost" className="justify-start h-auto py-3 px-4 hover:bg-zinc-800" onClick={() => window.open('https://wa.me/919999999999', '_blank')}>
                            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center mr-3">
                                <Phone className="h-4 w-4 text-green-500" />
                            </div>
                            <div className="text-left">
                                <div className="font-medium">Booking Issue</div>
                                <div className="text-xs text-zinc-500">Chat with Admin</div>
                            </div>
                        </Button>

                        <Button variant="ghost" className="justify-start h-auto py-3 px-4 hover:bg-red-900/10 hover:text-red-400" onClick={() => alert('Calling Police: 100')}>
                            <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center mr-3">
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                            </div>
                            <div className="text-left">
                                <div className="font-medium text-red-500">Safety Emergency</div>
                                <div className="text-xs text-red-500/70">Call Police/Warden</div>
                            </div>
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
