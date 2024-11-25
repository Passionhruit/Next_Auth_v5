import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

import { getUserById } from "@/data/user";
import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // 1. 페이지 설정: 인증 관련 경로를 지정
  pages: {
    // always redirect to this page when something goes wrong
    signIn: "/auth/login",
    error: "auth/error",
  },
  // 2. 이벤트 처리: 특정 이벤트가 발생했을 때 실행되는 함수
  events: {
    async linkAccount({ user }) {
      // 계정 연결 시 이메일 검증 날짜를 현재 날짜로 업데이트
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
  // 3. 인증 콜백: 인증 요청 처리 및 사용자 데이터 검증
  callbacks: {
    async signIn({ user, account }) {
      // Allow OAuth without email verification (OAuth 인증(github, google)은 별도의 이메일 검증없이 허용)
      if (account?.provider !== "credentials") return true;

      const existingUser = await getUserById(user.id as string);

      // we are not gonna allow user to login without email verification. (유저의 verification 없이는 로그인을 허용하지 않음)
      if (!existingUser || !existingUser.emailVerified) return false;

      // TODO: Add 2FA check (2단계 인증이 활성화된 사용자에 한하여 추가 검증)
      if (existingUser.isTwoFactorEnabled) {
        const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(
          existingUser.id
        );

        // 2단계 인증이 완료되지 않은경우 실패 처리
        if (!twoFactorConfirmation) return false;

        // Delete 2FA confirmation for next sign in (2FA 인증 완료 후, 인증 데이터를 삭제하여 재사용 방지)
        await db.twoFactorConfirmation.delete({
          where: {
            id: twoFactorConfirmation.id,
          },
        });
      }

      return true;
    },

    // NextAuth.js는 인증이 성공하면, 사용자를 위한 JWT 토큰과 세션 데이터를 생성
    async jwt({ token }) {
      // NextAuth는 jwt 콜백을 통해 사용자 정보를 기반으로 토큰을 생성
      if (!token.sub) return token;

      const existingUser = await getUserById(token.sub);

      if (!existingUser) return token;

      token.role = existingUser.role;

      return token;
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

      session.customField = "임의로 넣은 필드값";

      return session;
    },
  },
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" }, // 세션 정보를 db에 저장하지 않음, 토큰 기반으로 인증 정보를 확인

  ...authConfig,
});
