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
    verdict?: string;
    sentimentTags: string[];
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
        verdict: { type: String },
        sentimentTags: [{ type: String }],
    },
    { timestamps: true }
);

const Property: Model<IProperty> =
    mongoose.models.Property ||
    mongoose.model<IProperty>('Property', PropertySchema);

export default Property;
