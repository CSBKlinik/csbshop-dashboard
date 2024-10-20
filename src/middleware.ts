import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname }: { pathname: string } = request.nextUrl;
  const token = await getToken({ req: request });

  const loginRoute = ["/"];

  const laboratoryRoutes = [
    "/admin/laboratory,/admin/laboratory/managing-orders,/admin/laboratory/managing-stock-products",
    "/admin/laboratory/settings",
  ];

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à une autre page que l'accueil, rediriger vers la page d'accueil
  if (!token && pathname !== "/") {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  if (loginRoute.includes(pathname)) {
    if (!token) {
      return;
    } else {
      // @ts-ignore
      if (token?.role?.id === 3) {
        console.log("redirection labo");
        return NextResponse.redirect(
          new URL("/admin/laboratory", request.nextUrl)
        );
      } else {
        return;
      }
    }
  }
  // Si l'utilisateur est connecté et se trouve sur la route d'accueil, rediriger en fonction du rôle
  // if (token && pathname === "/") {
  //   // Vérifie si l'utilisateur a le rôle 3 (Laboratory)
  //   // @ts-ignore
  //   if (parseInt(token?.role?.id) === 3) {
  //     return NextResponse.redirect(
  //       new URL("/admin/laboratory", request.nextUrl)
  //     );
  //   }

  //   // Tu peux ajouter d'autres rôles ici
  //   // Exemple : if (parseInt(token?.role?.id) === 4) { ... }
  // }

  // Protéger les routes spécifiques pour les utilisateurs ayant le rôle 3
  if (laboratoryRoutes.includes(pathname)) {
    // @ts-ignore
    if (parseInt(token?.role?.id) !== 3) {
      return NextResponse.redirect(new URL("/", request.nextUrl));
    }
  }

  // Continuer la requête si aucune redirection n'est nécessaire
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/admin/laboratory",
    "/admin/laboratory/managing-orders",
    "/admin/laboratory/managing-stock-products",
    "/admin/laboratory/settings",
  ],
};
