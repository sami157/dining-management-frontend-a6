'use client'

import { auth } from "@/firebase/firebase.init";

export async function getAuthHeader() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not signed in");
  }

  const token = await user.getIdToken();

  return {
    Authorization: `Bearer ${token}`,
  };
}
