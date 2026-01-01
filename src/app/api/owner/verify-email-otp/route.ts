import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { otpStore } from '../send-email-otp/route';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    // Get stored OTP
    const storedData = otpStore.get(email);

    if (!storedData) {
      return NextResponse.json({ error: 'OTP expired or not found' }, { status: 400 });
    }

    // Check if expired
    if (Date.now() > storedData.expires) {
      otpStore.delete(email);
      return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    // OTP is valid, remove it from store
    otpStore.delete(email);

    return NextResponse.json({
      message: 'OTP verified successfully',
      verified: true,
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
