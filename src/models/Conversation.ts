import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  propertyId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  status: 'active' | 'ended' | 'archived';
  endChatRequested: boolean;
  endChatRequestedAt?: Date;
  endChatApprovals?: {
    student?: boolean;
    owner?: boolean;
  };
  startedAt: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['active', 'ended', 'archived'],
      default: 'active',
    },
    endChatRequested: {
      type: Boolean,
      default: false,
    },
    endChatRequestedAt: {
      type: Date,
    },
    endChatApprovals: {
      student: { type: Boolean, default: false },
      owner: { type: Boolean, default: false },
    },
    startedAt: {
      type: Date,
      default: () => new Date(),
    },
    endedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Compound index for finding conversations
conversationSchema.index({ propertyId: 1, studentId: 1, ownerId: 1 });
conversationSchema.index({ studentId: 1, ownerId: 1 });

const Conversation: mongoose.Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>('Conversation', conversationSchema);

export default Conversation;
