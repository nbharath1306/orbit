'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ReviewModalProps {
  propertyId: string;
  bookingId?: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export default function ReviewModal({ propertyId, bookingId, onSuccess, trigger }: ReviewModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);
  
  const [formData, setFormData] = useState({
    rating: 0,
    cleanliness: 0,
    communication: 0,
    accuracy: 0,
    location: 0,
    value: 0,
    title: '',
    comment: '',
    pros: [''],
    cons: [''],
    isAnonymous: false,
  });

  const ratingCategories = [
    { key: 'rating', label: 'Overall Rating', icon: '⭐' },
    { key: 'cleanliness', label: 'Cleanliness', icon: '✨' },
    { key: 'communication', label: 'Communication', icon: '💬' },
    { key: 'accuracy', label: 'Accuracy', icon: '🎯' },
    { key: 'location', label: 'Location', icon: '📍' },
    { key: 'value', label: 'Value for Money', icon: '💰' },
  ];

  const setRating = (category: string, value: number) => {
    setFormData((prev) => ({ ...prev, [category]: value }));
  };

  const handleArrayChange = (type: 'pros' | 'cons', index: number, value: string) => {
    setFormData((prev) => {
      const newArray = [...prev[type]];
      newArray[index] = value;
      return { ...prev, [type]: newArray };
    });
  };

  const addArrayItem = (type: 'pros' | 'cons') => {
    if (formData[type].length < 5) {
      setFormData((prev) => ({ ...prev, [type]: [...prev[type], ''] }));
    }
  };

  const removeArrayItem = (type: 'pros' | 'cons', index: number) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (Object.values({
      rating: formData.rating,
      cleanliness: formData.cleanliness,
      communication: formData.communication,
      accuracy: formData.accuracy,
      location: formData.location,
      value: formData.value,
    }).some(r => r === 0)) {
      toast.error('⭐ Please rate all categories to continue', { duration: 3000 });
      return;
    }

    if (comment.length < 50) {
      toast.error('✏️ Comment must be at least 50 characters (currently ${comment.length}/50)', { duration: 3000 });
      return;
    }

    if (formData.comment.length > 2000) {
      toast.error(`✏️ Comment too long. Maximum 2000 characters (currently ${formData.comment.length}/2000)`, { duration: 3000 });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          bookingId,
          ...formData,
          pros: formData.pros.filter(p => p.trim()),
          cons: formData.cons.filter(c => c.trim()),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      toast.success('✅ Thank you! Your review has been submitted successfully and will help other students.', { duration: 4000 });
      setOpen(false);
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Reload page to show new review
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      setFormData({
        rating: 0,
        cleanliness: 0,
        communication: 0,
        accuracy: 0,
        location: 0,
        value: 0,
        title: '',
        comment: '',
        pros: [''],
        cons: [''],
        isAnonymous: false,
      });
    } catch (error) {
      console.error('Review error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ value, onChange, category }: { value: number; onChange: (v: number) => void; category: string }) => {
    const cat = ratingCategories.find(c => c.key === category);
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{cat?.icon}</span>
          <Label className="font-medium text-zinc-200">{cat?.label}</Label>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="focus:outline-none transition-all hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= value 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'text-zinc-700 hover:text-zinc-600'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            ⭐ Write a Review
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-900 border border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl">Share Your Experience</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Help others make informed decisions by sharing your honest feedback.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Ratings Section */}
          <div className="space-y-5 pb-6 border-b border-white/10">
            <h3 className="font-semibold text-white text-lg">Rate Your Experience</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {ratingCategories.map(({ key }) => (
                <StarRating
                  key={key}
                  value={formData[key as keyof typeof formData] as number}
                  onChange={(v) => setRating(key, v)}
                  category={key}
                />
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white font-medium">Review Title (Optional)</Label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., 'Amazing location and clean rooms!'"
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-800/50 border border-white/10 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-white font-medium">Your Review <span className="text-red-400">*</span></Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => setFormData((prev) => ({ ...prev, comment: e.target.value }))}
              placeholder="Tell us about your stay. What did you like? What could be improved? (50-2000 characters)"
              rows={5}
              minLength={50}
              maxLength={2000}
              required
              className="resize-none w-full px-4 py-2.5 rounded-lg bg-zinc-800/50 border border-white/10 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none transition-colors"
            />
            <div className="flex justify-between items-center text-xs">
              <p className={formData.comment.length < 50 ? 'text-red-400' : 'text-zinc-400'}>
                {formData.comment.length}/2000 (minimum 50)
              </p>
            </div>
          </div>

          {/* Pros */}
          <div className="space-y-3 pb-4 border-b border-white/10">
            <Label className="text-white font-medium flex items-center gap-2">✓ What did you like? (Optional)</Label>
            <div className="space-y-2">
              {formData.pros.map((pro, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={pro}
                    onChange={(e) => handleArrayChange('pros', index, e.target.value)}
                    placeholder={`Pro ${index + 1}`}
                    maxLength={200}
                    className="flex-1 px-3 py-2 rounded-lg bg-zinc-800/50 border border-white/10 text-white placeholder-zinc-500 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  {formData.pros.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem('pros', index)}
                      className="hover:bg-red-500/20 text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {formData.pros.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('pros')}
                  className="border-white/10 hover:border-blue-500 text-blue-400"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Pro
                </Button>
              )}
            </div>
          </div>

          {/* Cons */}
          <div className="space-y-3 pb-4 border-b border-white/10">
            <Label className="text-white font-medium flex items-center gap-2">✗ What could be improved? (Optional)</Label>
            <div className="space-y-2">
              {formData.cons.map((con, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={con}
                    onChange={(e) => handleArrayChange('cons', index, e.target.value)}
                    placeholder={`Con ${index + 1}`}
                    maxLength={200}
                    className="flex-1 px-3 py-2 rounded-lg bg-zinc-800/50 border border-white/10 text-white placeholder-zinc-500 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  {formData.cons.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem('cons', index)}
                      className="hover:bg-red-500/20 text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {formData.cons.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('cons')}
                  className="border-white/10 hover:border-blue-500 text-blue-400"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Con
                </Button>
              )}
            </div>
          </div>

          {/* Anonymous */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <input
              type="checkbox"
              id="isAnonymous"
              checked={formData.isAnonymous}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isAnonymous: e.target.checked }))
              }
              className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
            />
            <Label htmlFor="isAnonymous" className="cursor-pointer text-white">
              Post this review anonymously
            </Label>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 border-white/10 hover:border-white/20"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
              disabled={loading}
            >
              {loading ? 'Submitting...' : '✓ Submit Review'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}