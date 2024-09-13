import { authOptions } from "@/app/utils/lib/context/authOptions";
import NextAuth from "next-auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
