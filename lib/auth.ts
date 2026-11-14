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
          scope:       "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
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

        if (account.access_token && account.provider === "google") {
          try {
            const existing: any = await prisma.$queryRawUnsafe(
              `SELECT id FROM public.user_integrations WHERE provider = 'google_calendar' LIMIT 1`
            );
            if (existing && existing.length > 0) {
              await prisma.$queryRawUnsafe(
                `UPDATE public.user_integrations SET access_token = $1, refresh_token = COALESCE($2, refresh_token), scope = $3, updated_at = NOW() WHERE id = $4::uuid`,
                account.access_token,
                account.refresh_token || null,
                account.scope || null,
                existing[0].id
              );
            } else {
              await prisma.$queryRawUnsafe(
                `INSERT INTO public.user_integrations (provider, access_token, refresh_token, scope, updated_at) VALUES ('google_calendar', $1, $2, $3, NOW())`,
                account.access_token,
                account.refresh_token || null,
                account.scope || null
              );
            }
          } catch (e) {
            console.warn("Could not mirror token to user_integrations:", e);
          }
        }
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
      (session as any).refreshToken = token.refreshToken as string | undefined;
      (session as any).userId       = token.userId       as string | undefined;
      (session as any).role         = token.role         as string | undefined;
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
  },
};
