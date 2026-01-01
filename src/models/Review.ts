import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
    studentId: mongoose.Types.ObjectId;
    propertyId: mongoose.Types.ObjectId;
    bookingId?: mongoose.Types.ObjectId;
    
    // Rating breakdown
    rating: number;
    cleanliness: number;
    communication: number;
    accuracy: number;
    location: number;
    value: number;
    
    // Review content
    comment: string;
    title?: string;
    pros?: string[];
    cons?: string[];
    
    // Media
    images?: string[];
    
    // Privacy
    isAnonymous: boolean;
    
    // Verification
    isVerifiedStay: boolean;
    
    // Owner response
    ownerResponse?: {
        comment: string;
        respondedAt: Date;
    };
    
    // Moderation
    status: 'pending' | 'approved' | 'rejected' | 'flagged';
    moderationReason?: string;
    moderatedBy?: mongoose.Types.ObjectId;
    moderatedAt?: Date;
    
    // Helpfulness
    helpfulCount: number;
    reportCount: number;
    
    // Metadata
    stayDuration?: number; // in months
    createdAt: Date;
    updatedAt: Date;
}

const ReviewSchema: Schema<IReview> = new Schema(
    {
        studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
        bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
        
        // Rating breakdown (1-5 scale)
        rating: { type: Number, required: true, min: 1, max: 5 },
        cleanliness: { type: Number, required: true, min: 1, max: 5 },
        communication: { type: Number, required: true, min: 1, max: 5 },
        accuracy: { type: Number, required: true, min: 1, max: 5 },
        location: { type: Number, required: true, min: 1, max: 5 },
        value: { type: Number, required: true, min: 1, max: 5 },
        
        // Review content
        comment: { type: String, required: true, minlength: 50, maxlength: 2000 },
        title: { type: String, maxlength: 100 },
        pros: [{ type: String, maxlength: 200 }],
        cons: [{ type: String, maxlength: 200 }],
        
        // Media
        images: [{ type: String }],
        
        // Privacy
        isAnonymous: { type: Boolean, default: false },
        
        // Verification
        isVerifiedStay: { type: Boolean, default: false },
        
        // Owner response
        ownerResponse: {
            comment: { type: String, maxlength: 1000 },
            respondedAt: { type: Date },
        },
        
        // Moderation
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'flagged'],
            default: 'approved',
            index: true,
        },
        moderationReason: { type: String },
        moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        moderatedAt: { type: Date },
        
        // Helpfulness
        helpfulCount: { type: Number, default: 0 },
        reportCount: { type: Number, default: 0 },
        
        // Metadata
        stayDuration: { type: Number },
    },
    { 
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes for efficient queries
ReviewSchema.index({ propertyId: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ studentId: 1, createdAt: -1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ isVerifiedStay: 1 });

// Ensure one review per booking
ReviewSchema.index({ bookingId: 1 }, { unique: true, sparse: true });

// Virtual for overall rating calculation
ReviewSchema.virtual('overallRating').get(function() {
    return (this.rating + this.cleanliness + this.communication + 
            this.accuracy + this.location + this.value) / 6;
});

// Pre-save validation: ensure rating matches average of sub-ratings
ReviewSchema.pre('save', function(next) {
    const avgRating = Math.round(
        (this.cleanliness + this.communication + this.accuracy + 
         this.location + this.value) / 5
    );
    
    // Allow ±0.5 difference
    if (Math.abs(this.rating - avgRating) > 0.5) {
        this.rating = avgRating;
    }
    
    next();
});

const Review: Model<IReview> =
    mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
