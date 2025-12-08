import NextAuth, { NextAuthOptions } from 'next-auth';
import Auth0Provider from 'next-auth/providers/auth0';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export const authOptions: NextAuthOptions = {
    providers: [
        Auth0Provider({
            clientId: process.env.AUTH0_CLIENT_ID || '',
            clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
            issuer: process.env.AUTH0_ISSUER,
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
                    credentials?.email === 'user@orbit.com' &&
                    credentials?.password === 'password'
                ) {
                    return {
                        id: 'mock_user_id',
                        name: 'Demo User',
                        email: 'user@orbit.com',
                        role: 'user',
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

                // Allow any user in the database with 'password' as the password
                if (credentials?.email && credentials?.password === 'password') {
                    try {
                        await dbConnect();
                        const user = await User.findOne({ email: credentials.email }).lean();
                        if (user) {
                            return {
                                id: user._id.toString(),
                                name: user.name || 'User',
                                email: user.email,
                                role: user.role || 'user',
                            };
                        }
                    } catch (error) {
                        console.error('Error in credentials authorize:', error);
                    }
                }

                return null;
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === 'auth0') {
                await dbConnect();
                const existingUser = await User.findOne({ email: user.email });
                if (!existingUser) {
                    await User.create({
                        name: user.name,
                        email: user.email,
                        image: user.image,
                        role: 'user', // Default role
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

                    session.user.id = dbUser._id.toString();

                    session.user.role = dbUser.role;

                    session.user.isVerified = dbUser.isVerified;
                } else if (token) {
                    // Fallback to token if dbUser fetch fails or for other providers
                    // @ts-expect-error - sub is not in default session type
                    session.user.id = token.sub;
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
