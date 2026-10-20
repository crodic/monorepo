import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-dvh flex-col">{children}</div>;
}
