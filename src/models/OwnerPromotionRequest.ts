import mongoose from 'mongoose';

const ownerPromotionRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userEmail: String,
    userName: String,
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
    },
    propertyTitle: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reason: String, // For rejection reason
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export interface IOwnerPromotionRequest extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  userEmail?: string;
  userName?: string;
  propertyId?: mongoose.Types.ObjectId;
  propertyTitle?: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const OwnerPromotionRequest: mongoose.Model<IOwnerPromotionRequest> =
  mongoose.models.OwnerPromotionRequest ||
  mongoose.model<IOwnerPromotionRequest>('OwnerPromotionRequest', ownerPromotionRequestSchema);
