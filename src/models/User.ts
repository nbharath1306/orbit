import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    image?: string;
    role: 'student' | 'owner' | 'admin';
    isVerified: boolean;
    phone?: string;
    university?: 'DSU' | 'Jain' | 'Other';
    blacklisted: boolean;
    password?: string;
}

const UserSchema: Schema<IUser> = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        image: { type: String },
        password: { type: String },
        role: {
            type: String,
            enum: ['student', 'owner', 'admin'],
            default: 'student',
        },
        isVerified: { type: Boolean, default: false },
        phone: { type: String },
        university: { type: String, enum: ['DSU', 'Jain', 'Other'] },
        blacklisted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
