import type { Metadata } from "next";
import { Suspense } from "react";
import { Workspace } from "@/components/workspace";
import "./globals.css";

export const metadata: Metadata = {
  title: "Talent Pipeline | TrackFlow",
  description: "TrackFlow People Operations recruiting workspace.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<main className="workspace" role="status">Loading the talent pipeline…</main>}>
          <Workspace>{children}</Workspace>
        </Suspense>
      </body>
    </html>
  );
}
