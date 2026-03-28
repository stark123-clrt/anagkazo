import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_ROUTES = ["/accueil", "/connexion", "/inscription", "/invitation", "/rejoindre", "/mot-de-passe-oublie", "/reinitialisation"];
const ADMIN_ONLY_ROUTES = ["/programmes/nouveau", "/equipe"];

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Routes publiques — toujours accessibles
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Lire le JWT sans passer par auth() (compatible Edge Runtime)
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: req.nextUrl.protocol === "https:",
  });

  // Non connecté → redirection vers connexion
  if (!token) {
    const loginUrl = new URL("/connexion", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role as string | undefined;

  // Évangéliste sur route admin uniquement → redirigé
  if (
    role === "EVANGELISTE" &&
    ADMIN_ONLY_ROUTES.some((r) => pathname.startsWith(r))
  ) {
    return NextResponse.redirect(new URL("/evangeliste", req.nextUrl.origin));
  }

  // Évangéliste sur espace admin → redirigé vers son espace
  if (
    role === "EVANGELISTE" &&
    !pathname.startsWith("/evangeliste") &&
    !pathname.startsWith("/api")
  ) {
    return NextResponse.redirect(new URL("/evangeliste", req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.png|.*\\.jpg|.*\\.svg).*)",
  ],
};

