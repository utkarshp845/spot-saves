// Optional NextAuth.js route - placeholder for future authentication
// Currently, SpotSave supports both anonymous one-time scans and authenticated persistent monitoring
// This file can be extended when implementing full authentication

import NextAuth, { NextAuthOptions } from "next-auth";

// Get secret from environment, generate one if not set (for development only)
const secret = process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'development-secret-key-change-in-production');

// Placeholder auth configuration - can be extended later
const authOptions: NextAuthOptions = {
  secret: secret || undefined, // Only set if secret is provided
  providers: [],
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
