import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
    studentId: mongoose.Types.ObjectId;
    propertyId: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
    isAnonymous: boolean;
}

const ReviewSchema: Schema<IReview> = new Schema(
    {
        studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, required: true },
        isAnonymous: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const Review: Model<IReview> =
    mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
