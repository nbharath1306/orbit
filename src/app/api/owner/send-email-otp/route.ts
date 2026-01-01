import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';

// Temporary in-memory store for OTPs (in production, use Redis)
const otpStore = new Map<string, { otp: string; expires: number }>();

// Function to generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with 10 minute expiration
    otpStore.set(email, {
      otp,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // In production, send this via email service (SendGrid, AWS SES, etc.)
    // For now, we'll just log it
    console.log(`OTP for ${email}: ${otp}`);

    // TODO: Send email with OTP
    // Example with nodemailer or SendGrid:
    // await sendEmail({
    //   to: email,
    //   subject: 'Verify Your Email - Orbit',
    //   html: `Your verification code is: <strong>${otp}</strong>. This code expires in 10 minutes.`
    // });

    return NextResponse.json({
      message: 'OTP sent successfully',
      // In development, return OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otp }),
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}

// Cleanup expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (data.expires < now) {
      otpStore.delete(email);
    }
  }
}, 60000); // Run every minute

export { otpStore };
