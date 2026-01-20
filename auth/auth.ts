import NextAuth from "next-auth";
import { authServerConfig } from "./lib/auth-server";

export const { handlers, auth, signIn, signOut } = NextAuth(authServerConfig);