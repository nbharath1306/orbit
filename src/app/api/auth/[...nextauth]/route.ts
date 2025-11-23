import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || 'mock_client_id',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_client_secret',
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                // Mock login for demo purposes
                if (
                    credentials?.email === 'student@orbit.com' &&
                    credentials?.password === 'password'
                ) {
                    return {
                        id: 'mock_student_id',
                        name: 'Demo Student',
                        email: 'student@orbit.com',
                        role: 'student',
                    };
                }
                if (
                    credentials?.email === 'owner@orbit.com' &&
                    credentials?.password === 'password'
                ) {
                    return {
                        id: 'mock_owner_id',
                        name: 'Demo Owner',
                        email: 'owner@orbit.com',
                        role: 'owner',
                    };
                }
                return null;
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === 'google') {
                await dbConnect();
                const existingUser = await User.findOne({ email: user.email });
                if (!existingUser) {
                    await User.create({
                        name: user.name,
                        email: user.email,
                        image: user.image,
                        role: 'student', // Default role
                        isVerified: false,
                    });
                }
            }
            return true;
        },
        async session({ session, token }) {
            if (session.user) {
                await dbConnect();
                const dbUser = await User.findOne({ email: session.user.email });
                if (dbUser) {
                    // @ts-expect-error -- Extending session user type
                    session.user.id = dbUser._id.toString();
                    // @ts-expect-error -- Extending session user type
                    session.user.role = dbUser.role;
                    // @ts-expect-error -- Extending session user type
                    session.user.isVerified = dbUser.isVerified;
                }
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/signin',
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
