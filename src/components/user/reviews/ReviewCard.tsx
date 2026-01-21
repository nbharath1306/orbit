'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ThumbsUp, Flag, CheckCircle, MessageSquare, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface Review {
  _id: string;
  studentId: {
    _id?: string;
    name: string;
    image?: string;
  };
  propertyId: {
    title: string;
    slug: string;
  };
  rating: number;
  cleanliness: number;
  communication: number;
  accuracy: number;
  location: number;
  value: number;
  title?: string;
  comment: string;
  pros?: string[];
  cons?: string[];
  isAnonymous: boolean;
  isVerifiedStay: boolean;
  ownerResponse?: {
    comment: string;
    respondedAt: string;
  };
  helpfulCount: number;
  stayDuration?: number;
  createdAt: string;
}

interface ReviewCardProps {
  review: Review;
  showProperty?: boolean;
  onUpdate?: () => void;
  isAuthor?: boolean;
}

export default function ReviewCard({ review, showProperty = false, onUpdate, isAuthor = false }: ReviewCardProps) {
  const [marked, setMarked] = useState(false);
  const [reported, setReported] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleHelpful = async () => {
    if (marked) return;

    try {
      const response = await fetch(`/api/reviews/${review._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'helpful' }),
      });

      if (response.ok) {
        setMarked(true);
        toast.success('👍 Marked as helpful! Thank you for the feedback.', { duration: 2000 });
        if (onUpdate) onUpdate();
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || errorData.error || 'Failed to mark as helpful';
        console.error('API Error:', response.status, errorData);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error marking helpful:', error);
      toast.error('Network error - please try again');
    }
  };

  const handleReport = async () => {
    if (reported) return;

    try {
      const response = await fetch(`/api/reviews/${review._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'report' }),
      });

      if (response.ok) {
        setReported(true);
        toast.success('✅ Thank you! Review reported successfully. Our team will review it shortly.', { duration: 4000 });
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || errorData.error || 'Failed to report review';
        console.error('API Error:', response.status, errorData);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error reporting:', error);
      toast.error('Network error - please try again');
    }
  };

  const handleDelete = async () => {
    if (!isAuthor) return;

    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/reviews/${review._id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('✅ Review deleted successfully', { duration: 3000 });
        if (onUpdate) {
          setTimeout(() => {
            onUpdate();
          }, 500);
        }
      } else {
        const errorMsg = data.message || data.error || 'Failed to delete review';
        toast.error(errorMsg, { duration: 3000 });
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Network error - please try again', { duration: 3000 });
    } finally {
      setIsDeleting(false);
    }
  };



  const avgRating = Math.round(
    (review.rating + review.cleanliness + review.communication + review.accuracy +
      review.location + review.value) / 6 * 10
  ) / 10;

  return (
    <Card className="p-4 space-y-3 border border-white/10 bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-zinc-950/80 hover:border-white/20 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
      {/* Header Section - Compact */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
            {review.isAnonymous ? (
              <span className="text-zinc-200 font-bold text-xs">A</span>
            ) : review.studentId.image ? (
              <img src={review.studentId.image} alt={review.studentId.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-zinc-200 font-bold text-xs">
                {review.studentId.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-white text-sm truncate">
                {review.isAnonymous ? 'Anonymous' : review.studentId.name}
              </p>
              {review.isVerifiedStay && (
                <Badge variant="outline" className="text-green-300 border-green-500/40 bg-green-500/10 text-xs h-5 px-1.5">
                  <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                  Verified
                </Badge>
              )}
            </div>
            {mounted && (
              <p className="text-xs text-zinc-500 mt-0.5">
                {format(new Date(review.createdAt), 'MMM dd, yyyy')}
              </p>
            )}
          </div>
        </div>

        {/* Overall Rating Badge - Compact */}
        <div className="text-right flex-shrink-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-2.5 rounded-lg border border-yellow-500/30">
          <div className="flex items-center gap-1.5 justify-center">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-xl font-bold text-yellow-300">{avgRating}</span>
          </div>
        </div>
      </div>

      {/* Property Title */}
      {showProperty && (
        <div className="pt-2 border-t border-white/5">
          <p className="text-xs text-zinc-500">
            Reviewed: <span className="font-semibold text-blue-300 text-sm">{review.propertyId.title}</span>
          </p>
        </div>
      )}

      {/* Review Title & Comment - Compact */}
      <div className="space-y-2">
        {review.title && (
          <h4 className="font-semibold text-white text-sm leading-tight">{review.title}</h4>
        )}
        <p className="text-zinc-400 text-sm leading-snug line-clamp-3">{review.comment}</p>
      </div>

      {/* Rating Breakdown - Compact Grid */}
      <div className="space-y-2 pt-2 border-t border-white/5">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Ratings</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'Cleanliness', value: review.cleanliness, icon: '✨' },
            { label: 'Communication', value: review.communication, icon: '💬' },
            { label: 'Accuracy', value: review.accuracy, icon: '🎯' },
            { label: 'Location', value: review.location, icon: '📍' },
            { label: 'Value', value: review.value, icon: '💰' },
          ].map((item) => (
            <div key={item.label} className="bg-white/5 rounded-lg p-2 border border-white/10 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-sm">{item.icon}</span>
                <p className="text-xs font-medium text-zinc-400">{item.label}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-2.5 h-2.5 ${star <= item.value ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-700'
                        }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-white">{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pros & Cons - Compact */}
      {(review.pros?.length || review.cons?.length) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
          {review.pros && review.pros.length > 0 && (
            <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
              <p className="text-xs font-semibold text-green-300 mb-2 flex items-center gap-1.5">
                <span>✓</span> Pros
              </p>
              <ul className="space-y-1">
                {review.pros.slice(0, 2).map((pro, i) => (
                  <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                    <span className="text-green-400 flex-shrink-0">•</span>
                    <span className="line-clamp-2">{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {review.cons && review.cons.length > 0 && (
            <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
              <p className="text-xs font-semibold text-red-300 mb-2 flex items-center gap-1.5">
                <span>✗</span> Cons
              </p>
              <ul className="space-y-1">
                {review.cons.slice(0, 2).map((con, i) => (
                  <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                    <span className="text-red-400 flex-shrink-0">•</span>
                    <span className="line-clamp-2">{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Owner Response - Compact */}
      {review.ownerResponse && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500/15 to-blue-600/10 border-l-4 border-blue-500 space-y-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
            <p className="font-semibold text-blue-300 text-xs">Owner&apos;s Response</p>
          </div>
          <p className="text-xs text-zinc-300 line-clamp-2">{review.ownerResponse.comment}</p>
        </div>
      )}

      {/* Actions - Compact */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/5 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleHelpful}
          disabled={marked}
          className={`text-xs font-semibold transition-all px-2 py-1 h-7 ${marked
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'text-zinc-400 hover:text-green-400 hover:bg-green-500/10 hover:border-green-500/30 border border-white/10'
            } rounded-full`}
        >
          <ThumbsUp className={`w-3 h-3 mr-1 ${marked ? 'fill-current' : ''}`} />
          <span className={`${marked ? 'text-green-300' : 'text-zinc-500'}`}>
            ({review.helpfulCount})
          </span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReport}
          disabled={reported}
          className={`text-xs font-semibold transition-all px-2 py-1 h-7 ${reported
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'text-zinc-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 border border-white/10'
            } rounded-full`}
        >
          <Flag className={`w-3 h-3 mr-1 ${reported ? 'fill-current' : ''}`} />
          {reported ? 'Reported' : 'Report'}
        </Button>

        {/* Author Actions */}
        {isAuthor && (
          <>
            <div className="flex-1 hidden sm:block" />
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-semibold px-2 py-1 h-7 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 hover:border-blue-500/30 border border-white/10 rounded-full transition-all"
              onClick={() => {
                // TODO: Implement edit functionality
                toast.loading('Edit feature coming soon...', { duration: 2000 });
              }}
            >
              <Edit2 className="w-3 h-3 mr-1" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              className="text-xs font-semibold px-2 py-1 h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/30 border border-white/10 rounded-full transition-all disabled:opacity-50"
              onClick={handleDelete}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
