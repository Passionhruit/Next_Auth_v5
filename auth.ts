import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

import { getUserById } from "@/data/user";

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    // always redirect to this page when something goes wrong
    signIn: "/auth/login",
    error: "auth/error",
  },
  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // Allow OAuth without email verification
      if (account?.provider !== "credentials") return true;
      const existingUser = await getUserById(user.id as string);

      // we are not gonna allow user to login without email verification.
      if (!existingUser || !existingUser.emailVerified) return false;

      // TODO: Add 2FA check

      return true;
    },

    async session({ token, session }) {
      console.log({ sessionToken: token, session });

      if (token.sub && session.user) {
        // session 에 userId 를 삽입
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role;
      }
      return session;
    },

    async jwt({ token }) {
      if (!token.sub) return token;

      const existingUser = await getUserById(token.sub);

      if (!existingUser) return token;

      token.role = existingUser.role;

      return token;
    },
  },
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  ...authConfig,
});
