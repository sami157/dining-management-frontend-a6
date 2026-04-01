'use client'

import type { User } from "firebase/auth";
import { auth } from "@/firebase/firebase.init";

export async function getAuthHeader(user?: User | null) {
  const activeUser = user ?? auth.currentUser;

  if (!activeUser) {
    return null;
  }

  const token = await activeUser.getIdToken();

  return {
    Authorization: `Bearer ${token}`,
  };
}
