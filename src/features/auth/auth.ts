import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  appName: "Bible",
  baseURL: {
    // Requests are answered on whichever of these hosts they arrive at, so the
    // production aliases and preview deployments all work. Google sign-in only
    // works on hosts registered as redirect URIs in the Google Cloud console.
    allowedHosts: [
      "localhost:*",
      "thebiblefree.com",
      "www.thebiblefree.com",
      "bible-blush-nine.vercel.app",
      "bible-fabiojosue.vercel.app",
      "bible-*-fabiojosue.vercel.app",
    ],
    fallback: process.env.BETTER_AUTH_URL,
  },
  database: drizzleAdapter(db, { provider: "pg", schema, transaction: true }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            prompt: "select_account",
          },
        }
      : {},
  account: {
    // Email addresses of password accounts are never verified (there is no
    // email service), so linking a Google sign-in to one would let whoever
    // registered that address first share the account.
    accountLinking: { enabled: false },
    encryptOAuthTokens: true,
  },
  user: { deleteUser: { enabled: true } },
  session: {
    expiresIn: 60 * 60 * 24 * 60,
    updateAge: 60 * 60 * 24,
    // Every page load checks the session; a signed cookie answers it without a database query.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "rateLimit",
    // Every page load reads the session, and it is served from the cookie cache.
    customRules: { "/get-session": false },
  },
  advanced: { database: { generateId: () => crypto.randomUUID() } },
});

export type Session = typeof auth.$Infer.Session;
