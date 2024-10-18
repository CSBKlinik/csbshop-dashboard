import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { loginLib } from "../api/users/api-requests";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {},
        password: {},
      },
      // @ts-ignore
      async authorize(credentials) {
        const params = {
          identifier: credentials?.email,
          password: credentials?.password,
        };
        const authentification = await loginLib(params);
        if (authentification.error) {
          console.log("Auth error ...", authentification.error);
          return null;
        } else {
          console.log("Auth success !");
          const jwt = authentification.jwt;
          const user = authentification.user;
          return {
            id: user.id,
            jwt: jwt,
            email: user.email,
            prenom: user.firstname,
            nom: user.lastname,
            role: user.role,
            laboratory: user.laboratories,
          };
        }
      },
    }),
  ],
  pages: {
    signIn: "/admin",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (user) {
        token.id = user.id;
        // @ts-ignore
        token.jwt = user.jwt;
        token.email = user.email;
        // @ts-ignore
        token.role = user.role;
        // @ts-ignore
        token.laboratory = user.laboratory;
        // token.prenom = user.prenom;
        // token.nom = user.nom;
      }
      return token;
    },
    async session({ session, user, token }) {
      // console.log("from session:", session, "token:", token);
      if (session?.user) {
        // @ts-ignore

        session.user.jwt = token.jwt;
        // @ts-ignore

        session.user.id = token.id;

        session.user.email = token.email;
        // @ts-ignore
        session.user.role = token.role;
        // @ts-ignore
        session.user.laboratory = token.laboratory;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
};
