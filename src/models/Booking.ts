import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBooking extends Document {
    studentId: mongoose.Types.ObjectId;
    propertyId: mongoose.Types.ObjectId;
    ownerId: mongoose.Types.ObjectId;
    roomType?: string;
    status: 'pending' | 'confirmed' | 'checked-in' | 'completed' | 'cancelled' | 'rejected' | 'paid';
    paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
    paymentId?: string;
    razorpayOrderId?: string;
    razorpaySignature?: string;
    
    // Booking details
    checkInDate: Date;
    checkOutDate?: Date;
    durationMonths: number;
    
    // Pricing
    monthlyRent: number;
    securityDeposit: number;
    totalAmount: number;
    amountPaid: number;
    
    // Additional info
    specialRequests?: string;
    guestCount: number;
    
    // Cancellation
    cancellationReason?: string;
    cancelledBy?: 'student' | 'owner' | 'admin';
    cancelledAt?: Date;
    refundAmount?: number;
    
    // Owner response & acceptance workflow
    ownerResponse?: {
        status: 'accepted' | 'rejected';
        message?: string;
        respondedAt: Date;
    };
    acceptedAt?: Date;
    acceptedBy?: mongoose.Types.ObjectId;
    rejectedAt?: Date;
    rejectedBy?: mongoose.Types.ObjectId;
    rejectionReason?: string;
    paidAt?: Date;
    completedAt?: Date;
    
    // Metadata
    source?: 'web' | 'mobile';
    metadata?: Record<string, any>;
    
    createdAt: Date;
    updatedAt: Date;
}

const BookingSchema: Schema<IBooking> = new Schema(
    {
        studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
        ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        roomType: { type: String },
        
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'checked-in', 'completed', 'cancelled', 'rejected', 'paid'],
            default: 'pending',
            index: true,
        },
        
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'refunded', 'failed'],
            default: 'pending',
            index: true,
        },
        
        paymentId: { type: String },
        razorpayOrderId: { type: String },
        razorpaySignature: { type: String },
        
        // Booking details
        checkInDate: { type: Date, required: true },
        checkOutDate: { type: Date },
        durationMonths: { type: Number, required: true, min: 1, max: 12 },
        
        // Pricing
        monthlyRent: { type: Number, required: true },
        securityDeposit: { type: Number, default: 0 },
        totalAmount: { type: Number, required: true },
        amountPaid: { type: Number, default: 0 },
        
        // Additional info
        specialRequests: { type: String, maxlength: 500 },
        guestCount: { type: Number, default: 1, min: 1 },
        
        // Cancellation
        cancellationReason: { type: String, maxlength: 500 },
        cancelledBy: { type: String, enum: ['student', 'owner', 'admin'] },
        cancelledAt: { type: Date },
        refundAmount: { type: Number, default: 0 },
        
        // Owner response
        ownerResponse: {
            status: { type: String, enum: ['accepted', 'rejected'] },
            message: { type: String, maxlength: 300 },
            respondedAt: { type: Date },
        },
        acceptedAt: { type: Date },
        acceptedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        rejectedAt: { type: Date },
        rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        rejectionReason: { type: String, maxlength: 500 },
        paidAt: { type: Date },
        completedAt: { type: Date },
        
        // Metadata
        source: { type: String, enum: ['web', 'mobile'], default: 'web' },
        metadata: { type: Schema.Types.Mixed },
    },
    { 
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes for efficient queries
BookingSchema.index({ studentId: 1, status: 1 });
BookingSchema.index({ ownerId: 1, status: 1 });
BookingSchema.index({ propertyId: 1, status: 1 });
BookingSchema.index({ createdAt: -1 });
BookingSchema.index({ checkInDate: 1 });

// Virtual for booking duration in days
BookingSchema.virtual('durationDays').get(function() {
    return this.durationMonths * 30;
});

// Virtual to check if booking is active
BookingSchema.virtual('isActive').get(function() {
    return ['confirmed', 'checked-in'].includes(this.status);
});

// Pre-save middleware to calculate total amount
BookingSchema.pre('save', function(next) {
    if (this.isModified('monthlyRent') || this.isModified('durationMonths') || this.isModified('securityDeposit')) {
        this.totalAmount = (this.monthlyRent * this.durationMonths) + this.securityDeposit;
    }
    next();
});

const Booking: Model<IBooking> =
    mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
