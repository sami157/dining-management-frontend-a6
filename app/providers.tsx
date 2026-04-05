'use client'

import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
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
      </QueryProvider>
    </ThemeProvider>
  );
}
