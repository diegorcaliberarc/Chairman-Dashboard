import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  // JWT strategy so we can forward access_token + userId to the client
  session: { strategy: "jwt" },

  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:       "openid email profile https://www.googleapis.com/auth/calendar",
          access_type: "offline",
          prompt:      "consent",
        },
      },
    }),
  ],

  callbacks: {
    // Persist userId + tokens into the JWT on first sign-in
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken  = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      if (user) {
        token.userId = user.id;
      }
      return token;
    },

    // Expose userId + accessToken on the client-side session object
    async session({ session, token }) {
      (session as any).accessToken  = token.accessToken  as string | undefined;
      (session as any).userId       = token.userId       as string | undefined;
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
  },
};
