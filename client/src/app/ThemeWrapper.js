"use client";

import { useState, useEffect } from "react";
import { ThemeProvider } from "next-themes";
import Header from "@/app/components/header/Header";

export default function ThemeWrapper({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-screen">{children}</div>;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1">{children}</div>
      </div>
    </ThemeProvider>
  );
}