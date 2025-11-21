import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import Property from '@/models/Property';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import { LiveStatsCounter } from '@/components/LiveStatsCounter';

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/api/auth/signin');
    }

    await dbConnect();

    // @ts-ignore
    const role = session.user.role;
    // @ts-ignore
    const userId = session.user.id;

    if (role === 'student') {
        const bookings = await Booking.find({ studentId: userId })
            .populate('propertyId')
            .sort({ createdAt: -1 })
            .lean();

        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>

                <div className="space-y-6">
                    <h2 className="text-xl font-semibold">My Bookings</h2>
                    {bookings.length === 0 ? (
                        <p className="text-zinc-500">No bookings yet.</p>
                    ) : (
                        <div className="grid gap-4">
                            {bookings.map((booking: any) => (
                                <Card key={booking._id} className="bg-zinc-900 border-zinc-800">
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <CardTitle>{booking.propertyId.title}</CardTitle>
                                            <Badge variant={booking.status === 'paid' ? 'default' : 'secondary'}>
                                                {booking.status.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between text-sm text-zinc-400">
                                            <span>Amount Paid: ₹{booking.amountPaid}</span>
                                            <span>Date: {new Date(booking.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="mt-2 text-xs text-zinc-500">
                                            Payment ID: {booking.paymentId}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (role === 'owner') {
        const properties = await Property.find({ ownerId: userId }).lean();

        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Owner Dashboard</h1>
                    <Button>Add Property</Button>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-semibold">My Listings & Live Stats</h2>
                    <div className="grid gap-6">
                        {properties.map((prop: any) => (
                            <Card key={prop._id} className="bg-zinc-900 border-zinc-800">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle>{prop.title}</CardTitle>
                                            <p className="text-sm text-zinc-400">{prop.location.address}</p>
                                        </div>
                                        <Badge variant="outline">{prop.slug}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between bg-zinc-800/50 p-4 rounded-lg">
                                        <div>
                                            <div className="text-sm text-zinc-400">Occupancy</div>
                                            <div className="text-2xl font-bold">
                                                {prop.liveStats.occupiedRooms} / {prop.liveStats.totalRooms}
                                            </div>
                                        </div>
                                        <LiveStatsCounter
                                            propertyId={prop._id.toString()}
                                            initialCount={prop.liveStats.occupiedRooms}
                                            total={prop.liveStats.totalRooms}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p>Welcome, Admin.</p>
        </div>
    );
}
