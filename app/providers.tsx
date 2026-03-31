'use client'

import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/providers/AuthProvider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "14px",
            border: "1px solid #e4e4e7",
            background: "#ffffff",
            color: "#18181b",
          },
        }}
      />
    </AuthProvider>
  );
}
