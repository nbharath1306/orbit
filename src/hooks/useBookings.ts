import { useState, useEffect, useCallback } from 'react';

interface UseBookingsOptions {
  filter?: string;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface Booking {
  _id: string;
  propertyId: string;
  status: string;
  paymentStatus: string;
  checkInDate: string;
  totalAmount: number;
  [key: string]: unknown;
}

export function useBookings(options: UseBookingsOptions = {}) {
  const {
    filter = 'all',
    limit = 10,
    autoRefresh = false,
    refreshInterval = 30000,
  } = options;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
  });

  const fetchBookings = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const skip = (page - 1) * limit;
      const response = await fetch(
        `/api/user/bookings?filter=${filter}&limit=${limit}&skip=${skip}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data.bookings);
      setPagination({
        total: data.total,
        page: data.page,
        pages: data.pages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [filter, limit]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchBookings(pagination.page);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, pagination.page, fetchBookings]);

  const refresh = () => fetchBookings(pagination.page);
  const nextPage = () => {
    if (pagination.page < pagination.pages) {
      fetchBookings(pagination.page + 1);
    }
  };
  const prevPage = () => {
    if (pagination.page > 1) {
      fetchBookings(pagination.page - 1);
    }
  };

  return {
    bookings,
    loading,
    error,
    pagination,
    refresh,
    nextPage,
    prevPage,
  };
}

export function useBooking(bookingId: string) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooking = useCallback(async () => {
    if (!bookingId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/${bookingId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch booking');
      }

      const data = await response.json();
      setBooking(data.booking);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const updateBooking = async (action: string, payload?: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });

      if (!response.ok) {
        throw new Error('Failed to update booking');
      }

      const data = await response.json();
      setBooking(data.booking);
      return data;
    } catch (err) {
      throw err;
    }
  };

  return {
    booking,
    loading,
    error,
    refresh: fetchBooking,
    updateBooking,
  };
}
