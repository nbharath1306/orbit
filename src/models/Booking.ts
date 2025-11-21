import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBooking extends Document {
    studentId: mongoose.Types.ObjectId;
    propertyId: mongoose.Types.ObjectId;
    status: 'pending' | 'paid' | 'confirmed' | 'rejected';
    paymentId?: string;
    amountPaid: number;
}

const BookingSchema: Schema<IBooking> = new Schema(
    {
        studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
        status: {
            type: String,
            enum: ['pending', 'paid', 'confirmed', 'rejected'],
            default: 'pending',
        },
        paymentId: { type: String },
        amountPaid: { type: Number, required: true },
    },
    { timestamps: true }
);

const Booking: Model<IBooking> =
    mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
