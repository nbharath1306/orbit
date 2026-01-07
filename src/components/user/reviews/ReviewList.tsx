'use client';

import { useState } from 'react';
import ReviewCard from './ReviewCard';
import { useRouter } from 'next/navigation';

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

interface ReviewListProps {
  reviews: Review[];
}

export default function ReviewList({ reviews: initialReviews }: ReviewListProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);

  const handleUpdate = () => {
    // Refresh the page to get updated reviews
    router.refresh();
  };

  const handleDelete = (reviewId: string) => {
    // Remove the deleted review from the list
    setReviews(reviews.filter(review => review._id !== reviewId));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {reviews.map((review) => (
        <ReviewCard
          key={review._id}
          review={review}
          showProperty={true}
          isAuthor={true}
          onUpdate={handleUpdate}
        />
      ))}
    </div>
  );
}
