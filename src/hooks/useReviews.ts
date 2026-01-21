import { useState, useEffect, useCallback } from 'react';

interface UseReviewsOptions {
  propertyId?: string;
  studentId?: string;
  minRating?: number;
  verifiedOnly?: boolean;
  limit?: number;
}

interface Review {
  _id: string;
  studentId: string;
  propertyId: string;
  rating: number;
  comment: string;
  [key: string]: unknown;
}

interface ReviewAverages {
  avgRating: number;
  avgCleanliness: number;
  avgCommunication: number;
  avgAccuracy: number;
  avgLocation: number;
  avgValue: number;
}

export function useReviews(options: UseReviewsOptions = {}) {
  const {
    propertyId,
    studentId,
    minRating,
    verifiedOnly = false,
    limit = 10,
  } = options;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
  });
  const [averages, setAverages] = useState<ReviewAverages | null>(null);
  const [ratingDistribution, setRatingDistribution] = useState<Record<string, number>>({});

  const fetchReviews = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const skip = (page - 1) * limit;
      const params = new URLSearchParams({
        limit: limit.toString(),
        skip: skip.toString(),
      });

      if (propertyId) params.append('propertyId', propertyId);
      if (studentId) params.append('studentId', studentId);
      if (minRating) params.append('minRating', minRating.toString());
      if (verifiedOnly) params.append('verifiedOnly', 'true');

      const response = await fetch(`/api/reviews?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      setReviews(data.reviews);
      setPagination({
        total: data.total,
        page: data.page,
        pages: data.pages,
      });
      setAverages(data.averages);
      setRatingDistribution(data.ratingDistribution);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [propertyId, studentId, minRating, verifiedOnly, limit]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const refresh = () => fetchReviews(pagination.page);
  const nextPage = () => {
    if (pagination.page < pagination.pages) {
      fetchReviews(pagination.page + 1);
    }
  };
  const prevPage = () => {
    if (pagination.page > 1) {
      fetchReviews(pagination.page - 1);
    }
  };

  return {
    reviews,
    loading,
    error,
    pagination,
    averages,
    ratingDistribution,
    refresh,
    nextPage,
    prevPage,
  };
}

export function useReview(reviewId: string) {
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReview = useCallback(async () => {
    if (!reviewId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/reviews/${reviewId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch review');
      }

      const data = await response.json();
      setReview(data.review);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  const updateReview = async (action: string, payload?: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });

      if (!response.ok) {
        throw new Error('Failed to update review');
      }

      const data = await response.json();
      setReview(data.review);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const deleteReview = async () => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete review');
      }

      return true;
    } catch (err) {
      throw err;
    }
  };

  return {
    review,
    loading,
    error,
    refresh: fetchReview,
    updateReview,
    deleteReview,
  };
}
