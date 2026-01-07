import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import Review from '@/models/Review';
import User from '@/models/User';
import UserLayoutContent from '@/components/user/layout/UserLayoutContent';
import ReviewList from '@/components/user/reviews/ReviewList';

export const dynamic = 'force-dynamic';

async function getUserReviews(userId: string) {
  await dbConnect();
  
  try {
    const reviews = await Review.find({ studentId: userId })
      .populate('propertyId', 'title slug')
      .sort({ createdAt: -1 })
      .lean();
    
    // Serialize MongoDB objects
    return reviews.map((review: any) => ({
      _id: review._id?.toString() || '',
      studentId: {
        _id: review.studentId?._id?.toString() || userId,
        name: review.studentId?.name || 'You',
        image: review.studentId?.image || null,
      },
      propertyId: {
        title: review.propertyId?.title || 'Unknown Property',
        slug: review.propertyId?.slug || '',
      },
      rating: review.rating || 0,
      cleanliness: review.cleanliness || 0,
      communication: review.communication || 0,
      accuracy: review.accuracy || 0,
      location: review.location || 0,
      value: review.value || 0,
      title: review.title || '',
      comment: review.comment || '',
      pros: review.pros || [],
      cons: review.cons || [],
      isAnonymous: review.isAnonymous || false,
      isVerifiedStay: review.isVerifiedStay || false,
      ownerResponse: review.ownerResponse || null,
      helpfulCount: review.helpfulCount || 0,
      stayDuration: review.stayDuration || 0,
      createdAt: review.createdAt?.toISOString() || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return [];
  }
}

export default async function ReviewsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  // Get user ID
  await dbConnect();
  const user = await User.findOne({ email: session.user.email }).select('_id').lean();
  
  if (!user) {
    redirect('/auth/signin');
  }

  const reviews = await getUserReviews(user._id.toString());

  return (
    <UserLayoutContent
      title="My Reviews"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Reviews' },
      ]}
    >
      {reviews.length === 0 ? (
        <div className="relative rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-12 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="relative z-10">
            <div className="text-5xl mb-4">⭐</div>
            <h3 className="text-lg font-semibold text-white mb-2">No Reviews Yet</h3>
            <p className="text-zinc-400">
              Share your experience after completing a booking!
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <p className="text-zinc-400">
              You have written <span className="font-bold text-white">{reviews.length}</span> review{reviews.length !== 1 ? 's' : ''}
            </p>
          </div>
          <ReviewList reviews={reviews} />
        </div>
      )}
    </UserLayoutContent>
  );
}
