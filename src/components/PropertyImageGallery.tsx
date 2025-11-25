'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Share2, Heart } from 'lucide-react';

const PLACEHOLDERS = [
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=2069&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522771753035-4a53c9d1314f?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop'
];

export function PropertyImageGallery({ 
    images, 
    virtualTourUrl, 
    videoUrl 
}: { 
    images: string[], 
    virtualTourUrl?: string, 
    videoUrl?: string 
}) {
    const [imageSources, setImageSources] = useState(images);

    const handleImageError = (index: number) => {
        const newSources = [...imageSources];
        // If the image at this index fails, replace it with a placeholder
        // Use modulo to cycle through placeholders based on the index
        newSources[index] = PLACEHOLDERS[index % PLACEHOLDERS.length];
        setImageSources(newSources);
    };

    return (
        <Tabs defaultValue="photos" className="w-full">
            <div className="flex justify-between items-center mb-4">
                <TabsList className="bg-zinc-900 border border-zinc-800">
                    <TabsTrigger value="photos">Photos</TabsTrigger>
                    <TabsTrigger value="360">360° Tour</TabsTrigger>
                    <TabsTrigger value="video">Video</TabsTrigger>
                </TabsList>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="rounded-full border-zinc-700 hover:bg-zinc-800">
                        <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-full border-zinc-700 hover:bg-zinc-800">
                        <Heart className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <TabsContent value="photos" className="mt-0">
                <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden aspect-video relative">
                    <div className="relative w-full h-full">
                        <Image
                            src={imageSources[0] || PLACEHOLDERS[0]}
                            alt="Main view"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                            onError={() => handleImageError(0)}
                        />
                    </div>
                    <div className="grid grid-rows-2 gap-2 h-full">
                        <div className="relative w-full h-full">
                            <Image
                                src={imageSources[1] || PLACEHOLDERS[1]}
                                alt="Secondary view 1"
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 50vw, 25vw"
                                onError={() => handleImageError(1)}
                            />
                        </div>
                        <div className="relative w-full h-full">
                            <Image
                                src={imageSources[2] || PLACEHOLDERS[2]}
                                alt="Secondary view 2"
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 50vw, 25vw"
                                onError={() => handleImageError(2)}
                            />
                        </div>
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="360" className="mt-0">
                <div className="aspect-video rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    {virtualTourUrl ? (
                        <iframe
                            src={virtualTourUrl}
                            className="w-full h-full border-0"
                            allowFullScreen
                        />
                    ) : (
                        <div className="text-zinc-500">No 360° Tour available</div>
                    )}
                </div>
            </TabsContent>
            <TabsContent value="video" className="mt-0">
                <div className="aspect-video rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    {videoUrl ? (
                        <iframe
                            src={videoUrl.replace('youtube.com/shorts/', 'youtube.com/embed/')}
                            className="w-full h-full border-0"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                    ) : (
                        <div className="text-zinc-500">No directions video available</div>
                    )}
                </div>
            </TabsContent>
        </Tabs>
    );
}
