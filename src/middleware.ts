import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

const DEMO = process.env.NEXT_PUBLIC_DEMO_DATA === "true";

export default async function middleware(req: NextRequest) {
  if (DEMO) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (!token.memberId) {
    return NextResponse.redirect(new URL("/setup", req.url));
  }

  if (token.memberStatus === "ARHIVAT" || token.memberStatus === "SUSPENDAT") {
    return NextResponse.redirect(new URL("/pending", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|api/setup|_next/static|_next/image|favicon.ico|login|pending|setup|images).*)",
  ],
};
