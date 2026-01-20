import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    image?: string;
    avatar?: string;
    role: 'user' | 'owner' | 'admin';
    isVerified: boolean;
    phone?: string;
    address?: string;
    university?: 'DSU' | 'Jain' | 'Other';
    blacklisted: boolean;
    password?: string;
    isOnline: boolean;
    lastSeen?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const UserSchema: Schema<IUser> = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        image: { type: String },
        avatar: { type: String },
        password: { type: String },
        role: {
            type: String,
            enum: ['user', 'owner', 'admin'],
            default: 'user',
        },
        isVerified: { type: Boolean, default: false },
        phone: { type: String },
        address: { type: String },
        university: { type: String, enum: ['DSU', 'Jain', 'Other'] },
        blacklisted: { type: Boolean, default: false },
        isOnline: { type: Boolean, default: false },
        lastSeen: { type: Date, default: null },
    },
    { timestamps: true }
);

// Performance Indexes
UserSchema.index({ email: 1 }); // Already unique, but explicit
UserSchema.index({ role: 1 }); // Filter by role (admin queries)
UserSchema.index({ blacklisted: 1 }); // Filter blacklisted users
UserSchema.index({ role: 1, blacklisted: 1 }); // Compound for admin user list
UserSchema.index({ createdAt: -1 }); // Sort by creation date
UserSchema.index({ isOnline: 1, lastSeen: -1 }); // Online status queries

const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
