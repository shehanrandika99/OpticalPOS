import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Dashboard route protection is handled client-side in Dashboard component
  // using localStorage. We allow the request to pass through and let the
  // Dashboard component handle authentication checks.
  // This is necessary because we're using localStorage (client-side) instead of cookies.
  
  return NextResponse.next();
}

export const config = {
  matcher: "/dashboard/:path*",
};

