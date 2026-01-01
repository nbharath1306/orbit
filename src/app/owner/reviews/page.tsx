'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Star, Loader2 } from 'lucide-react';

interface Review {
  _id: string;
  studentId?: {
    name: string;
    email: string;
  };
  propertyId: {
    _id: string;
    title: string;
  };
  rating: number;
  comment: string;
  isAnonymous?: boolean;
  isVerifiedStay?: boolean;
  createdAt: string;
  ownerResponse?: {
    comment: string;
    createdAt: string;
  };
}

interface Property {
  _id: string;
  title: string;
  averageRating?: number;
  reviewCount?: number;
}

export default function OwnerReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [responseText, setResponseText] = useState<{ [key: string]: string }>({});
  const [submittingResponse, setSubmittingResponse] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reviewsRes, propsRes] = await Promise.all([
        fetch('/api/owner/reviews'),
        fetch('/api/owner/properties'),
      ]);

      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        // Sort reviews by date (newest first)
        const sortedReviews = (data.reviews || []).sort(
          (a: Review, b: Review) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setReviews(sortedReviews);
      }

      if (propsRes.ok) {
        const data = await propsRes.json();
        setProperties(data.properties || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseSubmit = async (reviewId: string) => {
    const response = responseText[reviewId]?.trim();
    if (!response) return;

    try {
      setSubmittingResponse(reviewId);
      const res = await fetch(`/api/owner/reviews/${reviewId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });

      if (res.ok) {
        await fetchData();
        setResponseText(prev => ({ ...prev, [reviewId]: '' }));
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to submit response');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit response');
    } finally {
      setSubmittingResponse(null);
    }
  };

  const filteredReviews = selectedProperty === 'all'
    ? reviews
    : reviews.filter(r => r.propertyId._id === selectedProperty);

  const totalReviews = reviews.length;
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mb-4" />
        <p className="text-zinc-400 animate-pulse">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 pt-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-white via-emerald-200 to-emerald-400 bg-clip-text text-transparent">
            Reviews
          </h1>
          <p className="text-zinc-400 text-lg">Latest reviews from your guests - sorted by most recent</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-7 hover:scale-[1.02] hover:border-blue-500/40 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium mb-2">Total Reviews</p>
                <p className="text-4xl font-bold text-blue-400">{totalReviews}</p>
              </div>
              <div className="text-5xl opacity-80">⭐</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-7 hover:scale-[1.02] hover:border-emerald-500/40 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-300 text-sm font-medium mb-2">Average Rating</p>
                <p className="text-4xl font-bold text-emerald-400">{averageRating}</p>
              </div>
              <Star className="w-12 h-12 text-yellow-400 fill-yellow-400 opacity-90" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-7 hover:scale-[1.02] hover:border-purple-500/40 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm font-medium mb-2">Properties</p>
                <p className="text-4xl font-bold text-purple-400">{properties.length}</p>
              </div>
              <div className="text-5xl opacity-80">🏠</div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-8 flex items-center gap-4">
          <label className="text-sm font-medium text-zinc-400">Filter by property:</label>
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="bg-zinc-900/80 border border-white/10 rounded-xl px-5 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 transition-all hover:bg-zinc-900 backdrop-blur-sm"
          >
            <option value="all">All Properties</option>
            {properties.map((prop) => (
              <option key={prop._id} value={prop._id}>
                {prop.title} ({prop.reviewCount || 0} reviews)
              </option>
            ))}
          </select>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="bg-gradient-to-br from-zinc-900/60 to-zinc-900/30 border border-white/10 rounded-3xl p-16 text-center backdrop-blur-sm">
              <div className="text-7xl mb-6 animate-pulse">⭐</div>
              <h3 className="text-2xl font-bold text-white mb-3">No Reviews Yet</h3>
              <p className="text-zinc-400 text-lg">
                Reviews from guests will appear here
              </p>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <div
                key={review._id}
                className="bg-gradient-to-br from-zinc-900/60 to-zinc-900/30 border border-white/10 rounded-2xl p-7 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center border border-white/10">
                        <span className="text-lg font-bold text-white">
                          {(review.isAnonymous ? 'A' : review.studentId?.name?.[0] || 'S')}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">
                          {review.isAnonymous ? 'Anonymous' : review.studentId?.name || 'Student'}
                        </h3>
                        {review.isVerifiedStay && (
                          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/40 inline-flex items-center gap-1 mt-1">
                            <span className="text-emerald-400">✓</span> Verified Stay
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400 mb-3 font-medium">
                      📍 {review.propertyId.title}
                    </p>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= review.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-zinc-700'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm font-bold text-yellow-400">{review.rating}.0</span>
                      </div>
                      <span className="text-xs text-zinc-500 bg-white/5 px-2.5 py-1 rounded-lg">
                        {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 mb-5 border border-white/5">
                  <p className="text-zinc-200 leading-relaxed">{review.comment}</p>
                </div>

                {/* Owner Response */}
                {review.ownerResponse ? (
                  <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-8 bg-emerald-500 rounded-full"></div>
                      <p className="text-sm font-bold text-emerald-400">Your Response</p>
                    </div>
                    <p className="text-zinc-200 leading-relaxed mb-2">{review.ownerResponse.comment}</p>
                    <p className="text-xs text-zinc-500">
                      Responded on {format(new Date(review.ownerResponse.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                ) : (
                  <div className="border-t border-white/10 pt-5">
                    <label className="text-sm font-medium text-zinc-400 mb-2 block">Write your response:</label>
                    <textarea
                      value={responseText[review._id] || ''}
                      onChange={(e) =>
                        setResponseText(prev => ({ ...prev, [review._id]: e.target.value }))
                      }
                      placeholder="Share your thoughts and thank them for their feedback..."
                      className="w-full bg-zinc-900/60 border border-white/10 rounded-xl p-4 text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none backdrop-blur-sm"
                      rows={4}
                    />
                    <button
                      onClick={() => handleResponseSubmit(review._id)}
                      disabled={
                        !responseText[review._id]?.trim() ||
                        submittingResponse === review._id
                      }
                      className="mt-3 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-zinc-700 disabled:to-zinc-800 disabled:text-zinc-500 text-white rounded-xl transition-all text-sm font-semibold shadow-lg shadow-emerald-500/20 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {submittingResponse === review._id ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </span>
                      ) : (
                        'Submit Response'
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
