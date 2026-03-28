import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  useSecureCookies: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 jours
  redirectProxyUrl: process.env.NEXTAUTH_URL,

  pages: {
    signIn: "/connexion",
  },

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { organization: true },
        });

        if (!user || !user.actif) return null;

        const passwordOk = await compare(
          credentials.password as string,
          user.password,
        );
        if (!passwordOk) return null;

        return {
          id: user.id,
          name: user.nom,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.role = (user as any).role;
        token.organizationId = (user as any).organizationId;
        token.issuedAt = Date.now();
      }

      // Renouveler le token si plus de la moitié de sa durée est écoulée (15 jours)
      const issuedAt = token.issuedAt as number | undefined;
      const halfLife = 15 * 24 * 60 * 60 * 1000; // 15 jours en ms
      if (issuedAt && Date.now() - issuedAt > halfLife) {
        token.issuedAt = Date.now();
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string;
      }
      return session;
    },
  },
});
