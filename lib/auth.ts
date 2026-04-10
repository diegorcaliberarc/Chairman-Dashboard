import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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
    async jwt({ token, account, user }) {
      // On first sign-in, persist base fields from the user record
      if (user) {
        token.userId = user.id;
      }
      if (account) {
        token.accessToken  = account.access_token;
        token.refreshToken = account.refresh_token;
      }

      // Always fetch the latest role from the DB so ADMIN grants take effect immediately
      if (token.userId) {
        const dbUser = await prisma.user.findUnique({
          where:  { id: token.userId as string },
          select: { role: true },
        });
        token.role = dbUser?.role ?? "USER";
      }

      return token;
    },

    async session({ session, token }) {
      (session as any).accessToken  = token.accessToken  as string | undefined;
      (session as any).userId       = token.userId       as string | undefined;
      (session as any).role         = token.role         as string | undefined;
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
  },
};
