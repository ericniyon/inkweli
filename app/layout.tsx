import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import { SiteLayoutProvider } from "@/lib/site-layout-context";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "usethinkup | Premium Publishing",
  description: "Discover stories, thinking, and expertise from writers on any topic.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          href="https://cdn.jsdelivr.net/npm/charter-webfont@4/charter.min.css"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased font-charter">
        <SessionProviderWrapper>
          <AuthProvider>
            <SiteLayoutProvider>{children}</SiteLayoutProvider>
          </AuthProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
