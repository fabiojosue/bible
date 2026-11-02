"use client";

import { createAuthClient } from "better-auth/react";

/** Same-origin client: requests go to /api/auth on whichever host serves the page. */
export const authClient = createAuthClient();

export const { useSession, signIn, signUp, signOut, deleteUser } = authClient;
