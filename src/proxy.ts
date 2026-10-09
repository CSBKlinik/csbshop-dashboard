import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isLaboratoryRole } from "./app/utils/lib/context/laboratory-role";

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request });
  const pathname = request.nextUrl.pathname;
  const isLaboratory = isLaboratoryRole(token?.role);

  if (pathname === "/") {
    return isLaboratory
      ? NextResponse.redirect(new URL("/admin/laboratory", request.url))
      : NextResponse.next();
  }

  if (!token || !isLaboratory) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ["/", "/admin/laboratory/:path*"] };
