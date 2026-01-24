import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProperty extends Document {
    ownerId: mongoose.Types.ObjectId;
    title: string;
    slug: string;
    description: string;
    location: {
        lat: number;
        lng: number;
        address: string;
        directionsVideoUrl?: string;
    };
    price: {
        amount: number;
        period: 'monthly';
    };
    amenities: string[];
    media: {
        images: string[];
        virtualTourUrl?: string;
    };
    liveStats: {
        totalRooms: number;
        occupiedRooms: number;
    };
    // Rating fields
    averageRating?: number;
    avgCleanliness?: number;
    avgCommunication?: number;
    avgAccuracy?: number;
    avgLocation?: number;
    avgValue?: number;
    reviewCount?: number;
    verdict?: string;
    sentimentTags: string[];
    approvalStatus: 'pending' | 'approved' | 'rejected';
    status: 'active' | 'inactive' | 'rented';
}

const PropertySchema: Schema<IProperty> = new Schema(
    {
        ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        description: { type: String, required: true },
        location: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
            address: { type: String, required: true },
            directionsVideoUrl: { type: String },
        },
        price: {
            amount: { type: Number, required: true },
            period: { type: String, enum: ['monthly'], default: 'monthly' },
        },
        amenities: [{ type: String }],
        media: {
            images: [{ type: String }],
            virtualTourUrl: { type: String },
        },
        liveStats: {
            totalRooms: { type: Number, required: true },
            occupiedRooms: { type: Number, default: 0 },
        },
        // Rating fields
        averageRating: { type: Number, default: 0, min: 0, max: 5 },
        avgCleanliness: { type: Number, default: 0, min: 0, max: 5 },
        avgCommunication: { type: Number, default: 0, min: 0, max: 5 },
        avgAccuracy: { type: Number, default: 0, min: 0, max: 5 },
        avgLocation: { type: Number, default: 0, min: 0, max: 5 },
        avgValue: { type: Number, default: 0, min: 0, max: 5 },
        reviewCount: { type: Number, default: 0 },
        verdict: { type: String },
        sentimentTags: [{ type: String }],
        approvalStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'rented'],
            default: 'active',
        },
    },
    { timestamps: true }
);

// Performance Indexes
PropertySchema.index({ ownerId: 1, createdAt: -1 }); // Owner's properties list
PropertySchema.index({ slug: 1 }, { unique: true }); // URL lookup
PropertySchema.index({ 'location.address': 'text', title: 'text', description: 'text' }); // Full-text search
PropertySchema.index({ 'price.amount': 1 }); // Price filtering
PropertySchema.index({ averageRating: -1, reviewCount: -1 }); // Sort by rating
PropertySchema.index({ createdAt: -1 }); // Recent properties
PropertySchema.index({ 'liveStats.occupiedRooms': 1, 'liveStats.totalRooms': 1 }); // Availability
PropertySchema.index({ averageRating: 1, 'price.amount': 1 }); // Compound for filtered search

const Property: Model<IProperty> =
    mongoose.models.Property ||
    mongoose.model<IProperty>('Property', PropertySchema);

export default Property;
