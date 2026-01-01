import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  threadId?: string;
  conversationId?: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  senderRole: 'student' | 'owner';
  message: string;
  attachments?: string[];
  encrypted?: boolean;
  read: boolean;
  readAt?: Date;
  delivered: boolean;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    threadId: {
      type: String,
      index: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      index: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
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
    senderRole: {
      type: String,
      enum: ['student', 'owner'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    attachments: {
      type: [String],
      default: [],
    },
    encrypted: {
      type: Boolean,
      default: false,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    delivered: {
      type: Boolean,
      default: false,
      index: true,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for conversations and threads
messageSchema.index({ threadId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ bookingId: 1, createdAt: -1 });
messageSchema.index({ studentId: 1, ownerId: 1 });

export default mongoose.models.Message ||
  mongoose.model<IMessage>('Message', messageSchema);
